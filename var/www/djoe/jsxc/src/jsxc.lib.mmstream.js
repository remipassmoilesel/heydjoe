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
  remoteVideoSessions : {},

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

  _purgeArray : function(arrayTarget, arrayNeedle) {

    for (var i = 0; i < arrayNeedle.length; i++) {

      var n = arrayNeedle[i];

      var index = -1;

      do {
        index = arrayTarget.indexOf(n);
        if (index > -1) {
          arrayTarget.splice(index, 1);
        }
      } while (index > -1);

    }

    return arrayTarget;
  },

  /**
   * Check if received stanza is a videoconference invitation
   * @param stanza
   * @private
   */
  _onReceived : function(stanza) {

    console.log("");
    console.log("_onReceived");
    console.log(stanza);

    var self = jsxc.mmstream;

    // check if stanza is a videoconference invitation
    var video = $(stanza).find("videoconference");
    if (video.length > 0) {

      var initiator = $(stanza).attr("from");
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
        console.log("");
        console.log("self.videoconferenceWaitingBuddies");
        console.log(self.videoconferenceWaitingBuddies);
      }

      // TODO: remove own JID from list
      // TODO: add message to dialog
      // TODO: reject all other video conference invitation while user is deciding

      // show dialog
      self.gui._showIncomingVideoconferenceDialog(Strophe.getNodeFromJid(initiator))

      // video conference is accepted
          .done(function() {

            console.error("Video conference accepted");

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
                    console.log("");
                    console.log("Session accepted");
                    console.log(element);
                    console.log(self.videoconferenceWaitingSessions[element]);
                  }

                  delete self.videoconferenceWaitingSessions[element];
                }

                // or store buddy in auto accept list
                else {

                  if (jsxc.mmstream.debug === true) {
                    console.error("");
                    console.error("Waiting for buddy");
                    console.error(element);
                  }

                  self.videoconferenceAcceptedBuddies.push(element);
                }

                // and remove it from waiting list
                waiting.splice(waiting.indexOf(element), 1);
              }

            });

            if (jsxc.mmstream.debug === true) {
              console.log("");
              console.log("Before call others");
              console.log("Waiting list");
              console.log(waiting);
            }

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

              // call
              self.startCall(toCall[i]);

            }
          })

          // video conference is rejected
          .fail(function() {
            jsxc.feedback("Vidéo conférence rejetée");

            // TODO: empty buddy waiting list
            // TODO: empty session waiting list

          });

    }

    // keep handler
    return true;

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
  _sendVideoconferenceInvitation : function(fulljidArray, message) {

    if (jsxc.mmstream.debug === true) {
      console.log("");
      console.log("_sendVideoconferenceInvitation");
      console.log(fulljidArray, message);
    }

    var self = jsxc.mmstream;

    // sort array of fjid, to order video calls
    fulljidArray.sort();

    // check ressources
    $.each(fulljidArray, function(index, element) {
      var res = Strophe.getResourceFromJid(element);
      if (res === null || res === "" || res === "null") {
        throw "Only full jid are permitted: " + element;
      }
    });

    var msgid = self.conn.getUniqueId();

    var msg = $msg({

      from : self.conn.jid,

      id : msgid
    })
        .c("videoconference", {

          users : fulljidArray.join(","),

          datetime : new Date().toString(),

          message : message || ''

        });

    // send one invitation to each participants
    $.each(fulljidArray, function(index, element) {

      console.log("sent to " + element);

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

    if (jsxc.mmstream.debug === true) {
      console.log("");
      console.log("startVideoconference");
      console.log(fulljidArray, message);
    }

    // TODO verify jid list to get full jid

    // keep jids
    self.videoconferenceAcceptedBuddies = self.videoconferenceAcceptedBuddies.concat(fulljidArray);

    // send an invitation to each participant
    try {
      self._sendVideoconferenceInvitation(fulljidArray, message);

      jsxc.gui.feedback("La vidéoconférence va bientôt commencer ...");

      // TODO: improve
      setTimeout(function() {

        // call each participant
        $.each(fulljidArray, function(index, element) {
          self.startCall(element);
        });

      }, 1500);

    } catch (error) {

      console.log(error);

      jsxc.gui.feedback(
          "Erreur lors de l'envoi des invitations. Veuillez rafraichir la page et réessayer.");
    }

  },

  /**
   *  Called when receive incoming media session
   *
   */
  _onIncomingJingleSession : function(session) {

    if (jsxc.mmstream.debug === true) {
      console.error("");
      console.error("_onIncomingJingleSession");
      console.error(session);
    }

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

    if (jsxc.mmstream.debug === true) {
      console.error("");
      console.error("_onIncomingCall " + session.peerID);
      console.error(session);
      console.error("self.videoconferenceAcceptedBuddies");
      console.error(self.videoconferenceAcceptedBuddies);
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
        console.log();
        console.log("Session accepted: " + session.peerID);
        console.log(session);
      }

      session.addStream(localStream);
      session.accept();

    };

    // decline video call
    var declineRemoteSession = function(error) {

      if (jsxc.mmstream.debug === true) {
        console.log();
        console.log("Session declined: " + session.peerID);
        console.log(session);
      }

      session.decline();

      jsxc.gui.feedback("Erreur lors de l'accès à la caméra et au micro: " + error);
      jsxc.error("Error while using audio/video", error);

    };

    // auto accept calls if specified
    if (self.auto_accept === true) {

      console.error("AUTO ACCEPT " + session.peerID);

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
        console.error("BUDDY ACCEPTED " + session.peerID);
        console.error("self.videoconferenceAcceptedBuddies");
        console.error(self.videoconferenceAcceptedBuddies);
      }
      // remove from video buddies
      var i1 = self.videoconferenceAcceptedBuddies.indexOf(session.peerID);
      self.videoconferenceAcceptedBuddies.splice(i1, 1);

      if (jsxc.mmstream.debug === true) {
        console.error("After slice");
        console.error(self.videoconferenceAcceptedBuddies);
      }
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
        console.error("BUDDY WAITING " + session.peerID);
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

      if (jsxc.mmstream.debug === true) {
        console.error("self.videoconferenceWaitingSessions");
        console.error(self.videoconferenceWaitingSessions);
      }

    }

    // show accept/decline confirmation dialog
    else {

      notify();

      console.error("INCOMING CALL " + session.peerID);

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

    if (jsxc.mmstream.debug === true) {
      console.error("_onRemoteStreamAdded");
      console.error(session, stream);
    }

    var self = jsxc.mmstream;

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
      self.gui.showLocalVideo();
    }

  },

  /**
   * Called when a remote stream is removed
   * @param session
   * @param stream
   * @private
   */
  _onRemoteStreamRemoved : function(session, stream) {

    if (jsxc.mmstream.debug === true) {
      console.error("_onRemoteStreamRemoved");
      console.error(session, stream);
    }

    var self = jsxc.mmstream;

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

    if (jsxc.mmstream.debug === true) {
      console.error("startCall " + fulljid);
    }

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

          // here we must verify if tracks are enought
          // var audioTracks = stream.getAudioTracks();
          // var videoTracks = stream.getVideoTracks();

          // console.log("Audio / video tracks: ")
          // console.log(audioTracks);
          // console.log(videoTracks);

          // openning jingle session
          var session = self.conn.jingle.initiate(fulljid, stream);

          session.on('change:connectionState', self._onSessionStateChanged);

        },

        function(error) {

          console.error('Failed to get access to local media. Error ', error);

          jsxc.feedback(
              "Impossible d'accéder à votre webcam, veuillez autoriser l'accès et réessayer.");

        });

  },

  /**
   * Called on session changes
   * @param session
   * @param state
   * @private
   */
  _onSessionStateChanged : function(session, state) {

    console.log("[JINGLE] _onSessionStateChanged change:connectionState");
    console.log(session, state);

    if (state === "interrupted") {
      jsxc.feedback("Problème de connexion avec " + Strophe.getNodeFromJid(session.peerID));
    }
  },

  /**
   * Stop a call
   */
  hangupCall : function(fulljid) {

    var self = jsxc.mmstream;

    if (Strophe.getResourceFromJid(fulljid) === null) {
      throw "JID must be full jid";
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

    console.log(stream);

    $.each(stream.getTracks(), function(index, element) {

      console.log(element);

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
      console.error("Stop local stream");
      console.error(self.localStream);
      console.error(self.conn.jingle.localStream);
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

    self.conn.deleteHandler(self.messageHandler);

    /**
     * Remove all videos
     */
    $("#jsxc_videoPanel .jsxc_videoThumbContainer").remove();

    // stop local stream
    self.stopLocalStream();

  },

};

/**
 * Gui part of the manager
 *
 */
jsxc.mmstream.gui = {

  /**
   * JQuery object that represent the side panel on left
   */
  videoPanel : null,

  /**
   * Create gui and add it to the main window
   *
   * @private
   */
  _initGui : function() {

    var self = jsxc.mmstream.gui;

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

    self.videoPanel.find(".jsxc_videoPanelContent").perfectScrollbar("update");

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
    if (Object.keys(mmstream.getCurrentVideoSessions()).length < 1) {
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
            title : "Local video stream",
            prepend : true,
            hangupButton : false,
            supClasses : "jsxc_local_video_container"
          });
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

    var dialog = jsxc.gui.dialog.open(jsxc.gui.template.get('incomingCall', bid), {
      noClose : true
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
      noClose : true
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