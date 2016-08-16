/**
 * Here go all interactions from the new interface
 *
 * All init functions are called onlys once, when GUI is preparing, whenever disconnections happend
 *
 */
jsxc.gui.actions = {

  init : function() {

    var self = jsxc.gui.actions;

    self._initSettingsPanel();

    self._initActionPanel();

    self._initSearchPanel();

    self._initStatusPanel();

  },

  /**
   * Add a listener to connexion events and remove it when disconnected
   * @param callback
   * @private
   */
  _addAttachedListener : function(callback) {
    $(document).on('attached.jsxc', callback);
    $(document).on('disconnected.jsxc', function() {
      $(document).off('attached.jsxc', callback);
    });
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

  /**
   * Get checked elements from buddylist, and only the buddies
   * @returns {Array}
   * @private
   */
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

  /**
   * Init the status panel, at bottom of the chat sidebar
   * @private
   */
  _initStatusPanel : function() {

    // var self = jsxc.gui.actions;
    var newgui = jsxc.newgui;

    var loginBtn = $('#jsxc-status-bar .jsxc-login-button');
    var logoutBtn = $('#jsxc-status-bar .jsxc-logout-button');

    // display own presence information
    $(document).on('ownpresence.jsxc', function() {
      newgui.updateUserPresenceIndicator();
    });
    newgui.updateUserPresenceIndicator();

    /**
     * Hide one element and show a second one
     * @param toShow
     * @param toHide
     */
    var hideAndShow = function(toShow, toHide) {

      // hide old element
      toHide.animate({
        opacity : 0
      }, newgui.OPACITY_ANIMATION_DURATION, function() {
        toHide.css('display', 'none');

        // show new one
        toShow.css({
          'display' : 'inline-block', 'opacity' : 0
        });
        toShow.animate({
          'opacity' : '1'
        }, newgui.OPACITY_ANIMATION_DURATION);
      });

    };

    // log out button
    logoutBtn.click(function() {

      // disconnect
      jsxc.api.disconnect();
      hideAndShow(loginBtn, logoutBtn);

    });

    // login button
    loginBtn.click(function() {

      jsxc.api.reconnect();

      $(document).one('connected.jsxc', function() {
        hideAndShow(logoutBtn, loginBtn);
      });

    });

    // show login / logout on connect
    if (jsxc.xmpp.conn) {
      hideAndShow(logoutBtn, loginBtn);
    } else {
      $(document).one('attached.jsxc', function() {
        hideAndShow(logoutBtn, loginBtn);
      });
    }

    // make status bar selectable
    $("#jsxc-status-bar .jsxc-select-status").change(function() {

      var pres = $(this).find(":selected").data('pres');

      jsxc.xmpp.changeOwnPresence(pres);

      jsxc.gui.feedback('Statut mis à jour');

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