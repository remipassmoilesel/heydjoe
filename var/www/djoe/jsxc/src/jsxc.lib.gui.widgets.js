jsxc.gui.widgets = {

  /**
   * Create a selectable conversation list
   *
   *
   * <p>Each item contains data:
   *
   * <p>'data-conversjid'
   *
   *
   * @param selector
   */
  createConversationList : function(selector) {

    var root = $(selector);
    root.empty();

    root.addClass("jsxc_conversation-list-container");

    // add list
    var list = $("<ul class='jsxc-conversation-list'></ul>");
    root.append(list);

    // update lists
    var updateConversationList = function() {

      list.empty();

      // iterate buddies
      var conversList = jsxc.storage.getLocaleBuddyListBJID();
      var conversNumber = 0;
      $.each(conversList, function(index, jid) {

        // check type of element: buddie / conversation
        var infos = jsxc.storage.getUserItem('buddy', Strophe.getBareJidFromJid(jid));

        if ((infos.type === 'groupchat') !== true) {
          return true;
        }

        var conversName = Strophe.getNodeFromJid(jid);

        // create list element
        var li = $("<li></li>")
            .text(conversName)
            .data('conversjid', jid)
            .click(function() {
              $(this).toggleClass("jsxc-checked");
            });

        list.append(li);

        conversNumber++;

      });

      if (conversNumber < 1) {
        // create list element
        var li = $("<li></li>")
            .text("Aucune conversation")
            .data('conversjid', null);

        list.append(li);
      }

    };

    // update each time buddy list change
    $(document).on("add.roster.jsxc", updateConversationList);
    $(document).on("remove.roster.jsxc", updateConversationList);
    $(document).on("cloaded.roster.jsxc", updateConversationList);

    // first update
    updateConversationList();

    return {
      /**
       * Jquery object on root
       */
      "root" : root,

      /**
       * Update list
       */
      "updateConversationList" : updateConversationList
    };

  },

  /**
   * Create a buddy list. To retrieve selected elements select $("#listId .ui-selected");
   *
   *
   * <p>Each item contains data:
   *
   * <p>'data-conversjid'
   *
   *
   * @param selector
   */
  createBuddyList : function(selector) {

    var root = $(selector);
    root.empty();

    root.addClass("jsxc_buddy-list-container");

    // add list
    var list = $("<ul class='jsxc-buddy-list'></ul>");
    root.append(list);

    // update lists
    var updateBuddyList = function() {

      list.empty();

      // iterate buddies
      var buddyList = jsxc.storage.getLocaleBuddyListBJID();
      var buddyNumber = 0;
      $.each(buddyList, function(index, jid) {

        var bid = Strophe.getBareJidFromJid(jid);

        // check type of element: buddie / conversation
        var infos = jsxc.storage.getUserItem('buddy', bid);

        if ((infos.type === 'chat') !== true) {
          return true;
        }

        var buddyName = Strophe.getNodeFromJid(jid);

        // create list element
        var li = $("<li></li>")
            .text(buddyName)
            .data('bid', bid)
            .click(function() {
              $(this).toggleClass("jsxc-checked");
            });

        list.append(li);

        buddyNumber++;

      });

      if (buddyNumber < 1) {
        // create list element
        var li = $("<li></li>")
            .text("Aucun contact")
            .data('bid', null);

        list.append(li);
      }

    };

    // update each time buddy list change
    $(document).on("add.roster.jsxc", updateBuddyList);
    $(document).on("remove.roster.jsxc", updateBuddyList);
    $(document).on("cloaded.roster.jsxc", updateBuddyList);

    // first update
    updateBuddyList();

    return {
      /**
       * Jquery object on root
       */
      "root" : root,

      /**
       * Update list
       */
      "updateBuddyList" : updateBuddyList
    };

  }

};