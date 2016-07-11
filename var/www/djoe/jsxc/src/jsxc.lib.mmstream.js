/**
 * New Multimedia Stream Manager
 *
 * Intend to replace jsxc.lib.webrtc.js
 *
 * Modules can be switched by use jsxc.multimediaStreamSystem in
 * jsxc.lib.js
 *
 */

jsxc.mmstream = {

  auto_accept : false,

  /** required disco features for video call */
  reqVideoFeatures : ['urn:xmpp:jingle:apps:rtp:video', 'urn:xmpp:jingle:apps:rtp:audio',
    'urn:xmpp:jingle:transports:ice-udp:1', 'urn:xmpp:jingle:apps:dtls:0'],

  /** required disco features for file transfer */
  reqFileFeatures : ['urn:xmpp:jingle:1', 'urn:xmpp:jingle:apps:file-transfer:3'],

  /**
   * Where local stream is stored, to avoid too many stream creation
   */
  localStream : null,

  /**
   * Current streams
   */
  remoteVideoSessions : [],

  /**
   * Recipients for call
   *
   */
  recipients : [],

  /**
   * Currents video dialogs
   */
  videoDialogs : [],

  /**
   *
   * XMPP connexion
   *
   */
  conn : null,

  /**
   * Initialize and configure multimedia stream manager
   */
  init : function() {

    var self = jsxc.mmstream;

    // create strophe connexion
    self.conn = jsxc.xmpp.conn;

    if (self.conn.caps) {
      $(document).on('caps.strophe', self._onCaps);
    }

    // check if jingle strophe plugin exist
    if (!self.conn.jingle) {
      jsxc.error('No jingle plugin found!');
      return;
    }

    self.gui._initGui();

    var manager = self.conn.jingle.manager;

    // listen for incoming jingle calls
    manager.on('incoming', self._onIncomingJingleSession.bind(self));

    manager.on('peerStreamAdded', self._onRemoteStreamAdded.bind(self));
    manager.on('peerStreamRemoved', self._onRemoteStreamRemoved.bind(self));

    //self.gui.showLocalVideo();

  },

  /**
   *  Called when receive incoming media session
   *
   */
  _onIncomingJingleSession : function(session) {

    console.log("[INCOMING - JINGLE]", arguments);

    var self = jsxc.mmstream;
    var type = (session.constructor) ? session.constructor.name : null;

    if (type === 'FileTransferSession') {
      self._onIncomingFileTransfer(session);
    } else if (type === 'MediaSession') {
      self._onIncomingCall(session);
    } else {
      console.error("Unknown session type: " + type, session);
    }

  },

  /**
   * Called when incoming file transfer
   */
  _onIncomingFileTransfer : function() {

    jsxc.feedback("Transfert de fichier à l'arrivée");

    throw "Not implemented yet";

  },

  /**
   * Called on incoming video call
   */
  _onIncomingCall : function(session) {

    var self = jsxc.mmstream;

    // send signal to partner
    session.ring();

    var bid = jsxc.jidToBid(session.peerID);

    // display notification
    jsxc.notification.notify(jsxc.t('Incoming_call'), jsxc.t('from_sender', {
      sender : bid
    }));

    var acceptRemoteSession = function(localStream) {

      session.addStream(localStream);
      session.accept();

      // show local video if needed
      if (self.gui.localVideoShown !== true) {
        self.gui.showLocalVideo();
      }

    };

    var declineRemoteSession = function(error) {

      session.decline();

      jsxc.gui.feedback("Erreur lors de l'accès à la caméra et au micro: " + error);
      jsxc.error("Error while using audio/video", error);

    };

    // auto accept calls if specified
    if (self.auto_accept === true) {

      // require permission on devices if needed
      self._requireLocalStream()
          .done(function(localStream) {
            acceptRemoteSession(localStream);
          })
          .fail(function(error) {
            declineRemoteSession(error);
          });
    }

    // show accept/decline confirmation dialog
    else {
      self.gui._showIncomingCallDialog(bid)
          .done(function() {

            // require permission on devices if needed
            self._requireLocalStream()
                .done(function(localStream) {
                  acceptRemoteSession(localStream);
                })
                .fail(function(error) {
                  declineRemoteSession(error);
                });

          })

          .fail(function() {
            console.log("Heyheyhey");
            jsxc.gui.feedback("Appel rejeté");
          });
    }

  },

  /**
   * Require access to local stream and return a promise with the stream
   *
   * If the stream already had been required, return the first stream to avoid
   *
   * to many local stream
   *
   * @returns {*}
   * @private
   */
  _requireLocalStream : function() {

    // TODO show indication on window that user have to accept to share video

    var self = jsxc.mmstream;

    var defer = $.Deferred();

    // Stream already stored, show it
    if (self.localStream) {
      defer.resolve(self.localStream);
      return defer.promise();
    }

    var constraints = {
      audio : true, video : true
    };

    // require local stream
    self.conn.jingle.RTC.getUserMedia(constraints,

        function(localStream) {
          self.localStream = localStream;
          defer.resolve(localStream);
        },

        function(error) {
          jsxc.error(error);
          defer.reject(error);
        });

    return defer.promise();

  },

  /**
   * Called when a remote stream is received
   * @param session
   * @param stream
   * @private
   */
  _onRemoteStreamAdded : function(session, stream) {

    var self = jsxc.mmstream;

    // var isVideoDevice = stream.getVideoTracks().length > 0;
    // var isAudioDevice = stream.getAudioTracks().length > 0;

    self.gui._showVideoStream(stream, session.peerID);

    // show sidebar if needed
    if (self.gui.isSidepanelShown() !== true) {
      self.gui.toggleVideoPanel();
    }

    self.remoteVideoSessions.push({
      session : session, stream : stream
    });

  },

  /**
   * Called when a remote stream is removed
   * @param session
   * @param stream
   * @private
   */
  _onRemoteStreamRemoved : function(session, stream) {

    console.error("Stream removed !");
    console.error(session, stream);

    var self = jsxc.mmstream;

    // found session and remove it from session stored
    var sid = session.sid;
    var sessionFound = false;

    for (var i = 0; i < self.remoteVideoSessions.length; i++) {
      var rsid = self.remoteVideoSessions[i].session.sid;
      if (rsid === sid) {
        self.remoteVideoSessions.splice(i, 1);
        sessionFound = true;
        break;
      }
    }

    // Hide stream after removed session
    self.gui._hideVideoStream(session.peerID);

    if (sessionFound !== true) {
      console.error("No session found");
    }

  },

  /**
   * Return list of current active sessions
   * @returns {Array}
   */
  getCurrentVideoSessions : function() {
    return jsxc.mmstream.remoteVideoSessions;
  },

  /**
   * Create a new video call
   * @param fullJid
   */
  startCall : function(fulljid) {

    var self = jsxc.mmstream;

    if (Strophe.getResourceFromJid(fulljid) === null) {
      throw "JID must be full jid";
    }

    // ice configuration
    self.conn.jingle.setICEServers(self.iceServers);

    // requesting user media
    var constraints = {
      audio : true, video : true
    };

    // Open Jingle session
    self.conn.jingle.RTC.getUserMedia(constraints, function(stream) {

          // console.log('onUserMediaSuccess');

          // show local video if needed
          if (self.gui.localVideoShown !== true) {
            self.gui.showLocalVideo();
          }

          // here we must verify if tracks are enought
          // var audioTracks = stream.getAudioTracks();
          // var videoTracks = stream.getVideoTracks();

          // console.log("Audio / video tracks: ")
          // console.log(audioTracks);
          // console.log(videoTracks);

          // openning jingle session
          var session = self.conn.jingle.initiate(fulljid, stream);

          session.on('change:connectionState', function() {
            console.log("[JINGLE] change:connectionState");
            console.log(arguments);
          });

        },

        function(error) {

          console.error('Failed to get access to local media. Error ', error);

        });

  },

  /**
   * Stop a call
   */
  hangupCall : function(fulljid) {

    var self = jsxc.mmstream;

    if (Strophe.getResourceFromJid(fulljid) === null) {
      throw "JID must be full jid";
    }

    self.conn.jingle.terminate(fulljid, "success", "Tchaoooo mec !");

    // close local stream if necessary

    if (self.getCurrentVideoSessions().length < 1) {
      self.stopLocalStream();
    }

    //$(document).trigger("hangup.videocall.jsxc");

  },

  /**
   * Stop local stream and reset it
   */
  stopLocalStream: function(){

    var self = jsxc.mmstream;

    if (self.localStream) {
      $.each(self.localStream.getTracks(), function(index, element){
        console.log(element);
        element.stop();
      });
      self.localStream = null;
    }

    if (self.conn.jingle.localStream) {
      $.each(self.conn.jingle.localStream.getTracks(), function(index, element){
        console.log(element);
        element.stop();
      });
      self.conn.jingle.localStream = null;
    }
  },

  /**
   * Update "video" button if we receive cap information.
   *
   * @private
   * @memberOf jsxc.mmstream
   * @param event
   * @param jid
   */
  _onCaps : function(event, jid) {

    var self = jsxc.mmstream;

    if (jsxc.gui.roster.loaded) {
      self.gui.updateIcon(jsxc.jidToBid(jid));
    } else {
      $(document).on('cloaded.roster.jsxc', function() {
        self.gui.updateIcon(jsxc.jidToBid(jid));
      });
    }

  },

  /**
   * Return list of capable resources.
   *
   * @memberOf jsxc.mmstream
   * @param jid
   * @param {(string|string[])} features list of required features
   * @returns {Array}
   */
  getCapableRes : function(jid, features) {

    var self = jsxc.mmstream;
    var bid = jsxc.jidToBid(jid);
    var res = Object.keys(jsxc.storage.getUserItem('res', bid) || {}) || [];

    if (!features) {
      return res;
    } else if (typeof features === 'string') {
      features = [features];
    }

    var available = [];
    $.each(res, function(i, r) {
      if (self.conn.caps.hasFeatureByJid(bid + '/' + r, features)) {
        available.push(r);
      }
    });

    return available;
  },

  /**
   * Called when
   */
  _onDisconnected : function() {

    var self = jsxc.mmstream;

    /**
     * Remove listeners
     */
    $(document).off('disconnected.jsxc', self._onDisconnected);
    $(document).off('caps.strophe', self._onCaps);

    /**
     * Remove all videos
     */
    $("#jsxc_videoPanel .jsxc_videoThumbContainer").remove();

    self.stopLocalStream();

  },

};

