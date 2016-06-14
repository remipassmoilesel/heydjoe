/**
 * Implements user search (XEP 0055)
 *
 *
 */
jsxc.xmpp.search = {

    /**
     * Where connection is stored
     *
     */
    conn: null,

    /**
     * Domain for search. If not set at init{xmpp:{...}} domain will be used
     *
     */
    searchDomain: null,

    /**
     * True if user search is available
     */
    userSearchAvailable: false,

    /**
     * Initialize search functionnalities
     */
    init: function () {

        //console.log("jsxc.lib.xmpp.search.init()");

        var self = jsxc.xmpp.search;

        // shortcut
        self.conn = jsxc.xmpp.conn;

        // retrieve domain
        var xmppOpts = jsxc.options.get("xmpp");
        self.searchDomain = xmppOpts.searchDomain;

        if(typeof self.searchDomain === "undefined"){
            self.searchDomain = xmppOpts.domain;
            jsxc.warn('Search domain not found, domain will be used', xmppOpts.domain);
        }

        // first request to know if search is available
        self.requestForSearchCapabilities().then(function () {
            //console.log(arguments);
        });

        // set user cache
        self.getUserList();

    },

    /**
     * Return true if user search is available
     * @returns {boolean}
     */
    isUserSearchAvailable: function () {
        var self = jsxc.xmpp.search;
        return self.userSearchAvailable;
    },

    /**
     * Cache for ALL users list
     */
    userListCache: undefined,

    /**
     * Check an array of users and add a field "_is_buddy" to each user.
     *
     * <p>/!\ Work directly on the array
     *
     * @param userArr
     * @returns {*}
     */
    checkIfBuddies: function (userArr) {

        // list of buddies to check
        var buddies = jsxc.storage.getLocaleBuddyListBJID();

        $.each(userArr, function (i, e) {
            // check if is a buddy
            e["_is_buddy"] = buddies.indexOf(jsxc.jidToBid(e.jid)) !== -1;
        });

        return userArr;
    },

    /**
     * Return a promise containing all users in an array or an empty array
     *
     * <p>Response is stored in cache
     *
     * <p>Each entry of the array contains:
     * mail, jid, name, username, _is_buddy
     *
     */
    getUserList: function () {

        var self = jsxc.xmpp.search;

        var defer = $.Deferred();

        // list is already present, return false promise
        if (self.userListCache) {

            // clone array
            var clone = JSON.parse(JSON.stringify(self.userListCache));

            // check buddies another time
            self.checkIfBuddies(clone);

            // send list of users
            defer.resolve(clone);

            // console.log("cached user list");
            // console.log(self.userListCache.length);

        }

        else {
            self.searchUsers("*").then(
                // successful
                function (result) {

                    // here buddies are checked by search function

                    self.userListCache = result;
                    defer.resolve(JSON.parse(JSON.stringify(self.userListCache)));

                    // console.log("new user list");
                    // console.log(self.userListCache.length);

                },

                // not successful
                function () {
                    defer.reject();
                });
        }

        return defer.promise();
    },

    /**
     * Get new user list
     *
     * @returns {*}
     */
    getFreshUserList: function () {

        var self = jsxc.xmpp.search;
        self.userListCache = undefined;

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
    searchUsers: function (terms) {

        var self = jsxc.xmpp.search;

        // iq id for filtering
        var userListRequest;

        // send XMPP request to get all users
        var iq = $iq({
            type: 'set',
            to: self.searchDomain
        })
            .c('query', {xmlns: 'jabber:iq:search'})
            .c('x', {xmlns: 'jabber:x:data', type: 'submit'})
            .c('field', {type: 'hidden', var: 'FORM_TYPE'})
            .c('value', 'jabber:iq:search').up().up()
            .c('field', {var: 'search', type: "text-single"})
            .c('value', terms).up().up()
            .c('field', {var: 'Username', type: "boolean"})
            .c('value', '1').up().up()
            .c('field', {var: 'Name', type: "boolean"})
            .c('value', '1').up().up();

        // response in a promise
        var defer = $.Deferred();

        if (!self.conn) {
            jsxc.debug("Not connected !");
            throw "Not connected !";
        }

        // send request after regitered handler
        userListRequest = self.conn.sendIQ(
            iq,

            // successful request
            function (stanza) {

                // console.log("userListRequest = self.conn.sendIQ(");
                // console.log("ok");
                // console.log($(stanza).get(0));

                var id = $(stanza).attr('id');

                // ignore not interesting messages
                if (id !== userListRequest) {
                    return true;
                }

                // error while retieving users
                if ($(stanza).find("error").length > 0) {

                    defer.reject();

                    // remove handler when finished
                    return false;
                }

                var result = [];

                // browse items and create object
                $(stanza).find("item").each(function () {

                    var r = {};

                    // browse fields and get values
                    $(this).find("field").each(function () {
                        r[$(this).attr("var").toLowerCase()] = $(this).text();
                    });

                    result.push(r);

                });

                self.checkIfBuddies(result);

                // send list of item
                defer.resolve(result);

            },

            // error
            function () {
                // console.log("userListRequest = self.conn.sendIQ(");
                // console.log("fail");
                // console.log($(stanza).get(0));

                defer.reject();
            }
        );

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
     * <p>If search is available isUserSearchAvailable() return true.
     */
    requestForSearchCapabilities: function () {

        var self = jsxc.xmpp.search;

        // id of the XMPP request for filtering
        var capabilityRequestId;

        // request
        var iq = $iq({
            type: 'get',
            to: self.searchDomain
        }).c('query', {
            xmlns: 'jabber:iq:search'
        });

        // response in a promise
        var defer = $.Deferred();

        // send request
        capabilityRequestId = self.conn.sendIQ(

            iq,

            // success
            function (stanza) {
                self.userSearchAvailable = $(stanza).find("error").length === 0;

                defer.resolve(self.userSearchAvailable);
            },

            // error
            function () {
                self.userSearchAvailable = false;

                defer.reject(self.userSearchAvailable);
            }
        );

        // return a promise
        return defer.promise();
    },


};

/**
 * Initialize user search module. Executed at each connexion.
 */
$(document).ready(function () {
    $(document).on('attached.jsxc', jsxc.xmpp.search.init);
});