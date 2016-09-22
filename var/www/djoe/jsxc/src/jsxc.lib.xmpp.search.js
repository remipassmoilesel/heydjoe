/**
 * Implements user search (XEP 0055)
 *
 * @memberOf jsxc.xmpp
 */
jsxc.xmpp.search = {

  /**
   * Where connection is stored
   *
   */
  conn : null,

  /**
   * Domain for search. If not set at init{xmpp:{...}} domain will be used
   *
   */
  searchDomain : null,

  /**
   * True if user search is available, but will be set only after connection
   */
  userSearchAvailable : false,

  /**
   * Initialize search functionnalities
   */
  init : function() {

    var self = jsxc.xmpp.search;

    // shortcut
    self.conn = jsxc.xmpp.conn;

    // retrieve XMPP search domain
    var xmppOpts = jsxc.options.get("xmpp");
    self.searchDomain = xmppOpts.searchDomain;

    if (typeof self.searchDomain === "undefined") {
      self.searchDomain = xmppOpts.domain;
      jsxc.warn('Search domain not found, domain will be used', xmppOpts.domain);
    }

    // first request to know if search is available
    self.requestForSearchCapabilities()

        .then(function() {
          jsxc.debug("XMPP search available");
        })
        .fail(function() {
          jsxc.warn("XMPP search unavailable");
        });

    // set user cache
    // self.getUserList();

  },

  /**
   * Cache for searchs
   */
  _searchDefers : {},

  /**
   * Search terms to get all users
   */
  _allUserTerms : "*",

  /**
   * Check an array of users and add a field "_is_buddy" to each user.
   *
   * <p>/!\ Work directly on the array
   *
   * @param userArr
   * @returns {*}
   */
  _checkIfBuddies : function(userArr) {

    // list of buddies to check
    var buddies = jsxc.storage.getLocaleBuddyListBJID();

    $.each(userArr, function(i, e) {
      // check if is a buddy
      e["_is_buddy"] = buddies.indexOf(jsxc.jidToBid(e.jid)) !== -1;
    });

    return userArr;
  },

  /**
   * Return a promise containing all users in an array or an empty array
   *
   * <p> Response is stored in cache
   *
   * <p> Each entry of the array contains:
   * mail, jid, name, username, _is_buddy
   *
   */
  getUserList : function() {

    var self = jsxc.xmpp.search;

    // search users
    return self.searchUsers(self._allUserTerms)

        .then(function(result) {

          // here buddies are checked by search function
          return JSON.parse(JSON.stringify(result));

        });

  },

  /**
   * Get new user list
   *
   * @returns {*}
   */
  getFreshUserList : function() {

    var self = jsxc.xmpp.search;

    delete self._searchDefers[self._allUserTerms];

    return self.getUserList();
  },

  /**
   * Return a promise containing all users corresponding to "terms" in an array or an empty array
   *
   * <p>Wildcards "*" are allowed
   *
   * <p>Each entry of the array contains:
   * mail, jid, name, username, _is_buddy
   *
   */
  searchUsers : function(terms) {

    var self = jsxc.xmpp.search;

    jsxc.stats.addEvent('jsxc.search.users');

    if (!self.conn || self.conn.connected !== true) {
      jsxc.warn("Search not available: not connected");
      return $.Deferred().promise().fail("Not connected");
    }

    // request have already done
    if (self._searchDefers[terms]) {
      jsxc.debug("Search: return cached request");
      return self._searchDefers[terms].promise();
    }

    // send XMPP request to get all users
    var iq = $iq({
      type : 'set', to : self.searchDomain
    })
        .c('query', {xmlns : 'jabber:iq:search'})
        .c('x', {xmlns : 'jabber:x:data', type : 'submit'})
        .c('field', {type : 'hidden', var : 'FORM_TYPE'})
        .c('value', 'jabber:iq:search').up().up()
        .c('field', {var : 'search', type : "text-single"})
        .c('value', terms).up().up()
        .c('field', {var : 'Username', type : "boolean"})
        .c('value', '1').up().up()
        .c('field', {var : 'Name', type : "boolean"})
        .c('value', '1').up().up();

    // response in a promise
    self._searchDefers[terms] = $.Deferred();
    var defer = self._searchDefers[terms];

    // send request after regitered handler
    self.conn.sendIQ(iq,

        // successful request
        function(stanza) {

          jsxc.debug("Search: return fresh request");

          // error while retieving users
          if ($(stanza).find("error").length > 0) {

            defer.reject(stanza);

            // remove handler when finished
            return false;
          }

          // browse items and create result list
          var result = [];
          $(stanza).find("item").each(function() {

            var r = {};

            // browse fields and get values
            $(this).find("field").each(function() {
              r[$(this).attr("var").toLowerCase()] = $(this).text();
            });

            result.push(r);

          });

          // add buddy field
          self._checkIfBuddies(result);

          // send list of item
          defer.resolve(result);

        },

        // error
        function() {
          defer.reject(arguments);
        });

    // return a promise
    return defer.promise();
  },

  /**
   * Send request to know if search is available.
   *
   * <p>Designed to be called only one time at init.
   *
   * <p>If need more, need to be improved with promises
   *
   */
  requestForSearchCapabilities : function() {

    var self = jsxc.xmpp.search;

    // id of the XMPP request for filtering
    var capabilityRequestId;

    // request
    var iq = $iq({
      type : 'get', to : self.searchDomain
    }).c('query', {
      xmlns : 'jabber:iq:search'
    });

    // response in a promise
    var defer = $.Deferred();

    // send request
    capabilityRequestId = self.conn.sendIQ(iq,

        // success
        function(stanza) {
          self.userSearchAvailable = $(stanza).find("error").length === 0;

          defer.resolve(self.userSearchAvailable);
        },

        // error
        function() {
          self.userSearchAvailable = false;

          defer.reject(self.userSearchAvailable);
        });

    // return a promise
    return defer.promise();
  }

};

/**
 * Initialize user search module. Executed at each connexion.
 */
$(function() {
  $(document).on('attached.jsxc', jsxc.xmpp.search.init);
});