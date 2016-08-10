var jsxc = {
  gui : {
    newgui : {

      /**
       * Sidebar of deployed chat sidebar
       */
      SIDEBAR_HEIGHT: '500px',
      VIDEOPANEL_HEIGHT: '500px',

      /**
       * Animation of toggling chat side bar, in ms
       */
      SIDEBAR_ANIMATION_DURATION: '1500',

      _log: function(message, data, level){

        level = "[" + (level || 'INFO').trim().toUpperCase() + "] ";

        console.log(level + message, data || "");
      },

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

        var togglechat = $("#jsxc-chat-sidebar-header .jsxc-toggle-chat");
        togglechat.click(function(){
          self.toggleChatSidebar();
        });

        var togglevideo = $("#jsxc-chat-sidebar-header .jsxc-toggle-video");
        togglevideo.click(function(){
          self.toggleVideopanel();
        });

      },

      /**
       * Toggle video panel
       *
       * If video panel have to be shown, chat sidebar have too
       *
       * @param callbackWhenFinished
       */
      toggleVideopanel: function(callbackWhenFinished){

        var self = jsxc.gui.newgui;

        var videopanel = $("#jsxc-video-panel");

        if (self.isVideopanelShown() === false) {

          // add box shadow
          videopanel.css("box-shadow", "3px 3px 3px 3px rgba(0, 0, 0, 0.3)");

          videopanel.animate({
            height: self.VIDEOPANEL_HEIGHT
          }, self.SIDEBAR_ANIMATION_DURATION, function() {

            // Animation complete.
            videopanel.addClass("jsxc-deploy");

            if(callbackWhenFinished){
              callbackWhenFinished();
            }
          });

        }

        else {

          videopanel.animate({
            height: '0px'
          }, self.SIDEBAR_ANIMATION_DURATION, function() {

            // Animation complete.
            videopanel.removeClass("jsxc-deploy");

            // remove box shadow
            videopanel.css("box-shadow", "none");

            if(callbackWhenFinished){
              callbackWhenFinished();
            }
          });

        }
      },

      /**
       * Return true if chat sidebar is shown
       */
      isVideopanelShown: function(){
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
            height: self.SIDEBAR_HEIGHT
          }, self.SIDEBAR_ANIMATION_DURATION, function() {

            // Animation complete.
            content.addClass("jsxc-deploy");

            if(callbackWhenFinished){
              callbackWhenFinished();
            }
          });

        }

        else {

          content.animate({
            height: '0px'
          }, self.SIDEBAR_ANIMATION_DURATION, function() {

            // Animation complete.
            content.removeClass("jsxc-deploy");

            if(callbackWhenFinished){
              callbackWhenFinished();
            }
          });

        }

      },

      /**
       * Return true if chat sidebar is shown
       */
      isChatSidebarShown: function(){
        return $("#jsxc-chat-sidebar-content").hasClass("jsxc-deploy");
      }

    }

  }
};