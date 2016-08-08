/**
 * Gui part of the multimedia stream  manager
 *
 */
jsxc.mmstream.gui = {

  /**
   * JQuery object that represent the side panel on left
   */
  videoPanel : null,

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

    // update user status on event
    $(document).on("status.videoconference-changed.jsxc", self._videoconferenceChanged);
    $(document).on("type.videoconference-changed.jsxc", self._videoconferenceChanged);

    // create GUI
    self.videoPanel = $(jsxc.gui.template.get('videoPanel'));
    self.videoPanel.addClass("jsxc_state_hidden");

    // button for opening
    self.videoPanel.find("#jsxc_toggleVideoPanel").click(function() {
      jsxc.mmstream.gui.toggleVideoPanel();
    });

    self.videoPanel.find(".jsxc_videoPanelContent").perfectScrollbar();

    $('body').append(self.videoPanel);

    // init Chrome extension installation button
    if (jsxc.gui.menu.ready === true) {
      self._initChromeExtensionDialog();
    } else {
      $(document).one("menu.ready.jsxc", self._initChromeExtensionDialog);
    }

  },

  /**
   * Called when videoconference users changes
   *
   * Here we can show messages or close dialogs, update indicators, ...
   *
   * @private
   */
  _videoconferenceChanged : function(event, data) {

    var self = jsxc.mmstream.gui;
    var mmstream = jsxc.mmstream;

    if (jsxc.mmstream.debug === true) {
      self._log("On status changed", {
        event : event, data : data
      });
    }

    // update video conference indicator
    self._updateVideoconferenceIndicator();

    // iterate datas and show feedback if one user is disconnected
    // only for status changed, to avoid too many notifications
    if (event.type === "status") {

      $.each(data.users, function(index, element) {

        if (element.status === mmstream.USER_STATUS.DISCONNECTED) {

          // display message
          var node = Strophe.getNodeFromJid(element.fulljid);

          // hide dialog if necessary
          jsxc.gui.dialog.close('incoming_call_dialog');
          jsxc.gui.dialog.close('video_conference_incoming');

          // let dialog get closed
          setTimeout(function() {
            jsxc.gui.feedback("Connexion interrompue avec " + node);
          }, 700);

        }

      });
    }

  },

  /**
   * Update videoconference gui to show status of participants
   * @private
   */
  _updateVideoconferenceIndicator : function() {

    // var self = jsxc.mmstream.gui;
    var mmstream = jsxc.mmstream;

    var list = $("#jsxc_videoPanel .jsxc_videoconferenceUsers");

    // remove all items from list
    list.find("li").remove();

    // iterate users
    $.each(mmstream.videoconference.users, function(index, item) {

      var it = $("<li>");
      it.addClass("jsxcVideoConf_" + item.status);
      it.text(item.node + ": " + item.status);

      list.append(it);

    });

  },

  /**
   * Init dialog and button for installing screen capture Chrome extension
   * @private
   */
  _initChromeExtensionDialog : function() {

    // show gui for install Chrome extension
    var installChromeExt = $("#jsxc_menuConversation .jsxc_screenInstallChromeExtension");

    if (jsxc.mmstream._isNavigatorChrome() !== true) {
      installChromeExt.css({"display" : "none"});
    }

    else {

      // check if we connected in HTTPS
      if (document.location.protocol.indexOf("https") > -1) {

        installChromeExt.click(function() {

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

        });

        jsxc.mmstream._isChromeExtensionInstalled()
            .then(function() {
              installChromeExt.css({"display" : "none"});
            });

      }

      // we are not in HTTPS
      else {

        // remove existing warnings
        $("#jsxc_menuConversation .jsxc_httpScreenSharingWarning").remove();

        // add warning
        var message = "Vous devez vous connecter en HTTPS pour que la capture d'écran fonctionne.";
        installChromeExt.after(
            "<div class='jsxc_menuAdvice jsxc_httpScreenSharingWarning'>" + message + "</div>");

        // disable install button
        installChromeExt.click(function() {
          jsxc.gui.feedback(message);
        });

      }

    }

  },

  /**
   * Return true if local video is shown
   * @returns {*}
   */
  isLocalVideoShown : function() {
    var self = jsxc.mmstream.gui;
    return self.videoPanel.find(".jsxc_local_video_container").length > 0;
  },

  /**
   * Add a stream to the side panel
   * @param stream
   * @param jid
   * @param title
   * @private
   */
  _showVideoStream : function(stream, fulljid, options) {

    var self = jsxc.mmstream.gui;

    // TODO: display name only
    // var jid = Strophe.getNodeFromJid(fulljid);
    var jid = fulljid;

    if (Strophe.getResourceFromJid(fulljid) === null) {
      throw new Error("JID must be full jid");
    }

    // add only if not already present
    var alreadyHere = false;
    self.videoPanel.find(".jsxc_videoPanelContent").each(function(index, element) {
      if ($(element).data("fromjid") === fulljid) {
        alreadyHere = true;
        return false;
      }
    });

    if (alreadyHere === true) {
      return;
    }

    var defaultOptions = {

      /**
       * Title of video thumb
       */
      title : "From " + jid,

      /**
       * If true, thumb will be append in first position
       */
      prepend : false,

      /**
       * If false, no hang up button will be displayed
       */
      hangupButton : true,

      /**
       *
       */
      fullscreenButton : true,

      /**
       * Supplementary classes to add to video container
       */
      supClasses : "",
    };

    options = $.extend(defaultOptions, options);

    // create container for video and title
    var videoCtr = $("<div>").addClass('jsxc_videoThumbContainer');
    videoCtr.data("fromjid", fulljid);

    if (options.supClasses !== "") {
      videoCtr.addClass(options.supClasses);
    }

    $("<h2>").text(options.title).addClass("jsxc_videoThumb_title").appendTo(videoCtr);

    // create video element and attach media stream
    var video = $("<video>").addClass("jsxc_videoThumb").appendTo(videoCtr);

    // controls
    if (options.hangupButton === true) {
      var hangup = $("<div>").addClass('jsxc_hangUpControl jsxc_videoControl').click(function() {
        jsxc.mmstream.hangupCall(fulljid);
      });

      hangup.appendTo(videoCtr);
    }

    if (options.fullscreenButton === true) {

      var fullscreen = $("<div>").addClass('jsxc_fullscreenControl jsxc_videoControl').click(
          function() {
            jsxc.mmstream.gui._showVideoFullscreen(fulljid);
          });

      fullscreen.appendTo(videoCtr);
    }

    // append video on first position if needed
    if (options.prepend === true) {
      self.videoPanel.find(".jsxc_videoPanelContent").prepend(videoCtr);
    }
    // append video at end
    else {
      self.videoPanel.find(".jsxc_videoPanelContent").append(videoCtr);
    }

    self.videoPanel.find(".jsxc_videoPanelContent").perfectScrollbar("update");

    // attach video after append elements
    jsxc.attachMediaStream(video.get(0), stream);
  },

  /**
   * Hide video stream with optionnal message
   * @private
   */
  _hideVideoStream : function(fulljid) {

    var self = jsxc.mmstream.gui;

    if (Strophe.getResourceFromJid(fulljid) === null) {
      throw new Error("JID must be full jid");
    }

    // search element to remove
    self.videoPanel.find(".jsxc_videoThumbContainer").each(function() {

      var cjid = $(this).data("fromjid");
      if (cjid === fulljid) {

        // remove element
        $(this).remove();

        return false;
      }

    });

  },

  /**
   * Show local video
   * @private
   */
  showLocalVideo : function() {

    var mmstream = jsxc.mmstream;

    mmstream._requireLocalStream()
        .done(function(localStream) {

          jsxc.attachMediaStream("#jsxc_localVideo", localStream);

          // self._showVideoStream(localStream, jsxc.xmpp.conn.jid, {
          //   title : "Local video stream",
          //   prepend : true,
          //   hangupButton : false,
          //   fullscreenButton : false,
          //   supClasses : "jsxc_local_video_container"
          // });

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
      self._updateIcon(bid);
      self._updateVideoLink(bid);
      self._log("Video icon already exist, skip", event);
      return;
    }

    if (!mmstream.conn) {
      $(document).one('attached.jsxc', function() {
        self._initChatWindow(null, win);
      });
      return;
    }

    var div = $('<div>').addClass('jsxc_video');
    win.find('.jsxc_tools .jsxc_settings').after(div);

    self._updateIcon(bid);
    self._updateVideoLink(bid);
  },

  /**
   *
   * @private
   */
  _updateAllIcons : function() {
    // TODO
  },

  /**
   * Update all the video links
   * @private
   */
  _updateAllVideoLinks : function() {

    var self = jsxc.mmstream.gui;

    $.each(jsxc.storage.getUserItem('buddylist') || [], function(index, item) {
      self._updateVideoLink(item);
    });
  },

  /**
   * Add action to video call link.
   *
   * Action is determined only by the presence of resource.
   * If all clients are this kind of JSXC, then no problem will append
   *
   *
   * @param bid
   * @private
   */
  _updateVideoLink : function(bid) {

    var mmstream = jsxc.mmstream;
    // var self = jsxc.mmstream.gui;

    if (bid === jsxc.jidToBid(mmstream.conn.jid)) {
      return;
    }

    //self._log('Update link', bid);

    // search available ressource
    var budDatas = jsxc.storage.getUserItem("buddy", bid);

    /*
     /!\ /!\ Do not update group chat
     If updating group chat here, keep in mind that method
     jsxc.getCurrentActiveJidForBid(bid); will modify groupchat jid
     */
    if (budDatas.type === "groupchat") {
      return;
    }

    var fulljid = jsxc.getCurrentActiveJidForBid(bid);

    // get roster element representing buddy
    var rosterElement = jsxc.gui.roster.getItem(bid);
    if (!rosterElement) {
      return;
    }

    var videoLink = rosterElement.find('.jsxc_videocall');

    // remove other listeners
    videoLink.off("click");

    // check ressource and status
    if (fulljid !== null && budDatas.status && budDatas.status > 0) {

      videoLink.css("text-decoration", "underline");

      // simple video call
      videoLink.click(function() {

        jsxc.gui.feedback("L'appel va bientôt commencer");

        jsxc.mmstream.startVideoCall(fulljid);
        return false;
      });

    } else {
      videoLink.css("text-decoration", "line-through");
    }

  },

  /**
   * Remove all GUI elements
   */
  removeGui : function() {
    $("#jsxc_videoPanel").remove();
  },

  /**
   * Enable or disable "video" icon and assign full jid.
   *
   * @memberOf jsxc.mmstream
   * @param bid CSS conform jid
   */
  _updateIcon : function(bid) {

    bid = Strophe.getBareJidFromJid(bid);

    var mmstream = jsxc.mmstream;
    // var self = jsxc.mmstream.gui;

    //self._log('Update icon', bid);

    if (bid === jsxc.jidToBid(mmstream.conn.jid)) {
      return;
    }

    var win = jsxc.gui.window.get(bid);

    /*
     /!\ /!\ Do not update group chat window
     If updating chat window here, keep in mind that method
     jsxc.getCurrentActiveJidForBid(bid); will modify groupchat jid
     */

    var budDatas = jsxc.storage.getUserItem("buddy", bid);
    if (budDatas.type === "groupchat") {
      return;
    }

    // get fresh full jid
    var fulljid = jsxc.getCurrentActiveJidForBid(bid);

    // get the video icon
    var el = win.find('.jsxc_video');
    el.off('click');

    if (fulljid !== null && budDatas.status && budDatas.status > 0) {

      el.click(function() {
        mmstream.startVideoCall(fulljid);
      });

      el.removeClass('jsxc_disabled');
      el.attr('title', jsxc.t('Start_video_call'));

      win.find('.jsxc_sendFile').removeClass('jsxc_disabled');
    }

    else {
      el.addClass('jsxc_disabled');

      el.attr('title', jsxc.t('Video_call_not_possible'));

      win.find('.jsxc_sendFile').addClass('jsxc_disabled');
    }

  },

  /**
   * Create and show a new dialog displaying video stream
   *
   */
  _newVideoDialog : function(stream, title) {

    var self = jsxc.mmstream.gui;

    title = title || "";

    // create and append dialog to body
    var dialog = $("<video>");
    dialog.appendTo($("body"));

    self.videoDialogs.push(dialog);

    dialog.dialog({
      title : title, height : '400', width : 'auto'
    });

    // attach stream after element creation
    jsxc.attachMediaStream(dialog.get(0), stream);

  },

  /**
   * Return true if sidebar is shown
   */
  isSidepanelShown : function() {
    var self = jsxc.mmstream.gui;
    return self.videoPanel && self.videoPanel.hasClass('jsxc_state_shown');
  },

  /**
   * Open or close video panel
   *
   * State can be 'true' or 'false'
   *
   */
  toggleVideoPanel : function(state) {

    var self = jsxc.mmstream.gui;
    var panel = self.videoPanel;

    if (typeof state === "undefined") {
      state = !panel.hasClass('jsxc_state_shown');
    }

    panel.removeClass('jsxc_state_hidden jsxc_state_shown');

    // show window
    if (state === true) {
      panel.addClass('jsxc_state_shown');
    }

    // close window
    else {
      panel.addClass('jsxc_state_hidden');
    }

    $(document).trigger('toggle.videoPanel.jsxc', [state]);

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

    bid = Strophe.getBareJidFromJid(bid);

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

      defer.fail("REJECT");

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

    var self = jsxc.mmstream.gui;

    if (Strophe.getResourceFromJid(fulljid) === null) {
      throw new Error("JID must be full jid");
    }

    // hide video panel
    jsxc.mmstream.gui.toggleVideoPanel(false);

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

      jsxc.mmstream.gui.toggleVideoPanel(true);
    });

    // attach video stream
    var video = $("#jsxc_dialog video");
    var stream = jsxc.mmstream.getActiveStream(fulljid);

    if (stream) {
      jsxc.attachMediaStream(video.get(0), stream);
    }

    else {
      $("#jsxc_dialog h3").text("Vidéo indisponible");

      self._log("Stream is null", {
        fulljid : fulljid, stream : stream
      }, 'ERROR');

    }

  }

};
