/**
 * Multimedia Stream Manager
 */

jsxc.mmstream = {

  auto_acept : true,

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
    self.conn = new Strophe.Connection(self.boshUrl);

    // check if jingle strophe plugin exist
    if (!self.conn.jingle) {
      jsxc.error('No jingle plugin found!');
      return;
    }

    var manager = self.conn.jingle.manager;

    // listen for incoming jingle calls
    manager.on('incoming', self._onIncomingJingleSession.bind(self));

    manager.on('peerStreamAdded', self._onRemoteStreamAdded.bind(self));
    manager.on('peerStreamRemoved', self._onRemoteStreamRemoved.bind(self));

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

    var sessionAccept = function(localStream) {
      session.addStream(localStream);
      session.accept();
    };

    // auto accept calls if specified
    if (self.auto_acept) {

      self._requireLocalStream()
          .done(function(localStream) {
            sessionAccept(localStream);
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

    dialog.dialog({
      title : title, height : 400, width : 'auto'
    });

    self.videoDialogs.push(dialog);

    // attach stream
    self.conn.jingle.RTC.attachMediaStream(dialog.get(0), stream);

  },

  /**
   * Create a new video call
   * @param fullJid
   */
  newVideoCall : function(fullJid) {

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
            console.log("change:connectionState");
            console.log(arguments);
          });

        },

        function(error) {

          console.error('Failed to get access to local media. Error ', error);

        });

  },

  /**
   * Called when
   */
  onDisconnected : function() {

    // TODO remove here all listeners on document
    // TODO close all dialogs

  }

};

$(document).ready(function() {
  if (jsxc.multimediaStreamSystem && jsxc.multimediaStreamSystem === "multistream") {
    $(document).on('attached.jsxc', jsxc.mmstream.init);
    $(document).on('disconnected.jsxc', jsxc.mmstream.onDisconnected);
  }
});