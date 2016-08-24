/**
 * Here go all interactions from the new interface
 *
 * All init functions are called onlys once, when GUI is preparing, whenever disconnections happend
 *
 */
jsxc.gui.interactions = {

  init : function() {

    var self = jsxc.gui.interactions;

    self._initSettingsMenu();

    self._initActionMenu();

    self._initSearchMenu();

    self._initStatusMenu();

    self._initNotificationsMenu();

  },

  /**
   * Add a listener to connexion events and remove it when disconnected
   * @param callback
   * @private
   */
  _addAttachedListener : function(callback) {
    $(document).on('attached.jsxc', callback);
    $(document).on('disconnected.jsxc', function() {
      $(document).off('attached.jsxc', callback);
    });
  },

  /**
   * Return checked elements from search user panel
   * @returns {JQuery|*|jQuery|HTMLElement}
   * @private
   */
  _getCheckedSearchUsers : function() {
    return $(".jsxc-search-users-results .jsxc-checked");
  },

  /**
   * Init the status panel, at bottom of the chat sidebar
   * @private
   */
  _initStatusMenu : function() {

    // var self = jsxc.gui.interactions;
    var newgui = jsxc.newgui;

    var loginBtn = $('#jsxc-status-bar .jsxc-login-button');
    var logoutBtn = $('#jsxc-status-bar .jsxc-logout-button');

    // listen connection state to display informations and controls
    $(document).on('ownpresence.jsxc', function() {
      newgui.updateOwnPresenceIndicator();
    });

    $(document).on('attached.jsxc', function() {
      newgui.updateOwnPresenceIndicator();
    });

    $(document).on('disconnected.jsxc', function() {
      newgui.updateOwnPresenceIndicator(true);
      newgui.hideAndShow(loginBtn, logoutBtn);
    });

    $(document).on('connected.jsxc', function() {
      newgui.hideAndShow(logoutBtn, loginBtn);
    });
    newgui.updateOwnPresenceIndicator();

    // log out button
    logoutBtn.click(function() {
      jsxc.api.disconnect();
      jsxc.newgui.toggleBuddyList();
    });

    // login button
    loginBtn.click(function() {
      jsxc.api.reconnect();
    });

    // show login / logout on connect
    if (jsxc.xmpp.conn) {
      newgui.hideAndShow(logoutBtn, loginBtn);
    }

    // make status bar selectable
    var statusSelect = $("#jsxc-status-bar .jsxc-select-status");
    statusSelect.change(function() {

      jsxc.xmpp.changeOwnPresence(statusSelect.val());

      jsxc.gui.feedback('Statut mis à jour');

    });

  },

  /**
   * Menu where user can create conversations, make call, ...
   * @private
   */
  _initActionMenu : function() {

    // var self = jsxc.gui.interactions;
    var mmstream = jsxc.mmstream;
    var newgui = jsxc.newgui;

    /**
     * Start a multi user chat
     * =======================
     *
     */
    $('#jsxc-chat-sidebar .jsxc-action_new-conversation').click(function() {

      var selected = [];
      newgui.getCheckedBuddiesOrAskFor()
          .then(function(results) {
            $.each(results, function(index, element) {
              selected.push(element);
            });

            jsxc.api.createNewConversationWith(selected);
          })
          .fail(function() {
            jsxc.gui.feedback('Opération annulée');
          });

    });

    /**
     * Delete buddies or conversations
     * ===============================
     */

    $('.jsxc-action_delete-buddies').click(function() {

      newgui.getCheckedElementsOrAskFor()

          .then(function(buddies) {

            // check if buddies are checked
            if (buddies.length < 1) {
              jsxc.gui.feedback("Vous devez sélectionner un élément au moins");
              return;
            }

            // get bid
            var bidArray = [];
            $.each(buddies, function(index, element) {
              bidArray.push(element);
            });

            // show confirmation dialog
            jsxc.gui.showRemoveManyDialog(bidArray);

          })

          .fail(function() {
            jsxc.gui.feedback("Opération annulée");
          });

    });

    /**
     * Invite users in conversation
     * ============================
     */
    $('#jsxc-main-menu .jsxc-action_invite-in-conversation').click(function() {

      newgui.getCheckedBuddiesOrAskFor()
          .then(function(buddies) {

            if (buddies.length < 1) {
              jsxc.gui.feedback("Vous devez sélectionner au moins un contact");
              return;
            }

            var toInvite = [];
            $.each(buddies, function(index, element) {
              toInvite.push(element);
            });

            // show dialog
            jsxc.gui.showConversationSelectionDialog()

            // user clicks OK
                .done(function(conversations) {

                  if (conversations.length < 1) {
                    jsxc.gui.feedback("Vous devez sélectionner au moins un contact");
                    return;
                  }

                  $.each(conversations, function(index, cjid) {
                    jsxc.muc.inviteParticipants(cjid, toInvite);
                  });

                  jsxc.gui.feedback("Les utilisateurs ont été invités");

                })

                .fail(function() {
                  jsxc.gui.feedback("Opération annulée");
                });
          })
          .fail(function() {
            jsxc.gui.feedback('Opération annulée');
          });

    });

    /**
     * Etherpad doc creation
     * =====================
     */
    $("#jsxc-main-menu .jsxc-action_new-etherpad-document").click(function() {

      // check if some buddies are already selected
      var selected = newgui.getCheckedBuddies();

      // show dialog
      jsxc.gui.showEtherpadCreationDialog(selected)

          .then(function(res) {

            jsxc.gui.feedback("Le document va être ouvert");

            jsxc.etherpad.openpad(res.name);

            if (res.buddies.length > 0) {
              jsxc.etherpad.sendInvitations(res.name, res.buddies);
            }
          })

          .fail(function() {
            jsxc.gui.feedback("Opération annulée");
          });

    });

    /**
     * Video call
     * ==========
     *
     */
    $("#jsxc-main-menu .jsxc-action_video-call").click(function() {

      // get selected budies
      newgui.getCheckedBuddiesOrAskFor()

          .then(function(buddies) {

            if (buddies.length < 1) {
              jsxc.gui.feedback("Vous devez sélectionner au moins un contact");
              return;
            }

            // get full jid of buddies
            var fjidArray = [];
            var unavailables = [];
            $.each(buddies, function(index, element) {

              var fjid = jsxc.getCurrentActiveJidForBid(element);

              if (fjid === null || jsxc.isBuddyOnline(element) === false) {
                unavailables.push(Strophe.getNodeFromJid(element));
              } else {
                fjidArray.push(jsxc.getCurrentActiveJidForBid(element));
              }

            });

            // check how many participants are unavailable
            if (unavailables.length === 1) {
              jsxc.gui.feedback("<b>" + unavailables[0] + "</b> n'est pas disponible");
              return;
            }

            else if (unavailables.length > 1) {
              jsxc.gui.feedback("<b>" + unavailables.join(", ") + "</b> ne sont pas disponibles");
              return;
            }

            // call buddies
            $.each(fjidArray, function(index, fjid) {
              mmstream.startSimpleVideoCall(fjid);
            });

          })
          .fail(function() {
            jsxc.gui.feedback('Opération annulée');
          });

    });

    /**
     * Video conférence
     * ================
     *
     */
    $("#jsxc-main-menu .jsxc-action_videoconference").click(function() {

      // get selected budies
      newgui.getCheckedBuddiesOrAskFor()

          .then(function(buddies) {

            if (buddies.length < 1) {
              jsxc.gui.feedback("Vous devez sélectionner au moins un contact");
              return;
            }

            if (buddies.length > mmstream.VIDEOCONFERENCE_MAX_PARTICIPANTS) {
              jsxc.gui.feedback("La vidéoconférence est limitée à 6 participants");
              return;
            }

            // get full jid of buddies
            var fjidArray = [];
            var unavailables = [];
            $.each(buddies, function(index, element) {

              var fjid = jsxc.getCurrentActiveJidForBid(element);

              if (fjid === null || jsxc.isBuddyOnline(element) === false) {
                unavailables.push(Strophe.getNodeFromJid(element));
              } else {
                fjidArray.push(jsxc.getCurrentActiveJidForBid(element));
              }

            });

            // check how many participants are unavailable
            if (unavailables.length === 1) {
              jsxc.gui.feedback("<b>" + unavailables[0] + "</b> n'est pas disponible");
              return;
            }

            else if (unavailables.length > 1) {
              jsxc.gui.feedback("<b>" + unavailables.join(", ") + "</b> ne sont pas disponibles");
              return;
            }

            // start videoconference
            mmstream.startVideoconference(fjidArray);

          })
          .fail(function() {
            jsxc.gui.feedback('Opération annulée');
          });

    });

    /**
     * Screen sharing
     * ===============
     *
     */
    $("#jsxc-main-menu .jsxc-action_screensharing").click(function() {

      // get selected budies
      newgui.getCheckedBuddiesOrAskFor()

          .then(function(buddies) {

            if (buddies.length < 1) {
              jsxc.gui.feedback("Vous devez sélectionner au moins un contact");
              return;
            }

            mmstream.checkNavigatorCompatibility("screensharing");

            mmstream.isChromeExtensionInstalled()

                .fail(function() {
                  mmstream.gui.showInstallScreenSharingExtensionDialog();
                  return;
                })

                .then(function() {

                  // get full jid of buddies
                  var fjidArray = [];
                  var unavailables = [];
                  $.each(buddies, function(index, element) {

                    var fjid = jsxc.getCurrentActiveJidForBid(element);

                    if (fjid === null || jsxc.isBuddyOnline(element) === false) {
                      unavailables.push(Strophe.getNodeFromJid(element));
                    } else {
                      fjidArray.push(jsxc.getCurrentActiveJidForBid(element));
                    }

                  });

                  // check how many participants are unavailable
                  if (unavailables.length === 1) {
                    jsxc.gui.feedback("<b>" + unavailables[0] + "</b> n'est pas disponible");
                    return;
                  }

                  else if (unavailables.length > 1) {
                    jsxc.gui.feedback(
                        "<b>" + unavailables.join(", ") + "</b> ne sont pas disponibles");
                    return;
                  }

                  // call buddies
                  mmstream.startScreenSharingMultiPart(fjidArray);

                });
          });

    });

  },

  /**
   * Setting menu, where user can mute notifications, see 'About dialog', ...
   * @private
   */
  _initSettingsMenu : function() {

    // var self = jsxc.gui.interactions;
    var newgui = jsxc.newgui;
    var mmstream = jsxc.mmstream;
    var notification = jsxc.notification;

    /**
     * Open settings menu
     * ==================
     */
    $('#jsxc-chat-sidebar .jsxc-toggle-settings').click(function(event) {
      newgui.toggleSettingsMenu();
      event.stopPropagation();
    });

    /**
     * Show collected datas
     * ==================
     */
    $('#jsxc-chat-sidebar .jsxc-action_showCollectedDatas').click(function(event) {
      window.open(jsxc.options.stats.destinationUrl + "/visualization/");
      event.stopPropagation();
    });

    /**
     * Clear local history of conversations
     * ====================================
     */
    $('#jsxc-settings-menu .jsxc-action_clearLocalHistory').click(function() {

      var buddies = jsxc.storage.getUserItem("buddylist") || [];

      $.each(buddies, function(index, jid) {
        jsxc.gui.window.clear(jid);
      });

      jsxc.gui.feedback("L'historique a été éffacé avec succès");

    });

    /**
     * Install screensharing extension
     * ===============================
     */
    $('#jsxc-settings-menu .jsxc-action_installScreenSharingExtension').click(function() {
      mmstream.gui.showInstallScreenSharingExtensionDialog();
    });

    /**
     * About dialog
     * ============
     */
    $('#jsxc-settings-menu .jsxc-show-about-dialog').click(function() {
      jsxc.gui.showAboutDialog();
    });

    /**
     * Mute sounds
     * ===========
     */
    var muteIndicator = jsxc.newgui.createStateIndicator('.jsxc-action_toggleMuteMode');
    muteIndicator.toggleState(!notification.isSoundMuted());

    $('#jsxc-settings-menu .jsxc-action_toggleMuteMode').click(function() {

      muteIndicator.toggleState();

      if (muteIndicator.getState() === false) {
        notification.muteSound();
      }

      else {
        notification.unmuteSound();
      }

    });

    /**
     * Show / Hide notifications
     * =========================
     */
    var notifIndicator = jsxc.newgui.createStateIndicator('.jsxc-action_toggleNotifications');
    notifIndicator.toggleState(notification.isNotificationShowed());

    $('#jsxc-settings-menu .jsxc-action_toggleNotifications').click(function() {

      notifIndicator.toggleState();

      if (notifIndicator.getState() === true) {

        // request permission if needed
        if (notification.hasPermission() !== true) {
          jsxc.gui.showRequestNotification();
        }

        notification.showNotifications();
      }

      else {
        notification.hideNotifications();
      }

    });

    var videoIndicator = jsxc.newgui.createStateIndicator('.jsxc-action_disableVideoCalls');
    $('#jsxc-settings-menu .jsxc-action_disableVideoCalls').click(function() {

      videoIndicator.toggleState();

    });

  },

  /**
   * Search panel XEP 0055 where users can search other users to invite them
   * @private
   */
  _initSearchMenu : function() {

    var self = jsxc.gui.interactions;
    // var newgui = jsxc.newgui;

    /**
     * Invite users
     * ============
     */
    $("#jsxc-chat-sidebar-search-invite").click(function() {

      var checkedElements = self._getCheckedSearchUsers();

      if (checkedElements.length < 1) {
        jsxc.gui.feedback("Vous devez choisir au moins un contact");
        return false;
      }

      var invited = [];
      $.each(checkedElements, function(index, element) {

        var jqi = $(element);
        var i = jqi.data('jid');

        jsxc.xmpp.addBuddy(i);
        invited.push(Strophe.getNodeFromJid(i));

        jqi.removeClass('jsxc-checked');

      });

      if (invited.length < 2) {
        jsxc.gui.feedback("<b>" + invited[0] + "</b> a été invité");
      } else {
        jsxc.gui.feedback("Ces utilisateurs ont été invité: <b>" + invited.join(", ") + "</b>");
      }

      var entries = $(".jsxc-search-users-results .jsxc-search-user-entry");

      // clean search space
      entries.animate({
        'opacity' : "0"
      }, 700, function() {
        entries.remove();
      });

    });

    /**
     * Chat with users
     * ============
     */
    $("#jsxc-chat-sidebar-search-chat").click(function() {

      var checkedElements = self._getCheckedSearchUsers();

      if (checkedElements.length < 1) {
        jsxc.gui.feedback("Vous devez choisir au moins un contact");
        return false;
      }

      $.each(checkedElements, function(index, element) {
        var jid = $(element).data('jid');
        jsxc.api.openChatWindow(jid);
      });

      var entries = $(".jsxc-search-users-results .jsxc-search-user-entry");

      // clean search space
      entries.animate({
        'opacity' : "0"
      }, 700, function() {
        entries.remove();
      });

    });

  },

  /**
   * Where user can manage notifications: reject or accept them, remove them....
   * @private
   */
  _initNotificationsMenu : function() {

    /**
     * Reject all notifications
     * ========================
     *
     */
    $('#jsxc-manage-notifications .jsxc-action_rejectAllNotifications').click(function() {

      if ($('#jsxc-notifications ul li[data-nid]').length < 1) {
        jsxc.gui.feedback("Aucune notification à rejeter");
        return;
      }

      jsxc.gui.showConfirmDialog("Etes vous sur de vouloir rejeter toutes les notifications ?",

          function() {

            jsxc.gui.dialog.close();

            $('#jsxc-notifications ul li[data-nid]').each(function() {
              jsxc.notice.remove($(this).data('nid'));
            });

            jsxc.gui.feedback("Notifications rejetées");
          },

          function() {
            jsxc.gui.feedback("Opération annulée");
          });

    });

    /**
     * Show notifications parameters
     * =============================
     */
    $('#jsxc-manage-notifications .jsxc-action_notificationsParameters').click(function() {
      jsxc.newgui.toggleSettingsMenu();
    });

  }

};