/**
 * All stuff needed by media panel, the folding panelon top of window
 */
$.extend(jsxc.newgui, {

  /**
   * Return an JQuery object selecting all media ressources displayed
   * @returns {*|JQuery|jQuery|HTMLElement}
   */
  getAllDisplayedMediaRessource : function() {
    return $("#jsxc-mediapanel .jsxc-media-ressource");
  },

  /**
   * Toggle video panel
   *
   * If video panel have to be shown, chat sidebar have too
   *
   * @param callbackWhenFinished
   */
  toggleMediapanel : function(state, callbackWhenFinished) {

    var self = jsxc.newgui;

    // if state not specified, invert it
    if (typeof state === 'undefined' || state === null) {
      state = !self.isMediapanelShown();
    }

    // nothing to do, return
    if (state === self.isMediapanelShown()) {
      if (callbackWhenFinished) {
        callbackWhenFinished();
      }
      return;
    }

    var mediapanel = $("#jsxc-mediapanel");

    // deploy media panel
    if (state === true) {

      mediapanel.find(".jsxc-close-mediapanel").css({
        display : 'block'
      });

      // add box shadow
      mediapanel.css("box-shadow", "3px 3px 3px 3px rgba(0, 0, 0, 0.1)");

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

      mediapanel.find(".jsxc-close-mediapanel").css({
        display : 'none'
      });

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
   * Open a ressource in media panel
   * @param ressource
   */
  openMediaRessource : function(ressource) {

    var self = jsxc.newgui;
    var ress = jsxc.ressources;

    // show media panel if necessary
    self.toggleMediapanel(true);

    //retrieve prefix of ressource
    var prefix = ressource.substring(0, ressource.indexOf(":"));

    var ressourceOnly = ressource.substring(prefix.length + 1, ressource.length);

    self._log("openMediaRessource: ", {
      ressource : ressource, prefix : prefix, ressourceOnly : ressourceOnly
    });

    var embedded = ress.getEmbeddedFor(prefix, ressourceOnly);

    // add ressource only if needed
    if (embedded) {
      self.addMediaRessource(embedded, ressourceOnly);
    }

  },

  /**
   * Remove a media ressource
   * @param container
   */
  removeMediaRessource : function(container) {

    var self = jsxc.newgui;

    if (!container) {
      throw new Error("Invalid argument: " + container);
    }

    container.animate({
      opacity : "0"
    }, self.OPACITY_ANIMATION_DURATION, function() {
      container.remove();
    });

  },

  /**
   * Add a ressource in media panel, wrapped in container
   *
   * @param htmlContent
   * @param title
   * @param ressource
   * @private
   */
  addMediaRessource : function(htmlContent, title, options) {

    var self = jsxc.newgui;

    var defaultOptions = {
      /**
       * Controls availables next the title
       *
       * If null, a close cross will be happend
       */
      titleControls : null
    };

    options = $.extend(defaultOptions, options);

    // container for ressource
    var container = $('<div class="jsxc-media-ressource"></div>').append(htmlContent);

    // displayable title, not too long
    var dspTitle = title.length > 30 ? title.substring(0, 27) + "..." : title;

    // header with title and close cross
    var ressHeader = $("<h1 class='jsxc-title'>" + dspTitle + "</h1>").attr('title', title);
    container.prepend(ressHeader);

    // add close control next the title
    if (!options.titleControls) {

      var closeHeader = $("<span class='jsxc-close-ressource'></span>");
      closeHeader.click(function() {
        self.removeMediaRessource(container);
      });

      ressHeader.append(closeHeader);
    }

    // user provide custom controls, add them
    else {
      ressHeader.append(options.titleControls);
    }

    self._log("addMediaRessource", {title : title, container : container});

    // append ressource
    $("#jsxc-mediapanel-right").append(container);

  }

});
