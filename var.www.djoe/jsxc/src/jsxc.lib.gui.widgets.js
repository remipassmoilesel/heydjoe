/**
 * Show a feedback message. Type can be 'info' or 'warn'
 *
 * @param selector
 * @returns {JQuery|jQuery|HTMLElement}
 */
jsxc.gui.feedback = function (message, type, timeout) {

    var defaultType = "info";

    var bgColors = {
        info: '#1a1a1a',
        warn: '#520400',
    };
    var icons = {
        info: 'info',
        warn: 'warning',
    };

    // show the toast
    $.toast({
        text: message, // Text that is to be shown in the toast
        icon: icons[type || defaultType], // Type of toast icon
        showHideTransition: 'fade', // fade, slide or plain
        allowToastClose: true, // Boolean value true or false
        hideAfter: timeout || 3000, // false to make it sticky or number representing the miliseconds as time after which toast needs to be hidden
        stack: 3, // false if there should be only one toast at a time or a number representing the maximum number of toasts to be shown at a time
        position: 'top-right', // bottom-left or bottom-right or bottom-center or top-left or top-right or top-center or mid-center or an object representing the left, right, top, bottom values
        textAlign: 'left',  // Text alignment i.e. left, right or center
        loader: false,  // Whether to show loader or not. True by default
        bgColor: bgColors[type || defaultType], // background color of toast
    });

};

/**
 * Create a room list
 *
 * @param selector
 */
jsxc.gui.createRoomList = function (selector) {

    var root = $(selector);

    root.addClass("jsxc_roomListContainer");

    root.append("<ol class='jsxc_roomList'></ol>");

    var list = $(selector + " .jsxc_roomList");

    // make selectable list
    list.selectable();

    // make list scrollable
    root.perfectScrollbar();

    // refresh room list
    var updateRoomList = function () {

        jsxc.xmpp.conn.muc.listRooms(jsxc.options.get('muc').server,

            // getting list
            function (stanza) {

                list.empty();

                var items = $(stanza).find('item');

                // no rooms
                if (items.length < 1) {

                    // create list element
                    var li = $("<li></li>")
                        .text("Aucun salon disponible")
                        .attr({
                            'class': 'ui-widget-content',
                            'roomjid': "_NO_ROOM_AVAILABLE"
                        });

                    list.append(li);

                }

                // list all rooms
                else {

                    items.each(function () {

                        var rjid = $(this).attr('jid').toLowerCase();
                        var rnode = Strophe.getNodeFromJid(rjid);
                        var rname = $(this).attr('name') || rnode;

                        // create list element
                        var li = $("<li></li>")
                            .text(rname)
                            .attr({
                                'data-roomjid': rjid,
                                'data-rname': rname,
                                'class': 'ui-widget-content',
                                'title': rjid
                            });

                        list.append(li);
                    });
                }

            },

            // error while getting list
            function () {

                list.empty();

                jsxc.debug("Unable to retrieve rooms", arguments);

                // create list element
                var li = $("<li></li>")
                    .text("Liste des salons indisponible")
                    .attr({
                        'class': 'ui-widget-content'
                    });

                list.append(li);
            });

    };

    // update each time buddy list change
    $(document).on("status.muc.jsxc", updateRoomList);

    // first update
    updateRoomList();

    return {
        /**
         * Jquery object on root
         */
        "root": root,

        /**
         * Update list
         */
        "updateRoomList": updateRoomList
    };

};

/**
 * Create an user list. To retrieve selected elements select $("#listId .ui-selected");
 *
 *
 * <p>Each item contains data:
 *
 * <p>'data-userjid': elmt.jid, 'data-username': elmt.username,
 *
 *
 * @param selector
 */
jsxc.gui.createUserList = function (selector) {

    var root = $(selector);

    root.addClass("jsxc_userListContainer");

    root.append("<ol class='jsxc_userList'></ol>");

    var list = $(selector + " .jsxc_userList");

    // make selectable list
    list.selectable();

    // make list scrollable
    root.perfectScrollbar();

    // update lists
    var updateUserList = function (freshList) {

        var search = jsxc.xmpp.search.getUserList;

        if (freshList === "freshList") {
            search = jsxc.xmpp.search.getFreshUserList;
        }

        // add contact to list
        search().then(function (users) {

                // remove exisiting elements
                list.empty();

                // add users
                $.each(users, function (index, elmt) {

                    // check if not user
                    if (elmt.username === jsxc.xmpp.getCurrentNode()) {
                        return true;
                    }

                    // create list element
                    var li = $("<li></li>")
                        .text(elmt.username)
                        .attr({
                            'data-userjid': elmt.jid,
                            'data-username': elmt.username,
                            'class': 'ui-widget-content',
                            'title': elmt.username + " n'est pas dans vos contacts"
                        });

                    // modify element if buddy
                    if (elmt._is_buddy) {
                        li.addClass("buddy_item")
                            .attr({
                                'title': elmt.username + " est dans vos contacts"
                            });
                    }

                    list.append(li);
                });
            },

            // error while updating
            function () {

                // remove exisiting elements
                list.empty();

                var li = $("<li></li>")
                    .text("Liste des contacts indisponible")
                    .attr({'class': 'ui-widget-content'});

                list.append(li);

            });
    };

    // update each time buddy list change
    $(document).on("add.roster.jsxc", updateUserList);
    $(document).on("cloaded.roster.jsxc", updateUserList);
    $(document).on("buddyListChanged.jsxc", updateUserList);

    // first update
    updateUserList();

    return {
        /**
         * Jquery object on root
         */
        "root": root,

        /**
         * Update list
         */
        "updateUserList": updateUserList
    };

};

