// TODO: onSlave
// TODO: ...

var jsxc = {

  newgui : {

    /**
     * Sidebar of deployed chat sidebar
     */
    SIDEBAR_HEIGHT : '550px',

    MEDIAPANEL_HEIGHT : '500px',

    /**
     * Animation of toggling chat side bar, in ms
     */
    SIDEBAR_ANIMATION_DURATION : '1500',

    MENU_APPEAR_ANIMATION_DURATION : '800',

    _log : function(message, data, level) {

      level = "[" + (level || 'INFO').trim().toUpperCase() + "] ";

      console.log(level + message, data || "");
    },

    _selectionMode : true,

    /**
     * Init gui
     */
    init : function() {

      var self = jsxc.newgui;

      /**
       * Header: Always visible
       *
       */
      var header = $("#jsxc-chat-sidebar-header");
      header.click(function() {

      });

      // open and close chat sidebar
      var togglechat = $("#jsxc-chat-sidebar-header .jsxc-toggle-chat");
      togglechat.click(function() {
        self.toggleChatSidebar();
      });

      // open and close video panel
      var togglevideo = $("#jsxc-chat-sidebar-header .jsxc-toggle-video");
      togglevideo.click(function() {
        self.toggleMediapanel();
      });

      // filter users and conversations
      var buddyFilter = $("#jsxc-new-gui-filter-users");
      var conversationFilter = $("#jsxc-new-gui-filter-conversations");

      buddyFilter.click(function() {
        self.toggleBuddyFilter('buddies');
        buddyFilter.toggleClass("jsxc-active-filter");
        conversationFilter.toggleClass("jsxc-active-filter");
      });
      self.toggleBuddyFilter('buddies');
      buddyFilter.toggleClass("jsxc-active-filter");

      conversationFilter.click(function() {
        self.toggleBuddyFilter('conversations');
        conversationFilter.toggleClass("jsxc-active-filter");
        buddyFilter.toggleClass("jsxc-active-filter");
      });

      // selection mode
      $("#jsxc-select-buddies").click(function() {
        self.toggleSelectionMode();
        $(this).toggleClass("jsxc-selection-mode-enabled");
      });

      $(".jsxc-last-notifications").click(function(){
        self.toggleChatSidebar();
        self.toggleMediapanel();
      });

      // settings menu
      self._initSettingsMenu();

    },

    toggleBuddyFilter : function(mode) {

      var self = jsxc.newgui;

      self._log("toggleBuddyFilter: " + mode);

      if (mode !== 'buddies' && mode !== 'conversations') {
        throw new Error("Unknown mode: " + mode);
      }

      // TODO check how was selected buddies in original JSXC
      var list = self._getBuddyList();

      // self._log("buddylist", list);

      var displayBuddies = mode === 'buddies' ? 'block' : 'none';
      var displayConversations = displayBuddies === 'block' ? 'none' : 'block';

      list.each(function() {
        var element = $(this);

        element.css('display',
            element.data('type') === 'chat' ? displayBuddies : displayConversations);
      });

    },

    toggleSelectionMode : function() {

      var self = jsxc.newgui;

      self._log("toggleSelectionMode: " + self._selectionMode);

      var list = self._getBuddyList();

      self._selectionMode = !self._selectionMode;

      if (self._selectionMode === false) {

        // remove all click handler and replace it by selector
        list.each(function() {

          var element = $(this);
          element.off('click');

          element.on('click', function() {
            var toDecorate = $(this).find('div.jsxc_name');
            self._toggleBuddySelected(toDecorate);
          });

        });
      }

      else {

        // remove all click handler and replace it by selector
        list.each(function() {

          var element = $(this);
          element.off('click');

          element.find(".jsxc-checked").removeClass("jsxc-checked");

        });
      }

    },

    _toggleBuddySelected : function(toDecorate) {

      var className = 'jsxc-checked';
      if (toDecorate.hasClass(className)) {
        toDecorate.removeClass(className);
      } else {
        toDecorate.addClass(className);
      }
      return toDecorate;
    },

    /**
     * Return an JQuery instance of the buddy list ( li )
     * @returns {*|JQuery|jQuery|HTMLElement}
     * @private
     */
    _getBuddyList : function() {

      // TODO check how was selected buddies in original JSXC
      return $("#jsxc_buddylist li.jsxc_rosteritem");

    },

    /**
     * Toggle video panel
     *
     * If video panel have to be shown, chat sidebar have too
     *
     * @param callbackWhenFinished
     */
    toggleMediapanel : function(callbackWhenFinished) {

      var self = jsxc.newgui;

      var mediapanel = $("#jsxc-mediapanel");

      if (self.isMediapanelShown() === false) {

        // add box shadow
        mediapanel.css("box-shadow", "3px 3px 3px 3px rgba(0, 0, 0, 0.3)");

        mediapanel.animate({
          height : self.MEDIAPANEL_HEIGHT
        }, self.SIDEBAR_ANIMATION_DURATION, function() {

          // Animation complete.
          mediapanel.addClass("jsxc-deploy");

          if (callbackWhenFinished) {
            callbackWhenFinished();
          }
        });

      }

      else {

        mediapanel.animate({
          height : '0px'
        }, self.SIDEBAR_ANIMATION_DURATION, function() {

          // Animation complete.
          mediapanel.removeClass("jsxc-deploy");

          // remove box shadow
          mediapanel.css("box-shadow", "none");

          if (callbackWhenFinished) {
            callbackWhenFinished();
          }
        });

      }
    },

    /**
     * Return true if chat sidebar is shown
     */
    isMediapanelShown : function() {
      return $("#jsxc-mediapanel").hasClass("jsxc-deploy");
    },

    /**
     * Toggle the chat sidebar
     */
    toggleChatSidebar : function(callbackWhenFinished) {

      var self = jsxc.newgui;

      var sidebar = $("#jsxc-chat-sidebar");
      var content = $("#jsxc-chat-sidebar-content");
      var settings = $("#jsxc-toggle-settings");

      if (self.isChatSidebarShown() === false) {

        settings.css({
          opacity : '0', display : 'inline-block'
        });

        // show settings button
        settings.animate({
          opacity : 1
        });

        // raise sidebar
        content.animate({
          height : self.SIDEBAR_HEIGHT
        }, self.SIDEBAR_ANIMATION_DURATION, function() {

          // Animation complete.
          content.addClass("jsxc-deploy");

          if (callbackWhenFinished) {
            callbackWhenFinished();
          }
        });

      }

      else {

        // hide settings button
        settings.animate({
          opacity : 0
        });

        // drop down sidebar
        content.animate({
          height : '0px'
        }, self.SIDEBAR_ANIMATION_DURATION, function() {

          // Animation complete.
          content.removeClass("jsxc-deploy");

          settings.css({
            display : 'none'
          });

          if (callbackWhenFinished) {
            callbackWhenFinished();
          }
        });

      }

    },

    /**
     * Return true if chat sidebar is shown
     */
    isChatSidebarShown : function() {
      return $("#jsxc-chat-sidebar-content").hasClass("jsxc-deploy");
    },

    /**
     * Setting menu, where user can mute notifications, see 'About dialog', ...
     * @private
     */
    _initSettingsMenu : function() {

      var self = jsxc.newgui;

      // add openning action
      $('#jsxc-toggle-settings').click(function() {
        self.toggleSettingsMenu();
      });

    },

    /**
     * Open or close settings menu
     */
    toggleSettingsMenu : function() {
      jsxc.newgui._toggleFloatingMenu('#jsxc-settings-menu', '#jsxc-toggle-settings', 'top right',
          'middle left');
    },

    /**
     * Utility to toggle a menu visible or hidden
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
        var tether = new Tether({
          element : menuSelector,
          target : buttonSelector,
          attachment : attachment,
          targetAttachment : targetAttachment,
          offset : offset || '5px 5px'
        });

        // animate openning
        menu.animate({
          opacity : 1
        }, self.MENU_APPEAR_ANIMATION_DURATION, function() {

        });

      }

      else {

        menu.removeClass("jsxc-deploy");

        // animate closing
        menu.animate({
          opacity : 0
        }, self.SIDEBAR_ANIMATION_DURATION, function() {

          // hide menu
          menu.css({
            'display' : 'none'
          });

        });

      }

    },

    MEDIA_RESSOURCES : {

      youtube : {

        //https://www.youtube.com/watch?v=FbuluDBHpfQ
        regex : [/https?:\/\/(www\.)?youtube\.[a-z]{1,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/ig,
          /https?:\/\/(www\.)?youtu\.be\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/ig],

        filterFunction : function() {
          var self = jsxc.newgui;
          var match = arguments[0];
          return self._getShowRessourceLink(match, "youtube");
        },

        getEmbedded : function(ressourceOnly) {
          var self = jsxc.newgui;

          // get video id from ressource
          // https://www.youtube.com/watch?v=FbuluDBHpfQ.match(/v=([^&]+)/i);
          var vid = ressourceOnly.match(/v=([^&]+)/i);

          if(vid === null) {
            return null;
          }

          return '<iframe src="https://www.youtube.com/embed/' + vid[1] +
              '" frameborder="0" allowfullscreen></iframe>';
        }

      }

    },

    /**
     * Return an HTML link
     * @param ressource
     * @returns {string}
     * @private
     */
    _getShowRessourceLink : function(ressource, prefix) {

      if (typeof ressource === 'undefined') {
        throw new Error('Ressource cannot be undefined');
      }
      if (typeof prefix === 'undefined') {
        throw new Error('Prefix cannot be undefined');
      }

      // format ressource to show it
      var ressourceLabel = ressource.length < 20 ? ressource : ressource.substr(0, 17) + "...";

      // add prefix to ressource
      ressource = prefix ? prefix + ":" + ressource : ressource;

      // return HTML link
      return '<a class="jsxc-media-ressource-link" onclick="jsxc.newgui.openMediaRessource(\'' +
          ressource + '\')">' + ressourceLabel + '</a>';
    },

    /**
     * Open a media ressource in the media panel
     * @param ressource
     */
    openMediaRessource : function(ressource) {

      var self = jsxc.newgui;

      if (self.isMediapanelShown() === false) {
        self.toggleMediapanel();
      }

      //retrieve prefix of ressource
      var prefix = ressource.substring(0, ressource.indexOf(":"));

      var ressourceOnly = ressource.substring(prefix.length + 1, ressource.length);

      self._log("openMediaRessource: ", {
        ressource : ressource, prefix : prefix, ressourceOnly : ressourceOnly
      });

      if (!prefix || !self.MEDIA_RESSOURCES[prefix]) {
        throw new Error("Invalid ressource: " + ressource);
      }

      var embedded = self.MEDIA_RESSOURCES[prefix].getEmbedded(ressourceOnly);

      self._addMediaRessource(embedded);

    },

    _addMediaRessource : function(htmlContent) {

      var self = jsxc.newgui;

      var container = $('<div class="jsxc-remote-video"></div>').append(htmlContent);

      self._log("_addMediaRessource", {container : container});

      $("#jsxc-mediapanel-right").append(container);
    },

    /**
     * Analyse text and return HTML code containing links to display ressources in the ressource
     * panel
     */
    textFilter : function(text) {

      var self = jsxc.newgui;

      self._log("textFilter");
      self._log(text);

      $.each(self.MEDIA_RESSOURCES, function(filterName, filter) {

        for (var i = 0; i < filter.regex.length; i++) {

          var regex = filter.regex[i];

          if (text.match(regex)) {
            text = text.replace(regex, filter.filterFunction);
          }

        }

      });

      self._log("Output: ", text);

      return text;
    }

  }

};