/**
 * Gui part of the manager
 *
 * @type {{videoPanel: null, localVideoShown: boolean, _initGui: jsxc.mmstream.gui._initGui,
 *     _showVideoStream: jsxc.mmstream.gui._showVideoStream, _hideVideoStream:
 *     jsxc.mmstream.gui._hideVideoStream, showLocalVideo: jsxc.mmstream.gui.showLocalVideo,
 *     _initChatWindow: jsxc.mmstream._initChatWindow, updateIcon: jsxc.mmstream.updateIcon,
 *     _newVideoDialog: jsxc.mmstream.gui._newVideoDialog, isSidepanelShown:
 *     jsxc.mmstream.gui.isSidepanelShown, toggleVideoPanel: jsxc.mmstream.gui.toggleVideoPanel,
 *     _showIncomingCallDialog: jsxc.mmstream.gui._showIncomingCallDialog}}
 */
jsxc.mmstream.gui = {

  /**
   * JQuery object that represent the side panel on left
   */
  videoPanel : null,

  /**
   * True if local video is displayed
   */
  localVideoShown : false,

  /**
   * Create gui and add it to the main window
   *
   * @private
   */
  _initGui : function() {

    var self = jsxc.mmstream.gui;

    self.localVideoShown = false;

    // create GUI
    self.videoPanel = $(jsxc.gui.template.get('videoPanel'));
    self.videoPanel.addClass("jsxc_state_hidden");

    // button for opening
    self.videoPanel.find("#jsxc_toggleVideoPanel").click(function() {
      jsxc.mmstream.gui.toggleVideoPanel();
    });

    self.videoPanel.find(".jsxc_videoPanelContent").perfectScrollbar();

    $('body').append(self.videoPanel);

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

    var jid = Strophe.getBareJidFromJid(fulljid);

    if (Strophe.getResourceFromJid(fulljid) === null) {
      throw "JID must be full jid";
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
    };

    options = $.extend(defaultOptions, options);

    // create container for video and title
    var videoCtr = $("<div>").addClass('jsxc_videoThumbContainer');
    videoCtr.data("fromjid", fulljid);

    $("<h2>").text(options.title).addClass("jsxc_videoThumb_title").appendTo(videoCtr);

    // create video element and attach media stream
    var video = $("<video>").addClass("jsxc_videoThumb").appendTo(videoCtr);
    jsxc.attachMediaStream(video.get(0), stream);

    // controls
    if (options.hangupButton === true) {
      var hangup = $("<div>").addClass('jsxc_hangUp jsxc_videoControl').click(function() {
        jsxc.mmstream.hangupCall(fulljid);
      });

      hangup.appendTo(videoCtr);
    }

    // append video on first position if needed
    if (options.prepend === true) {
      self.videoPanel.find(".jsxc_videoPanelContent").prepend(videoCtr);
    }
    // append video at end
    else {
      self.videoPanel.find(".jsxc_videoPanelContent").append(videoCtr);
    }

  },

  /**
   * Hide video stream with optionnal message
   * @private
   */
  _hideVideoStream : function(fulljid) {

    var mmstream = jsxc.mmstream;
    var self = jsxc.mmstream.gui;

    if (Strophe.getResourceFromJid(fulljid) === null) {
      throw "JID must be full jid";
    }

    // search element to remove
    self.videoPanel.find(".jsxc_videoThumbContainer").each(function() {

      var cjid = $(this).data("fromjid");
      if (cjid === fulljid) {

        // remove element
        $(this).remove();

        // display message
        var node = Strophe.getNodeFromJid(fulljid);
        var mess = "Connexion interrompue avec " + node;

        jsxc.gui.feedback(mess);

        return false;
      }

    });

    // hide localvideo if necessary
    if(mmstream.getCurrentVideoSessions().length < 1){
      $("#jsxc_videoPanel .jsxc_videoThumbContainer").remove();
    }

  },

  /**
   * Show local video
   * @private
   */
  showLocalVideo : function() {

    var mmstream = jsxc.mmstream;
    var self = jsxc.mmstream.gui;

    mmstream._requireLocalStream()
        .done(function(localStream) {
          self._showVideoStream(localStream, jsxc.xmpp.conn.jid, {
            title : "Local video stream", prepend : true, hangupButton : false,
          });

          self.localVideoShown = true;
        })
        .fail(function() {
          self.localVideoShown = false;
        });

  },

  /**
   * Add "video" button to a window chat menu when open.
   *
   * @private
   * @memberOf jsxc.mmstream
   * @param event
   * @param win jQuery window object
   */
  _initChatWindow : function(event, win) {

    var self = jsxc.mmstream;

    if (win.hasClass('jsxc_groupchat')) {
      return;
    }

    jsxc.debug('mmstream._initChatWindow');

    if (!self.conn) {
      $(document).one('attached.jsxc', function() {
        self.gui._initChatWindow(null, win);
      });
      return;
    }

    var div = $('<div>').addClass('jsxc_video');
    win.find('.jsxc_tools .jsxc_settings').after(div);

    self.gui.updateIcon(win.data('bid'));
  },

  /**
   * Enable or disable "video" icon and assign full jid.
   *
   * @memberOf jsxc.mmstream
   * @param bid CSS conform jid
   */
  updateIcon : function(bid) {

    jsxc.debug('Update icon', bid);

    var self = jsxc.mmstream;

    if (bid === jsxc.jidToBid(self.conn.jid)) {
      return;
    }

    var win = jsxc.gui.window.get(bid);
    var jid = win.data('jid');
    var ls = jsxc.storage.getUserItem('buddy', bid);

    if (typeof jid !== 'string') {
      if (ls && typeof ls.jid === 'string') {
        jid = ls.jid;
      } else {
        jsxc.debug('[mmstream] Could not update icon, because could not find jid for ' + bid);
        return;
      }
    }

    var res = Strophe.getResourceFromJid(jid);

    var el = win.find('.jsxc_video');

    var capableRes = self.getCapableRes(jid, self.reqVideoFeatures);
    var targetRes = res;

    if (targetRes === null) {
      $.each(jsxc.storage.getUserItem('buddy', bid).res || [], function(index, val) {
        if (capableRes.indexOf(val) > -1) {
          targetRes = val;
          return false;
        }
      });

      jid = jid + '/' + targetRes;
    }

    el.off('click');

    if (capableRes.indexOf(targetRes) > -1) {
      el.click(function() {
        self.startCall(jid);
      });

      el.removeClass('jsxc_disabled');

      el.attr('title', jsxc.t('Start_video_call'));
    } else {
      el.addClass('jsxc_disabled');

      el.attr('title', jsxc.t('Video_call_not_possible'));
    }

    var fileCapableRes = self.getCapableRes(jid, self.reqFileFeatures);
    var resources = Object.keys(jsxc.storage.getUserItem('res', bid) || {}) || [];

    if (fileCapableRes.indexOf(res) > -1 ||
        (res === null && fileCapableRes.length === 1 && resources.length === 1)) {
      win.find('.jsxc_sendFile').removeClass('jsxc_disabled');
    } else {
      win.find('.jsxc_sendFile').addClass('jsxc_disabled');
    }
  },

  /**
   * Create and show a new dialog displaying video stream
   *
   */
  _newVideoDialog : function(stream, title) {

    var self = jsxc.mmstream;

    title = title || "";

    // create and append dialog to body
    var dialog = $("<video>");
    dialog.appendTo($("body"));

    self.videoDialogs.push(dialog);

    // attach stream
    jsxc.attachMediaStream(dialog.get(0), stream);

    dialog.dialog({
      title : title, height : '400', width : 'auto'
    });

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

    if (!state) {
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

  _ringOnIncomming : function() {
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

    var dialog = jsxc.gui.dialog.open(jsxc.gui.template.get('incomingCall', bid), {
      noClose : true
    });

    self._ringOnIncomming();

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

  }

};

$(document).ready(function() {
  if (jsxc.multimediaStreamSystem && jsxc.multimediaStreamSystem === "multistream") {

    var self = jsxc.mmstream;

    $(document).on('attached.jsxc', self.init);
    $(document).on('disconnected.jsxc', self._onDisconnected);
    $(document).on('init.window.jsxc', self.gui._initChatWindow);

  }
});