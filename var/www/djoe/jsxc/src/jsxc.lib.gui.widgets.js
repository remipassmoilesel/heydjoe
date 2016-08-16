jsxc.gui.widgets = {

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
  createConversationList : function(selector) {

    var root = $(selector);
    root.addClass("jsxc_conversation-list-container");

    // add list
    root.append("<ul class='jsxc-conversation-list'></ul>");

    var list = $(selector + " .jsxc-conversation-list");

    // update lists
    var updateConversationList = function() {

      list.empty();

      // iterate buddies
      var conversList = jsxc.storage.getLocaleBuddyListBJID();
      var conversNumber = 0;
      $.each(conversList, function(index, jid) {

        // check type of element: buddie / conversation
        var infos = jsxc.storage.getUserItem('buddy', Strophe.getBareJidFromJid(jid));
        var chatRoom = infos.type === 'groupchat';

        if (chatRoom !== true) {
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
    $(document).on("cloaded.roster.jsxc", updateConversationList);
    $(document).on("buddyListChanged.jsxc", updateConversationList);

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

  }

};