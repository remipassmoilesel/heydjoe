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

  /**
   * Set to true to activate log. Log here are not filtered by log level beacause log can be very
   * verbose here.
   */
  debug : true,

  /**
   * Auto accept only for debug purpose
   */
  auto_accept_debug : false,

  /**
   * Delay before attach video, to let navigator create all elements needed.
   *
   * Workaround for Firefox
   */
  DELAY_BEFORE_ATTACH : 600,

  /**
   * Waiting time before call after sending invitations. If we call before invitation arrive,
   * videoconference will fail.
   *
   * Receiver need to get all jids participant before first calls
   *
   * TODO Improve that with confirmations from receivers
   */
  WAIT_BEFORE_CALL : 1000,

  /**
   * Hangup call if no response
   */
  // HANGUP_IF_NO_RESPONSE : 20000,
  HANGUP_IF_NO_RESPONSE : 20000,

  /**
   * XMPP videoconference messages elements
   *
   * Not implementing a XEP, just extending the message stanza
   *
   */
  XMPP_VIDEOCONFERENCE : {

    ELEMENT_NAME : "videoconference",

    /**
     * Status argument describing the status of the videoconference
     */
    STATUS : {

      /**
       * The first invitation to send.
       *
       * After that, all participants have to make calls to complete the videoconference
       * or have to send abort message to abort the videoconference
       *
       */
      INIT : "initiate",

      /**
       *
       * Eventual second message, if one client want to abort conversation it have
       * to send it to all participants, and they have to stop conference.
       *
       */
      ABORT : "abort"

    }
  },

  /**
   * List of timers and jids to auto hangup calls if no response
   *
   * Even if we use confirmation next, this will be mandatory to avoid
   * call to invalid full jid (maybe old jid per exemple)
   *
   */
  autoHangupCalls : {},

  /**
   * List of videoconference users
   *
   * Every current active call must be registered here
   *
   */
  videoconference : {

    /**
     * Last date of launch
     */
    lastLaunch : -1,

    /**
     * All users have to interact with video conference
     *
     * Users are identified by their full JID and contains session, streams, state, ...
     *
     */
    users : {}
  },

  USER_TYPE : {

    SELF : 'SELF',

    /**
     * The user launched the videconference
     */
    INITIATOR : 'INITIATOR',

    /**
     * The user was invited to the videoconference
     */
    PARTICIPANT : 'PARTICIPANT'

  },

  /**
   * Status representation of users in a videconference
   *
   */
  USER_STATUS : {

    /**
     * Status representing own entry.
     */
    SELF : 'SELF',

    /**
     * Video/audio stream not present, or have been removed
     */
    DISCONNECTED : 'DISCONNECTED',

    /**
     * We are now calling the user
     */
    RINGING : 'RINGING',

    /**
     * The user is waiting for our conference acceptance
     */
    WAITING : 'WAITING',

    /**
     * User of an accepted videconference, session and streams must be auto accepted
     */
    AUTOACCEPT_STREAM : 'AUTOACCEPT_STREAM',

    /**
     * Session is accepted with user, we wait for stream
     */
    CONNECTING : 'CONNECTING',

    /**
     * We are connected with the user, and we receive video stream
     */
    CONNECTED : 'CONNECTED',

    /**
     * User declined the videoconference
     */
    DECLINED_VIDEOCONFERENCE : 'DECLINED_VIDEOCONFERENCE',

    /**
     * User declined call
     */
    DECLINED_CALL : 'DECLINED_CALL',

    /**
     * Temporary problems with connexion
     */
    CONNEXION_DISTURBED : 'CONNEXION_DISTURBED'

  },

  /**
   * Special log function here, to prefix logs
   *
   * @param message
   * @param data
   * @param level
   * @private
   */
  _log : function(message, data, level) {
    jsxc.debug("[MMSTREAM] " + message, data, level);
  },

  /**
   * Create a user entry in videoconference cache with default values
   * @private
   */
  _createUserEntry : function(fulljid) {

    var self = jsxc.mmstream;

    // check if jid is full
    if (!fulljid || !Strophe.getResourceFromJid(fulljid)) {
      throw new Error("Incorrect JID, must be full: " + fulljid);
    }

    self.videoconference.users[fulljid] = {

      node : Strophe.getNodeFromJid(fulljid),

      type : self.USER_TYPE.PARTICIPANT,

      status : self.USER_STATUS.DISCONNECTED

    };

  },

  /**
   * Set user status and fire event
   *
   * @param fulljid
   * @param status
   * @private
   */
  _setUserStatus : function(fulljid, status, doNotNotify) {

    var self = jsxc.mmstream;

    // create user if not exist
    if (!self.videoconference.users[fulljid]) {
      self._log("Status change: user was created", fulljid, 'INFO');
      self._createUserEntry(fulljid);
    }

    // update status
    self.videoconference.users[fulljid].status = status;

    // trigger event
    if (doNotNotify !== true) {
      $(document).trigger("status.videoconference-changed.jsxc",
          {users : [{"fulljid" : fulljid, "status" : status}]});
    }

  },

  /**
   * Set user type and fire event
   *
   * @param fulljid
   * @param status
   * @private
   */
  _setUserType : function(fulljid, type, doNotNotify) {

    var self = jsxc.mmstream;

    // create user if not exist
    if (!self.videoconference.users[fulljid]) {
      self._log("Type change: user was created", fulljid, 'INFO');
      self._createUserEntry(fulljid);
    }

    // update status
    self.videoconference.users[fulljid].type = type;

    // trigger event
    if (doNotNotify !== true) {
      $(document).trigger("type.videoconference-changed.jsxc",
          {users : [{"fulljid" : fulljid, "type" : type}]});
    }

  },

  /**
   * Add a list of user with a predefined status
   *
   * @param fulljidArray
   * @param status
   * @private
   */
  _addAllUsers : function(fulljidArray, status) {

    var self = jsxc.mmstream;

    var triggeredDatas = [];
    $.each(fulljidArray, function(index, element) {

      self._setUserStatus(element, status, true);

      triggeredDatas.push({"fulljid" : element, "status" : status});

    });

    // trigger only once
    $(document).trigger("status.videoconference-changed.jsxc", {users : triggeredDatas});

  },

  /**
   * Return the user status or null if user not exist
   * @param fulljid
   * @returns {*}
   * @private
   */
  getUserStatus : function(fulljid) {

    var self = jsxc.mmstream;

    // check if jid is full
    if (!fulljid || !Strophe.getResourceFromJid(fulljid)) {
      throw new Error("Incorrect JID, must be full: " + fulljid);
    }

    return self.videoconference.users[fulljid] && self.videoconference.users[fulljid].status ?
        self.videoconference.users[fulljid].status : null;

  },

  /**
   * Return true if the buddy must be auto accepted
   *
   * @param fulljid
   * @returns {*|boolean}
   * @private
   */
  _isBuddyAutoAccept : function(fulljid) {

    var self = jsxc.mmstream;

    // check if jid is full
    if (!fulljid || !Strophe.getResourceFromJid(fulljid)) {
      throw new Error("Incorrect JID, must be full: " + fulljid);
    }

    return self.videoconference.users[fulljid] && self.videoconference.users[fulljid].status &&
        self.videoconference.users[fulljid].status === self.USER_STATUS.AUTOACCEPT_STREAM;

  },

  /**
   * Return true if the buddy is waiting for our response
   *
   * @param fulljid
   * @returns {*|boolean}
   * @private
   */
  _isBuddyWaiting : function(fulljid) {

    var self = jsxc.mmstream;

    // check if jid is full
    if (!fulljid || !Strophe.getResourceFromJid(fulljid)) {
      throw new Error("Incorrect JID, must be full: " + fulljid);
    }

    return self.videoconference.users[fulljid] && self.videoconference.users[fulljid].status &&
        self.videoconference.users[fulljid].status === self.USER_STATUS.WAITING;

  },

  /**
   * Clear videoconference datas
   *
   * @private
   */
  _clearVideoconferenceCache : function() {

    var self = jsxc.mmstream;

    self.videoconference.lastLaunch = -1;
    self.videoconference.users = {};

  },

  /**
   * Purge videconference cache:
   *
   * <p>mode: undefined or purge: remove all array jids from cache
   * <p>others: remove all others jids
   *
   * @param arrayMustNotBeThere
   * @param arrayMustBeThere
   * @private
   */
  _purgeVideoconferenceCache : function(fulljidArray, mode) {

    var self = jsxc.mmstream;

    mode = mode || 'purge';

    if (mode !== "others" && mode !== 'purge') {
      throw new Error("Unknown mode in _purgeVideoconferenceCache: " + mode);
    }

    self.videoconference.lastLaunch = -1;

    $.each(self.videoconference.users, function(fulljid) {

      // we found jid and we have to remove all array ids from cache
      if (fulljidArray.indexOf(fulljid) > -1 && mode === "purge") {
        delete self.videoconference.users[fulljid];
      }

      // we dont found jid and we have to remove all jids not in array from cache
      else if (fulljidArray.indexOf(fulljid) < 0 && mode === "others") {
        delete self.videoconference.users[fulljid];
      }

    });
  },

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

    // check if jingle strophe plugin exist
    if (!self.conn.jingle) {
      self._log('No jingle plugin found!', null, 'ERROR');
      return;
    }

    self.messageHandler = self.conn.addHandler(jsxc.mmstream._onMessageReceived, null, 'message');

    self._registerListenersOnAttached();

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

    // launch unit testing only in debug mode
    jsxc.tests.runTests(jsxc.mmstream.testCases);
  },

  /**
   * Return an array of jid from a string list "a@b/res,c@d/res,e@f/res"
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
  _onMessageReceived : function(stanza) {

    var self = jsxc.mmstream;

    // check if stanza is a videoconference invitation
    var video = $(stanza).find(self.XMPP_VIDEOCONFERENCE.ELEMENT_NAME);

    var initiator = $(stanza).attr("from");

    if (video.length > 0) {

      if (jsxc.mmstream.debug) {
        self._log("_onMessageReceived", stanza);
      }

      /**
       * We received a video conference invitation
       */
      if (video.attr("status") === self.XMPP_VIDEOCONFERENCE.STATUS.INIT) {

        jsxc.stats.addEvent("jsxc.mmstream.videoconference.invitationReceived");

        var participants = self._unserializeJidList(video.attr("users") || "");

        // TODO Display message of invitation ?
        // TODO check if datetime is now - 5 min ?
        // var message = video.attr("message");
        var datetime = video.attr("datetime");

        // check how many participants
        if (participants.length < 1) {
          self._log('Too few participants', {stanza : stanza, participants : participants},
              'ERROR');

          jsxc.gui.feedback("Invitation à une vidéo conférence reçue mais invalide.");

          // stop but keep handler
          return true;
        }

        // add buddies to waiting list to avoid too many notifications
        var allUsers = [].concat(participants, [initiator]);
        self._addAllUsers(participants, self.USER_STATUS.WAITING);

        self._setUserStatus(initiator, self.USER_STATUS.WAITING);
        self._setUserType(initiator, self.USER_TYPE.INITIATOR);

        self._setUserStatus(self.conn.jid, self.USER_STATUS.SELF);
        self._setUserType(self.conn.jid, self.USER_TYPE.SELF);

        if (jsxc.mmstream.debug === true) {
          self._log("self.videoconference", self.videoconference);
        }

        /**
         * Video conference was accepted by user
         * -------------------------------------
         */
        var acceptVideoConference = function() {

          jsxc.stats.addEvent("jsxc.mmstream.videoconference.accepted");

          //  terminate all currents conversations
          self._hangUpAll();
          self._purgeVideoconferenceCache(allUsers, 'others');

          self.videoconference.lastLaunch = datetime;

          // accept people was waiting
          // iterate people was waiting
          $.each(self.videoconference.users, function(fulljid, element) {

            // work only with participants of this videoconference
            if (allUsers.indexOf(fulljid) > -1) {

              // accept each buddy who had already called
              if (self._isBuddyWaiting(fulljid) && element.acceptSession) {

                if (jsxc.mmstream.debug === true) {
                  self._log("Waiting buddy accepted", {
                    fulljid : fulljid, element : element
                  });
                }

                // accept session
                element.acceptSession();

              }

              // change status of each buddy who have not already called
              else if (fulljid !== self.conn.jid) {

                if (jsxc.mmstream.debug === true) {
                  self._log("Waiting for buddy", {
                    fulljid : fulljid, element : element
                  });
                }

                self._setUserStatus(fulljid, self.USER_STATUS.AUTOACCEPT_STREAM);

              }

            }

          });

          /**
           * Call other people we have to call to begin videoconference
           * // TODO: to improve, with use of confirmations
           */
          setTimeout(function() {

            var toCall = self._whichUsersMustWeCall(initiator, participants);

            if (jsxc.mmstream.debug === true) {
              self._log("We have to call those clients", toCall);
            }

            self._log("Start videoconference calls");

            $.each(toCall, function(index, item) {

              // call
              self.startVideoCall(item);

            });

          }, self.WAIT_BEFORE_CALL);

        };

        /**
         * Video conference was declined by user
         * -------------------------------------
         * @param error
         */
        var declineVideconference = function(error) {

          jsxc.stats.addEvent("jsxc.mmstream.videoconference.decline");

          self._log("declineVideconference", error);

          var invitationId = $(stanza).attr('id');
          var allUsers = participants.concat([initiator]);

          self._sendDeclineVideoConferenceMessage(invitationId, allUsers);

        };

        /**
         * Show videoconference dialog confirmation
         * ----------------------------------------
         */
        self.gui._showIncomingVideoconferenceDialog(Strophe.getNodeFromJid(initiator))

        // video conference is accepted
            .done(function() {

              self._log("Videoconference accepted");

              // require local stream to continue
              self._requireLocalStream()
                  .done(function(localStream) {
                    self._log("Local stream sharing accepted");
                    acceptVideoConference(localStream);
                  })

                  // user cannot access to camera
                  .fail(function(error) {
                    jsxc.gui.feedback("Accès à la caméra refusé" + (error ? ": " + error : ""));
                    declineVideconference(error);
                  });

            })

            // video conference is rejected
            .fail(function(error) {
              jsxc.gui.feedback("Vidéo conférence rejetée" + (error ? ": " + error : ""));
              declineVideconference(error);
            });
      }

      /**
       * Video conference was declined by someone, close all streams
       */

      else if (video.attr("status") === self.XMPP_VIDEOCONFERENCE.STATUS.ABORT) {

        self._log("Videoconference aborted");

        // change status of user who hung up
        self._setUserStatus(initiator, self.USER_STATUS.DECLINED_VIDEOCONFERENCE);

        // terminate all conversations
        self._hangUpAll();

        // clear caches
        self._clearVideoconferenceCache();

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
  _sendDeclineVideoConferenceMessage : function(invitationId, fulljidArray) {

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
      self._log("_sendVideoconferenceInvitations", {users : fulljidArray, message : message});
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
    var datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');

    var msg = $msg({

      from : self.conn.jid,

      id : msgid
    })
        .c("videoconference", {

          users : fulljidArray.join(","),

          status : self.XMPP_VIDEOCONFERENCE.STATUS.INIT,

          datetime : datetime,

          message : message || ''

        });

    // send one invitation to each participants
    $.each(fulljidArray, function(index, element) {

      jsxc.stats.addEvent("jsxc.mmstream.videoconference.sendInvitation");

      self._log("Send invitation to: ", element);

      var adressedMessage = $(msg.toString()).attr("to", element);
      self.conn.send(adressedMessage);

    });

    return {

      msgid : msgid,

      datetime : datetime

    };
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

    // require local stream to prevent erros
    self._requireLocalStream()
        .then(function() {

          // TODO verify jid list to get full jid

          self._clearVideoconferenceCache();
          self._addAllUsers(fulljidArray, self.USER_STATUS.AUTOACCEPT_STREAM);
          self._setUserStatus(self.conn.jid, self.USER_STATUS.SELF);

          try {

            // send an invitation to each participant
            var ret = self._sendVideoconferenceInvitations(fulljidArray, message);
            self.videoconference.lastLaunch = ret.datetime;

            jsxc.gui.feedback("La vidéoconférence va bientôt commencer ...");

            // Call all people we have to call, after they received invitation
            // TODO: to improve
            setTimeout(function() {

              var toCall = self._whichUsersMustWeCall(self.conn.jid, fulljidArray);

              if (jsxc.mmstream.debug === true) {
                self._log("We have to call those clients", toCall);
              }

              $.each(toCall, function(index, item) {

                self._log("Start video call", item);

                // call
                self.startVideoCall(item);

              });

            }, self.WAIT_BEFORE_CALL);

          } catch (error) {

            self._log("Error while starting videoconference: ", error, "ERROR");

            jsxc.gui.feedback(
                "Erreur lors de l'envoi des invitations. Veuillez rafraichir la page et réessayer.");

          }
        })

        // user cannot access to camera
        .fail(function(error) {
          jsxc.gui.feedback("Accès à la caméra refusé" + (error ? ": " + error : ""));
        });

  },

  /**
   * Return the list of user this client must call to complete the videconference
   *
   * @param initator
   * @param participants
   * @private
   */
  _whichUsersMustWeCall : function(initiator, participants, ownJid) {

    var self = jsxc.mmstream;

    ownJid = ownJid || self.conn.jid;

    //final result
    var res = [];

    // call every participant after our jid to the initator
    var fulllist = participants.concat([initiator]);
    fulllist.sort();
    fulllist = fulllist.concat(fulllist);

    var ownIndex = fulllist.indexOf(ownJid);

    for (var i = ownIndex + 1; i < fulllist.length; i++) {

      // stop if we reach initiator
      if (fulllist[i] === initiator) {
        break;
      }

      res.push(fulllist[i]);

    }

    return res;

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

    session.on('change:sessionState', self._onConnectionStateChanged);
    session.on('change:connectionState', self._onSessionStateChanged);

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

    jsxc.gui.feedback(
        "Transfert de fichier à l'arrivée. Cette fonction n'est pas encore disponible.");

    throw new Error("Not implemented yet");

  },

  /**
   * Called on incoming video call
   */
  _onIncomingCall : function(session) {

    var self = jsxc.mmstream;

    if (jsxc.mmstream.debug === true) {
      self._log("_onIncomingCall", session);
      self._log("self.videoconference", self.videoconference);
    }

    // send signal to partner
    session.ring();

    var bid = jsxc.jidToBid(session.peerID);

    // display desktop notification
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

      self._setUserStatus(session.peerID, self.USER_STATUS.DECLINED_CALL);

    };

    /**
     * auto accept calls if specified - only for debug purposes
     */
    if (self.auto_accept_debug === true) {

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
     * Call from videoconference was initiated by client
     * or videoconf was accepted by client
     *
     * So all participants of videoconference calling must be accepted
     */

    else if (self._isBuddyAutoAccept(session.peerID) === true) {

      notify();

      if (jsxc.mmstream.debug === true) {
        self._log("BUDDY ACCEPTED " + session.peerID);
        self._log("self.videoconference", self.videoconference);
      }

      self._setUserStatus(session.peerID, self.USER_STATUS.CONNECTING);

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

    else if (self._isBuddyWaiting(session.peerID) === true) {

      if (jsxc.mmstream.debug === true) {
        self._log("BUDDY WAITING ", session);
      }

      self.videoconference.users[session.peerID].session = session;

      self.videoconference.users[session.peerID].acceptSession = function() {

        // require permission on devices if needed
        self._requireLocalStream()
            .done(function(localStream) {

              acceptRemoteSession(localStream);

              notify();
            })
            .fail(function(error) {
              declineRemoteSession(error);
            });
      };

    }

    // show accept/decline confirmation dialog
    else {

      notify();

      self._log("INCOMING CALL ", session);

      console.error(self.videoconference);
      console.error(self.videoconference.users[session.peerID].status);
      console.error(self.videoconference.users[session.peerID]);
      console.error(self.videoconference.users[session.peerID]);

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
    if (self.localStream !== null && self.localStream.active) {
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
          self._log("Error while getting local stream", error, 'ERROR');
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

    // TODO check if video and audio is present
    // var isVideoDevice = stream.getVideoTracks().length > 0;
    // var isAudioDevice = stream.getAudioTracks().length > 0;

    // display video stream
    self.gui._showVideoStream(stream, session.peerID);

    // show sidebar if needed
    if (self.gui.isSidepanelShown() !== true) {
      self.gui.toggleVideoPanel();
    }

    // save session and stream
    self.videoconference.users[session.peerID].session = session;
    self.videoconference.users[session.peerID].stream = stream;

    // show local video if needed
    if (self.gui.isLocalVideoShown() !== true) {
      self.gui.showLocalVideo();
    }

  },

  /**
   * Return the active session of user or null
   * @param fulljid
   * @private
   */
  getActiveSession : function(fulljid) {
    var self = jsxc.mmstream;
    return self.videoconference.users[fulljid] && self.videoconference.users[fulljid].session ?
        self.videoconference.users[fulljid].session : null;
  },

  /**
   * Return the active stream of user or null
   * @param fulljid
   * @private
   */
  getActiveStream : function(fulljid) {
    var self = jsxc.mmstream;
    return self.videoconference.users[fulljid] && self.videoconference.users[fulljid].stream ?
        self.videoconference.users[fulljid].stream : null;
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

    // stop the stream
    self._stopStream(stream);

    if (self.videoconference.users[session.peerID]) {
      delete self.videoconference.users[session.peerID].session;
      delete self.videoconference.users[session.peerID].stream;
    }

    else {
      self._log("No session found", null, "ERROR");
    }

    // Hide stream AFTER removed session
    self.gui._hideVideoStream(session.peerID);

    // stop localstream if no other current stream active
    if (self.getCurrentVideoSessions().length < 1) {
      self.stopLocalStream();
    }

    // Do not set status here, it will be set in _onSessionStateChanged
    //self._setUserStatus(session.peerID, self.USER_STATUS.DISCONNECTED);

  },

  /**
   * Return an array of current active sessions
   * @returns {Array}
   */
  getCurrentVideoSessions : function() {

    var self = jsxc.mmstream;

    var res = [];

    $.each(self.videoconference.users, function(index, item) {
      if (item.session) {
        res.push(item.session);
      }
    });

    return res;
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

    // notify user is ringing
    self._setUserStatus(fulljid, self.USER_STATUS.RINGING);

    // ice configuration
    self.conn.jingle.setICEServers(self.iceServers);

    self._requireLocalStream()
        .done(function(localStream) {

          // openning jingle session
          var session = self.conn.jingle.initiate(fulljid, localStream);

          session.on('change:connectionState', self._onSessionStateChanged);

          // set timer to hangup if no response
          self._addAutoHangup(session.sid, fulljid);

        })
        .fail(function(error) {

          self._log('Failed to get access to local media.', error, 'ERROR');

          jsxc.gui.feedback(
              "Impossible d'accéder à votre webcam, veuillez autoriser l'accès et réessayer." +
              (error ? "Message: " + error : ""));

        });

  },

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

    self._log("[JINGLE] _onSessionStateChanged", {state : state, session : session});

    // inform user of problem
    if (state === "interrupted") {
      jsxc.gui.feedback("Problème de connexion avec " + Strophe.getNodeFromJid(session.peerID));

      self._setUserStatus(session.peerID, self.USER_STATUS.CONNEXION_DISTURBED);
    }

    else if (state === "connected") {

      // remove auto hangup timer
      self._removeAutoHangup(session.sid);

      self._setUserStatus(session.peerID, self.USER_STATUS.CONNECTED);

    } else if (state === "disconnected") {

      self._setUserStatus(session.peerID, self.USER_STATUS.DISCONNECTED);

    }
  },

  _onConnectionStateChanged : function(session, state) {

    var self = jsxc.mmstream;

    self._log("[JINGLE] _onConnectionStateChanged",
        {state : state, session : session, arguments : arguments});

  },

  /**
   * Hang up all calls and close local stream
   * @private
   */
  _hangUpAll : function(forceHangupEvenIfWaiting) {

    var self = this;

    forceHangupEvenIfWaiting = forceHangupEvenIfWaiting || false;

    if (self.debug === true) {
      self._log("Hangup all calls. Force hangup: " + forceHangupEvenIfWaiting);
    }

    $.each(self.videoconference.users, function(fulljid) {

      if (forceHangupEvenIfWaiting === true || self._isBuddyWaiting(fulljid) !== true) {
        self.hangupCall(fulljid);
      }

    });

    self.stopLocalStream();

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

    if (self.debug === true) {
      self._log("Hang up call: " + fulljid);
    }

    self.conn.jingle.terminate(fulljid, "gone");

    // close local stream if necessary

    if (self.getCurrentVideoSessions().length < 1) {
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