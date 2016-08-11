// TODO: onSlave
// TODO: ...

var jsxc = {
  gui : {
    newgui : {

      /**
       * Sidebar of deployed chat sidebar
       */
      SIDEBAR_HEIGHT : '600px', VIDEOPANEL_HEIGHT : '500px',

      /**
       * Animation of toggling chat side bar, in ms
       */
      SIDEBAR_ANIMATION_DURATION : '1500',

      _log : function(message, data, level) {

        level = "[" + (level || 'INFO').trim().toUpperCase() + "] ";

        console.log(level + message, data || "");
      },

      _selectionMode: true,

      /**
       * Init gui
       */
      init : function() {

        var self = jsxc.gui.newgui;

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
          self.toggleVideopanel();
        });

        // filter users / conversations
        $("#jsxc-new-gui-filter-users").click(function() {
          self.toggleBuddyFilter('buddies');
        });

        $("#jsxc-new-gui-filter-conversations").click(function() {
          self.toggleBuddyFilter('conversations');
        });
        self.toggleBuddyFilter('buddies');

        // selection mode
        $("#jsxc-select-buddies").click(function() {
          self.toggleSelectionMode();
          $(this).toggleClass("jsxc-selection-mode-enabled");
        });
        

      },

      toggleBuddyFilter : function(mode) {

        var self = jsxc.gui.newgui;

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

        var self = jsxc.gui.newgui;

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
      toggleVideopanel : function(callbackWhenFinished) {

        var self = jsxc.gui.newgui;

        var videopanel = $("#jsxc-video-panel");

        if (self.isVideopanelShown() === false) {

          // add box shadow
          videopanel.css("box-shadow", "3px 3px 3px 3px rgba(0, 0, 0, 0.3)");

          videopanel.animate({
            height : self.VIDEOPANEL_HEIGHT
          }, self.SIDEBAR_ANIMATION_DURATION, function() {

            // Animation complete.
            videopanel.addClass("jsxc-deploy");

            if (callbackWhenFinished) {
              callbackWhenFinished();
            }
          });

        }

        else {

          videopanel.animate({
            height : '0px'
          }, self.SIDEBAR_ANIMATION_DURATION, function() {

            // Animation complete.
            videopanel.removeClass("jsxc-deploy");

            // remove box shadow
            videopanel.css("box-shadow", "none");

            if (callbackWhenFinished) {
              callbackWhenFinished();
            }
          });

        }
      },

      /**
       * Return true if chat sidebar is shown
       */
      isVideopanelShown : function() {
        return $("#jsxc-video-panel").hasClass("jsxc-deploy");
      },

      /**
       * Toggle the chat sidebar
       */
      toggleChatSidebar : function(callbackWhenFinished) {

        var self = jsxc.gui.newgui;

        var sidebar = $("#jsxc-chat-sidebar");
        var content = $("#jsxc-chat-sidebar-content");

        if (self.isChatSidebarShown() === false) {

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

          content.animate({
            height : '0px'
          }, self.SIDEBAR_ANIMATION_DURATION, function() {

            // Animation complete.
            content.removeClass("jsxc-deploy");

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
      }

    }

  }
};