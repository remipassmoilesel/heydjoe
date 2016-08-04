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

  debug : true,

  auto_accept : false,

  XMPP_VIDEOCONFERENCE : {

    ELEMENT_NAME : "videoconference",

    STATUS : {

      INIT : "initiate",

      ABORT : "abort"

    }
  },

  _log : function(message, data, level) {
    jsxc.debug("[MMSTREAM] " + message, data, level);
  },

  /**
   * Waiting time before call after sending invitations. If we call before invitation arrive,
   * videoconference will fail.
   *
   * Receiver need to get all jids participant before first calls
   *
   */
  //WAIT_BEFORE_CALL : 1000,
  WAIT_BEFORE_CALL : 1000,

  /**
   * Hangup call if no response
   */
  HANGUP_IF_NO_RESPONSE : 20000,

  /** required disco features for video call */
  reqVideoFeatures : ['urn:xmpp:jingle:apps:rtp:video', 'urn:xmpp:jingle:apps:rtp:audio',
    'urn:xmpp:jingle:transports:ice-udp:1', 'urn:xmpp:jingle:apps:dtls:0'],

  /** required disco features for file transfer */
  reqFileFeatures : ['urn:xmpp:jingle:1', 'urn:xmpp:jingle:apps:file-transfer:3'],

  /**
   * True if navigator can share is screen
   */
  screenSharingCapable : false,

  /**
   * Messages for Chrome communicate with Chrome extension
   */

  chromeExtensionMessages : {
    isAvailable : "djoe.screencapture-extension." + "is-available",
    available : "djoe.screencapture-extension." + "available",
    getScreenSourceId : "djoe.screencapture-extension." + "get-screen-source-id",
    getAPTSourceId : "djoe.screencapture-extension." + "get-audio-plus-tab-source-id"
  },

  /**
   * Where local stream is stored, to avoid too many stream creation
   */
  localStream : null,

  /**
   * Current streams
   */
  remoteVideoSessions : {},

  /**
   * Recipients for call
   *
   */
  recipients : [],

  /**
   * List of full jids which are automatically accepted
   */
  videoconferenceAcceptedBuddies : [],

  /**
   * List of full jids which are waiting for our response. To avoid too many notifications
   */
  videoconferenceWaitingBuddies : [],

  /**
   * Same but only sessions. JID => Sessions
   */
  videoconferenceWaitingSessions : {},

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

    self.messageHandler = self.conn.addHandler(jsxc.mmstream._onReceived, null, 'message');

    self._registerListenersOnAttached();

    // check if jingle strophe plugin exist
    if (!self.conn.jingle) {
      self._log('No jingle plugin found!', null, 'ERROR');
      return;
    }

    // check screen sharing capabilities
    if (self._isNavigatorChrome() === true) {
      self._isChromeExtensionInstalled();
    }

    self.gui._initGui();

    var manager = self.conn.jingle.manager;

    // listen for incoming jingle calls
    manager.on('incoming', self._onIncomingJingleSession.bind(self));

    manager.on('peerStreamAdded', self._onRemoteStreamAdded.bind(self));
    manager.on('peerStreamRemoved', self._onRemoteStreamRemoved.bind(self));

    self._log("MMStream module init");

  },

  /**
   * Return an array of jid from a string list "a@b,c@d,e@f"
   *
   * @param stringList
   * @returns {Array}
   * @private
   */
  _unserializeJidList : function(stringList) {

    var res = stringList.split(",");
    var finalRes = [];
    $.each(res, function(index, elmt) {
      finalRes.push(elmt.trim().toLowerCase());
    });

    return finalRes;
  },

  /**
   *
   * Reception of videoconference messages
   *
   * @param stanza
   * @private
   */
  _onReceived : function(stanza) {

    var self = jsxc.mmstream;

    // check if stanza is a videoconference invitation
    var video = $(stanza).find(self.XMPP_VIDEOCONFERENCE.ELEMENT_NAME);

    var initiator = $(stanza).attr("from");

    if (video.length > 0) {

      if (jsxc.mmstream.debug) {
        self._log("_onReceived", stanza);
      }

      /**
       * Video conference invitation
       */
      if (video.attr("status") === self.XMPP_VIDEOCONFERENCE.STATUS.INIT) {

        jsxc.stats.addEvent("jsxc.mmstream.videoconference.invitationReceived");

        var participants = self._unserializeJidList(video.attr("users") || "");
        // var message = video.attr("message");
        // var datetime = video.attr("datetime");

        // TODO check if datetime is now - 5 min

        // check how many participants
        if (participants.length < 1) {
          // stop but keep handler
          return true;
        }

        // add buddies to waiting list to avoid too many notifications
        self.videoconferenceWaitingBuddies =
            self.videoconferenceWaitingBuddies.concat(participants, [initiator]);

        if (jsxc.mmstream.debug === true) {
          self._log("self.videoconferenceWaitingBuddies", self.videoconferenceWaitingBuddies);
        }

        // TODO: remove own JID from list
        // TODO: add message to dialog
        // TODO: reject all other video conference invitation while user is deciding

        // show dialog
        self.gui._showIncomingVideoconferenceDialog(Strophe.getNodeFromJid(initiator))

        // video conference is accepted
            .done(function() {

              self._log("Videoconference accepted");

              jsxc.stats.addEvent("jsxc.mmstream.videoconference.accepted");

              // iterate people was waiting
              var waiting = self.videoconferenceWaitingBuddies;
              var copy = JSON.parse(JSON.stringify(waiting));

              $.each(copy, function(index, element) {

                // work only with participants of this videoconference
                if (element === initiator || participants.indexOf(element) > -1) {

                  // accept each buddy who had already called
                  if (typeof self.videoconferenceWaitingSessions[element] !== "undefined") {

                    self.videoconferenceWaitingSessions[element].accept();

                    if (jsxc.mmstream.debug === true) {
                      self._log("Waiting session accepted",
                          [element, self.videoconferenceWaitingSessions[element]]);
                    }

                    delete self.videoconferenceWaitingSessions[element];
                  }

                  // or store buddy in auto accept list
                  else {

                    if (jsxc.mmstream.debug === true) {
                      self._log("Waiting for buddy");
                    }

                    self.videoconferenceAcceptedBuddies.push(element);
                  }

                  // and remove it from waiting list
                  waiting.splice(waiting.indexOf(element), 1);
                }

              });

              // TODO: to improve
              setTimeout(function() {

                // call every participant after our jid to the initator
                var toCall = participants.concat([initiator]);
                toCall.sort();
                toCall = toCall.concat(toCall);

                var ownIndex = toCall.indexOf(self.conn.jid);

                for (var i = ownIndex + 1; i < toCall.length; i++) {

                  // stop if we reach initiator
                  if (toCall[i] === initiator) {
                    break;
                  }

                  self._log("Start video call", toCall[i]);

                  // call
                  self.startVideoCall(toCall[i]);

                }

              }, self.WAIT_BEFORE_CALL);

            })

            // video conference is rejected
            .fail(function() {

              jsxc.stats.addEvent("jsxc.mmstream.videoconference.decline");

              self._log("Videoconference rejected");

              var invitationId = $(stanza).attr('id');
              var fulljidArray = participants.concat([initiator]);

              self._declineVideoConference(invitationId, fulljidArray);

              jsxc.gui.feedback("Vidéo conférence rejetée");

            });
      }

      /**
       * Video conference declined, close all streams
       */

      else if (video.attr("status") === self.XMPP_VIDEOCONFERENCE.STATUS.ABORT) {

        self._log("Videoconference aborted");

        // stop local streams
        self.stopLocalStream();

        // stop all distants streams
        $.each(self.remoteVideoSessions, function(index, element) {
          self._stopStream(element.stream);
        });

        // clear caches
        self.remoteVideoSessions = {};
        self.videoconferenceWaitingSessions = {};
        self.videoconferenceAcceptedBuddies = [];

        // close dialog if needed
        jsxc.gui.dialog.close('video_conference_incoming');

        // show toast
        jsxc.gui.feedback(
            "La videoconférence à été annulée par " + Strophe.getNodeFromJid(initiator));

      }

    }

    // keep handler
    return true;

  },

  /**
   * Send at each participant a message that indicate videoconference is aborted.
   *
   * @param invitationId
   * @param fulljidArray
   * @private
   */
  _declineVideoConference : function(invitationId, fulljidArray) {

    var self = jsxc.mmstream;

    var msg = $msg({
      from : self.conn.jid
    })
        .c("videoconference", {

          users : fulljidArray.join(","),

          status : self.XMPP_VIDEOCONFERENCE.STATUS.ABORT,

          id : invitationId,

          datetime : new Date().toISOString().slice(0, 19).replace('T', ' '),

          message : "Vidéoconférence annulée par " + Strophe.getNodeFromJid(self.conn.jid)

        });

    // send decline to everybody
    $.each(fulljidArray, function(index, element) {

      var adressedMessage = $(msg.toString()).attr("to", element);
      self.conn.send(adressedMessage);

    });

  },

  /**
   * Send an invitation for a video conference.
   *
   * For now do not use any particulary XEP
   *
   * <videoconference users="..."> contains an alphabetical sorted list of users in conference,
   * not including  initiator
   *
   * /!\ Throw error if ther is a non full jid
   *
   * @param fulljidArray
   * @param message
   * @returns {*}
   */
  _sendVideoconferenceInvitations : function(fulljidArray, message) {

    var self = jsxc.mmstream;

    if (jsxc.mmstream.debug === true) {
      self._log("_sendVideoconferenceInvitations", [fulljidArray, message]);
    }

    // sort array of fjid, to order video calls
    fulljidArray.sort();

    // check ressources
    $.each(fulljidArray, function(index, element) {
      var res = Strophe.getResourceFromJid(element);
      if (res === null || res === "" || res === "null") {
        throw new Error("Only full jid are permitted: " + element);
      }
    });

    var msgid = self.conn.getUniqueId();

    var msg = $msg({

      from : self.conn.jid,

      id : msgid
    })
        .c("videoconference", {

          users : fulljidArray.join(","),

          status : self.XMPP_VIDEOCONFERENCE.STATUS.INIT,

          datetime : new Date().toISOString().slice(0, 19).replace('T', ' '),

          message : message || ''

        });

    // send one invitation to each participants
    $.each(fulljidArray, function(index, element) {

      jsxc.stats.addEvent("jsxc.mmstream.videoconference.sendInvitation");

      self._log("Send invitation to: ", element);

      var adressedMessage = $(msg.toString()).attr("to", element);
      self.conn.send(adressedMessage);

    });

    return msgid;
  },

  /**
   * Start a videoconference with specified full jids
   * @param fulljidArray
   */
  startVideoconference : function(fulljidArray, message) {

    var self = jsxc.mmstream;

    jsxc.stats.addEvent("jsxc.mmstream.videoconference.start");

    if (jsxc.mmstream.debug === true) {
      self._log("startVideoconference", [fulljidArray, message]);
    }

    // TODO verify jid list to get full jid

    // keep jids
    self.videoconferenceAcceptedBuddies = self.videoconferenceAcceptedBuddies.concat(fulljidArray);

    // send an invitation to each participant
    try {
      self._sendVideoconferenceInvitations(fulljidArray, message);

      jsxc.gui.feedback("La vidéoconférence va bientôt commencer ...");

      // TODO: to improve, we have to wait a little to let invitations go
      setTimeout(function() {

        // call each participant
        $.each(fulljidArray, function(index, element) {
          self.startVideoCall(element);
        });

      }, self.WAIT_BEFORE_CALL);

    } catch (error) {

      self._log("Error while starting videoconference: ", error, "ERROR");

      jsxc.gui.feedback(
          "Erreur lors de l'envoi des invitations. Veuillez rafraichir la page et réessayer.");
    }

  },

  _sendScreensharingInvitation : function(fulljidArray, message) {

    var self = jsxc.mmstream;

    self._log("_sendScreensharingInvitation", [fulljidArray, message]);
  },

  /**
   * Cast screen to one or multiple users
   *
   * First invitations are sent, after screen is casting
   *
   */
  startScreenSharingMultiPart : function(fulljidArray, message) {

    var self = jsxc.mmstream;

    jsxc.stats.addEvent("jsxc.mmstream.screensharing.multipart.start");

    if (jsxc.mmstream.debug === true) {
      self._log("startScreenSharingMultiPart", [fulljidArray, message]);
    }

    // TODO verify jid list to get full jid

    // send an invitation to each participant
    try {
      self._sendScreensharingInvitation(fulljidArray, message);

      jsxc.gui.feedback("Le partage d'écran va bientôt commencer ...");

      // TODO: to improve, we have to wait a little to let invitations go
      setTimeout(function() {

        // call each participant
        $.each(fulljidArray, function(index, element) {
          self.shareScreen(element);
        });

      }, self.WAIT_BEFORE_CALL);

    } catch (error) {

      self._log("Error while starting screensharing multipart: ", error, "ERROR");

      jsxc.gui.feedback(
          "Erreur lors de l'envoi des invitations. Veuillez rafraichir la page et réessayer.");
    }
  },

  _isNavigatorFirefox : function() {
    return typeof InstallTrigger !== 'undefined';
  },

  _isNavigatorChrome : function() {
    return !!window.chrome && !!window.chrome.webstore;
  },

  /**
   * Return a promise indicating if sceen capture is available
   *
   * /!\ Promise will never fail for now, it can just be done.
   *
   *
   * @returns {*}
   * @private
   */
  _isChromeExtensionInstalled : function() {

    var self = jsxc.mmstream;
    var messages = self.chromeExtensionMessages;

    var defer = $.Deferred();

    self.screenSharingCapable = false;

    if (self._isNavigatorChrome() === true) {

      /**
       * Before begin capturing, we have to ask for source id and wait for response
       */
      window.addEventListener("message", function(event) {

        if (event && event.data && event.data === messages.available) {
          self.screenSharingCapable = true;
          defer.resolve();
        }

      });

      window.postMessage(messages.isAvailable, '*');

    }

    else {
      defer.reject("InvalidNavigator");
    }

    return defer.promise();

  },

  /**
   * Return a promise with the user screen stream, or fail
   * @private
   */
  _getUserScreenStream : function() {

    var self = jsxc.mmstream;

    var defer = $.Deferred();
    var messages = self.chromeExtensionMessages;

    window.addEventListener("message", function(event) {

      // filter invalid messages
      if (!event || !event.data) {
        self._log("Invalid event", event);
        return;
      }

      var data = event.data;

      // extension send video sourceid
      if (data.sourceId) {

        // getUserMedia
        var constraints = {

          audio : false,

          video : {
            mandatory : {
              chromeMediaSource : "desktop",
              maxWidth : screen.width > 1920 ? screen.width : 1920,
              maxHeight : screen.height > 1080 ? screen.height : 1080,
              chromeMediaSourceId : data.sourceId
            }
          }

        };

        navigator.webkitGetUserMedia(constraints,

            function(stream) {

              self._log("Screen capture accepted");

              jsxc.stats.addEvent("jsxc.mmstream.screensharing.streamAcquired");

              window.removeEventListener("message", this);

              defer.resolve(stream);

            },

            // error
            function(error) {

              self._log("Screen capture declined");

              jsxc.stats.addEvent("jsxc.mmstream.screensharing.streamRefused");

              window.removeEventListener("message", this);

              defer.fail(error);

            });

      }
    });

    // ask for source id
    window.postMessage(messages.getScreenSourceId, '*');

    return defer.promise();

  },

  /**
   * Share screen with one user
   *
   *
   * /!\ Here we don't check if navigator can share screen
   * /!\ Here we don't check if navigator can share screen
   * /!\ Here we don't check if navigator can share screen
   *
   * @param fullJid
   */
  shareScreen : function(fulljid) {

    var self = jsxc.mmstream;

    if (jsxc.mmstream.debug === true) {
      self._log("Start scren sharing", fulljid);
    }

    if (Strophe.getResourceFromJid(fulljid) === null) {
      throw new Error("JID must be full jid");
    }

    // ice configuration
    self.conn.jingle.setICEServers(self.iceServers);

    // requesting user media
    // TODO test chrome 'desktop' constraint ?
    // TODO test firefox 'window' constraint ?

    self._getUserScreenStream()

        .then(function(stream) {

          // openning jingle session
          var session = self.conn.jingle.initiate(fulljid, stream);

          session.on('change:connectionState', self._onSessionStateChanged);

        })

        .fail(function() {

          jsxc.gui.feedback(
              "Impossible d'accéder à votre écran, veuillez autoriser l'accès, installer l'extension si nécéssaire et réessayer.");

        });

  },

  /**
   *  Called when receive incoming media session
   *
   */
  _onIncomingJingleSession : function(session) {

    var self = jsxc.mmstream;

    if (jsxc.mmstream.debug === true) {
      self._log("_onIncomingJingleSession", session);
    }

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

    jsxc.gui.feedback("Transfert de fichier à l'arrivée");

    throw new Error("Not implemented yet");

  },

  /**
   * Called on incoming video call
   */
  _onIncomingCall : function(session) {

    var self = jsxc.mmstream;

    if (jsxc.mmstream.debug === true) {
      self._log("_onIncomingCall", session);
      self._log("self.videoconferenceAcceptedBuddies", self.videoconferenceAcceptedBuddies);
    }

    // send signal to partner
    session.ring();

    var bid = jsxc.jidToBid(session.peerID);

    // display notification
    var notify = function() {
      jsxc.notification.notify(jsxc.t('Incoming_call'), jsxc.t('from_sender', {
        sender : bid
      }));
    };

    // accept video call
    var acceptRemoteSession = function(localStream) {

      if (jsxc.mmstream.debug === true) {
        self._log("Call accepted", session);
      }

      session.addStream(localStream);
      session.accept();

    };

    // decline video call
    var declineRemoteSession = function(error) {

      if (jsxc.mmstream.debug === true) {
        self._log("Call declined", session);
      }

      session.decline();

      jsxc.gui.feedback("Erreur lors de l'accès à la caméra et au micro: " + error);

      self._log("Error while using audio/video", error);

    };

    // auto accept calls if specified
    if (self.auto_accept === true) {

      self._log("Auto accept call", session);

      notify();

      // require permission on devices if needed
      self._requireLocalStream()
          .done(function(localStream) {
            acceptRemoteSession(localStream);
          })
          .fail(function(error) {
            declineRemoteSession(error);
          });
    }

    /**
     * Call from videoconference was initiated by client or videoconf was accepted by client
     */

    else if (self.videoconferenceAcceptedBuddies.indexOf(session.peerID) > -1) {

      if (jsxc.mmstream.debug === true) {
        self._log("BUDDY ACCEPTED " + session.peerID);
        self._log("self.videoconferenceAcceptedBuddies", self.videoconferenceAcceptedBuddies);
      }

      // remove from video buddies
      var i1 = self.videoconferenceAcceptedBuddies.indexOf(session.peerID);
      self.videoconferenceAcceptedBuddies.splice(i1, 1);

      // require permission on devices if needed
      self._requireLocalStream()
          .done(function(localStream) {
            acceptRemoteSession(localStream);
          })
          .fail(function(error) {
            declineRemoteSession(error);
          });

    }

    /**
     * Call from videoconference will maybe accepted by client
     */

    else if (self.videoconferenceWaitingBuddies.indexOf(session.peerID) > -1) {

      if (jsxc.mmstream.debug === true) {
        self._log("BUDDY WAITING ", session);
      }

      self.videoconferenceWaitingSessions[session.peerID] = {

        session : session,

        accept : function() {
          // require permission on devices if needed
          self._requireLocalStream()
              .done(function(localStream) {
                acceptRemoteSession(localStream);
              })
              .fail(function(error) {
                declineRemoteSession(error);
              });
        }
      };

    }

    // show accept/decline confirmation dialog
    else {

      notify();

      self._log("INCOMING CALL ", session);

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

    // TODO: reduce resolution with firefox too
    // For now use of mandatory / optionnal is deprecated

    var constraints;
    if (self._isNavigatorFirefox()) {

      constraints = {

        audio : true,

        video : true

      };
    }

    // other navigators
    else {

      constraints = {

        audio : true,

        video : {
          "mandatory" : {

            "minWidth" : 320, "maxWidth" : 640,

            "minHeight" : 180, "maxHeight" : 480,

            "minFrameRate" : 10, "maxFrameRate" : 20

          }, "optional" : []
        }

      };
    }

    // require local stream
    self.conn.jingle.RTC.getUserMedia(constraints,

        function(localStream) {
          self.localStream = localStream;
          defer.resolve(localStream);
        },

        function(error) {
          self._log("Error while getting local stream", error);
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

    if (jsxc.mmstream.debug === true) {
      self._log("_onRemoteStreamAdded", [session, stream]);
    }

    // var isVideoDevice = stream.getVideoTracks().length > 0;
    // var isAudioDevice = stream.getAudioTracks().length > 0;

    // TODO: don't display if already present

    self.gui._showVideoStream(stream, session.peerID);

    // show sidebar if needed
    if (self.gui.isSidepanelShown() !== true) {
      self.gui.toggleVideoPanel();
    }

    self.remoteVideoSessions[session.peerID] = {
      session : session,

      stream : stream
    };

    // show local video if needed
    if (self.gui.isLocalVideoShown() !== true) {
      // self.gui.showLocalVideo();
      self.gui.showVideoRecordingWarning();
    }

  },

  /**
   * Called when a remote stream is removed
   * @param session
   * @param stream
   * @private
   */
  _onRemoteStreamRemoved : function(session, stream) {

    var self = jsxc.mmstream;

    if (jsxc.mmstream.debug === true) {
      self._log("_onRemoteStreamRemoved", [session, stream]);
    }

    self._stopStream(stream);

    // found session and remove it from session storage
    var sessionFound = false;

    if (typeof self.remoteVideoSessions[session.peerID] !== "undefined") {
      delete self.remoteVideoSessions[session.peerID];
      sessionFound = true;
    }

    // Hide stream AFTER removed session
    self.gui._hideVideoStream(session.peerID);

    if (sessionFound !== true) {
      self._log("No session found", null, "ERROR");
    }

    // stop localstream if no current stream
    if (Object.keys(self.getCurrentVideoSessions()).length < 1) {
      self.stopLocalStream();
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
   * Call another user with video and audio media
   * @param fullJid
   */
  startVideoCall : function(fulljid) {

    var self = jsxc.mmstream;

    if (jsxc.mmstream.debug === true) {
      self._log("startVideoCall ", fulljid);
    }

    if (Strophe.getResourceFromJid(fulljid) === null) {
      throw new Error("JID must be full jid");
    }

    // ice configuration
    self.conn.jingle.setICEServers(self.iceServers);

    // requesting user media
    var constraints = {
      audio : true, video : true
    };

    // Open Jingle session
    self.conn.jingle.RTC.getUserMedia(constraints, function(stream) {

          // openning jingle session
          var session = self.conn.jingle.initiate(fulljid, stream);

          session.on('change:connectionState', self._onSessionStateChanged);

          // set timer to hangup if no response
          self._addAutoHangup(session.sid, fulljid);

        },

        function() {

          self._log('Failed to get access to local media.', arguments, 'ERROR');

          jsxc.gui.feedback(
              "Impossible d'accéder à votre webcam, veuillez autoriser l'accès et réessayer.");

        });

  },

  /**
   * Array of jid which be called and have to be close
   * if no response after determined time
   */
  autoHangupCalls : {},

  /**
   * Remove an auto hangup timer
   * @param fulljid
   * @private
   */
  _removeAutoHangup : function(sessionid) {

    var self = jsxc.mmstream;

    clearTimeout(self.autoHangupCalls[sessionid]);

    // unregister timer
    delete self.autoHangupCalls[sessionid];

    self._log("Clear auto hangup", sessionid);
  },

  /**
   * Register an auto hangup timer
   * @param fulljid
   * @private
   */
  _addAutoHangup : function(sessionid, fulljid) {

    var self = jsxc.mmstream;

    // check if not already present
    if (Object.keys(self.autoHangupCalls).indexOf(sessionid) > -1) {
      self._log("Call already exist", sessionid, 'ERROR');
      return;
    }

    // create a timer to hangup
    var timeout = setTimeout(function() {

      // hangup and feedback
      self.hangupCall(fulljid);

      jsxc.gui.feedback("Pas de réponse de " + Strophe.getNodeFromJid(fulljid));

    }, self.HANGUP_IF_NO_RESPONSE);

    // register timer
    self.autoHangupCalls[sessionid] = timeout;

  },

  /**
   * Called on session changes
   *
   * @param session
   * @param state
   * @private
   */
  _onSessionStateChanged : function(session, state) {

    var self = jsxc.mmstream;

    self._log("[JINGLE] _onSessionStateChanged", [state, session]);

    // inform user of problem
    if (state === "interrupted") {
      jsxc.gui.feedback("Problème de connexion avec " + Strophe.getNodeFromJid(session.peerID));
    }

    // remove auto hangup timer
    else if (state === "connected") {
      self._removeAutoHangup(session.sid);
    }
  },

  /**
   * Stop a call
   */
  hangupCall : function(fulljid) {

    jsxc.stats.addEvent("jsxc.mmstream.videocall.hangupcall");

    var self = jsxc.mmstream;

    if (Strophe.getResourceFromJid(fulljid) === null) {
      throw new Error("JID must be full jid");
    }

    self.conn.jingle.terminate(fulljid, "gone");

    // close local stream if necessary

    if (Object.keys(self.getCurrentVideoSessions()).length < 1) {
      self.stopLocalStream();
    }

    //$(document).trigger("hangup.videocall.jsxc");

  },

  /**
   * Stop a stream
   */
  _stopStream : function(stream) {

    var self = jsxc.mmstream;

    self._log("Stop stream", stream);

    $.each(stream.getTracks(), function(index, element) {

      element.stop();

      if (typeof element.enabled !== "undefined") {
        element.enabled = false;
      }

    });
  },

  /**
   * Stop local stream and reset it
   */
  stopLocalStream : function() {

    var self = jsxc.mmstream;

    if (jsxc.mmstream.debug === true) {
      self._log("Stop local stream", [self.localStream, self.conn.jingle.localStream]);
    }

    if (self.localStream) {
      self._stopStream(self.localStream);
      self.localStream = null;
    }

    if (self.conn.jingle.localStream) {
      self._stopStream(self.conn.jingle.localStream);
      self.conn.jingle.localStream = null;
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
   * Update icon on presence or on caps.
   *
   * If no jid is given, all roster will be updated
   *
   * @memberOf jsxc.mmstream
   * @param ev
   * @param status
   * @private
   */
  _onXmppEvent : function(ev, jid) {

    var self = jsxc.mmstream;

    if (jid) {
      self.gui._updateIcon(jsxc.jidToBid(jid));
      self.gui._updateVideoLink(jsxc.jidToBid(jid));
    }

    else {
      self.gui._updateAllIcons();
      self.gui._updateAllVideoLinks();
    }

    // preserve handler
    return true;
  },

  /**
   * Attach listeners on connect
   * @private
   */
  _registerListenersOnAttached : function() {

    var self = jsxc.mmstream;

    if (self.conn.caps) {
      $(document).on('caps.strophe', self._onXmppEvent);
    }

    $(document).on('init.window.jsxc', self.gui._initChatWindow);

    // TODO: to improve
    $(document).on('presence.jsxc', self._onXmppEvent);
    $(document).on("add.roster.jsxc", self.gui._onXmppEvent);
    $(document).on("cloaded.roster.jsxc", self.gui._onXmppEvent);
    $(document).on("buddyListChanged.jsxc", self.gui._onXmppEvent);

  },

  /**
   * Called when
   */
  _onDisconnected : function() {

    var self = jsxc.mmstream;

    // remove listeners added when attached
    $(document).off('caps.strophe', self._onXmppEvent);

    self.conn.deleteHandler(self.messageHandler);

    // remove all videos
    $("#jsxc_videoPanel .jsxc_videoThumbContainer").remove();

    // stop local stream
    self.stopLocalStream();

  },

};

$(function() {
  if (jsxc.multimediaStreamSystem && jsxc.multimediaStreamSystem === "multistream") {

    var self = jsxc.mmstream;

    $(document).on('attached.jsxc', self.init);
    $(document).on('disconnected.jsxc', self._onDisconnected);
    $(document).on('removed.gui.jsxc', self.gui.removeGui);

  }
});