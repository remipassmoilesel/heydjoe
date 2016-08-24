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
    togglechat.click(function(event) {
      self.toggleChatSidebar();
      if (self.isContentVisible('jsxc-buddy-list-container') === false) {
        self.toggleBuddyList();
      }
      event.stopPropagation();
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

    conversationFilter.click(function() {
      self.toggleBuddyFilter('conversations');
      conversationFilter.addClass("jsxc-active-filter");
      buddyFilter.removeClass("jsxc-active-filter");
    });

    // activate buddy on launch
    self.toggleBuddyFilter('buddies');
    buddyFilter.addClass("jsxc-active-filter");

    // selection mode
    $("#jsxc-select-buddies").click(function() {
      self.toggleSelectionMode();
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

    // (re) connexion panel
    self._initConnexionMenu();

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

  },

  /**
   * Utility to hide one element and show a second one with animations
   * @param toShow
   * @param toHide
   */
  hideAndShow : function(toShow, toHide) {

    var self = jsxc.newgui;

    // hide old element
    toHide.animate({
      opacity : 0
    }, self.OPACITY_ANIMATION_DURATION, function() {
      toHide.css('display', 'none');

      // show new one
      toShow.css({
        'display' : 'inline-block', 'opacity' : 0
      });
      toShow.animate({
        'opacity' : '1'
      }, self.OPACITY_ANIMATION_DURATION);
    });

  },

  /**
   * Half of the animation duration
   */
  STATE_INDICATOR_ANIMATION_DURATION : 100,

  /**
   * Create a state indicator informing user that something is turned on or off
   */
  createStateIndicator : function(selector) {

    var self = jsxc.newgui;

    if (!selector) {
      throw new Error("Invalid argument: " + selector);
    }

    // root maybe containing other elements
    var root = $(selector);

    // indicator off / on
    var indicator = $(
        '<span class="jsxc_stateIndicator">&nbsp;<span class="jsxc_stateIndicator_on">on</span> | ' +
        '<span class="jsxc_stateIndicator_off">off</span></span>');

    root.append(indicator);

    var on = indicator.find('.jsxc_stateIndicator_on');
    var off = indicator.find('.jsxc_stateIndicator_off');

    var duration = self.STATE_INDICATOR_ANIMATION_DURATION;

    /**
     * State of indicator. True: on, false: off
     * @type {boolean}
     */
    var indicatorState = false;

    var ret = {

      /**
       * The root of the indicator
       */
      root : indicator,

      getState : function() {
        return indicatorState;
      },

      /**
       * Toggle state on | off
       */
      toggleState : function(state) {

        if (typeof state === 'undefined') {
          state = !indicatorState;
          indicatorState = state;
        }

        if (state === true) {

          off.animate({
                color : 'black', opacity : 0.3
              }, duration,

              function() {

                on.animate({
                  color : 'blue', opacity : 1
                }, duration);

              });
        }

        else {

          on.animate({
                color : 'black', opacity : 0.5
              }, duration,

              function() {

                off.animate({
                  color : 'blue', opacity : 1
                }, duration);

              });
        }

      }

    };

    return ret;
  }

};