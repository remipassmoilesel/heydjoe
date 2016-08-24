/**
 * Gui part of the multimedia stream  manager
 *
 */
jsxc.mmstream.gui = {

  mediapanel : null,

  /**
   * Currents video dialogs
   */
  videoDialogs : [],

  /**
   * Special logging with prefix
   * @param message
   * @param data
   * @param level
   * @private
   */
  _log : function(message, data, level) {
    jsxc.debug("[MMSTREAM GUI] " + message, data, level);
  },

  /**
   * Create gui and add it to the main window
   *
   * @private
   */
  _initGui : function() {

    var self = jsxc.mmstream.gui;
    var mmstream = jsxc.mmstream;

    // update user status on event
    $(document).on('multimediacache-changed.jsxc', self._multimediacacheChanged);

    self.mediapanel = $("#jsxc-mediapanel");

    /**
     * Init terminate all link. Here it is important that user can clear multimedia cache to
     * correct possible errors
     */
    self.mediapanel.find('.jsxc_mmstreamTerminateAll').click(function() {

      mmstream._hangUpAll();

      // clear multimedia cache here and occupied flag
      setTimeout(function() {

        mmstream._clearMultimediacache();

        jsxc.gui.feedback('Appels terminés, système réinitialisé');

      }, 800);

    });

  },

  /**
   * Called when videoconference users changes
   *
   * Here we can show messages or close dialogs, update indicators, ...
   *
   * @private
   */
  _multimediacacheChanged : function(event, data) {

    var self = jsxc.mmstream.gui;
    var mmstream = jsxc.mmstream;

    if (jsxc.mmstream.debug === true) {
      self._log("On multimedia cache changed", {
        event : event, data : data
      });
    }

    // update video conference indicator
    self._updateVideoconferenceIndicator();

    // iterate datas and show feedback if one user is disconnected
    // only for status changed, to avoid too many notifications

    if (data && data.users) {
      $.each(data.users, function(index, element) {

        // display message
        var node = Strophe.getNodeFromJid(element.fulljid);
        // var bid = jsxc.jidToBid(element.fulljid);

        /**
         * Buddy is disconnected, show feedback
         */

        if (element.status === mmstream.USER_STATUS.DISCONNECTED) {

          // hide dialog if necessary
          jsxc.gui.dialog.close('incoming_call_dialog');
          jsxc.gui.dialog.close('video_conference_incoming');

          // let dialog get closed
          setTimeout(function() {
            jsxc.gui.feedback("Connexion interrompue avec " + node);
          }, 700);

        }


        /**
         * Buddy is connected, remove wait message
         */

        else if (element.status === mmstream.USER_STATUS.CONNECTED) {

          // find video element
          var mediaress = self.getRemoteVideoContainer(element.fulljid);

          mediaress.find('.jsxc_connectionInProgress').animate({opacity : 0},
              jsxc.newgui.OPACITY_ANIMATION_DURATION);

        }

      });
    }

  },

  /**
   * Get remote video container associated with fulljid
   */
  getRemoteVideoContainer : function(fulljid) {

    if (Strophe.getResourceFromJid(fulljid) === null) {
      throw new Error('Invalid argument: ' + fulljid);
    }

    return $('video[data-fromjid="' + fulljid + '"]').parents('.jsxc-media-ressource');
  },

  /**
   * Update videoconference gui to show status of participants
   * @private
   */
  _updateVideoconferenceIndicator : function() {

    var self = jsxc.mmstream.gui;
    var mmstream = jsxc.mmstream;

    var list = self.mediapanel.find(".jsxc_videoconferenceUsers");

    // remove all items from list
    list.find("li").remove();

    if (Object.keys(mmstream.multimediacache.users) < 1) {

      var it = $("<li>");
      it.text("Aucune connexion en cours");
      list.append(it);

      return;
    }

    // iterate users
    $.each(mmstream.multimediacache.users, function(fulljid, item) {

      var it = $("<li>");

      it.addClass("jsxcVideoConf_" + item.status);
      it.addClass("jsxcVideoConf_" + item.type);
      it.attr("title", item.type + ": " + item.status);

      var link;

      // user is participating to a videoconference, add link to reinvite him if needed
      if (mmstream._isBuddyParticipatingToVideoconference(fulljid) === true) {
        link = $("<a>").click(function() {
          mmstream.reinviteUserInVideoconference(fulljid);
        });
        link.text(item.node);

        list.append(it.append(link));
      }

      // user is participating to sreensharing, and we are initator. add link to reinvite
      // participants
      else if (mmstream._isBuddyScreensharingRecipient(fulljid) === true) {

        link = $("<a>").click(function() {
          mmstream.reinviteUserInScreensharing(fulljid);
        });
        link.text(item.node);

        list.append(it.append(link));
      }

      else {
        it.text(item.node);
        list.append(it);
      }

    });

  },

  /**
   * Show local screen stream in media panel. Do not ask for screen stream, if stream not exist,
   * error is raised.
   */
  showLocalScreenStream : function() {

    var mmstream = jsxc.mmstream;
    var self = mmstream.gui;
    var newgui = jsxc.newgui;

    if (mmstream.isVideoCallsDisabled() === true) {
      self._log('Calls are disabled');
      return;
    }

    if (mmstream.multimediacache.screenStream === null) {
      throw new Error("Screen stream is null");
    }

    // create container for video and title
    var videoCtr = $("<div>").addClass('jsxc_screenStreamContainer');

    // create video element and store jid
    var video = $("<video>").addClass("jsxc_mediaPanelLocalScreenStream");
    videoCtr.append(video);

    // create hangup button
    var hangup = $("<div>").addClass('jsxc_hangUpControl jsxc_videoControl').click(function() {
      mmstream._hangUpAll();
      jsxc.newgui.removeMediaRessource($(this).parents(".jsxc-media-ressource"));
    });

    // append video
    jsxc.newgui.addMediaRessource(videoCtr, "Votre écran", {titleControls : [hangup]});

    // attach video after append elements
    mmstream.attachMediaStream(video, mmstream.multimediacache.screenStream);

    if (newgui.isMediapanelShown() !== true) {
      newgui.toggleMediapanel();
    }

  },

  /**
   * Show a dialog explaining how to install screen sharing extension
   */
  showInstallScreenSharingExtensionDialog : function() {

    // show dialog
    jsxc.gui.dialog.open(jsxc.gui.template.get('installChromeExtension'), {
      'noClose' : true
    });

    $("#jsxc_dialog .jsxc_closeInstallChromeExtension").click(function() {
      jsxc.gui.dialog.close();
    });

    $("#jsxc_dialog .jsxc_reloadInstallChromeExtension").click(function() {
      location.reload();
    });

    // add animated gif
    $('#jsxc_installationIllustration').show().attr('src',
        jsxc.options.root + 'img/install-chrome-extension.gif');

  },

  /**
   * Return true if local video is shown
   * @returns {*}
   */
  isLocalVideoShown : function() {
    var self = jsxc.mmstream.gui;
    var local = self.mediapanel.find("#jsxc-local-video");

    return typeof local.attr("src") !== "undefined" && local.attr("src");
  },

  /**
   * Return true if the video stream provide from fulljid is displayed
   * @param fulljid
   * @returns {boolean}
   * @private
   */
  _isVideoStreamDisplayed : function(fulljid) {

    return jsxc.mmstream.gui.getRemoteVideoContainer(fulljid).length > 0;

  },

  /**
   * Add a stream to the side panel
   * @param stream
   * @param jid
   * @param title
   * @private
   */
  _showVideoStream : function(stream, fulljid) {

    if (Strophe.getResourceFromJid(fulljid) === null) {
      throw new Error("JID must be full jid");
    }

    var mmstream = jsxc.mmstream;
    var self = mmstream.gui;
    var node = Strophe.getNodeFromJid(fulljid);

    // check if video is not already present
    if (self._isVideoStreamDisplayed(fulljid) === true) {
      return;
    }

    // create container for video and title
    var videoCtr = $("<div>").addClass('jsxc_videoCallContainer');

    // create video element and store jid
    var video = $("<video>").addClass("jsxc_mediaPanelRemoteVideo");

    //$('#jsxc_webrtc .bubblingG').hide();

    video.data('fromjid', fulljid);
    video.attr('data-fromjid', fulljid);
    videoCtr.append(video);

    // waiting message
    videoCtr.append('<div class="jsxc_connectionInProgress">Connexion en cours ...</div>');

    // create hangup button
    var hangup = $("<div>").addClass('jsxc_hangUpControl jsxc_videoControl').click(function() {
      mmstream.hangupCall(fulljid);
      jsxc.newgui.removeMediaRessource($(this).parents(".jsxc-media-ressource"));
    });

    // create fullscreen button
    var fullscreen = $("<div>").addClass('jsxc_fullscreenControl jsxc_videoControl').click(
        function() {
          mmstream.gui._showVideoFullscreen(fulljid);
        });

    // append video
    jsxc.newgui.addMediaRessource(videoCtr, " Vidéo de " + node,
        {titleControls : [hangup, fullscreen]});

    // attach video after append elements
    mmstream.attachMediaStream(video, stream);
  },

  /**
   * Hide video stream with optionnal message
   * @private
   */
  _hideVideoStream : function(fulljid) {

    // var self = jsxc.mmstream.gui;

    if (Strophe.getResourceFromJid(fulljid) === null) {
      throw new Error("JID must be full jid");
    }

    // search element to remove
    $("video").each(function() {
      if ($(this).data('fromjid') === fulljid) {
        jsxc.newgui.removeMediaRessource($(this).parents(".jsxc-media-ressource"));
      }
    });

  },

  /**
   * Show local video
   * @private
   */
  showLocalVideo : function() {

    var self = jsxc.mmstream.gui;
    var mmstream = jsxc.mmstream;

    self._log("Show local stream");

    if (mmstream.isVideoCallsDisabled() === true) {
      self._log('Calls are disabled');
      return;
    }

    mmstream._requireLocalStream()
        .done(function(localStream) {
          mmstream.attachMediaStream($("#jsxc-local-video"), localStream);
        })
        .fail(function(error) {
          jsxc.gui.feedback("Erreur lors de l'accès à la caméra et au micro: " + error);
          jsxc.error("Error while using audio/video", error);
        });

  },

  /**
   * Add "video" button to a window chat menu when open.
   *
   * @private
   * @memberOf jsxc.mmstream.gui
   * @param event
   * @param win jQuery window object
   */
  _initChatWindow : function(event, win) {

    var mmstream = jsxc.mmstream;
    var self = jsxc.mmstream.gui;

    self._log('_initChatWindow', [event, win]);

    // don't update groupchat window
    if (win.hasClass('jsxc_groupchat')) {
      return;
    }

    var bid = win.data('bid');

    // don't add icon if already present
    if (win.find(".jsxc_video").length > 0) {
      self._log("Video icon already exist, skip", event);
      return;
    }

    if (!mmstream.conn) {
      $(document).one('attached.jsxc', function() {
        self._initChatWindow(null, win);
      });
      return;
    }

    // create and add video button
    var div = $('<div>').addClass('jsxc_video');
    div.click(function() {
      jsxc.api.startSimpleVideoCall(bid);
    });

    win.find('.jsxc_tools .jsxc_settings').after(div);

  },

  _ringOnIncoming : function() {
    jsxc.notification.playSound(jsxc.CONST.SOUNDS.CALL, true, true);
  },

  _stopRinging : function() {
    jsxc.notification.stopSound();
  },

  /**
   * Show an "accept / decline" dialog for an incoming call
   */
  _showIncomingCallDialog : function(bid) {

    var self = jsxc.mmstream.gui;

    var defer = $.Deferred();

    bid = jsxc.jidToBid(bid);

    var dialog = jsxc.gui.dialog.open(jsxc.gui.template.get('incomingCall', bid), {
      noClose : true, name : 'incoming_call_dialog'
    });

    self._ringOnIncoming();

    dialog.find('.jsxc_accept').click(function() {

      self._stopRinging();

      defer.resolve("ACCEPT");

      jsxc.gui.dialog.close();

    });

    dialog.find('.jsxc_reject').click(function() {

      self._stopRinging();

      defer.reject("REJECT");

      jsxc.gui.dialog.close();

    });

    return defer.promise();

  },

  /**
   * Show an "accept / decline" dialog for an incoming call
   */
  _showIncomingScreensharingDialog : function(bid) {

    if (!bid) {
      throw new Error("Invalid argument: " + bid);
    }

    var self = jsxc.mmstream.gui;

    var defer = $.Deferred();

    bid = jsxc.jidToBid(bid);

    var dialog = jsxc.gui.dialog.open(jsxc.gui.template.get('incomingScreensharing', bid), {
      noClose : true, name : 'incoming_screensharing'
    });

    self._ringOnIncoming();

    dialog.find('.jsxc_accept').click(function() {

      self._stopRinging();

      defer.resolve("ACCEPT");

      jsxc.gui.dialog.close();

    });

    dialog.find('.jsxc_reject').click(function() {

      self._stopRinging();

      defer.reject("REJECT");

      jsxc.gui.dialog.close();

    });

    return defer.promise();

  },

  /**
   *
   * @param bid
   * @returns {*}
   * @private
   */
  _showReinviteUserConfirmationDialog : function(bid, mode) {

    // var self = jsxc.mmstream.gui;

    var defer = $.Deferred();

    if (mode !== "received" && mode !== "emit") {
      throw new Error("Unkown mode: " + mode);
    }

    bid = jsxc.jidToBid(bid);

    var dialog = jsxc.gui.dialog.open(jsxc.gui.template.get('reinviteUser_' + mode, bid), {
      noClose : true, name : 'reinvite_user'
    });

    dialog.find('.jsxc_accept').click(function() {

      defer.resolve("ACCEPT");

      jsxc.gui.dialog.close();

    });

    dialog.find('.jsxc_reject').click(function() {

      defer.reject("REJECT");

      jsxc.gui.dialog.close();

    });

    return defer.promise();

  },

  /**
   * Show an "accept / decline" dialog for an incoming videoconference
   */
  _showIncomingVideoconferenceDialog : function(bid) {

    var self = jsxc.mmstream.gui;

    var defer = $.Deferred();

    var dialog = jsxc.gui.dialog.open(jsxc.gui.template.get('incomingVideoconference', bid), {
      noClose : true, name : "video_conference_incoming"
    });

    self._ringOnIncoming();

    dialog.find('.jsxc_accept').click(function() {

      self._stopRinging();

      defer.resolve("User accepted videoconference");

      jsxc.gui.dialog.close();

    });

    dialog.find('.jsxc_reject').click(function() {

      self._stopRinging();

      defer.reject("User rejected videoconference");

      jsxc.gui.dialog.close();

    });

    return defer.promise();

  },

  /**
   *
   *
   * @param fulljid
   * @private
   */
  _showVideoFullscreen : function(fulljid) {

    var mmstream = jsxc.mmstream;
    var self = mmstream.gui;
    var newgui = jsxc.newgui;

    if (Strophe.getResourceFromJid(fulljid) === null) {
      throw new Error("JID must be full jid");
    }

    // hide video panel
    if (newgui.isChatSidebarShown() === true) {
      newgui.toggleChatSidebar();
    }

    if (newgui.isMediapanelShown() === true) {
      newgui.toggleMediapanel();
    }

    // show video pop up
    jsxc.gui.dialog.open(jsxc.gui.template.get('videoStreamDialog'), {
      'noClose' : true
    });

    $("#jsxc_dialog .jsxc_from_jid").text(fulljid);

    $("#jsxc_dialog .jsxc_hangUpCall").click(function() {
      jsxc.mmstream.hangupCall(fulljid);
      jsxc.gui.dialog.close();
    });

    $("#jsxc_dialog .jsxc_closeVideoDialog").click(function() {
      jsxc.gui.dialog.close();

      jsxc.newgui.toggleMediapanel();
    });

    // attach video stream
    var video = $("#jsxc_dialog video");
    var stream = jsxc.mmstream.getActiveStream(fulljid);

    if (stream) {
      mmstream.attachMediaStream(video, stream);
    }

    else {
      $("#jsxc_dialog h3").text("Vidéo indisponible");

      self._log("Stream is null", {
        fulljid : fulljid, stream : stream
      }, 'ERROR');

    }

  }

};
