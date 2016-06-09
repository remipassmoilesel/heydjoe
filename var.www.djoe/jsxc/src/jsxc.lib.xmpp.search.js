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
     * Return true if user search is available
     * @returns {boolean}
     */
    isUserSearchAvailable: function () {
        var self = jsxc.xmpp.search;
        return self.userSearchAvailable;
    },

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
        self.searchDomain = xmppOpts.searchDomain || xmppOpts.domain;

        // first request to know if search is available
        self.requestForSearchCapabilities().then(function(){
            //console.log(arguments);
        });

        // set user cache
        self.getUserList();

    },

    /**
     * Cache for ALL users list
     */
    userListCache: undefined,

    /**
     * Return a promise containing all users in an array or an empty array
     *
     * <p>Response is stored in cache
     *
     * <p>Each entry of the array contains:
     * mail, jid, name, username, _is_buddy
     *
     */
    getUserList: function() {

        var self = jsxc.xmpp.search;

        var defer = $.Deferred();

        // list is already present, return false promise
        if(self.userListCache){

            // send list of item
            defer.resolve(JSON.parse(JSON.stringify(self.userListCache)));

            // console.log("cached user list");

            return defer;
        }

        else {
            return self.searchUsers("*").then(function(result){

                self.userListCache = result;
                defer.resolve(JSON.parse(JSON.stringify(self.userListCache)));

                // console.log("new user list");
                // console.log(self.userListCache.length);

            });
        }

        return defer.promise();
    },

    /**
     * Get new user list
     *
     * @returns {*}
     */
    getFreshUserList: function() {
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
    searchUsers: function(terms){

        var self = jsxc.xmpp.search;

        // iq id for filtering
        var userListRequest;

        // send XMPP request to get all users
        var iq = $iq({
            type: 'set',
            to: self.searchDomain
        })
            .c('query', {xmlns: 'jabber:iq:search'})
            .c('x', {xmlns: 'jabber:x:data', type:'submit'})
            .c('field', {type: 'hidden', var:'FORM_TYPE'})
            .c('value','jabber:iq:search').up().up()
            .c('field', {var: 'search',type:"text-single"})
            .c('value',terms).up().up()
            .c('field', {var: 'Username', type:"boolean"})
            .c('value','1').up().up()
            .c('field', {var: 'Name', type:"boolean"})
            .c('value','1').up().up();

        // response in a promise
        var defer = $.Deferred();

        // list of buddies to check
        var buddies = jsxc.xmpp.getLocaleBuddyListBJID();

        // listenning for iq response
        self.conn.addHandler(function(stanza){

            var id = $(stanza).attr('id');

            // ignore not interesting messages
            if (id !== userListRequest) {
                return true;
            }

            // error while retieving users
            if($(stanza).find("error").length > 0){

                defer.reject();

                // remove handler when finished
                return false;
            }

            var result = [];

            // browse items and create object
            $(stanza).find("item").each(function(){

                var r = {};

                // browse fields and get values
                $(this).find("field").each(function(){
                    r[$(this).attr("var").toLowerCase()] = $(this).text();
                });

                // check if is a buddy
                r["_is_buddy"] = buddies.indexOf(jsxc.jidToBid(r.jid)) !== -1;

                result.push(r);

            });

            // send list of item
            defer.resolve(result);

            // remove handler when finished
            return false;

        }, null, 'iq');

        // send request after regitered handler
        userListRequest = self.conn.sendIQ(iq);

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

        // listenning for iq response
        self.conn.addHandler(function(stanza){

            var id = $(stanza).attr('id');

            // filter iq responses
            if (id !== capabilityRequestId) {
                return true;
            }

            self.userSearchAvailable = $(stanza).find("error").length === 0;

            // console.log("self.userSearchAvailable");
            // console.log(self.userSearchAvailable);

            defer.resolve(self.userSearchAvailable);

            // remove handler when finished
            return false;

        }, null, 'iq');

        // send request
        capabilityRequestId = self.conn.sendIQ(iq);

        // return a promise
        return defer.promise();
    },


};

/**
 * Initialize user search
 */
$(document).ready(function () {
    $(document).on('attached.jsxc', jsxc.xmpp.search.init);
});