/**
 * Multimedia Stream Manager
 */

jsxc.mmstream = {

  auto_accept : true,

  localVideoShown : false,

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
   * Were are stored last people who call (id and time)
   */
  lastCallers : [],

  /**
   * JQuery object that represent the side panel on left
   */
  videoPanel : null,

  /**
   *  Current remote session and stream objects
   */
  remoteSessions : [],

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
      $(document).on('caps.strophe', self.onCaps);
    }

    // check if jingle strophe plugin exist
    if (!self.conn.jingle) {
      jsxc.error('No jingle plugin found!');
      return;
    }

    self._initGui();

    var manager = self.conn.jingle.manager;

    // listen for incoming jingle calls
    manager.on('incoming', self._onIncomingJingleSession.bind(self));

    manager.on('peerStreamAdded', self._onRemoteStreamAdded.bind(self));
    manager.on('peerStreamRemoved', self._onRemoteStreamRemoved.bind(self));

  },

  /**
   * Create gui and add it to the main window
   *
   * @private
   */
  _initGui : function() {

    var self = jsxc.mmstream;

    // create GUI
    self.videoPanel = $(jsxc.gui.template.get('videoPanel'));
    self.videoPanel.addClass("jsxc_state_hidden");

    // button for opening
    self.videoPanel.find("#jsxc_toggleVideoPanel").click(function() {
      self.toggleVideoPanel();
    });

    $('body').append(self.videoPanel);

  },

  /**
   * Open or close video panel
   * 
   * State can be 'true' or 'false'
   * 
   */
  toggleVideoPanel : function(state) {

    var self = jsxc.mmstream;
    var panel = self.videoPanel;

    if (!state) {
      state = !panel.hasClass('jsxc_state_shown');
    }

    panel.removeClass('jsxc_state_hidden jsxc_state_shown');

    // show window
    if(state === true){
      panel.addClass('jsxc_state_shown');
    }

    // close window
    else {
      panel.addClass('jsxc_state_hidden');
    }

    $(document).trigger('toggle.videoPanel.jsxc', [state]);

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

    self.lastCallers.push({
      id : session.peerID, when : new Date()
    });

    var acceptRemoteSession = function(localStream) {
      session.addStream(localStream);
      session.accept();
    };

    // auto accept calls if specified
    if (self.auto_accept === true) {

      self._requireLocalStream()
          .done(function(localStream) {

            console.log(localStream);

            acceptRemoteSession(localStream);
          })
          .fail(function() {
            session.decline();
          });
    }

    // show accept/decline confirmation dialog
    else {
      // TODO: show call accept/decline dialog
      throw "Not implemented yet !";
    }

    // show local video if needed
    if (self.localVideoShown !== true) {
      self._showLocalVideo();
    }

  },

  /**
   * Show local video
   * @private
   */
  _showLocalVideo : function() {

    // TODO: Show local video in a small video object on bottom left corner

    var self = jsxc.mmstream;

    self._requireLocalStream()
        .done(function(localStream) {
          self._newVideoDialog(localStream);
          self.localVideoShown = true;
        })
        .fail(function() {
          self.localVideoShown = false;
        });

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
      return;
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

    // keep trace of session
    self.remoteSessions.push({
      session : session, stream : stream
    });

    // var isVideoDevice = stream.getVideoTracks().length > 0;
    // var isAudioDevice = stream.getAudioTracks().length > 0;

    self._newVideoDialog(stream, "Video from: " + Strophe.getBareJidFromJid(session.peerID));

  },

  /**
   * Called when a remote stream is removed
   * @param session
   * @param stream
   * @private
   */
  _onRemoteStreamRemoved : function(session, stream) {

    console.error("Stream removed !");
    console.error(stream);

    var self = jsxc.mmstream;

    // found session and remove it from session stored
    var sid = session.sid;
    var sessionFound = false;

    for (var i = 0; i < self.remoteSessions.length; i++) {
      var rsid = self.remoteSessions[i].session.sid;
      if (rsid === sid) {
        self.remoteSessions.splice(i, 1);
        sessionFound = true;
        break;
      }
    }

    if (sessionFound !== true) {
      console.error("No session found");
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
    var dialog = $("<video></video>");
    dialog.appendTo($("body"));

    self.videoDialogs.push(dialog);

    // attach stream
    self.conn.jingle.RTC.attachMediaStream(dialog.get(0), stream);

    dialog.dialog({
      title : title, height : '400', width : 'auto'
    });

  },

  /**
   * Create a new video call
   * @param fullJid
   */
  startCall : function(fullJid) {

    var self = jsxc.mmstream;

    if (Strophe.getResourceFromJid(fullJid) === null) {
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

          self._newVideoDialog(stream, "Local stream");

          // here we must verify if tracks are enought
          // var audioTracks = stream.getAudioTracks();
          // var videoTracks = stream.getVideoTracks();

          // console.log("Audio / video tracks: ")
          // console.log(audioTracks);
          // console.log(videoTracks);

          // openning jingle session
          var session = self.conn.jingle.initiate(fullJid, stream);

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
   * Update "video" button if we receive cap information.
   *
   * @private
   * @memberOf jsxc.mmstream
   * @param event
   * @param jid
   */
  onCaps : function(event, jid) {

    var self = jsxc.mmstream;

    if (jsxc.gui.roster.loaded) {
      self.updateIcon(jsxc.jidToBid(jid));
    } else {
      $(document).on('cloaded.roster.jsxc', function() {
        self.updateIcon(jsxc.jidToBid(jid));
      });
    }

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
   * Add "video" button to window menu.
   *
   * @private
   * @memberOf jsxc.mmstream
   * @param event
   * @param win jQuery window object
   */
  initWindow : function(event, win) {
    var self = jsxc.mmstream;

    // if (win.hasClass('jsxc_groupchat')) {
    //   return;
    // }

    jsxc.debug('mmstream.initWindow');

    if (!self.conn) {
      $(document).one('attached.jsxc', function() {
        self.initWindow(null, win);
      });
      return;
    }

    var div = $('<div>').addClass('jsxc_video');
    win.find('.jsxc_tools .jsxc_settings').after(div);

    self.updateIcon(win.data('bid'));
  },

  /**
   * Called when
   */
  onDisconnected : function() {

    // TODO close all dialogs

    var self = jsxc.mmstream;

    $(document).off('attached.jsxc', self.init);
    $(document).off('disconnected.jsxc', self.onDisconnected);
    $(document).off('caps.strophe', self.onCaps);

  }

};

$(document).ready(function() {
  if (jsxc.multimediaStreamSystem && jsxc.multimediaStreamSystem === "multistream") {

    var self = jsxc.mmstream;

    $(document).on('attached.jsxc', self.init);
    $(document).on('disconnected.jsxc', self.onDisconnected);
    $(document).on('init.window.jsxc', self.initWindow);

  }
});