/**
 * Create a buddy list. To retrieve selected elements select $("#listId .ui-selected");
 *
 *
 * <p>Each item contains data:
 *
 * <p>'data-userjid': elmt.jid, 'data-username': elmt.username,
 *
 *
 * @param selector
 */
jsxc.gui.createBuddyList = function (selector) {

    var root = $(selector);

    root.addClass("jsxc_buddyListContainer");

    root.append("<ol class='jsxc_buddyList'></ol>");

    var list = $(selector + " .jsxc_buddyList");

    // make selectable list
    list.selectable();

    // make list scrollable
    root.perfectScrollbar();

    // update lists
    var updateBuddyList = function () {

        list.empty();

        var buddylist = jsxc.storage.getLocaleBuddyListBJID();

        var buddyNumber = 0;

        $.each(buddylist, function (index, jid) {

            //console.log(jsxc.storage.getUserItem('buddy', Strophe.getBareJidFromJid(jid)));

            var infos = jsxc.storage.getUserItem('buddy', Strophe.getBareJidFromJid(jid));

            // check friendship
            var realFriend = infos.sub === 'both' && infos.type !== 'groupchat';

            if (realFriend !== true) {
                return true;
            }

            var userName = Strophe.getNodeFromJid(jid);

            // create list element
            var li = $("<li></li>")
                .text(userName)
                .attr({
                    'data-userjid': jid,
                    'data-username': userName,
                    'class': 'ui-widget-content'
                });

            list.append(li);

        });

        if (buddyNumber < 1) {
            // create list element
            var li = $("<li></li>")
                .text("Aucun contact confirmé")
                .attr({
                    'data-userjid': null,
                    'data-username': null,
                    'class': 'ui-widget-content'
                });

            list.append(li);
        }

    };

    // update each time buddy list change
    $(document).on("add.roster.jsxc", updateBuddyList);
    $(document).on("cloaded.roster.jsxc", updateBuddyList);
    $(document).on("buddyListChanged.jsxc", updateBuddyList);

    // first update
    updateBuddyList();

    return {
        /**
         * Jquery object on root
         */
        "root": root,

        /**
         * Update list
         */
        "updateBuddyList": updateBuddyList
    };

};

/**
 * Create a conversation list. To retrieve selected elements select $("#listId .ui-selected");
 *
 *
 * <p>Each item contains data:
 *
 * <p>'data-conversjid'
 *
 *
 * @param selector
 */
jsxc.gui.createConversationList = function (selector) {

    var root = $(selector);

    root.addClass("jsxc_conversationListContainer");

    root.append("<ol class='jsxc_conversationList'></ol>");

    var list = $(selector + " .jsxc_conversationList");

    // make selectable list
    list.selectable();

    // make list scrollable
    root.perfectScrollbar();

    // update lists
    var updateConversationList = function () {

        list.empty();

        var conversList = jsxc.storage.getLocaleBuddyListBJID();

        var conversNumber = 0;

        $.each(conversList, function (index, jid) {

            var infos = jsxc.storage.getUserItem('buddy', Strophe.getBareJidFromJid(jid));

            // check friendship
            var chatRoom = infos.type === 'groupchat';

            if (chatRoom !== true) {
                return true;
            }

            var conversName = Strophe.getNodeFromJid(jid);

            // create list element
            var li = $("<li></li>")
                .text(conversName)
                .attr({
                    'data-conversjid': jid,
                    'class': 'ui-widget-content'
                });

            list.append(li);

            conversNumber++;

        });

        if (conversNumber < 1) {
            // create list element
            var li = $("<li></li>")
                .text("Aucune conversation")
                .attr({
                    'data-conversjid': null,
                    'class': 'ui-widget-content'
                });

            list.append(li);
        }

    };

    // update each time buddy list change
    $(document).on("add.roster.jsxc", updateConversationList);
    $(document).on("cloaded.roster.jsxc", updateConversationList);
    $(document).on("buddyListChanged.jsxc", updateConversationList);

    // first update
    updateConversationList();

    return {
        /**
         * Jquery object on root
         */
        "root": root,

        /**
         * Update list
         */
        "updateConversationList": updateConversationList
    };

};