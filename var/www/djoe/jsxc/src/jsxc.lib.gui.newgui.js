/**
 *
 * New GUI added on original JSXC GUI
 *
 * Gui is divided in two parts: mediapanel on the top of sreen and chat sidebar on right.
 * Here all stuff to initiate this GUI go here (openning, closing, ...) except "functionnnalities"
 * that have to be in 'gui.interactions'
 *
 *
 * @memberOf jsxc
 */
jsxc.newgui = {

  // TODO: onSlave
  // TODO: onHTTP/HTTPS
  // TODO: onLocalStorageUnavailable...

  /**
   * Sidebar of deployed chat sidebar
   */
  SIDEBAR_CONTENT_HEIGHT : '480px',

  MEDIAPANEL_HEIGHT : '550px',

  /**
   * Animation of toggling chat side bar, in ms
   */
  SIDEBAR_ANIMATION_DURATION : '1500',

  SCROLL_ANIMATION_DURATION : '500',

  FLOATING_MENU_ANIMATION_DURATION : '800',

  OPACITY_ANIMATION_DURATION : '500',

  _log : function(message, data, level) {
    jsxc.debug('[NGUI] ' + message, data, level);
  },

  /**
   * If true, buddies displayed in buddy list are selectionnable
   */
  _selectionMode : true,

  _searchTimer : 0,

  /**
   * Init gui
   */
  init : function() {

    var self = jsxc.newgui;

    /**
     * Header: Always visible
     *
     */
    // open and close chat sidebar
    var togglechat = $("#jsxc-chat-sidebar-header .jsxc-toggle-sidebar");
    togglechat.click(function() {
      self.toggleChatSidebar();
    });

    // open and close video panel
    var togglevideo = $("#jsxc-chat-sidebar-header .jsxc-toggle-mediapanel");
    togglevideo.click(function(event) {
      self.toggleMediapanel();
      event.stopPropagation();
    });

    // filter users and conversations
    var buddyFilter = $("#jsxc-new-gui-filter-users");
    var conversationFilter = $("#jsxc-new-gui-filter-conversations");

    buddyFilter.click(function() {
      self.toggleBuddyFilter('buddies');
      buddyFilter.addClass("jsxc-active-filter");
      conversationFilter.removeClass("jsxc-active-filter");
    });
    self.toggleBuddyFilter('buddies');
    buddyFilter.addClass("jsxc-active-filter");

    conversationFilter.click(function() {
      self.toggleBuddyFilter('conversations');
      conversationFilter.addClass("jsxc-active-filter");
      buddyFilter.removeClass("jsxc-active-filter");
    });

    // selection mode
    $("#jsxc-select-buddies").click(function() {
      self.toggleSelectionMode();
      $(this).toggleClass("jsxc-selection-mode-enabled");
    });

    $("#jsxc-chat-sidebar-header").click(function() {
      self.toggleChatSidebar();
    });

    // close media panel
    $("#jsxc-mediapanel .jsxc-close-mediapanel").click(function() {
      self.toggleMediapanel();
    });

    // close chat sidebar
    $("#jsxc-chat-sidebar .jsxc-close-chatsidebar").click(function() {
      self.toggleChatSidebar();
    });

    // add openning action
    $("#jsxc-toggle-actions").click(function() {
      self.toggleActionsMenu();
    });

    // XEP 0055 User search panel
    self._initSearchPanel();

    // where user can manage notifications
    self._initNotificationsPanel();

    // optionnal
    // self.initMediaPanelMouseNavigation();

    self.toggleBuddyFilter("buddies");

    // display name in status bar
    $(document).on('attached.jsxc', function() {
      self.updateStatusBarUserName();
    });
    self.updateStatusBarUserName();

    // hide etherpad control if needed
    if (jsxc.options.etherpad.enabled !== true) {
      $(".jsxc-action_new-etherpad-document").css({"display" : "none"});
    }

    // update header on presence and on notice received
    $(document).on('presence.jsxc', self.updateChatSidebarHeader);
    $(document).on('notice.jsxc', self.updateChatSidebarHeader);
    $(document).on('attached.jsxc', self.updateChatSidebarHeader);
    $(document).on('disconnected.jsxc', self.updateChatSidebarHeader.bind(self, true));
    self.updateChatSidebarHeader();

    // init multimedia stream gui
    jsxc.mmstream.gui._initGui();
  },


  /**
   * Utility to toggle a floating menu visible or hidden
   * @param menuSelector
   * @param buttonSelector
   * @param attachment
   * @param targetAttachment
   * @param offset
   * @private
   */
  _toggleFloatingMenu : function(menuSelector, buttonSelector, attachment, targetAttachment,
      offset) {

    var self = jsxc.newgui;
    var menu = $(menuSelector);

    if (menu.hasClass('jsxc-deploy') === false) {

      menu.addClass("jsxc-deploy");

      // show menu
      menu.css({
        'opacity' : '0', 'display' : 'block'
      });

      // pin menu to button
      new Tether({
        element : menuSelector,
        target : buttonSelector,
        attachment : attachment,
        targetAttachment : targetAttachment,
        offset : offset || '5px 5px'
      });

      // animate openning
      menu.animate({
        opacity : 1
      }, self.FLOATING_MENU_ANIMATION_DURATION, function() {

      });

    }

    else {

      menu.removeClass("jsxc-deploy");

      // animate closing
      menu.animate({
        opacity : 0
      }, self.FLOATING_MENU_ANIMATION_DURATION, function() {

        // hide menu
        menu.css({
          'display' : 'none'
        });

      });

    }

  }

};