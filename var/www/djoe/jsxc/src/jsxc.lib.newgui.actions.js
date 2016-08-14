



jsxc.newgui.actions = {

  init : function() {

    var self = jsxc.newgui.actions;

    self._initSettingsPanel();

    self._initActionPanel();

    // TODO delete MUC or user
    //
    // if (data.type !== 'groupchat') {
    //   bud.find('.jsxc_delete').click(function() {
    //     jsxc.gui.showRemoveDialog(bid);
    //     return false;
    //   });
    // }

  },

  _getCheckedBuddies : function() {

    var all = $("#jsxc_buddylist li");
    var rslt = [];

    all.each(function() {
      var element = $(this);
      if (element.find(".jsxc-checked").length > 0) {
        rslt.push({
          jid : element.data('jid'), bid : element.data('bid')
        });
      }
    });

    return rslt;

  },

  _initActionPanel : function() {

    var self = jsxc.newgui.actions;
    
    // Start a new MUC conversation
    $('#jsxc-chat-sidebar .jsxc-action_new-conversation').click(function() {

      var selected = [];
      $.each(self._getCheckedBuddies(), function(index, element) {
        selected.push(element.jid);
      });

      jsxc.api.createNewConversationWith(selected);
    });

  },

  /**
   * Setting menu, where user can mute notifications, see 'About dialog', ...
   * @private
   */
  _initSettingsPanel : function() {

    // var self = jsxc.newgui.actions;
    var newgui = jsxc.newgui;

    // add openning action
    $('#jsxc-chat-sidebar .jsxc-toggle-settings').click(function() {
      newgui.toggleSettingsMenu();
    });

    $('#jsxc-settings-menu .jsxc-action_clearLocalStorage').click(function(){

      var buddies = jsxc.storage.getUserItem("buddylist") || [];

      $.each(buddies, function(index, jid){
        jsxc.gui.window.clear(jid);
      });

      jsxc.gui.feedback("L'historique à été éffacé avec succès");

    });

  },

};