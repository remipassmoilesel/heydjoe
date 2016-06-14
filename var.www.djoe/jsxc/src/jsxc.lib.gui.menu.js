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
    timeoutBeforeClose: 5000,

    /**
     * Menu elements. Each menu element has a label, a template name and an optional init function.
     */
    elements: {

        welcomePanel: {
            label: "Menu",
            template: "menuWelcome",
            init: function () {

                //<div data-pres="offline" class="jsxc_actionButton jsxc_offline" data-i18n="Offline"></div>

                $('#jsxc_menuWelcome .jsxc_onlineHelp').click(function () {
                    window.open(jsxc.options.onlineHelp, 'onlineHelp');
                });

                // change presence or logout
                $('#jsxc_menuWelcome .jsxc_menu_offline').click(function () {
                    jsxc.xmpp.logout(false);

                    // close menu and roster
                    jsxc.gui.menu.closeSideMenu();
                    jsxc.gui.roster.toggle();
                });

                // change presence or logout
                $('#jsxc_menuWelcome .jsxc_status_buttons div').click(function () {
                    var self = $(this);

                    // pres info is stored in "data-pres" html arg
                    var pres = self.data('pres');

                    if (pres === 'offline') {
                        jsxc.xmpp.logout(false);
                    } else {
                        jsxc.gui.changePresence(pres);
                    }

                });

            },

        },

        contactPanel: {
            label: "Rechercher d'utilisateurs",
            template: "menuContacts",
            init: function () {

                /**
                 * Add or remove a contact from list
                 */

                var userList = jsxc.gui.createUserList("#jsxc_contactsUserList");

                // invite user
                $('#jsxc_menuContacts .jsxc_addBuddyFromList').click(function () {

                    // retrieve first element selected
                    var selItems = $("#jsxc_contactsUserList .ui-selected");

                    // test if a user is selected
                    if (selItems.length < 1) {
                        jsxc.gui.feedback("Vous devez sélectionner un utilisateur", "warn");
                        return;
                    }

                    var alreadyBuddy = "";
                    var added = "";

                    selItems.each(function () {

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
                        jsxc.gui.feedback("Déjà dans vos contacts: " + alreadyBuddy.substring(0, alreadyBuddy.length - 2));
                    }

                    if (added.length > 0) {
                        jsxc.gui.feedback("Une invitation à été envoyée<br> à " + added.substring(0, added.length - 2));
                    }

                    // stop propagating
                    return false;
                });

                // remove contact
                $('#jsxc_menuContacts .jsxc_removeBuddyFromList').click(function () {

                    // retrieve first element selected
                    var selItems = $("#jsxc_menuContacts .ui-selected");

                    //console.log(selItems);

                    if (selItems.length < 1) {
                        jsxc.gui.feedback("Vous devez sélectionner un utilisateur", "warn");
                        return;
                    }

                    var usersList = "";
                    selItems.each(function () {
                        usersList += $(this).data("username") + ", ";
                    });
                    usersList = usersList.substring(0, usersList.length - 2);

                    // show confirmation dialog
                    jsxc.gui.dialog.open(jsxc.gui.template.get('removeManyDialog', null, usersList));

                    $('#jsxc_dialog .jsxc_remove').click(function (ev) {
                        ev.stopPropagation();

                        selItems.each(function () {

                            if (jsxc.master) {
                                jsxc.xmpp.removeBuddy($(this).data("userjid"));
                            } else {
                                // inform master
                                jsxc.storage.setUserItem('deletebuddy', $(this).data("userjid"), {
                                    jid: $(this).data("userjid")
                                });
                            }

                        });

                        jsxc.gui.dialog.close();
                    });

                });

                // refresh list
                $('#jsxc_menuContacts .jsxc_refreshBuddyList').click(function () {

                    userList.updateUserList("freshList");

                    jsxc.gui.feedback("Mise à jour de la liste d'utilisateurs");

                });


            },
        },

        roomsPanel: {
            label: "Conversations",
            template: "menuRooms",
            init: function () {

                // buddy list for room creation
                //jsxc.gui.createBuddyList("#jsxc_roomCreationUsers");


                // // join room button
                // $('#jsxc_menuRooms .jsxc_joinRoom').click(function () {
                //
                //     // retrieve first element selected
                //     var selItems = $("#jsxc_availablesRooms .ui-selected");
                //
                //     // test if a user is selected
                //     if (selItems.length < 1) {
                //         jsxc.gui.feedback("Vous devez sélectionner un salon", "warn");
                //         return;
                //     }
                //
                //     if(selItems.data("roomjid") === "_NO_ROOM_AVAILABLE" ||
                //         typeof selItems.data("roomjid") === "undefined"){
                //         jsxc.gui.feedback("Saisie incorrecte", "warn");
                //         return;
                //     }
                //
                //     // join room
                //     jsxc.muc.join(selItems.data("roomjid"), jsxc.xmpp.getCurrentNode());
                //
                //     // open window
                //     jsxc.gui.window.open(selItems.data("roomjid"));
                //
                // });
                //
                // // refresh list button
                // $('#jsxc_menuRooms .jsxc_refreshRoomList').click(function () {
                //
                //     roomList.updateRoomList();
                //
                //     jsxc.gui.feedback("La liste des salons est en cours<br> de mise à jour");
                //
                // });
                //
                //
                // // check room name format in creation text field
                // var roomNameTxt = $('#jsxc_menuRooms .jsxc_inputChatRoomName');
                // roomNameTxt.keyup(function () {
                //
                //     var name = $(this).val().trim();
                //
                //     if (name === "") {
                //         roomNameTxt.removeClass("jsxc_invalid");
                //         return;
                //     }
                //
                //     if (name.match(/^[a-z0-9]{5,}$/i) === null) {
                //         roomNameTxt.addClass("jsxc_invalid");
                //     }
                //
                //     else {
                //         roomNameTxt.removeClass("jsxc_invalid");
                //     }
                //
                //     return;
                //
                // });
                //
                //
                // // create room
                // $('#jsxc_menuRooms .jsxc_createRoom').click(function () {
                //
                //     var roomName = $('#jsxc_menuRooms .jsxc_inputChatRoomName').val().trim();
                //
                //     // check room name format
                //     if (roomName.match(/^[a-z0-9]{5,}$/i) === null) {
                //
                //         jsxc.gui.feedback("Le nom du salon est invalide: <br> /^[a-z0-9]{5,}$/i", "warn");
                //
                //         return false;
                //     }
                //
                //     var fullRoomName = roomName + "@" + jsxc.options.get('muc').server;
                //
                //     jsxc.xmpp.conn.disco.info(fullRoomName, null,
                //
                //         // room already exist
                //         function () {
                //
                //             // join room
                //             jsxc.muc.join(fullRoomName, jsxc.xmpp.getCurrentNode());
                //
                //             // open window
                //             jsxc.gui.window.open(fullRoomName);
                //
                //             jsxc.gui.feedback("Le salon existe déjà: <br>" + roomName, "warn");
                //
                //         },
                //
                //         function (stanza) {
                //
                //             // room not found, create
                //             if ($(stanza).find("item-not-found").length > 0) {
                //
                //                 console.log(fullRoomName);
                //
                //                 // create room
                //                 jsxc.muc.join(fullRoomName, jsxc.xmpp.getCurrentNode());
                //
                //                 // locale update list TODO: Broadcast event ?
                //                 roomList.updateRoomList();
                //
                //                 // open window
                //                 jsxc.gui.window.open(fullRoomName);
                //
                //                 // empty text field
                //                 $('#jsxc_menuRooms .jsxc_inputChatRoomName').val("");
                //
                //                 jsxc.gui.feedback("Le salon à été créé");
                //
                //             }
                //
                //             // error while creating
                //             else {
                //                 jsxc.gui.feedback("Erreur lors de la création du salon", "warn");
                //             }
                //
                //         });
                //
                //
                //     // display room dialog
                //     $("#jsxc_menuRooms .jsxc_roomDialog").click(jsxc.muc.showJoinChat);
                //
                // });

            },

        },

        toolsPanel: {
            label: "Outils",
            template: "menuTools",
            init: function () {


            },

        },

        settingsPanel: {
            label: "Paramètres",
            template: "menuSettings",
            init: function () {

                // mute notifications
                $('#jsxc_menuSettings .jsxc_muteNotification').click(function () {

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

                // show dialog settings
                $('#jsxc_menuSettings .jsxc_dialog_settings').click(function () {
                    jsxc.gui.showSettings();
                });

                // display or hide offline buddies
                $('#jsxc_menuSettings .jsxc_hideOffline').click(function () {

                    var hideOffline = !jsxc.options.get('hideOffline');

                    if (hideOffline) {
                        $('#jsxc_buddylist').addClass('jsxc_hideOffline');
                    } else {
                        $('#jsxc_buddylist').removeClass('jsxc_hideOffline');
                    }

                    $(this).text(hideOffline ? $.t('Show_offline') : $.t('Hide_offline'));

                    jsxc.options.set('hideOffline', hideOffline);
                });

                // about dialog
                $('#jsxc_menuSettings .jsxc_about').click(function () {
                    jsxc.gui.showAboutDialog();
                });


            },
        },

    },

    /**
     * Initialise menu and menu elements
     */
    init: function () {

        // disable text selection
        $("#jsxc_side_menu").disableSelection();

        var menuRoot = $("#jsxc_side_menu_content");

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
        this.initAccordion();

        // set foldable
        this.initFoldableActions();
    },

    /**
     * Set menu accordion and searchable
     */
    initAccordion: function () {

        // voir: http://www.w3schools.com/howto/howto_js_accordion.asp

        // create accordion
        $("#jsxc_side_menu_content").accordion({
            collapsible: false,
            heightStyle: "fill",
            header: "h1"
        });

        // adding better srollbars
        $("#jsxc_side_menu_content > div").each(function () {
            $(this).perfectScrollbar();
        });

        var self = this;

        // add search text fields and buttons
        $("#jsxc_menu_search_text_field").keyup(self.onSearchKeyUp);

        // show next result
        $("#jsxc_menu_next_btn").click(function () {
            self.showNextResult();
        });

        // show previous result
        $("#jsxc_menu_previous_btn").click(function () {
            self.showPreviousResult();
        });

    },

    /**
     * Current index of search result
     */
    currentSearchResultIndex: 0,

    /**
     * All currents results
     */
    currentResults: [],

    /**
     * Title mark displayed when a result occur in a panel
     */
    searchTitleMark: "<span class='jsxc_menu_search_title_mark'> &lt;!&gt;</span>",

    /**
     * Settings for text highliting. Using jquery.highlight.js
     */
    highlightSettings: {
        caseSensitive: false,
        className: 'jsxc_menu_search_results'
    },

    /**
     * Called by search text field when user type something
     */
    onSearchKeyUp: function () {

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
            self.currentResults.each(function (index) {

                var title;
                var titleSearch = $(this).parents("h1.ui-accordion-header");
                if (titleSearch.length > 0) {
                    title = titleSearch.eq(0);
                } else {
                    title = self.currentResults.eq(index).parents("div.ui-accordion-content").prev("h1.ui-accordion-header");
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
    feedback: function (text) {
        $("#jsxc_menu_feedback").html(text || "&nbsp;");
    },

    /**
     * Highlight all term searched
     */
    highlightTerms: function (terms) {

        this.resetHighlights();

        // surligner tous les élements
        $("#jsxc_side_menu_content").highlight(terms, this.highlightSettings);

    },

    /**
     * Enlever le surlignage
     */
    resetHighlights: function () {

        $("#jsxc_side_menu_content").unhighlight(this.highlightSettings);

        // retirer les précédents résultats actifs
        $("#jsxc_side_menu_content .jsxc_menu_active_result").each(function () {
            $(this).removeClass("jsxc_menu_active_result");
        });
    },

    /**
     * Active the next result
     */
    showNextResult: function () {

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
    showPreviousResult: function () {

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
    selectResult: function (index) {

        // retirer les précédents résultats actifs
        $("#jsxc_side_menu_content .jsxc_menu_active_result").each(function () {
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
                this.currentResults.eq(index).parents("div.ui-accordion-content").prev("h1.ui-accordion-header").trigger("click");
            }
        }

    },

    /**
     * Open side menu with parameters and options
     */
    openSideMenu: function () {

        var self = $("#jsxc_side_menu");

        // state is saved inside the jquery element
        self.data("sideMenuEnabled", true);

        // reresh accordion size
        $("#jsxc_side_menu_content").accordion("refresh");

        self.animate({right: "0px"});

        // focus on search text field, but not on small devices
        if ($(window).height() > 700) {
            $("#jsxc_menu_search_text_field").focus();
        }

    },

    /**
     * Close the side menu
     */
    closeSideMenu: function () {

        var self = $("#jsxc_side_menu");

        // state is saved inside the jquery element
        self.data("sideMenuEnabled", false);

        self.animate({right: "-200px"});

        // clear timer
        window.clearTimeout(self.data('timerForClosing'));
    },

    /**
     * Associate click with fold / unfold menu action
     */
    initFoldableActions: function () {

        var sideMenu = $("#jsxc_side_menu");

        var self = this;

        // when clicking open menu, and launch timer to hide it after inactivity
        $("#jsxc_menu > span").click(function () {

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
        sideMenu.mouseleave(function () {
            sideMenu.data('timerForClosing', window.setTimeout(self.closeSideMenu, jsxc.gui.menu.timeoutBeforeClose));
        });

        // mouse entering, clear timeout to hide
        // timeouts are stored in self element with jquery.data()
        sideMenu.mouseenter(function () {
            window.clearTimeout(sideMenu.data('timerForClosing'));
        });

        // close side menu when roster is closed
        $(document).on("toggle.roster.jsxc", function () {
            self.closeSideMenu();
        });

    },


};