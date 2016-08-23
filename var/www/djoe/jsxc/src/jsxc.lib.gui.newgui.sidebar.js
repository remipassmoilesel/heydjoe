/**
 * All stuff needed by chat sidebar, displayed at the bottom right of screen
 */
$.extend(jsxc.newgui, {

  /**
   * Management the middle of the chat sidebar, to display of remove several contents
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

  },

  /**
   * Update the name displayed on bottom of the chat sidebar
   */
  updateStatusBarUserName : function() {

    if (jsxc.xmpp.conn) {
      $("#jsxc-status-bar .jsxc-user-name").text(Strophe.getNodeFromJid(jsxc.xmpp.conn.jid));
    }

    else {
      $("#jsxc-status-bar .jsxc-user-name").text("Déconnecté");
    }

  },

  /**
   * Notifications panel, where are displayed all notifications
   * @private
   */
  _initNotificationsPanel : function() {

    var self = jsxc.newgui;

    // add openning action
    $("#jsxc-actions-menu .jsxc-action_manage-notifications").click(function() {
      self.toggleNotificationsMenu();
    });

  },

  /**
   * Update the top of the chat sidebar to display notices or others
   */
  updateChatSidebarHeader : function(disconnected) {

    var self = jsxc.newgui;

    var headerContent = $("#jsxc-chat-sidebar-header .jsxc-header-content");
    headerContent.empty();
    headerContent.off('click');

    // we are disconnected
    if (disconnected === true) {
      headerContent.append('<span>Déconnecté</span>');
    }

    // if notifications, display them
    else if (jsxc.notice.getNotificationsNumber() > 0) {

      headerContent.append(
          '<span><span class="jsxc_menu_notif_number"></span> notification(s)</span>');

      // open notifications on click
      headerContent.click(function(event) {
        event.stopPropagation();

        if (self.isChatSidebarShown() !== true) {
          self.toggleChatSidebar();
        }
        self.toggleNotificationsMenu();

      });

      jsxc.notice.updateNotificationNumbers();

    }

    // if not, display online buddies
    else {
      var online = $('#jsxc_buddylist li[data-status!="offline"][data-type="chat"]').length;

      var message;
      if (online === 0) {
        message = "Aucune activité";
      }

      else if (online === 1) {
        message = "1 personne en ligne";
      }

      else {
        message = online + " personnes en ligne";
      }

      headerContent.append('<span>' + message + '</span>');
    }

    // keep handler if used like this
    return true;

  },

  /**
   * Update user indicator in the bottom of chat sidebar
   */
  updateOwnPresenceIndicator : function(disconnection) {

    var statusSelect = $("#jsxc-status-bar .jsxc-select-status");
    var username = $('#jsxc-status-bar .jsxc-user-name');
    var pres = jsxc.storage.getUserItem('presence') || 'online';
    var selectedPres = statusSelect ? statusSelect.val() : null;

    username.removeClass('jsxc_online jsxc_chat jsxc_away jsxc_xa jsxc_dnd jsxc_offline');

    // we are connected
    if (jsxc.xmpp.conn && disconnection !== true) {

      // change icon of user name
      username.addClass('jsxc_' + pres);

      if (statusSelect) {

        // check if status was not changed programmatically
        if (statusSelect.attr("disabled") === "disabled") {
          statusSelect.attr('disabled', false);
        }

        if (selectedPres !== pres) {
          statusSelect.val(pres);
        }

      }

    }

    // we are disconnected
    else {
      username.addClass('jsxc_offline');
      username.addClass('user');

      if (statusSelect) {
        statusSelect.val("novalue");
        statusSelect.attr("disabled", true);
      }

    }

  },

  /**
   * Search user panel (XEP 0055)
   * @private
   */
  _initSearchPanel : function() {

    var self = jsxc.newgui;

    $(".jsxc-action_search-user").click(function() {
      self.chatSidebarContent.showContent('jsxc-search-users');
    });

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

  /**
   * Called when we have to display search user results. Results can be selected to invite buddies.
   * @param results
   * @private
   */
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

      // element to show is a buddy, an special icon is displayed and switched with checked icon on
      // selection
      if (element._is_buddy === true) {
        res.attr('title', element.username + " est dans vos contacts");
        res.addClass("jsxc-search-result-buddie");
        res.click(function() {

          if (res.hasClass("jsxc-search-result-buddie")) {
            res.removeClass("jsxc-search-result-buddie");
            res.addClass("jsxc-checked");
          } else {
            res.removeClass("jsxc-checked");
            res.addClass("jsxc-search-result-buddie");
          }

        });
      }

      // element to show is not a buddy
      else {
        res.attr('title', element.username + " n'est pas dans vos contacts");
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

  /**
   * Called when an error occur while searching in user list
   *
   * @param error
   * @private
   */
  _displayUserSearchError : function(error) {

    var list = $("#jsxc-chat-sidebar-search .jsxc-search-users-results");

    list.empty();

    list.append("<div>Erreur lors de la recherche: " + error + "</div>");

  },

  /**
   * Open or close notifications panem
   */
  toggleNotificationsMenu : function() {
    jsxc.newgui.chatSidebarContent.toggleContent('jsxc-manage-notifications');
  },

  /**
   * Init the connexion panel
   * @private
   */
  _initConnexionMenu : function() {

    var self = jsxc.newgui;

    var button = $('#jsxc-connexion-menu #jsxc-connexion-submit');

    var releaseButton = function() {
      button.attr('value', 'Connexion');
      button.prop('disabled', false);
    };

    // timer to display a warnings if connexion time is too logn
    var connexionTimer = function() {

      // display warning
      $("#jsxc-connexion-menu #jsxc-login-warning").css({'display' : 'block', 'opacity' : '0px'})
          .animate({opacity : '1px'}, self.OPACITY_ANIMATION_DURATION);

    };

    // display warning after 10s
    var connexionTimerValueMs = 10000;
    var connexionTimerId = -1;

    button.click(function() {

      if (jsxc.xmpp.conn) {
        jsxc.gui.feedback("Vous êtes déjà connecté");
        return;
      }

      // lock connexion button
      button.attr('value', 'Veuillez patienter ...');
      button.prop('disabled', true);

      // check login and password
      var login = $('#jsxc-connexion-login').val();
      var password = $('#jsxc-connexion-password').val();

      if (!login) {
        jsxc.gui.feedback('Identifiant incorrect');
        return;
      }

      if (!password) {
        jsxc.gui.feedback('Mot de passe incorrect');
        return;
      }

      // register handlers for connexion results
      $(document).on('authfail.jsxc', function() {

        clearTimeout(connexionTimerId);

        jsxc.gui.feedback('Echec de la connexion');

        releaseButton();

      });

      $(document).on('connected.jsxc', function() {

        clearTimeout(connexionTimerId);

        jsxc.gui.feedback('Connexion réussie');

        releaseButton();

        self.toggleBuddyList();

      });

      // connexion
      try {

        connexionTimerId = setTimeout(connexionTimer, connexionTimerValueMs);

        jsxc.xmpp.login(login, password);

      } catch (e) {
        console.error(e);
        jsxc.gui.feedback('Erreur lors de la connexion: ' + e);
        releaseButton();
      }

    });

  },

  /**
   * Open or close settings menu
   */
  toggleConnexionMenu : function() {
    jsxc.newgui.chatSidebarContent.toggleContent('jsxc-connexion-menu');
  },

  /**
   * Return true if chat sidebar is shown
   */
  isConnexionMenuShown : function() {
    return jsxc.newgui.chatSidebarContent.isContentVisible('jsxc-connexion-menu');
  },

  /**
   * Open or close settings menu
   */
  toggleActionsMenu : function() {
    jsxc.newgui.chatSidebarContent.toggleContent('jsxc-actions-menu');
  },

  /**
   * EXPERIMENTAL
   * Allow users to navigate on mediapanel without scrollbars
   */
  initMediaPanelMouseNavigation : function() {

    // var self = jsxc.newgui;

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

    // // Optionnal: create fake ressources
    // for (var i = 0; i < 10; i++) {
    //   self.addMediaRessource(
    //       "<div style='background: red; margin: 20px; width: 400px; height: 400px'></div>",
    //       'Title ' + i);
    // }

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

    self.unselectAllElements();

    // set filter for future adding
    roster.setFilterMode(mode);

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

  /**
   * Unselect all buddies and conversations
   */
  unselectAllElements : function() {

    var self = jsxc.newgui;

    self._getBuddyList().find('.jsxc-checked').removeClass('jsxc-checked');

    self._updateSelectedCount();

  },

  /**
   * Update buddy count next the selection mode button
   */
  _updateSelectedCount : function() {

    var self = jsxc.newgui;

    var count = self._getBuddyList().find('.jsxc-checked').length;

    var text = count > 0 ? '(' + count + ')' : '';

    $('#jsxc-select-buddies .jsxc-selected-number').text(text);

  },

  toggleSelectionMode : function() {

    var self = jsxc.newgui;

    self._log("toggleSelectionMode: " + self._selectionMode);

    var list = self._getBuddyList();

    self._selectionMode = !self._selectionMode;

    // enable selection mode
    if (self._selectionMode === false) {

      // remove all click handler and replace it by selector
      list.each(function() {

        var element = $(this);
        element.off('click');

        element.on('click', function() {

          var toDecorate = $(this).find('div.jsxc_name');
          self._toggleBuddySelected(toDecorate);

          self._updateSelectedCount();
        });

      });

      self._updateSelectedCount();

    }

    // disable selection mode
    else {

      self.unselectAllElements();

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
   * Get all checked elements from buddylist, conversations AND buddies
   * @returns {Array}
   * @private
   */
  getCheckedElementsOrAskFor : function(buddiesOnly) {

    var self = jsxc.newgui;
    buddiesOnly = typeof buddiesOnly !== 'undefined' ? buddiesOnly : false;

    var defer = $.Deferred();

    var all = self._getBuddyList();
    var rslt = [];

    // search for checked elements
    all.each(function() {

      var element = $(this);

      // continue if we need only buddies
      if (buddiesOnly === true && element.data('type') === 'groupchat') {
        return true;
      }

      if (element.find(".jsxc-checked").length > 0) {
        rslt.push(element.data('jid'));
      }

    });

    // some elements are checked, return them
    if (rslt.length > 0) {

      // unselect all, to prevent mistakes
      self.unselectAllElements();

      defer.resolve(rslt);
    }

    // no elements checked, show BUDDY selection dialog only
    else {
      jsxc.gui.showSelectContactsDialog()
          .then(function(result) {
            defer.resolve(result);
          })
          .fail(function() {
            defer.reject("canceled");
          });
    }

    return defer.promise();

  },

  /**
   * Get checked elements from buddylist, and only the buddies
   * @returns {Array}
   * @private
   */
  getCheckedBuddiesOrAskFor : function() {
    return jsxc.newgui.getCheckedElementsOrAskFor(true);
  },

  /**
   * Return true if chat sidebar is shown
   */
  isChatSidebarShown : function() {
    return $("#jsxc-chat-sidebar-content").hasClass("jsxc-deploy");
  },

  /**
   * Open or close buddy list
   */
  toggleBuddyList : function() {
    jsxc.newgui.chatSidebarContent.toggleContent('jsxc-buddy-list-container');
  },

  /**
   * Open or close settings menu
   */
  toggleSettingsMenu : function() {
    jsxc.newgui.chatSidebarContent.toggleContent('jsxc-settings-menu');
  },

  /**
   * Show / hide the panel where we can search users
   */
  toggleSearchPanel : function() {

    var self = jsxc.newgui;

    if (self.chatSidebarContent.isContentVisible('jsxc-search-users') !== true) {
      self.chatSidebarContent.showContent('jsxc-search-users');
    } else {
      self.chatSidebarContent.showMainContent();
    }

  },

  /**
   * Show / hide the chat sidebar
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
        height : self.SIDEBAR_CONTENT_HEIGHT
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

  }
});