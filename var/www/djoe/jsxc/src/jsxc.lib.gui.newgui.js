/**
 *
 * New GUI added on original JSXC GUI
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
  SIDEBAR_HEIGHT : '550px',

  MEDIAPANEL_HEIGHT : '500px',

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
    // open and close chat sidebar
    var togglechat = $("#jsxc-chat-sidebar-header .jsxc-toggle-sidebar");
    togglechat.click(function() {
      self.toggleChatSidebar();
    });

    // open and close video panel
    var togglevideo = $("#jsxc-chat-sidebar-header .jsxc-toggle-mediapanel");
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

    $(".jsxc-last-notifications").click(function() {
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

    self._initSearchPanel();

    // optionnal
    // self.initMediaPanelMouseNavigation();

    self.toggleBuddyFilter("buddies");

    // display name in status bar
    if (jsxc.xmpp.conn.jid) {
      $("#jsxc-status-bar .jsxc-user-name").text(Strophe.getNodeFromJid(jsxc.xmpp.conn.jid));
    }

    $(document).on('attached.jsxc', function() {
      $("#jsxc-status-bar .jsxc-user-name").text(Strophe.getNodeFromJid(jsxc.xmpp.conn.jid));
    });

  },

  _searchTimer : 0,

  _initSearchPanel : function() {

    var self = jsxc.newgui;

    $(".jsxc-action_search-user").click(function() {
      self.chatSidebarContent.showContent('jsxc-search-users');
    });

    $("#jsxc-chat-sidebar-search-invite").button();

    var searchBar = $('#jsxc-chat-sidebar-search');

    searchBar.keyup(function() {

      var terms = searchBar.val();

      clearTimeout(self._searchTimer);
      self._searchTimer = setTimeout(function() {

        console.info("Search: " + terms);

        jsxc.xmpp.search.searchUsers(terms).then(function(results) {
          self._displayUserSearchResults(results);
        }).fail(function(error) {
          self._displayUserSearchError(error);
        });

      }, 700);

    });

  },

  _displayUserSearchResults : function(results) {

    var list = $("#jsxc-chat-sidebar .jsxc-search-users-results");

    list.empty();

    var displayed = 0;

    var ownJid = Strophe.getBareJidFromJid(jsxc.xmpp.conn.jid);
    $.each(results, function(index, element) {

      if (element.jid === ownJid) {
        // do not display but continue
        return true;
      }

      var res = $("<div class='jsxc-search-user-entry'></div>").text(element.username);
      res.css({
        display : 'block', opacity : 0
      });

      res.data('jid', element.jid);

      if (element._is_buddy === true) {
        res.addClass("jsxc-search-result-buddie");
      }

      else {
        res.click(function() {
          res.toggleClass("jsxc-checked");
        });
      }

      list.append(res);

      res.animate({
        'opacity' : 1
      });

      displayed++;
    });

    if (displayed < 1) {
      list.append("<div class='jsxc-search-user-entry'>Aucun résultat</div>");
      return;
    }

  },

  _displayUserSearchError : function(error) {

    var list = $("#jsxc-chat-sidebar-search .jsxc-search-users-results");

    list.empty();

    list.append("<div>Erreur lors de la recherche: " + error + "</div>");

  },

  /**
   * Open or close settings menu
   */
  toggleActionsMenu : function() {
    jsxc.newgui.chatSidebarContent.toggleContent('jsxc-actions-menu');
  },

  initMediaPanelMouseNavigation : function() {

    var self = jsxc.newgui;

    var mpanel = $("#jsxc-mediapanel-right");
    var lastMove;

    mpanel.mousemove(function(event) {

      console.log(event.pageX, event.pageY);

      // do not operate if mouse too down
      if (event.pageY > 150) {
        return true;
      }

      // first move
      if (!lastMove) {
        lastMove = event.pageX;

        // keep handler
        return true;
      }

      // get dimensions of panel
      var frameSize = mpanel.width();
      var viewportSize = 0;
      mpanel.find("div.jsxc-media-ressource").each(function() {
        viewportSize += $(this).width();
      });

      if (viewportSize > frameSize) {

        var factor = viewportSize / frameSize;

        // get direction
        var direction = lastMove - event.pageX;

        mpanel.scrollLeft(mpanel.scrollLeft() - direction * factor);

      }

      lastMove = event.pageX;

    });

    // Optionnal: create fake ressources
    for (var i = 0; i < 10; i++) {
      self._addMediaRessource(
          "<div style='background: red; margin: 20px; width: 400px; height: 400px'></div>", 'Title',
          'Ressource');
    }

  },

  /**
   * Buddylist filter. Allow to show only buddies or conversations.
   *
   * For historical reasons, buddies and conversations are stored in same
   * containers.
   *
   * @param mode
   */
  toggleBuddyFilter : function(mode) {

    var self = jsxc.newgui;
    var roster = jsxc.gui.roster;

    self._log("toggleBuddyFilter: " + mode);

    // set filter for future adding
    roster.setFilterMode(mode);

    // TODO check how was selected buddies in original JSXC
    var list = self._getBuddyList();

    // hide all
    list.each(function() {
      $(this).css({
        'opacity' : 0
      });
    });

    var hideElement = function(element) {
      element.css("display", "none");
    };

    var showElement = function(element) {

      element.css({
        display : 'block'
      });

      element.animate({
        opacity : 1
      }, self.OPACITY_ANIMATION_DURATION);

    };

    var applyBuddie = mode === 'buddies' ? showElement : hideElement;
    var applyConversation = mode === 'conversations' ? showElement : hideElement;

    list.each(function() {
      var element = $(this);

      if (element.data('type') === 'chat') {
        applyBuddie(element);
      } else {
        applyConversation(element);
      }

    });

    // show buddy panel if necessary
    // at end of all treatments !
    if (self.chatSidebarContent.isMainContentVisible() !== true) {
      self.chatSidebarContent.showMainContent();
    }

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

        element.click(function() {
          jsxc.gui.window.open(element.data("bid"));
        });

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

      mediapanel.find(".jsxc-close-mediapanel").css({
        display : 'block'
      });

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
   * Toggle the chat sidebar
   */
  toggleChatSidebar : function(callbackWhenFinished) {

    var self = jsxc.newgui;

    var content = $("#jsxc-chat-sidebar-content");
    var settings = $("#jsxc-chat-sidebar .jsxc-toggle-settings");
    var closeCross = $('#jsxc-chat-sidebar .jsxc-close-chatsidebar');

    if (self.isChatSidebarShown() === false) {

      // show close button
      closeCross.css({
        opacity : '0', display : 'inline-block'
      });
      closeCross.animate({
        opacity : 1
      });

      // show settings button
      settings.css({
        opacity : '0', display : 'inline-block'
      });
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

      // hide close button
      closeCross.animate({
        opacity : 0
      });

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
   * Open or close settings menu
   */
  toggleSettingsMenu : function() {
    jsxc.newgui.chatSidebarContent.toggleContent('jsxc-settings-menu');
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
   * Open a media ressource in the media panel
   * @param ressource
   */
  openMediaRessource : function(ressource) {

    var self = jsxc.newgui;
    var ress = jsxc.ressources;

    if (self.isMediapanelShown() === false) {
      self.toggleMediapanel();
    }

    //retrieve prefix of ressource
    var prefix = ressource.substring(0, ressource.indexOf(":"));

    var ressourceOnly = ressource.substring(prefix.length + 1, ressource.length);

    self._log("openMediaRessource: ", {
      ressource : ressource, prefix : prefix, ressourceOnly : ressourceOnly
    });

    var embedded = ress.getEmbeddedFor(prefix, ressourceOnly);

    // add ressource only if needed
    if (embedded) {

      var title = "Vidéo: " +
          (ressourceOnly.length > 20 ? ressourceOnly.substring(0, 17) + "..." : ressourceOnly);

      self._addMediaRessource(embedded, title, ressource);

    }

  },

  /**
   * Add a ressource in media panel, wrapped in container
   * 
   * @param htmlContent
   * @param title
   * @param ressource
   * @private
   */
  _addMediaRessource : function(htmlContent, title, ressource) {

    var self = jsxc.newgui;

    var container = $('<div class="jsxc-media-ressource"></div>').append(htmlContent);

    if (title && ressource) {
      var ressHeader = $("<h1 class='jsxc-title'>" + title + "</h1>").attr('title', ressource)

      var closeHeader = $("<span class='jsxc-close-ressource'></span>");
      closeHeader.click(function() {

        container.animate({
          opacity : "0"
        }, 500, function() {
          container.remove();
        });

      });

      ressHeader.append(closeHeader);
      container.prepend(ressHeader);

    }

    self._log("_addMediaRessource", {title : title, container : container});

    $("#jsxc-mediapanel-right").append(container);
  },

  /**
   * @memberOf jsxc.newgui
   */
  chatSidebarContent : {

    /**
     * Return a find search resuts with all possible displayable viewports
     * @returns {*|jQuery}
     */
    getAllContents : function() {
      return $('#jsxc-sidebar-content-viewport').find(".jsxc-viewport-content");
    },

    showMainContent : function() {
      var self = jsxc.newgui.chatSidebarContent;
      self._setContentVisible("jsxc-buddy-list-container");
    },

    showContent : function(contentId) {
      var self = jsxc.newgui.chatSidebarContent;
      self._setContentVisible(contentId);
    },

    isMainContentVisible : function() {
      return jsxc.newgui.chatSidebarContent.isContentVisible("jsxc-buddy-list-container");
    },

    isContentVisible : function(contentId) {

      var element = $("#" + contentId);

      if (element.length < 1) {
        throw new Error("Unable to find: " + contentId);
      }

      return element.css("display") === "block";

    },

    toggleContent : function(contentId) {

      var self = jsxc.newgui.chatSidebarContent;

      // check if content shown
      var visible = self.isContentVisible(contentId);

      if (visible) {
        self.showMainContent();
      }

      else {
        self._setContentVisible(contentId);
      }

    },

    _setContentVisible : function(contentId) {

      var self = jsxc.newgui.chatSidebarContent;

      self.getAllContents().each(function() {
        $(this).css('display', 'none');
      });

      // the corresponding panel we have to show after hiding the visible
      var toDisplay = $('#jsxc-sidebar-content-viewport #' + contentId);

      if (toDisplay.length < 1) {
        throw new Error("Unable to find ID: " + contentId);
      } else {

        // display element transparent
        toDisplay.css({
          opacity : 0, display : 'block'
        });

        // animate opacity
        toDisplay.animate({
          opacity : 1
        }, self.OPACITY_ANIMATION_DURATION);

      }

    }

  }

};