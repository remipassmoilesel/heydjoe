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
  DELAY_BEFORE_ATTACH : 700,

  /**
   * Hangup call if no response
   */
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
     * Status attribute, indicating the status of videoconference
     */
    STATUS_ATTR : "status",

    /**
     * List of all users of videoconference, NOT including initiator
     */
    USERS_ATTR : "users",

    /**
     * Date time of current message
     */
    DATETIME_ATTR : "datetime",

    /**
     * ID attribute of conference
     */
    ID_ATTR : "id",

    /**
     * User who initiate the videoconference
     */
    INITIATOR_ATTR : "initiator",

    /**
     * Optionnal readable message
     */
    MESSAGE_ATTR : "message",

    /**
     * Status argument describing the status of the videoconference
     */
    STATUS : {

      /**
       * The first invitation to send.
       *
       * After receiving an invitation, all participants have to confirm if they accept or decline
       * videoconference
       *
       */
      INIT : "initiate",

      /**
       * Confirmation sent by all participants, except initiator, to all participants
       */
      ACCEPTED : "accepted",

      /**
       * Decline message sent to all participants
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
     * True if current user confirm that conference is accepted
     */
    accepted : false,

    /**
     * All users have to interact with video conference
     *
     * Users are identified by their full JID and contains session, streams, state, ...
     *
     */
    users : {}
  },

  USER_TYPE : {

    /**
     * Special type representing the current user
     */
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
     * Special status representing the current user
     */
    SELF : 'SELF',

    /**
     * Video/audio stream not present, or have been removed
     */
    DISCONNECTED : 'DISCONNECTED',

    /**
     * The user will participate but is not ready
     */
    NOT_READY : "NOT_READY",

    /**
     * The user sent a confirmation and is waiting for calls
     */
    READY : "READY",

    /**
     * We will be connected soon to this user
     */
    CONNECTING : 'CONNECTING',

    /**
     * We are connected to this user
     */
    CONNECTED : 'CONNECTED',

    /**
     * Temporary problems with connexion
     */
    CONNEXION_DISTURBED : 'CONNEXION_DISTURBED',

    /**
     * User has declined videconference
     */
    HAS_DECLINED_VIDEOCONFERENCE : "HAS_DECLINED_VIDEOCONFERENCE",

    /**
     * User have been rejected
     */
    REJECTED : "REJECTED"
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
   * Send JQuery event to notify that user list, status or type has changed.
   * @param userArray
   * @private
   */
  _notifyVideoconferenceChanged : function(userArray) {
    $(document).trigger("videoconference-changed.jsxc", userArray ? {users : userArray} : null);
  },

  /**
   * Create a user entry in videoconference cache with default values
   * @private
   */
  _createUserEntry : function(fulljid) {

    var self = jsxc.mmstream;

    // check if jid is full
    if (!fulljid || !Strophe.getResourceFromJid(fulljid)) {
      throw new Error("Incorrect JID, must be full: " + fulljid);
    }

    self.videoconference.users[fulljid] = {

      node : Strophe.getNodeFromJid(fulljid),

      type : self.USER_TYPE.PARTICIPANT,

      status : self.USER_STATUS.DISCONNECTED,

      session : null,

      stream : null,

      jingleState : null

    };

  },

  /**
   * Set user status and fire an event
   *
   * @param fulljid
   * @param status
   * @private
   */
  _setUserStatus : function(fulljid, status, overwrite) {

    var self = jsxc.mmstream;

    // overwrite value by default
    overwrite = typeof overwrite !== 'undefined' ? overwrite : true;

    if (Object.keys(self.USER_STATUS).indexOf(status) === -1) {
      throw new Error("Invalid status: " + status);
    }

    // create user if not exist
    if (!self.videoconference.users[fulljid]) {
      self._log("Status change: user was created", fulljid, 'INFO');
      self._createUserEntry(fulljid);

      self.videoconference.users[fulljid].status = status;
    }

    else {
      if (overwrite === true) {
        // update status
        self.videoconference.users[fulljid].status = status;
      }
    }

  },

  /**
   * Set user type and fire an event
   *
   * @param fulljid
   * @param status
   * @private
   */
  _setUserType : function(fulljid, type, overwrite) {

    var self = jsxc.mmstream;

    if (Object.keys(self.USER_TYPE).indexOf(type) === -1) {
      throw new Error("Invalid type: " + type);
    }

    // overwrite value by default
    overwrite = typeof overwrite !== 'undefined' ? overwrite : true;

    // create user if not exist
    if (!self.videoconference.users[fulljid]) {
      self._log("Type change: user was created", fulljid, 'INFO');
      self._createUserEntry(fulljid);

      // update status
      self.videoconference.users[fulljid].type = type;

    }

    else {
      if (overwrite === true) {
        // update status
        self.videoconference.users[fulljid].type = type;
      }
    }

  },

  /**
   * Add a list of user with a predefined status
   *
   * @param fulljidArray
   * @param status
   * @private
   */
  _updateAllVideoconferenceUsers : function(fulljidArray, status, type, overwrite) {

    var self = jsxc.mmstream;

    var triggeredDatas = [];
    $.each(fulljidArray, function(index, element) {

      if (status) {
        self._setUserStatus(element, status, overwrite);
      }

      if (type) {
        self._setUserType(element, type, overwrite);
      }

      triggeredDatas.push({"fulljid" : element, "status" : status});

    });

    // trigger only once
    self._notifyVideoconferenceChanged(triggeredDatas);

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
    if (!fulljid || !Strophe.getResourceFromJid(fulljid)) {
      throw new Error("Incorrect JID, must be full: " + fulljid);
    }

    return self.videoconference.users[fulljid] && self.videoconference.users[fulljid].status ?
        self.videoconference.users[fulljid].status : null;

  },

  /**
   * Return true if the buddy is ready to be called
   *
   * @param fulljid
   * @returns {*|boolean}
   * @private
   */
  _isBuddyReady : function(fulljid) {

    var self = jsxc.mmstream;

    // check if jid is full
    if (!fulljid || !Strophe.getResourceFromJid(fulljid)) {
      throw new Error("Incorrect JID, must be full: " + fulljid);
    }

    return self.videoconference.users[fulljid] && self.videoconference.users[fulljid].status &&
        self.videoconference.users[fulljid].status === self.USER_STATUS.READY;

  },

  /**
   * Return true if buddy participate to videoconference and if his status is different from
   * DISCONNECTED
   * @param fulljid
   * @returns {*|boolean}
   * @private
   */
  _isBuddyParticipating : function(fulljid) {

    var self = jsxc.mmstream;

    // check if jid is full
    if (!fulljid || !Strophe.getResourceFromJid(fulljid)) {
      throw new Error("Incorrect JID, must be full: " + fulljid);
    }

    return self.videoconference.users[fulljid] && self.videoconference.users[fulljid].status &&
        self.videoconference.users[fulljid].status !== self.USER_STATUS.DISCONNECTED;

  },

  /**
   * Clear videoconference datas
   *
   * @private
   */
  _clearVideoconferenceCache : function() {

    var self = jsxc.mmstream;

    if (jsxc.mmstream.debug === true) {
      self._log(" /!\\ Videoconference cleared");
    }

    self.videoconference.lastLaunch = -1;
    self.videoconference.users = {};
    self.videoconference.accepted = false;

    $(document).trigger("videoconference-changed.jsxc");

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

    // ignore eventual messages from current user
    if ($(stanza).attr("from") === self.conn.jid) {
      self._log("Ignoring message from current user: ", stanza, "ERROR");

      // keep handler
      return true;
    }

    // check if stanza is a videoconference invitation
    var video = $(stanza).find(self.XMPP_VIDEOCONFERENCE.ELEMENT_NAME);

    if (video.length > 0) {

      if (jsxc.mmstream.debug) {
        self._log("_onMessageReceived", stanza);
      }

      var status = video.attr("status");

      // received an invitation
      if (status === self.XMPP_VIDEOCONFERENCE.STATUS.INIT) {
        jsxc.stats.addEvent("jsxc.mmstream.videoconference.invitationReceived");
        self._onVideoconferenceInvitationReceived(stanza, video);
      }

      // some user accept videoconference
      else if (status === self.XMPP_VIDEOCONFERENCE.STATUS.ACCEPTED) {
        self._onVideoconferenceAccepted(stanza, video);
      }

      // some user declined videoconference
      else if (status === self.XMPP_VIDEOCONFERENCE.STATUS.ABORT) {
        self._onVideoconferenceDeclined(stanza, video);
      }

      // invalid message
      else {
        self._log("Invalid videoconference message: ", stanza, "ERROR");
      }

    }

    // keep handler
    return true;

  },

  /**
   *  Triggered if we received a videoconference invitation
   *
   * @param stanza
   * @returns {boolean}
   * @private
   */
  _onVideoconferenceInvitationReceived : function(stanza, video) {

    var self = jsxc.mmstream;

    // reset acceptance flag
    self.videoconference.accepted = false;

    var invitationId = $(stanza).attr('id');
    var initiator = video.attr("initiator");
    var participants = self._unserializeJidList(video.attr("users") || "");
    var datetime = video.attr("datetime");

    // check how many participants
    if (participants.length < 1) {
      self._log('Too few participants', {stanza : stanza, participants : participants}, 'ERROR');

      jsxc.gui.feedback("Invitation à une vidéo conférence reçue mais invalide.");

      // stop but keep handler
      return true;
    }

    if (jsxc.mmstream.debug === true) {
      self._log("_onVideoconferenceInvitationReceived",
          {fulljid : initiator, videoconference : self.videoconference});
    }

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
              .done(function() {
                self._log("Local stream sharing accepted");
                self._acceptVideoconference(initiator, participants, invitationId, datetime);
              })

              // user cannot access to camera
              .fail(function(error) {
                jsxc.gui.feedback("Accès à la caméra refusé" + (error ? ": " + error : ""));
                self._declineVideconference(initiator, participants, invitationId, error);
              });

        })

        // video conference is rejected
        .fail(function(error) {
          jsxc.gui.feedback("Vidéo conférence rejetée" + (error ? ": " + error : ""));
          self._declineVideconference(initiator, participants, invitationId, error);
        });

  },

  /**
   * Accept a videoconference. Used in onVideoconferenceInvitationReceived
   *
   * @param initiator
   * @param participants
   * @param invitationId
   * @param datetime
   * @private
   */
  _acceptVideoconference : function(initiator, participants, invitationId, datetime) {

    var self = jsxc.mmstream;

    jsxc.stats.addEvent("jsxc.mmstream.videoconference.accepted");

    //  terminate all currents conversations, and remove non-videoconference entries
    self._hangUpAll();
    self._purgeVideoconferenceCache(participants.concat([initiator]), "others");

    // store buddies was already ready
    var alreadyReady = [];
    $.each(self.videoconference.users, function(fulljid) {
      if (self._isBuddyReady(fulljid) === true) {
        alreadyReady.push(fulljid);
      }
    });

    // reset buddy list
    self._updateAllVideoconferenceUsers(participants, self.USER_STATUS.NOT_READY,
        self.USER_TYPE.PARTICIPANT);

    // restore ready states
    $.each(alreadyReady, function(index, fulljid) {
      self._setUserStatus(fulljid, self.USER_STATUS.READY);
    });

    // initiator is ready to be called
    self._setUserType(initiator, self.USER_TYPE.INITIATOR);
    self._setUserStatus(initiator, self.USER_STATUS.READY);

    // special status for current user
    self._setUserType(self.conn.jid, self.USER_TYPE.SELF);
    self._setUserStatus(self.conn.jid, self.USER_STATUS.SELF);

    self.videoconference.lastLaunch = datetime;

    // acceptance flag
    self.videoconference.accepted = true;

    // notify changes
    self._notifyVideoconferenceChanged();

    self._sendAcceptVideoconferenceMessage(initiator, invitationId, participants);

    // call users which are ready
    self._videoconferenceCallUsersReady(initiator, participants);

  },

  /**
   * Decline a videoconference. Used in onVideoconferenceInvitationReceived
   *
   * @param initiator
   * @param participants
   * @param invitationId
   * @param error
   * @private
   */
  _declineVideconference : function(initiator, participants, invitationId, error) {

    var self = jsxc.mmstream;

    jsxc.stats.addEvent("jsxc.mmstream.videoconference.decline");

    self._log("declineVideconference", error);

    self._sendDeclineVideoconferenceMessage(initiator, invitationId, participants);

  },

  /**
   * Check which users are ready to receive call and call them if necessary
   *
   * ownJid is optionnal
   * @private
   */
  _videoconferenceCallUsersReady : function(initiator, participants, ownJid) {

    var self = jsxc.mmstream;

    // retrieve users we must call
    var usersToCall = self._whichUsersMustWeCall(initiator, participants, ownJid);

    // list users called
    var called = [];

    // accept people was waiting
    // iterate people was waiting
    $.each(self.videoconference.users, function(fulljid) {

      if (usersToCall.indexOf(fulljid) !== -1 && self._isBuddyReady(fulljid) === true) {

        // call but dont hangup other calls
        self.startVideoCall(fulljid);

        // status is changed by startVideoCall
        // self._setUserStatus(fulljid, self.USER_STATUS.CONNECTING);

        called.push(fulljid);
      }

    });

    if (jsxc.mmstream.debug === true) {
      self._log("_videoconferenceCallUsersReady", called);
    }
  },

  /**
   * Triggered if one user has accepted videoconference
   *
   * @param stanza
   * @private
   */
  _onVideoconferenceAccepted : function(stanza, video) {

    var self = jsxc.mmstream;

    var initiator = video.attr("initiator");
    var participants = self._unserializeJidList(video.attr("users") || "");
    var user = $(stanza).attr("from");

    if (jsxc.mmstream.debug === true) {
      self._log("_onVideoconferenceAccepted", {
        initiator : initiator, from : user, participants : participants
      });
    }

    // change user status
    self._setUserStatus(user, self.USER_STATUS.READY);

    // notify changes
    self._notifyVideoconferenceChanged();

    // call users which are ready, be only if conference is accepted
    if (self.videoconference.accepted === true) {
      self._videoconferenceCallUsersReady(initiator, participants);
    }
  },

  /**
   * Triggered if videoconference have been aborted by one user.
   *
   * So all users have to stop videoconference
   *
   * @param stanza
   * @private
   */
  _onVideoconferenceDeclined : function(stanza, video) {

    var self = jsxc.mmstream;

    var from = $(stanza).attr("from");
    var initiator = video.attr("initiator");

    if (jsxc.mmstream.debug === true) {
      self._log("_onVideoconferenceDeclined", {
        initiator : initiator, from : from,
      });
    }

    // change status of user who hung up
    self._setUserStatus(initiator, self.USER_STATUS.HAS_DECLINED_VIDEOCONFERENCE);

    // notify changes
    self._notifyVideoconferenceChanged();

    // terminate all conversations, even if waiting
    self._hangUpAll();

    // dont clear caches here, to show who declined videoconference
    // self._clearVideoconferenceCache();

    // close dialog if needed
    jsxc.gui.dialog.close('video_conference_incoming');

    // show toast
    jsxc.gui.feedback("La videoconférence à été annulée par " + Strophe.getNodeFromJid(from));

  },

  /**
   * Send at each participant a message that indicate videoconference is accepted.
   *
   * participants must contain all jids of all participants WITH current user but WITHOUT initiator
   *
   * @param conferenceId
   * @param fulljidArray
   * @private
   */
  _sendAcceptVideoconferenceMessage : function(initiator, conferenceId, participants) {

    var self = jsxc.mmstream;

    if (participants.indexOf(initiator) !== -1) {
      throw new Error("Participants list must not contain initiator: " + initiator + " / " +
          participants.join(','));
    }

    // videoconference item
    var video = {};
    video[self.XMPP_VIDEOCONFERENCE.USERS_ATTR] = participants.join(",");
    video[self.XMPP_VIDEOCONFERENCE.STATUS_ATTR] = self.XMPP_VIDEOCONFERENCE.STATUS.ACCEPTED;
    video[self.XMPP_VIDEOCONFERENCE.ID_ATTR] = conferenceId;
    video[self.XMPP_VIDEOCONFERENCE.INITIATOR_ATTR] = initiator;
    video[self.XMPP_VIDEOCONFERENCE.DATETIME_ATTR] =
        new Date().toISOString().slice(0, 19).replace('T', ' ');
    video[self.XMPP_VIDEOCONFERENCE.MESSAGE_ATTR] =
        "Vidéoconférence acceptée par " + Strophe.getNodeFromJid(self.conn.jid);

    // XMPP message stanza
    var msg = $msg({
      from : self.conn.jid
    }).c(self.XMPP_VIDEOCONFERENCE.ELEMENT_NAME, video);

    var sent = [];

    // send to everybody
    $.each(participants.concat([initiator]), function(index, fulljid) {

      if (fulljid !== self.conn.jid) {
        var adressedMessage = $(msg.toString()).attr("to", fulljid);
        self.conn.send(adressedMessage);

        sent.push(fulljid);
      }

    });

    if (jsxc.mmstream.debug === true) {
      self._log("_sendAcceptVideoconferenceMessage", {to : sent});
    }

  },

  /**
   * Send at each participant a message that indicate videoconference is aborted.
   *
   * participants must contain all jids of all participants WITH current user but WITHOUT initiator
   *
   * @param invitationId
   * @param fulljidArray
   * @private
   */
  _sendDeclineVideoconferenceMessage : function(initiator, conferenceId, participants) {

    var self = jsxc.mmstream;

    if (participants.indexOf(initiator) !== -1) {
      throw new Error("Participants list must not contain initiator: " + initiator + " / " +
          participants.join(','));
    }

    // videoconference item
    var video = {};
    video[self.XMPP_VIDEOCONFERENCE.USERS_ATTR] = participants.join(",");
    video[self.XMPP_VIDEOCONFERENCE.STATUS_ATTR] = self.XMPP_VIDEOCONFERENCE.STATUS.ABORT;
    video[self.XMPP_VIDEOCONFERENCE.ID_ATTR] = conferenceId;
    video[self.XMPP_VIDEOCONFERENCE.INITIATOR_ATTR] = initiator;
    video[self.XMPP_VIDEOCONFERENCE.DATETIME_ATTR] =
        new Date().toISOString().slice(0, 19).replace('T', ' ');
    video[self.XMPP_VIDEOCONFERENCE.MESSAGE_ATTR] =
        "Vidéoconférence rejetée par " + Strophe.getNodeFromJid(self.conn.jid);

    // XMPP message stanza
    var msg = $msg({
      from : self.conn.jid
    }).c(self.XMPP_VIDEOCONFERENCE.ELEMENT_NAME, video);

    var sent = [];

    // send to everybody
    $.each(participants.concat([initiator]), function(index, fulljid) {

      if (fulljid !== self.conn.jid) {
        var adressedMessage = $(msg.toString()).attr("to", fulljid);
        self.conn.send(adressedMessage);

        sent.push(fulljid);
      }

    });

    if (jsxc.mmstream.debug === true) {
      self._log("_sendDeclineVideoconferenceMessage", {to : sent});
    }

  },

  /**
   * Send an invitation for a video conference.
   *
   * @param fulljidArray
   * @param message
   * @returns {*}
   */
  _sendVideoconferenceInvitations : function(participants, messageTxt) {

    var self = jsxc.mmstream;

    // check ressources to avoid wrong videoconference starting
    $.each(participants, function(index, element) {
      var res = Strophe.getResourceFromJid(element);
      if (res === null || res === "" || res === "null") {
        throw new Error("Only full jid are permitted: " + element);
      }
    });

    if (participants.indexOf(self.conn.jid) !== -1) {
      throw new Error("Participants list must not contain initiator: " + self.conn.jid + " / " +
          participants.join(','));
    }

    var conferenceId = self.conn.getUniqueId();

    var datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // videoconference item
    var video = {};
    video[self.XMPP_VIDEOCONFERENCE.USERS_ATTR] = participants.join(",");
    video[self.XMPP_VIDEOCONFERENCE.STATUS_ATTR] = self.XMPP_VIDEOCONFERENCE.STATUS.INIT;
    video[self.XMPP_VIDEOCONFERENCE.ID_ATTR] = conferenceId;
    video[self.XMPP_VIDEOCONFERENCE.INITIATOR_ATTR] = self.conn.jid;
    video[self.XMPP_VIDEOCONFERENCE.DATETIME_ATTR] = datetime;
    video[self.XMPP_VIDEOCONFERENCE.MESSAGE_ATTR] =
        messageTxt || "Vidéoconférence organisée par " + Strophe.getNodeFromJid(self.conn.jid);

    // XMPP message stanza
    var msg = $msg({
      from : self.conn.jid
    }).c(self.XMPP_VIDEOCONFERENCE.ELEMENT_NAME, video);

    var sent = [];

    // send one invitation to each participants
    $.each(participants, function(index, fulljid) {

      jsxc.stats.addEvent("jsxc.mmstream.videoconference.sendInvitation");

      var adressedMessage = $(msg.toString()).attr("to", fulljid);
      self.conn.send(adressedMessage);

      sent.push(fulljid);

    });

    if (jsxc.mmstream.debug === true) {
      self._log("_sendVideoconferenceInvitations", {to : sent});
    }

    return {

      conferenceId : conferenceId,

      datetime : datetime

    };
  },

  /**
   * Start a videoconference with specified full jids
   * @param fulljidArray
   */
  startVideoconference : function(fulljidArray, message) {

    var self = jsxc.mmstream;

    self.checkNavigatorCompatibility("videoconference");

    jsxc.stats.addEvent("jsxc.mmstream.videoconference.start");

    if (jsxc.mmstream.debug === true) {
      self._log("startVideoconference", [fulljidArray, message]);
    }

    self.videoconference.accepted = false;

    // require local stream to prevent errors
    self._requireLocalStream()
        .then(function() {

          // clear previous video conference informations
          self._clearVideoconferenceCache();

          self.videoconference.accepted = true;

          // auto accept all participants streams
          self._updateAllVideoconferenceUsers(fulljidArray, self.USER_STATUS.NOT_READY);

          // special status for current user
          self._setUserStatus(self.conn.jid, self.USER_STATUS.SELF);
          self._setUserType(self.conn.jid, self.USER_TYPE.SELF);

          // notify changes
          self._notifyVideoconferenceChanged();

          try {

            // send an invitation to each participant
            var ret = self._sendVideoconferenceInvitations(fulljidArray, message);
            self.videoconference.lastLaunch = ret.datetime;

            jsxc.gui.feedback("La vidéoconférence va bientôt commencer ...");

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
   * @param initator : the videoconference initiator
   * @param participants : all participants WITHOUT initiator but WITH own JID
   * @private
   */
  _whichUsersMustWeCall : function(initiator, participants, ownJid) {

    // debug utility:
    // jsxc.mmstream._whichUsersMustWeCall('yohann@im.silverpeas.net/2sip93169u',
    //     ['david@im.silverpeas.net/3stb6wxfaw', 'remi@im.silverpeas.net/aeevsvdon6'],
    // jsxc.xmpp.conn.jid);

    var self = jsxc.mmstream;

    ownJid = ownJid || self.conn.jid;

    if (participants.indexOf(initiator) !== -1) {
      throw new Error("Participants list must not contain initiator: " + initiator + " / " +
          participants.join(','));
    }

    //final result
    var res = [];

    // call every participant after our jid to the initator
    var fulllist = participants.concat([initiator]);
    fulllist.sort();
    fulllist = fulllist.concat(fulllist);

    var ownIndex = fulllist.indexOf(ownJid);

    if (ownIndex < 0) {
      throw new Error("Invalid jid: " + ownJid);
    }

    for (var i = ownIndex + 1; i < fulllist.length; i++) {

      // stop if we reach initiator
      if (fulllist[i] === initiator) {
        break;
      }

      res.push(fulllist[i]);

    }

    return res;

  },

  /**
   * Cast screen to one or multiple users
   *
   * First invitations are sent, after screen is casting
   *
   */
  startScreenSharingMultiPart : function(fulljidArray, message) {

    var self = jsxc.mmstream;

    self.checkNavigatorCompatibility("videoconference");

    jsxc.stats.addEvent("jsxc.mmstream.screensharing.multipart.start");

    if (jsxc.mmstream.debug === true) {
      self._log("startScreenSharingMultiPart", [fulljidArray, message]);
    }

    // TODO verify jid list to get full jid

    try {

      jsxc.gui.feedback("Le partage d'écran va bientôt commencer ...");

      // call each participant
      $.each(fulljidArray, function(index, element) {
        self._shareScreen(element);
      });

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

  _isNavigatorInternetExplorer : function() {

    var ua = window.navigator.userAgent;

    return ua.indexOf('MSIE ') > 0 || ua.indexOf('Trident/') > 0 || ua.indexOf('Edge/' > 0);

  },

  /**
   * Feedback user and throw  an exception if navigator is not compatible with  specified task
   * @param task
   */
  checkNavigatorCompatibility : function(task) {

    var self = jsxc.mmstream;

    var message = "";

    if (task === "videoconference") {
      if (self._isNavigatorInternetExplorer() === true) {
        message =
            "La vidéo conférence n'est pas disponible avec Internet Explorer. Utilisez Firefox, Brave, Opera ou Chrome.";
      }
    }

    else if (task === "screensharing") {
      if (self._isNavigatorChrome() !== true) {
        message = "Le partage d'écran n'est pas disponible avec votre navigateur. Utilisez Chrome.";
      }
    } else {
      throw new Error("Unknown task: " + task);
    }

    if (message !== "") {
      jsxc.gui.feedback(message);
      throw new Error(message);
    }

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
  _shareScreen : function(fulljid) {

    var self = jsxc.mmstream;

    self.checkNavigatorCompatibility("videoconference");

    if (jsxc.mmstream.debug === true) {
      self._log("Start screen sharing", fulljid);
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

          session.on('change:connectionState', self._onVideoSessionStateChanged);

        })

        .fail(function() {

          jsxc.gui.feedback(
              "Impossible d'accéder à votre écran, veuillez autoriser l'accès, installer l'extension si nécéssaire et réessayer.");

        });

  },

  /**
   *  Called when receive incoming Jingle media session
   *
   */
  _onIncomingJingleSession : function(session) {

    var self = jsxc.mmstream;

    if (jsxc.mmstream.debug === true) {
      self._log("_onIncomingJingleSession", {session : session});
    }

    // session.on('change:sessionState', self._onConnectionStateChanged);
    session.on('change:connectionState', self._onVideoSessionStateChanged);

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
        "Transfert de fichier à l'arrivée. Cette fonctionnalité n'est pas encore disponible.");

    throw new Error("Not implemented yet");

  },

  /**
   * Called on incoming video call
   */
  _onIncomingCall : function(session) {

    var self = jsxc.mmstream;

    if (jsxc.mmstream.debug === true) {
      self._log("_onIncomingCall", {videoconference : self.videoconference});
    }

    // send signal to partner
    session.ring();

    var bid = jsxc.jidToBid(session.peerID);

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

      self._setUserStatus(session.peerID, self.USER_STATUS.REJECTED);

      // notify changes
      self._notifyVideoconferenceChanged();
    };

    /**
     * Auto accept calls if specified - only for debug purposes
     */
    if (self.auto_accept_debug === true) {

      if (jsxc.mmstream.debug === true) {
        self._log("Auto accept call - debug mode");
      }

      jsxc.notification.notify("Appel vidéo", "L'appel a été accepté automatiquement: " + bid);

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
     * Buddy participate to videoconference, accept his stream
     */

    else if (self._isBuddyParticipating(session.peerID) === true) {

      self._log("Participant accepted", {
        session : session, videoconference : self.videoconference
      });

      if (jsxc.mmstream.debug === true) {
        self._log("Buddy accepted ", {
          fulljid : session.peerID, videoconference : self.videoconference
        });
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

    // show accept/decline confirmation dialog
    else {

      // desktop notification
      jsxc.notification.notify(jsxc.t('Incoming_call'), jsxc.t('from_sender', {
        sender : bid
      }));

      self._log("Incoming call ", session);

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

    var fulljid = session.peerID;

    // display video stream
    self.gui._showVideoStream(stream, fulljid);

    // show sidebar if needed
    if (self.gui.isSidepanelShown() !== true) {
      self.gui.toggleVideoPanel();
    }

    // save session and stream
    if (!self.videoconference.users[fulljid]) {
      self._createUserEntry(fulljid);
    }
    self.videoconference.users[fulljid].session = session;
    self.videoconference.users[fulljid].stream = stream;

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

    var fulljid = session.peerID;

    // stop the stream
    self._stopStream(stream);

    if (self.videoconference.users[fulljid]) {
      delete self.videoconference.users[fulljid].session;
      delete self.videoconference.users[fulljid].stream;
    }

    else {
      self._log("No session found", null, "ERROR");
    }

    // Hide stream AFTER removed session
    self.gui._hideVideoStream(fulljid);

    // Do not set status here, it will be set in _onVideoSessionStateChanged
    //self._setUserStatus(fulljid, self.USER_STATUS.DISCONNECTED);

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
   *
   * If isStandaloneCall set to true (default), all current conversations will be hung up and
   * videoconference cache will be cleared
   *
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

    self.checkNavigatorCompatibility("videoconference");

    // change user status
    self._setUserStatus(fulljid, self.USER_STATUS.CONNECTING);

    // notify changes
    self._notifyVideoconferenceChanged();

    // ice configuration
    self.conn.jingle.setICEServers(self.iceServers);

    self._requireLocalStream()
        .done(function(localStream) {

          // openning jingle session
          var session = self.conn.jingle.initiate(fulljid, localStream);

          session.on('change:connectionState', self._onVideoSessionStateChanged);

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
   *
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
  _onVideoSessionStateChanged : function(session, state) {

    var self = jsxc.mmstream;

    self._log("[JINGLE] _onVideoSessionStateChanged", {state : state, session : session});

    var fulljid = session.peerID;

    // save jingle state for debug purposes
    if (!self.videoconference.users[fulljid]) {
      self._createUserEntry(fulljid);
    }
    self.videoconference.users[fulljid].jingleState = state;

    // mmstream status
    var status;

    if (state === "interrupted") {

      // inform user of problem
      jsxc.gui.feedback("Problème de connexion avec " + Strophe.getNodeFromJid(fulljid));

      status = self.USER_STATUS.CONNEXION_DISTURBED;
    }

    else if (state === "connected") {

      // remove auto hangup timer
      self._removeAutoHangup(session.sid);

      status = self.USER_STATUS.CONNECTED;

    }

    else if (state === "disconnected") {

      status = self.USER_STATUS.DISCONNECTED;

      // check if no connection is running
      if (self.getCurrentVideoSessions().length < 1) {

        // close local stream if necessary
        self.stopLocalStream();

      }

    }

    // change status if necessary
    if (status) {

      self._setUserStatus(fulljid, status);

      // notify changes
      self._notifyVideoconferenceChanged([{fulljid : fulljid, status : status}]);

    }

  },

  /**
   * Triggered on connection changed.
   *
   * For now used only for debug purposes, use sessionStateChanged instead.
   *
   * @param session
   * @param state
   * @private
   */
  _onConnectionStateChanged : function(session, state) {

    var self = jsxc.mmstream;

    self._log("[JINGLE] _onConnectionStateChanged",
        {state : state, session : session, arguments : arguments});

  },

  /**
   * Hang up all calls and close local stream
   * @private
   */
  _hangUpAll : function() {

    var self = this;

    if (self.debug === true) {
      self._log("Hangup all calls");
    }

    $.each(self.videoconference.users, function(fulljid) {
      self.hangupCall(fulljid);
    });

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

  },

  /**
   * Stop each track of a media stream
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
      //self._log("Stop local stream", [self.localStream, self.conn.jingle.localStream]);
      self._log("Stop local stream", [self.localStream, self.conn.jingle.localStream], 'ERROR');
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

    // reset videoconference cache and indicator
    self._clearVideoconferenceCache();

  }

};

$(function() {
  if (jsxc.multimediaStreamSystem && jsxc.multimediaStreamSystem === "multistream") {

    var self = jsxc.mmstream;

    $(document).on('attached.jsxc', self.init);
    $(document).on('disconnected.jsxc', self._onDisconnected);
    $(document).on('removed.gui.jsxc', self.gui.removeGui);

  }
});