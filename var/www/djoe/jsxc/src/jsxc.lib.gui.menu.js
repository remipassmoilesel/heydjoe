/**
 *
 * Main menu. This menu is included in roster.
 *
 * <p>All templates are stored in templates/menu*.html
 *
 * <p>Call init() to build the menu. First init call is done in jsxc.roster.init()
 *
 * @namespace menu
 *
 * */
jsxc.gui.menu = {

  /**
   * Time out before close menu
   */
  timeoutBeforeClose : 5000,

  ready : false,

  /**
   * Menu elements. Each menu element has a label, a template name and an optional init function.
   */
  elements : {

    /**
     *
     *
     *
     *  WELCOME PANEL
     *
     *
     *
     */
    welcomePanel : {
      label : "Accueil", template : "menuWelcome", init : function() {

        // change presence or logout
        $('#jsxc_menuWelcome .jsxc_menu_offline').click(function() {
          jsxc.xmpp.logout(false);

          // close menu and roster
          jsxc.gui.menu.closeSideMenu();
          jsxc.gui.roster.toggle();
        });

        // change presence or logout
        $('#jsxc_menuWelcome .jsxc_status_buttons div').click(function() {
          var self = $(this);

          // pres info is stored in "data-pres" html arg
          var pres = self.data('pres');

          if (pres === 'offline') {
            jsxc.xmpp.logout(false);
          } else {
            jsxc.gui.changePresence(pres);
          }

        });

        var userList = jsxc.gui.createUserList("#jsxc_contactsUserList");

        // invite user
        $('#jsxc_menuWelcome .jsxc_addBuddyFromList').click(function() {

          // retrieve first element selected
          var selItems = $("#jsxc_contactsUserList .ui-selected");

          // test if a user is selected
          if (selItems.length < 1) {
            jsxc.gui.feedback("Vous devez sélectionner un utilisateur", "warn");
            return;
          }

          var alreadyBuddy = "";
          var added = "";

          selItems.each(function() {

            // test if already buddy
            if ($(this).hasClass("buddy_item")) {
              alreadyBuddy += $(this).data("username") + ", ";
              return true;
            }

            // add user
            jsxc.xmpp.addBuddy($(this).data("userjid"));
            added += $(this).data("username") + ", ";

          });

          if (alreadyBuddy.length > 0) {
            jsxc.gui.feedback(
                "Déjà dans vos contacts: " + alreadyBuddy.substring(0, alreadyBuddy.length - 2));
          }

          if (added.length > 0) {
            jsxc.gui.feedback(
                "Une invitation à été envoyée<br> à " + added.substring(0, added.length - 2));
          }

          // stop propagating
          return false;
        });

        // remove contact
        $('#jsxc_menuWelcome .jsxc_removeBuddyFromList').click(function() {

          // retrieve first element selected
          var selItems = $("#jsxc_menuWelcome .ui-selected");

          //console.log(selItems);

          if (selItems.length < 1) {
            jsxc.gui.feedback("Vous devez sélectionner un utilisateur", "warn");
            return;
          }

          var usersList = "";
          selItems.each(function() {
            usersList += $(this).data("username") + ", ";
          });
          usersList = usersList.substring(0, usersList.length - 2);

          // show confirmation dialog
          jsxc.gui.dialog.open(jsxc.gui.template.get('removeManyDialog', null, usersList));

          $('#jsxc_dialog .jsxc_remove').click(function(ev) {
            ev.stopPropagation();

            selItems.each(function() {

              if (jsxc.master) {
                jsxc.xmpp.removeBuddy($(this).data("userjid"));
              } else {
                // inform master
                jsxc.storage.setUserItem('deletebuddy', $(this).data("userjid"), {
                  jid : $(this).data("userjid")
                });
              }

            });

            jsxc.gui.dialog.close();
          });

        });

        // refresh list
        $('#jsxc_menuWelcome .jsxc_refreshBuddyList').click(function() {

          userList.updateUserList("freshList");

          jsxc.gui.feedback("Mise à jour de la liste d'utilisateurs");

        });

      },
    },

    /**
     *
     * CONVERSATION PANEL
     *
     *
     *
     */

    conversationPanel : {
      label : "Conversations et multimédia", template : "menuConversations", init : function() {

        // buddy list for room creation
        var buddyList = jsxc.gui.createBuddyList("#jsxc_conversationUserList");

        // update buddy list on click
        $("#jsxc_menuConversation .jsxc_refreshBuddyList").click(function() {

          buddyList.updateBuddyList();

          jsxc.gui.feedback("Mise à jour en cours ...");
        });

        $("#jsxc_menuConversation .jsxc_createConversation").click(function() {

          var selItems = $("#jsxc_conversationUserList .ui-selected");

          // check selected elements
          if (selItems.length < 1) {
            jsxc.gui.feedback("Vous devez sélectionner au moins un contact", "warn");
            return;
          }

          // prepare title
          // var title = $("#jsxc_menuConversation .jsxc_inputRoomTitle").val().trim();

          // prepare subject
          // var subject = $("#jsxc_menuConversation .jsxc_inputRoomSubject").val().trim();

          // prepare initial participants
          var buddies = [];
          selItems.each(function() {
            buddies.push($(this).data("userjid"));
          });

          // jsxc.muc.createNewConversationWith(buddies, title, subject);
          jsxc.muc.createNewConversationWith(buddies);

        });

        // invite users
        $(".jsxc_inviteBuddiesOnConversation").click(function() {

          var selItems = $("#jsxc_conversationUserList .ui-selected");

          // check selected elements
          if (selItems.length < 1) {
            jsxc.gui.feedback("Vous devez sélectionner au moins un contact", "warn");
            return;
          }

          // get user array
          var users = [];
          selItems.each(function() {
            users.push($(this).data("userjid"));
          });

          // show dialog
          jsxc.gui.showConversationSelectionDialog()

          // user clicks OK
              .done(function(conversations) {

                // iterate conversations
                conversations.each(function() {
                  var conversJid = $(this).data("conversjid");
                  jsxc.muc.inviteParticipants(conversJid, users);
                });

              });
        });

        // // display room dialog
        // $("#jsxc_menuConversation .jsxc_roomDialog").click(jsxc.muc.showJoinChat);

        /**
         * Video conference
         *
         */

        /**
         * Get selected contacts and return array of FULL jids
         * @returns {Array}
         * @private
         */
        var _getSelectedContactsForMultimedia = function() {

          var selItems = $("#jsxc_conversationUserList .ui-selected");

          // check selected elements
          if (selItems.length < 1) {
            jsxc.gui.feedback("Vous devez sélectionner au moins un contact", "warn");
            return;
          }

          /**
           * Get full jid of people to call
           */
          var toCall = [];
          var errorHappen = false;

          $.each(selItems, function() {

            // get informations about buddy
            var bid = $(this).data("userjid");

            var fulljid = jsxc.getCurrentActiveJidForBid(bid);
            var budDatas = jsxc.storage.getUserItem("buddy", bid);

            // check resource and connection
            if (fulljid !== null && budDatas.status && budDatas.status > 0) {
              toCall.push(fulljid);
            }

            else {

              var node = Strophe.getNodeFromJid(bid);

              jsxc.error("Invalid buddy for video call", bid);
              jsxc.gui.feedback("Impossible de contacter " + node +
                  ". Vérifiez que votre contact est bien connecté et rafraichissez la page " +
                  "si le problème persiste.");

              errorHappen = true;

              // stop loop
              return false;
            }

          });

          return errorHappen ? null : toCall;
        };

        // create video conference

        $("#jsxc_menuConversation .jsxc_createConference").click(function() {

          var toCall = _getSelectedContactsForMultimedia();

          if (toCall && toCall.length > 0) {
            jsxc.mmstream.startVideoconference(toCall);
          }

        });

        // call contacts separately

        $("#jsxc_menuConversation .jsxc_callContacts").click(function() {

          var toCall = _getSelectedContactsForMultimedia();

          // call each participant
          if (toCall && toCall.length > 0) {
            $.each(toCall, function(index, element) {
              jsxc.mmstream.startVideoCall(element);
            });
          }

        });

        /**
         *
         * Screen sharing
         *
         */

        $("#jsxc_menuConversation .jsxc_screenSharing").click(function() {

          if (jsxc.mmstream.screenSharingCapable === true) {
            var toCall = _getSelectedContactsForMultimedia();

            if (toCall && toCall.length > 0) {
              jsxc.mmstream.startScreenSharingMultiPart(toCall);
            }
          }

          else {
            jsxc.gui.feedback(
                "Pour partager votre écran vous devez utiliser le navigateur Chrome et " +
                "installer l'extension de capture d'écran.");

          }

        });

        /**
         * Etherpad
         *
         */

        // show share link
        var etherpadNameTxt = $("#jsxc_etherpad_name");
        var etherpadShareLink = $("#jsxc_menuConversation .jsxc_etherpad_sharelink");
        var etherpadShareLinkTxt = $("#jsxc_menuConversation .jsxc_etherpad_sharetextfield");

        etherpadNameTxt.keyup(function() {

          var hrefLink = jsxc.etherpad.getEtherpadLinkFor(etherpadNameTxt.val());

          etherpadShareLink.attr({
            href : hrefLink
          });

          etherpadShareLinkTxt.val(hrefLink);
        });

        // create Etherpad documents
        $("#jsxc_menuConversation .jsxc_openpad").click(function() {

          var etherpadId = $("#jsxc_etherpad_name").val().toLowerCase();

          if (!etherpadId.match(/^[a-z0-9_-]{5,50}$/i)) {
            jsxc.gui.feedback("Nom invalide: /^[a-z0-9_-]{5,50}$/i");
            return true;
          }

          jsxc.etherpad.openpad(etherpadId);

        });

      },

    },

    settingsPanel : {
      label : "Paramètres", template : "menuSettings", init : function() {

        // mute notifications
        $('#jsxc_menuSettings .jsxc_muteNotification').click(function() {

          if (jsxc.storage.getUserItem('presence') === 'dnd') {
            return;
          }

          // invert current choice
          var mute = !jsxc.options.get('muteNotification');

          if (mute) {
            jsxc.notification.muteSound();
          } else {
            jsxc.notification.unmuteSound();
          }
        });

        $("#jsxc_menuSettings .jsxc_showNotificationRequestDialog").click(function() {
          jsxc.gui.showRequestNotification();
        });

        // show dialog settings
        $('#jsxc_menuSettings .jsxc_dialog_settings').click(function() {
          jsxc.gui.showSettings();
        });

        // display or hide offline buddies
        $('#jsxc_menuSettings .jsxc_hideOffline').click(function() {

          var hideOffline = !jsxc.options.get('hideOffline');

          if (hideOffline) {
            $('#jsxc_buddylist').addClass('jsxc_hideOffline');
          } else {
            $('#jsxc_buddylist').removeClass('jsxc_hideOffline');
          }

          $(this).text(hideOffline ? jsxc.t('Show_offline') : jsxc.t('Hide_offline'));

          jsxc.options.set('hideOffline', hideOffline);
        });

        // about dialog
        $('#jsxc_menuSettings .jsxc_about').click(function() {
          jsxc.gui.showAboutDialog();
        });

        $('#jsxc_menuSettings .jsxc_spaceInvasion').click(function(){
          jsxc.api.spaceInvasion();
        });

      },
    },

  },

  /**
   * Initialise menu and menu elements
   */
  init : function() {

    jsxc.debug("Menu init");

    var self = jsxc.gui.menu;

    // disable text selection
    $("#jsxc_side_menu").disableSelection();

    var menuRoot = $("#jsxc_side_menu_content");

    // clear menu root
    menuRoot.empty();

    // initializing elements
    for (var prop in this.elements) {
      var elmt = this.elements[prop];

      // add Title
      menuRoot.append("<h1>" + elmt.label + "</h1>");

      // load and add template
      if (typeof elmt.template === "undefined") {
        throw "Parameter cannot be undefined: " + elmt.template;
      }
      elmt.template = jsxc.gui.template.get(elmt.template);

      menuRoot.append(elmt.template);

      // launch init function
      if (typeof elmt.init !== "undefined") {
        elmt.init.call(elmt);
      }
    }

    // set accordion menu
    this._initAccordion();

    // set foldable
    this._initFoldableActions();

    // open at launch
    $("#jsxc_side_menu_content > h1.ui-accordion-header").eq(0).trigger("click");

    self.ready = true;
    $(document).trigger("menu.ready.jsxc");

  },

  /**
   * Set menu accordion and searchable
   */
  _initAccordion : function() {

    // voir: http://www.w3schools.com/howto/howto_js_accordion.asp

    // create accordion
    $("#jsxc_side_menu_content").accordion({
      collapsible : false, heightStyle : "fill", header : "h1"
    });

    // adding better srollbars
    $("#jsxc_side_menu_content > div").each(function() {
      $(this).perfectScrollbar();
    });

    var self = this;

    // add search text fields and buttons
    $("#jsxc_menu_search_text_field").keyup(self.onSearchKeyUp);

    // show next result
    $("#jsxc_menu_next_btn").click(function() {
      self.showNextResult();
    });

    // show previous result
    $("#jsxc_menu_previous_btn").click(function() {
      self.showPreviousResult();
    });

  },

  /**
   * Current index of search result
   */
  currentSearchResultIndex : 0,

  /**
   * All currents results
   */
  currentResults : [],

  /**
   * Title mark displayed when a result occur in a panel
   */
  searchTitleMark : "<span class='jsxc_menu_search_title_mark'> &lt;!&gt;</span>",

  /**
   * Settings for text highliting. Using jquery.highlight.js
   */
  highlightSettings : {
    caseSensitive : false, className : 'jsxc_menu_search_results'
  },

  /**
   * Called by search text field when user type something
   */
  onSearchKeyUp : function() {

    // terms to search
    var rawTerms = $(this).val().trim();

    //console.log(rawTerms);

    var self = jsxc.gui.menu;

    // reinitialize indicators
    self.currentResults = [];
    self.currentSearchResultIndex = 0;
    $("#jsxc_side_menu_content span.jsxc_menu_search_title_mark").remove();

    // champs vide, arret
    if (rawTerms.length < 1) {

      self.feedback();

      self.resetHighlights();

      $("#jsxc_side_menu_content > h1.ui-accordion-header").eq(0).trigger("click");

      return;
    }

    // surligner les résultats
    self.highlightTerms(rawTerms);

    // lister les résultats
    self.currentResults = $(".jsxc_menu_search_results");

    // pas de résultats, activer le premier onglet
    if (self.currentResults.length < 1) {

      self.feedback("Aucun résultat");

      $("#jsxc_side_menu_content > h1.ui-accordion-header").eq(0).trigger("click");

    }

    // un ou plusieurs résultats, afficher l'onglet du premier resultat correspondant
    else {

      // ajouter les marques aux titres correspondants
      self.currentResults.each(function(index) {

        var title;
        var titleSearch = $(this).parents("h1.ui-accordion-header");
        if (titleSearch.length > 0) {
          title = titleSearch.eq(0);
        } else {
          title = self.currentResults.eq(index).parents("div.ui-accordion-content").prev(
              "h1.ui-accordion-header");
        }

        var mark = $(self.searchTitleMark);

        if (title.find("span.jsxc_menu_search_title_mark").length < 1) {
          title.append(mark);
        }

      });

      self.selectResult(0);

    }
  },

  /**
   * Display a message for user
   */
  feedback : function(text) {
    $("#jsxc_menu_feedback").html(text || "&nbsp;");
  },

  /**
   * Highlight all term searched
   */
  highlightTerms : function(terms) {

    this.resetHighlights();

    // surligner tous les élements
    $("#jsxc_side_menu_content").highlight(terms, this.highlightSettings);

  },

  /**
   * Enlever le surlignage
   */
  resetHighlights : function() {

    $("#jsxc_side_menu_content").unhighlight(this.highlightSettings);

    // retirer les précédents résultats actifs
    $("#jsxc_side_menu_content .jsxc_menu_active_result").each(function() {
      $(this).removeClass("jsxc_menu_active_result");
    });
  },

  /**
   * Active the next result
   */
  showNextResult : function() {

    this.currentSearchResultIndex++;

    if (this.currentSearchResultIndex > this.currentResults.length - 1) {
      this.feedback("Dernier résultat atteint");
      this.currentSearchResultIndex = this.currentResults.length - 1;
    }

    this.selectResult(this.currentSearchResultIndex);

  },

  /**
   * Active the previous result
   */
  showPreviousResult : function() {

    this.currentSearchResultIndex--;

    if (this.currentSearchResultIndex <= 0) {
      this.feedback("Premier résultat atteint");
      this.currentSearchResultIndex = 0;
    }

    this.selectResult(this.currentSearchResultIndex);

  },

  /**
   * Show result tab and active it
   */
  selectResult : function(index) {

    // retirer les précédents résultats actifs
    $("#jsxc_side_menu_content .jsxc_menu_active_result").each(function() {
      $(this).removeClass("jsxc_menu_active_result");
    });

    // ajouter la classe au résultat actif
    if (this.currentResults.length > 0) {
      this.currentResults.eq(this.currentSearchResultIndex).addClass("jsxc_menu_active_result");

      // activer l'accordéon correspondant
      var titleSearch = this.currentResults.eq(index).parents("h1");
      if (titleSearch.length > 0) {
        titleSearch.eq(0).trigger("click");
      } else {
        this.currentResults.eq(index).parents("div.ui-accordion-content").prev(
            "h1.ui-accordion-header").trigger("click");
      }
    }

  },

  /**
   * Open side menu with parameters and options
   */
  openSideMenu : function() {

    var self = $("#jsxc_side_menu");

    // state is saved inside the jquery element
    self.data("sideMenuEnabled", true);

    // reresh accordion size
    $("#jsxc_side_menu_content").accordion("refresh");

    self.animate({right : "0px"});

    // focus on search text field, but not on small devices
    var txtField = $("#jsxc_menu_search_text_field");
    if ($(window).height() > 600) {
      txtField.get(0).focus();
      txtField.get(0).select();
    }

  },

  /**
   * Close the side menu
   */
  closeSideMenu : function() {

    var self = $("#jsxc_side_menu");

    // state is saved inside the jquery element
    self.data("sideMenuEnabled", false);

    self.animate({right : "-200px"});

    // clear timer
    window.clearTimeout(self.data('timerForClosing'));
  },

  /**
   * Associate click with fold / unfold menu action
   */
  _initFoldableActions : function() {

    var sideMenu = $("#jsxc_side_menu");

    var self = this;

    // when clicking open menu, and launch timer to hide it after inactivity
    $("#jsxc_menu > span").click(function() {

      //  side menu is open, close it
      if (sideMenu.data("sideMenuEnabled")) {
        self.closeSideMenu();
      }

      // side menu is closed, open it
      else {
        self.openSideMenu();
      }

      return false;

    });

    // mouse leaving, timeout to hide
    // timeouts are stored in self element with jquery.data()
    sideMenu.mouseleave(function() {
      sideMenu.data('timerForClosing',
          window.setTimeout(self.closeSideMenu, jsxc.gui.menu.timeoutBeforeClose));
    });

    // mouse entering, clear timeout to hide
    // timeouts are stored in self element with jquery.data()
    sideMenu.mouseenter(function() {
      window.clearTimeout(sideMenu.data('timerForClosing'));
    });

    // close side menu when roster is closed
    $(document).on("toggle.roster.jsxc", function() {
      self.closeSideMenu();
    });

    // click on notification, show first panel

    // when clicking open menu, and launch timer to hide it after inactivity
    $("#jsxc_roster .jsxc_menu_notif_bottom_roster").click(function() {

      //  side menu is closed, open it
      if (sideMenu.data("sideMenuEnabled") !== true) {
        self.openSideMenu();
      }

      // open first tab
      $("#jsxc_side_menu_content > h1.ui-accordion-header").eq(0).trigger("click");

      return false;

    });

    // click on text field, show cursor
    // workaround for firefox
    $("#jsxc_side_menu_content input[type=text]").each(function() {
      $(this).click(function() {
        $(this).get(0).focus();
        $(this).get(0).select();
      });
    });

  },

};