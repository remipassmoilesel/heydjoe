jsxc.gui.actions = {

  init : function() {

    var self = jsxc.gui.actions;

    self._initSettingsPanel();

    self._initActionPanel();

    self._initSearchPanel();

    self._initStatusPanel();

  },

  /**
   * Get all checked elements from buddylist, conversations AND buddies
   * @returns {Array}
   * @private
   */
  _getCheckedElements : function() {

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

  _getCheckedBuddies : function() {

    var all = $("#jsxc_buddylist li");
    var rslt = [];

    all.each(function() {
      var element = $(this);
      if (element.data('type') === 'chat' && element.find(".jsxc-checked").length > 0) {
        rslt.push({
          jid : element.data('jid'), bid : element.data('bid')
        });
      }
    });

    return rslt;

  },

  _initStatusPanel: function(){

    $('#jsxc-status-bar .jsxc-logout-button').click(function(){
      jsxc.api.disconnect();
    });
    
    $('#jsxc-status-bar .jsxc-login-button').click(function(){
      jsxc.api.reconnect();
    });

    $('#jsxc-status-bar .jsxc-select-status').change(function(){
      console.error(arguments);
    });

  },

  _initActionPanel : function() {

    var self = jsxc.gui.actions;

    // Start a new MUC conversation
    $('#jsxc-chat-sidebar .jsxc-action_new-conversation').click(function() {

      var selected = [];
      $.each(self._getCheckedElements(), function(index, element) {
        selected.push(element.jid);
      });

      jsxc.api.createNewConversationWith(selected);
    });

    $('.jsxc-action_delete-buddies').click(function() {

      var buddies = self._getCheckedElements();

      // check if buddies are checked
      if (buddies.length < 1) {
        jsxc.gui.feedback("Vous devez sélectionner un élément au moins");
        return;
      }

      // get bid
      var bidArray = [];
      $.each(buddies, function(index, element) {
        bidArray.push(element.bid);
      });

      // show confirmation dialog
      jsxc.gui.showRemoveManyDialog(bidArray);

    });

  },

  /**
   * Setting menu, where user can mute notifications, see 'About dialog', ...
   * @private
   */
  _initSettingsPanel : function() {

    // var self = jsxc.gui.actions;
    var newgui = jsxc.newgui;

    // add openning action
    $('#jsxc-chat-sidebar .jsxc-toggle-settings').click(function() {
      newgui.toggleSettingsMenu();
    });

    $('#jsxc-settings-menu .jsxc-action_clearLocalStorage').click(function() {

      var buddies = jsxc.storage.getUserItem("buddylist") || [];

      $.each(buddies, function(index, jid) {
        jsxc.gui.window.clear(jid);
      });

      jsxc.gui.feedback("L'historique à été éffacé avec succès");

    });

  },

  _getCheckedSearchUsers : function() {
    return $(".jsxc-search-users-results .jsxc-checked");
  },

  _initSearchPanel : function() {

    var self = jsxc.gui.actions;
    // var newgui = jsxc.newgui;

    $("#jsxc-chat-sidebar-search-invite").click(function() {

      var checkedElements = self._getCheckedSearchUsers();

      if (checkedElements.length < 1) {
        jsxc.gui.feedback("Vous devez choisir au moins un contact");
        return false;
      }

      var invited = [];
      $.each(checkedElements, function(index, element) {

        var jqi = $(element);
        var i = jqi.data('jid');

        jsxc.xmpp.addBuddy(i);
        invited.push(Strophe.getNodeFromJid(i));

        jqi.removeClass('jsxc-checked');

      });

      jsxc.gui.feedback("Ces utilisateurs ont été invité: " + invited.join(", "));

      var entries = $(".jsxc-search-users-results .jsxc-search-user-entry");

      // clean search space
      entries.animate({
        'opacity' : "0"
      }, 700, function() {
        entries.remove();
      });

    });

  }

};