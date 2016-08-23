/**
 * New Multimedia Stream Manager
 *
 */

jsxc.mmstream = {

  /**
   * Set to true to activate log. Log here are not filtered by log level beacause log can be very
   * verbose here.
   */
  debug : true,

  /**
   * Maximum number of participants to a videoconference
   */
  VIDEOCONFERENCE_MAX_PARTICIPANTS : 6,

  /**
   * Auto accept only for debug purpose
   */
  auto_accept_debug : false,

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

    ELEMENT_NAME : 'videoconference',

    /**
     * Status attribute, indicating the status of videoconference
     */
    STATUS_ATTR : 'status',

    /**
     * List of all users of videoconference, NOT including initiator
     */
    USERS_ATTR : 'users',

    /**
     * Date time of current message
     */
    DATETIME_ATTR : 'datetime',

    /**
     * ID attribute of conference
     */
    ID_ATTR : 'id',

    /**
     * User who initiate the videoconference
     */
    INITIATOR_ATTR : 'initiator',

    /**
     * Optionnal readable message
     */
    MESSAGE_ATTR : 'message',

    /**
     * Reinvite field, optionnal
     */
    REINVITE_ATTR : 'reinvite',

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
      INIT : 'initiate',

      /**
       * Confirmation sent by all participants, except initiator, to all participants
       */
      ACCEPTED : 'accepted',

      /**
       * Decline message sent to all participants
       */
      ABORT : 'abort',

      /**
       * Can be send to reinvite a lost user
       */
      REINVITATION : 'reinvitation'

    }
  },

  SCREENSHARING_INVITATION_EXPIRATION : 20000,

  XMPP_SCREENSHARING : {

    ELEMENT_NAME : 'screensharing',

    STATUS_ATTR : 'status',

    DATETIME_ATTR : 'datetime',

    STATUS : {

      INIT : 'init',

      REINVITE : 'reinvite',

      DECLINED : 'declined',

      ACCEPT : 'accept'

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
   * List of multimedia users
   *
   * Every current active call must be registered here
   *
   */
  multimediacache : {

    /**
     * Last date of launch
     */
    lastLaunch : -1,

    /**
     * If set to true, all multimedia streams will be refused to avoid disturbs
     */
    occupied : false,

    /**
     * True if current user confirm that conference is accepted
     */
    accepted : false,

    screenStream : null,

    localStream : null,

    /**
     * All users have to interact with video conference
     *
     * Users are identified by their full JID and contains session, streams, state, ...
     *
     */
    users : {},

    /**
     * Utility, current jids of videoconference users
     */
    userList : []
  },

  USER_TYPE : {

    /**
     * Special type representing the current user
     */
    SELF : 'SELF',

    /**
     * The user launched the videconference
     */
    VIDEOCONF_INITIATOR : 'VIDEOCONF_INITIATOR',

    /**
     * The user was invited to the videoconference
     */
    VIDEOCONF_PARTICIPANT : 'VIDEOCONF_PARTICIPANT',

    /**
     * Simple video call, exclusive
     */
    SIMPLE_VIDEO_CALL : 'SIMPLE_VIDEO_CALL',

    /**
     * User is sharing his screen
     */
    SCREENSHARING_INITITATOR : 'SCREENSHARING_INITITATOR',

    /**
     * User is receiving screen stream
     */
    SCREENSHARING_RECIPIENT : 'SCREENSHARING_RECIPIENT'

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
     * User has rejected video call
     */
    HAS_REJECT_CALL : "HAS_REJECT_CALL"
  },

  /** required disco features for video call */
  reqVideoFeatures : ['urn:xmpp:jingle:apps:rtp:video', 'urn:xmpp:jingle:apps:rtp:audio',
    'urn:xmpp:jingle:transports:ice-udp:1', 'urn:xmpp:jingle:apps:dtls:0'],

  /** required disco features for file transfer */
  reqFileFeatures : ['urn:xmpp:jingle:1', 'urn:xmpp:jingle:apps:file-transfer:3'],

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
      self.isChromeExtensionInstalled();
    }

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
  _notifyMultimediacacheChanged : function(userArray) {
    $(document).trigger("multimediacache-changed.jsxc", userArray ? {users : userArray} : null);
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

    self.multimediacache.users[fulljid] = {

      node : Strophe.getNodeFromJid(fulljid),

      type : self.USER_TYPE.SIMPLE_VIDEO_CALL,

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

    if (typeof fulljid === "undefined") {
      throw new Error("fulljid cannot be undefined: " + fulljid);
    }

    if (Object.keys(self.USER_STATUS).indexOf(status) === -1) {
      throw new Error("Invalid status: " + status);
    }

    // create user if not exist
    if (!self.multimediacache.users[fulljid]) {
      self._log("Status change: user was created", fulljid, 'INFO');
      self._createUserEntry(fulljid);

      self.multimediacache.users[fulljid].status = status;
    }

    else {
      if (overwrite === true) {
        // update status
        self.multimediacache.users[fulljid].status = status;
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

    if (typeof fulljid === "undefined") {
      throw new Error("fulljid cannot be undefined: " + fulljid);
    }

    if (Object.keys(self.USER_TYPE).indexOf(type) === -1) {
      throw new Error("Invalid type: " + type);
    }

    // overwrite value by default
    overwrite = typeof overwrite !== 'undefined' ? overwrite : true;

    // create user if not exist
    if (!self.multimediacache.users[fulljid]) {
      self._log("Type change: user was created", fulljid, 'INFO');
      self._createUserEntry(fulljid);

      // update status
      self.multimediacache.users[fulljid].type = type;

    }

    else {
      if (overwrite === true) {
        // update status
        self.multimediacache.users[fulljid].type = type;
      }
    }

  },

  /**
   * Return true if user is sharing his screen
   * @private
   */
  _isScreensharingInitiator : function(fulljid) {
    var self = jsxc.mmstream;
    return self.multimediacache.users[fulljid] &&
        self.multimediacache.users[fulljid].type === self.USER_TYPE.SCREENSHARING_INITITATOR;
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
    self._notifyMultimediacacheChanged(triggeredDatas);

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

    return self.multimediacache.users[fulljid] && self.multimediacache.users[fulljid].status ?
        self.multimediacache.users[fulljid].status : null;

  },

  /**
   * Return the user status or null if user not exist
   * @param fulljid
   * @returns {*}
   * @private
   */
  getUserType : function(fulljid) {

    var self = jsxc.mmstream;

    // check if jid is full
    if (!fulljid || !Strophe.getResourceFromJid(fulljid)) {
      throw new Error("Incorrect JID, must be full: " + fulljid);
    }

    return self.multimediacache.users[fulljid] && self.multimediacache.users[fulljid].type ?
        self.multimediacache.users[fulljid].type : null;

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

    return self.multimediacache.users[fulljid] && self.multimediacache.users[fulljid].status &&
        self.multimediacache.users[fulljid].status === self.USER_STATUS.READY;

  },

  /**
   * Return true if the buddy is connecting or connected
   *
   * @param fulljid
   * @returns {*|boolean}
   * @private
   */
  _isBuddyConnectingOrConnected : function(fulljid) {

    var self = jsxc.mmstream;

    // check if jid is full
    if (!fulljid || !Strophe.getResourceFromJid(fulljid)) {
      throw new Error("Incorrect JID, must be full: " + fulljid);
    }

    return self.multimediacache.users[fulljid] && self.multimediacache.users[fulljid].status &&
        (self.multimediacache.users[fulljid].status === self.USER_STATUS.CONNECTED ||
        self.multimediacache.users[fulljid].status === self.USER_STATUS.CONNECTING);

  },

  /**
   * Return true if buddy is a screensharing recipient
   * @private
   */
  _isBuddyScreensharingRecipient : function(fulljid) {

    var self = jsxc.mmstream;

    // check if jid is full
    if (!fulljid || !Strophe.getResourceFromJid(fulljid)) {
      throw new Error("Incorrect JID, must be full: " + fulljid);
    }

    return self.multimediacache.users[fulljid] && self.multimediacache.users[fulljid].type &&
        self.multimediacache.users[fulljid].type === self.USER_TYPE.SCREENSHARING_RECIPIENT;

  },

  /**
   * Return true if buddy participate to videoconference and if his status is different from
   * DISCONNECTED
   * @param fulljid
   * @returns {*|boolean}
   * @private
   */
  _isBuddyParticipatingToVideoconference : function(fulljid) {

    var self = jsxc.mmstream;

    // check if jid is full
    if (!fulljid || !Strophe.getResourceFromJid(fulljid)) {
      throw new Error("Incorrect JID, must be full: " + fulljid);
    }

    return self.multimediacache.users[fulljid] && self.multimediacache.users[fulljid].type &&
        (self.multimediacache.users[fulljid].type === self.USER_TYPE.VIDEOCONF_INITIATOR ||
        self.multimediacache.users[fulljid].type === self.USER_TYPE.VIDEOCONF_PARTICIPANT) &&
        self.multimediacache.users[fulljid].status &&
        self.multimediacache.users[fulljid].status !== self.USER_STATUS.HAS_REJECT_CALL;

  },

  /**
   * Clear videoconference datas
   *
   * @private
   */
  _clearMultimediacache : function() {

    var self = jsxc.mmstream;

    if (jsxc.mmstream.debug === true) {
      self._log("Multimedia cache cleared");
    }

    self.multimediacache.lastLaunch = -1;
    self.multimediacache.users = {};
    self.multimediacache.accepted = false;

    self.multimediacache.occupied = false;

    $(document).trigger('multimediacache-changed.jsxc');

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

    self.multimediacache.lastLaunch = -1;

    $.each(self.multimediacache.users, function(fulljid) {

      // we found jid and we have to remove all array ids from cache
      if (fulljidArray.indexOf(fulljid) > -1 && mode === "purge") {
        delete self.multimediacache.users[fulljid];
      }

      // we dont found jid and we have to remove all jids not in array from cache
      else if (fulljidArray.indexOf(fulljid) < 0 && mode === "others") {
        delete self.multimediacache.users[fulljid];
      }

    });
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
      //self._log("Ignoring message from current user: ", stanza, "ERROR");

      // keep handler
      return true;
    }

    // check if stanza is a videoconference invitation
    var video = $(stanza).find(self.XMPP_VIDEOCONFERENCE.ELEMENT_NAME);
    var screen = $(stanza).find(self.XMPP_SCREENSHARING.ELEMENT_NAME);
    var status;

    /**
     * Videoconference message
     */
    if (video.length > 0) {

      status = video.attr(self.XMPP_VIDEOCONFERENCE.STATUS_ATTR);

      if (jsxc.mmstream.debug) {
        self._log("_onMessageReceived " + status, {status : status, stanza : stanza});
      }

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

      // some user is reinvited in videoconference
      else if (status === self.XMPP_VIDEOCONFERENCE.STATUS.REINVITATION) {
        jsxc.stats.addEvent("jsxc.mmstream.videoconference.re-invitationReceived");
        self._onReinvitationReceived(stanza, video);
      }

      // invalid message
      else {
        self._log("Invalid videoconference message: ", stanza, "ERROR");
      }

    }

    /**
     * Screensharing message
     */ else if (screen.length > 0) {

      status = screen.attr(self.XMPP_SCREENSHARING.STATUS_ATTR);

      if (status === self.XMPP_SCREENSHARING.STATUS.INIT) {
        jsxc.stats.addEvent("jsxc.mmstream.screensharing.invitationReceived");
        self._onScreensharingInvitationReceived(stanza, screen);
      }

      else if (status === self.XMPP_SCREENSHARING.STATUS.ACCEPT) {
        self._onScreensharingAcceptReceived(stanza, screen);
      }

      else if (status === self.XMPP_SCREENSHARING.STATUS.DECLINE) {
        self._onScreensharingDeclineReceived(stanza, screen);
      }

      else if (status === self.XMPP_SCREENSHARING.STATUS.REINVITE) {
        jsxc.stats.addEvent("jsxc.mmstream.screensharing.re-invitationReceived");
        self._onScreensharingInvitationReceived(stanza, screen);
      }

      // invalid message
      else {
        self._log("Invalid screensharing message: ", stanza, "ERROR");
      }

    }

    // keep handler
    return true;

  },

  /**
   * Triggered when screen sharing invitation received
   *
   * If user accept, a confirmation is sent to initator
   *
   * @param stanza
   * @param screen
   * @private
   */
  _onScreensharingInvitationReceived : function(stanza, screen) {

    var self = jsxc.mmstream;

    var datetime = screen.attr(self.XMPP_SCREENSHARING.DATETIME_ATTR);
    var now = new Date().getTime();
    var from = $(stanza).attr("from");

    var decline = function() {
      self._sendScreensharingConfirmationMessage(self.XMPP_SCREENSHARING.STATUS.DECLINED, datetime,
          from);
    };

    if (self._isClientOccupied(from) !== false) {
      decline();
      return;
    }

    if (now - datetime > self.SCREENSHARING_INVITATION_EXPIRATION) {
      jsxc.gui.feedback("Vous avez reçu une invitation de partage d'écran, mais elle est périmée");
      decline();
      return;
    }

    self.gui._showIncomingScreensharingDialog(from)
        .then(function() {
          jsxc.gui.feedback("Partage d'écran accepté");

          self._setUserType(from, self.USER_TYPE.SCREENSHARING_INITITATOR);

          self._sendScreensharingConfirmationMessage(self.XMPP_SCREENSHARING.STATUS.ACCEPT,
              datetime, from);
        })
        .fail(function() {
          jsxc.gui.feedback("Partage d'écran refusé");
          decline();
        });

  },

  /**
   * Send screen sharing confirmation: accept or decline
   * @param status
   * @param datetime
   * @param to
   * @private
   */
  _sendScreensharingConfirmationMessage : function(status, datetime, to) {

    if (!status || !datetime || !to) {
      throw new Error("Invalid argument: " + status + " / " + datetime + " / " + to);
    }

    var self = jsxc.mmstream;

    // videoconference item
    var screen = {};
    screen[self.XMPP_SCREENSHARING.DATETIME_ATTR] = datetime;
    screen[self.XMPP_SCREENSHARING.STATUS_ATTR] = status;

    // XMPP message stanza
    var msg = $msg({

      from : self.conn.jid,

      to : to

    }).c(self.XMPP_SCREENSHARING.ELEMENT_NAME, screen);

    self.conn.send(msg);

    if (jsxc.mmstream.debug === true) {
      self._log("_sendAcceptScreensharingMessage", {to : to, datetime : datetime, status : status});
    }

  },

  /**
   * Triggered if a user decline a screen sharing
   *
   * We have to show a feedback and change status
   *
   * @param stanza
   * @param screen
   * @private
   */
  _onScreensharingDeclineReceived : function(stanza) {

    var self = jsxc.mmstream;
    var from = $(stanza).attr('from');

    self._setUserStatus(from, self.USER_STATUS.HAS_REJECT_CALL);

    jsxc.gui.feedback("Partage d'écran refusé par <b>" + Strophe.getNodeFromJid(from) + "</b>");

  },

  /**
   * Triggered if a user accept a screen sharing
   *
   * We have to initiate a session and send screen stream
   *
   * @param stanza
   * @param screen
   * @private
   */
  _onScreensharingAcceptReceived : function(stanza) {

    var self = jsxc.mmstream;
    var from = $(stanza).attr('from');

    if (self.multimediacache.screenStream === null) {
      throw new Error("Screen stream is null");
    }

    // openning jingle session
    var session = self.conn.jingle.initiate(from, self.multimediacache.screenStream);

    session.on('change:connectionState', self._onVideoSessionStateChanged);

  },

  /**
   * Triggered if user receive a reinvitation notification
   * @param stanza
   * @param video
   * @private
   */
  _onReinvitationReceived : function(stanza, video) {

    var self = jsxc.mmstream;

    self._log("_onReinvitation");

    var target = video.attr(self.XMPP_VIDEOCONFERENCE.REINVITE_ATTR);
    var target_node = Strophe.getNodeFromJid(target);
    var from = $(stanza).attr("from");

    var initiator = video.attr(self.XMPP_VIDEOCONFERENCE.INITIATOR_ATTR);
    var participants = self._unserializeJidList(
        video.attr(self.XMPP_VIDEOCONFERENCE.USERS_ATTR) || "");
    var datetime = video.attr(self.XMPP_VIDEOCONFERENCE.DATETIME_ATTR);
    var invitationId = video.attr(self.XMPP_VIDEOCONFERENCE.ID_ATTR);

    // case 1: I have to join the videoconference
    if (target === self.conn.jid) {

      // TODO: check if client is free ?
      // check if client is free
      // if(self._isClientOccupied(from) !== false){
      //   decline();
      //   return;
      // }

      self.multimediacache.occupied = true;

      if (jsxc.mmstream.debug === true) {
        self._log("I have to join videoconference");
      }

      self.gui._showReinviteUserConfirmationDialog(from, "received")
          .then(function() {

            // require local stream to continue
            self._requireLocalStream()
                .done(function() {
                  self._log("Local stream sharing accepted");

                  self._acceptVideoconference(initiator, participants, invitationId, datetime,
                      true);
                })

                // user cannot access to camera
                .fail(function(error) {
                  jsxc.gui.feedback("Accès à la caméra refusé" + (error ? ": " + error : ""));
                  self.multimediacache.occupied = false;
                });

          })
          .fail(function() {
            jsxc.gui.feedback("Invitation refusée");
            self.multimediacache.occupied = false;
          });
    }

    // case 2: Maybe I have to call people was disconnected
    else {
      jsxc.gui.feedback(target_node + " à été ré-invité dans la vidéoconférence par " +
          Strophe.getNodeFromJid(from));
    }

  },

  /**
   *  Triggered if we received a videoconference invitation
   *
   * @param stanza
   * @private
   */
  _onVideoconferenceInvitationReceived : function(stanza, video) {

    var self = jsxc.mmstream;

    var invitationId = $(stanza).attr(self.XMPP_VIDEOCONFERENCE.ID_ATTR);
    var initiator = video.attr(self.XMPP_VIDEOCONFERENCE.INITIATOR_ATTR);
    var initiator_node = Strophe.getNodeFromJid(initiator);
    var participants = self._unserializeJidList(
        video.attr(self.XMPP_VIDEOCONFERENCE.USERS_ATTR) || "");
    var datetime = video.attr(self.XMPP_VIDEOCONFERENCE.DATETIME_ATTR);

    // check if another multimedia session is currently running
    if (self._isClientOccupied(initiator) !== false) {
      self._declineVideconference(initiator, participants, invitationId, "Occupé !");
      return;
    }

    // check how many participants
    if (participants.length < 1) {
      self._log('Too few participants', {stanza : stanza, participants : participants}, 'ERROR');
      jsxc.gui.feedback(
          'Vous avez reçu une invitation à une vidéoconférence de <b>' + initiator_node +
          '</b>, mais elle est invalide.');
      return;
    }

    self.multimediacache.accepted = false;

    if (jsxc.mmstream.debug === true) {
      self._log("_onVideoconferenceInvitationReceived",
          {fulljid : initiator, videoconference : self.multimediacache});
    }

    var decline = function(message, error) {

      jsxc.error("Videoconference declined: ", error);

      jsxc.gui.feedback(message);

      self._declineVideconference(initiator, participants, invitationId, error);

      self.multimediacache.occupied = false;
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
              .done(function() {
                self._log("Local stream sharing accepted");
                self._acceptVideoconference(initiator, participants, invitationId, datetime);
              })

              // user cannot access to camera
              .fail(function(error) {
                decline("Accès à la caméra refusé", error);
              });

        })

        // video conference is rejected
        .fail(function(error) {
          decline("Vidéo conférence rejetée", error);
        });

  },

  /**
   * Allow to RE-invite an user that can be disconnected of video conference
   */
  reinviteUserInVideoconference : function(fulljid) {

    var self = jsxc.mmstream;

    // check if fulljid
    if (Strophe.getResourceFromJid(fulljid) === null) {
      throw new Error("JID must be full jid");
    }

    // first checks to avoid not needed re invitations
    var node = Strophe.getNodeFromJid(fulljid);
    var error = "";

    // check if a participant to videoconference
    if (self.multimediacache.userList.indexOf(fulljid) < 0 &&
        self.multimediacache.initiator !== fulljid) {
      error = "'" + node + "' ne participe pas à la vidéo conférence en cours.";
    }

    // check if user connected
    if (self._isBuddyConnectingOrConnected(fulljid) === true) {
      error = node + " est déjà connecté ou en cours de connexion";
    }

    if (error !== "") {
      jsxc.gui.feedback(error);
      return;
    }

    // ask confirmation
    self.gui._showReinviteUserConfirmationDialog(Strophe.getNodeFromJid(fulljid), "emit")

        .then(function() {

          // check if from current video conference
          //TODO dialog

          // send invitations
          var participants = self.multimediacache.userList;
          var initiator = self.multimediacache.initiator;
          var node = Strophe.getNodeFromJid(self.conn.jid);

          self._sendVideoconferenceInvitations(participants,
              node + " vous invite à revenir dans la vidéoconférence", initiator,
              self.XMPP_VIDEOCONFERENCE.STATUS.REINVITATION, fulljid);

          jsxc.gui.feedback("L'invitation à été envoyée.");

        })
        .fail(function(error) {
          throw new Error(error);
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
  _acceptVideoconference : function(initiator, participants, invitationId, datetime, reaccept) {

    var self = jsxc.mmstream;

    jsxc.stats.addEvent("jsxc.mmstream.multimediacache.accepted");

    // set to true if all users have already accepted videoconference
    reaccept = typeof reaccept !== "undefined" ? reaccept : false;

    //  terminate all currents conversations, and remove non-videoconference entries
    self._hangUpAll();
    self._purgeVideoconferenceCache(participants.concat([initiator]), "others");

    // keep informations
    self.multimediacache.userList = participants;
    self.multimediacache.initiator = initiator;

    // store buddies was already ready
    var alreadyReady = [];
    $.each(self.multimediacache.users, function(fulljid) {
      if (self._isBuddyReady(fulljid) === true) {
        alreadyReady.push(fulljid);
      }
    });

    // reset buddy list
    self._updateAllVideoconferenceUsers(participants, self.USER_STATUS.NOT_READY,
        self.USER_TYPE.VIDEOCONF_PARTICIPANT);

    // restore ready states
    $.each(alreadyReady, function(index, fulljid) {
      self._setUserStatus(fulljid, self.USER_STATUS.READY);
    });

    // initiator is ready to be called
    self._setUserType(initiator, self.USER_TYPE.VIDEOCONF_INITIATOR);
    self._setUserStatus(initiator, self.USER_STATUS.READY);

    // special status for current user
    self._setUserType(self.conn.jid, self.USER_TYPE.SELF);
    self._setUserStatus(self.conn.jid, self.USER_STATUS.SELF);

    self.multimediacache.lastLaunch = datetime;

    // acceptance flag
    self.multimediacache.accepted = true;

    // simulate all users we must call are ready beacuse they have already accepted videoconference
    if (reaccept === true) {
      var usersToCall = self._whichUsersMustWeCall(initiator, participants, self.conn.jid);
      $.each(usersToCall, function(index, fulljid) {
        self._setUserStatus(fulljid, self.USER_STATUS.READY);
      });
    }

    // notify changes
    self._notifyMultimediacacheChanged();

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

    jsxc.stats.addEvent("jsxc.mmstream.multimediacache.decline");

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
    $.each(self.multimediacache.users, function(fulljid) {

      if (usersToCall.indexOf(fulljid) !== -1 && self._isBuddyReady(fulljid) === true) {

        self._startVideoCall(fulljid, self.USER_TYPE.VIDEOCONF_PARTICIPANT);

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

    var initiator = video.attr(self.XMPP_VIDEOCONFERENCE.INITIATOR_ATTR);
    var participants = self._unserializeJidList(
        video.attr(self.XMPP_VIDEOCONFERENCE.USERS_ATTR) || "");
    var user = $(stanza).attr("from");

    if (jsxc.mmstream.debug === true) {
      self._log("_onVideoconferenceAccepted", {
        initiator : initiator, from : user, participants : participants
      });
    }

    // change user status
    self._setUserStatus(user, self.USER_STATUS.READY);

    // notify changes
    self._notifyMultimediacacheChanged();

    // call users which are ready, be only if conference is accepted
    if (self.multimediacache.accepted === true) {
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
    self._notifyMultimediacacheChanged();

    // terminate all conversations, even if waiting
    self._hangUpAll();

    // dont clear caches here, to show who declined videoconference
    // self._clearMultimediacache();

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
   * Send all invitations needed for initiate a video conference.
   *
   * @param fulljidArray
   * @param message
   * @returns {*}
   */
  _sendVideoconferenceInvitations : function(participants, messageTxt, initiator, status,
      reinvitationTarget) {

    var self = jsxc.mmstream;

    // by default initiator is current user
    initiator = initiator || self.conn.jid;

    // by default status is init
    status = status || self.XMPP_VIDEOCONFERENCE.STATUS.INIT;

    // check ressources to avoid wrong videoconference starting
    $.each(participants, function(index, element) {
      var res = Strophe.getResourceFromJid(element);
      if (res === null || res === "" || res === "null") {
        throw new Error("Only full jid are permitted: " + element);
      }
    });

    if (participants.indexOf(initiator) !== -1) {
      throw new Error("Participants list must not contain initiator: " + initiator + " / " +
          participants.join(','));
    }

    var conferenceId = self.conn.getUniqueId();

    var datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // videoconference item
    var video = {};
    video[self.XMPP_VIDEOCONFERENCE.USERS_ATTR] = participants.join(",");
    video[self.XMPP_VIDEOCONFERENCE.STATUS_ATTR] = status;
    video[self.XMPP_VIDEOCONFERENCE.ID_ATTR] = conferenceId;
    video[self.XMPP_VIDEOCONFERENCE.INITIATOR_ATTR] = initiator;
    video[self.XMPP_VIDEOCONFERENCE.DATETIME_ATTR] = datetime;
    video[self.XMPP_VIDEOCONFERENCE.MESSAGE_ATTR] =
        messageTxt || "Vidéoconférence organisée par " + Strophe.getNodeFromJid(initiator);

    if (reinvitationTarget) {
      video[self.XMPP_VIDEOCONFERENCE.REINVITE_ATTR] = reinvitationTarget;
    }

    // XMPP message stanza
    var msg = $msg({
      from : self.conn.jid
    }).c(self.XMPP_VIDEOCONFERENCE.ELEMENT_NAME, video);

    var sent = [];

    // send one invitation to each participants and eventually to initator if this is a reinvitation
    $.each(participants.concat(initiator), function(index, fulljid) {

      jsxc.stats.addEvent("jsxc.mmstream.videoconference.sendInvitation");

      if (fulljid !== self.conn.jid) {

        var adressedMessage = $(msg.toString()).attr("to", fulljid);
        self.conn.send(adressedMessage);

        sent.push(fulljid);

      }

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
   *
   * fulljidArray MUST NOT contain initator jid
   *
   * @param fulljidArray
   */
  startVideoconference : function(fulljidArray, message) {

    var self = jsxc.mmstream;

    jsxc.stats.addEvent("jsxc.mmstream.multimediacache.start");

    if (!fulljidArray || fulljidArray.constructor !== Array) {
      throw new Error("Illegal argument: " + fulljidArray);
    }

    if (fulljidArray.length > self.VIDEOCONFERENCE_MAX_PARTICIPANTS) {
      throw new Error("Too much participants. Number: " + fulljidArray.length + " / Max: " +
          self.VIDEOCONFERENCE_MAX_PARTICIPANTS);
    }

    // check if navigator is compatible
    self.checkNavigatorCompatibility("videoconference");

    if (jsxc.mmstream.debug === true) {
      self._log("startVideoconference", [fulljidArray, message]);
    }

    // check if another multimedia session is currently running
    if (self._isClientOccupied(null, true) !== false) {
      return;
    }

    // acceptance flag to call participants when videoconference will be accepted
    self.multimediacache.accepted = false;

    // require local stream to prevent errors
    self._requireLocalStream()
        .then(function() {

          // clear previous video conference informations
          self._clearMultimediacache();

          self.multimediacache.accepted = true;

          // update participants list to accept them when they will call
          self._updateAllVideoconferenceUsers(fulljidArray, self.USER_STATUS.NOT_READY);

          // special status for current user
          self._setUserStatus(self.conn.jid, self.USER_STATUS.SELF);
          self._setUserType(self.conn.jid, self.USER_TYPE.SELF);

          // notify changes
          self._notifyMultimediacacheChanged();

          // keep informations
          self.multimediacache.userList = fulljidArray;
          self.multimediacache.initiator = self.conn.jid;

          try {

            // send an invitation to each participant
            var ret = self._sendVideoconferenceInvitations(fulljidArray, message);
            self.multimediacache.lastLaunch = ret.datetime;

            jsxc.gui.feedback("La vidéoconférence va bientôt commencer ...");

          } catch (error) {

            self._log("Error while starting videoconference: ", error, "ERROR");

            jsxc.gui.feedback("Erreur lors de l'envoi des invitations.");

            self.multimediacache.occupied = false;
          }
        })

        // user cannot access to camera
        .fail(function(error) {
          jsxc.gui.feedback("Accès à la caméra refusé" + (error ? ": " + error : ""));

          self.multimediacache.occupied = false;
        });

  },

  /**
   * Return the list of user this client must call to complete the videconference
   *
   * @param initiator : the videoconference initiator
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

    // call every participant after our jid to the initiator
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

    if (jsxc.mmstream.debug === true) {
      self._log("startScreenSharingMultiPart", [fulljidArray, message]);
    }

    jsxc.stats.addEvent("jsxc.mmstream.screensharing.multipart.start");

    // check if navigator compatible
    self.checkNavigatorCompatibility("videoconference");

    // TODO: check if all participants connected ?

    // check if another multimedia session is currently running
    if (self._isClientOccupied(null, true) !== false) {
      return;
    }

    jsxc.gui.feedback("Le partage d'écran va bientôt commencer ...");

    // ice configuration
    self.conn.jingle.setICEServers(self.iceServers);

    // requesting user media
    self._getUserScreenStream()

        .then(function(stream) {

          self._clearMultimediacache();

          // auto accept all participants streams
          self._updateAllVideoconferenceUsers(fulljidArray, self.USER_STATUS.NOT_READY,
              self.USER_TYPE.SCREENSHARING_RECIPIENT);

          // special status for current user
          self._setUserStatus(self.conn.jid, self.USER_STATUS.SELF);
          self._setUserType(self.conn.jid, self.USER_TYPE.SELF);

          self._notifyMultimediacacheChanged();

          // keep screen stream
          self.multimediacache.screenStream = stream;

          // TODO: save participant list to accept them after
          self.multimediacache.userList = fulljidArray;

          // invite all participants
          self._sendScreensharingInvitations(fulljidArray);

          self.gui.showLocalScreenStream();

        })

        .fail(function() {

          jsxc.gui.feedback(
              "Impossible d'accéder à votre écran, veuillez autoriser l'accès, installer l'extension si nécéssaire et réessayer.");

          self.multimediacache.occupied = false;

        });

  },

  reinviteUserInScreensharing : function(fulljid) {

    var self = jsxc.mmstream;
    if (!fulljid || Strophe.getResourceFromJid(fulljid) === null) {
      throw new Error("Invalid argument: " + fulljid);
    }

    var node = Strophe.getNodeFromJid(fulljid);

    // check if user connected
    if (self._isBuddyConnectingOrConnected(fulljid) === true) {
      jsxc.gui.feedback(node + " est déjà connecté ou en cours de connexion");
    }

    // ask confirmation
    self.gui._showReinviteUserConfirmationDialog(Strophe.getNodeFromJid(fulljid), "emit")

        .then(function() {

          jsxc.gui.feedback('Invitation envoyée');

          // invite all participants
          self._sendScreensharingInvitations([fulljid], true);

        })

        .fail(function() {

          jsxc.gui.feedback('Opération annulée');

        });

  },

  /**
   * Send invitations to user to invite them to see our screen.
   *
   * These invitation allow to distinguish calls from screensharing.
   * TODO: to improve
   *
   * @param participants
   * @private
   */
  _sendScreensharingInvitations : function(participants, reinvitation) {

    var self = jsxc.mmstream;

    reinvitation = typeof reinvitation !== "undefined" ? reinvitation : false;

    // check ressources to avoid wrong videoconference starting
    $.each(participants, function(index, element) {
      var res = Strophe.getResourceFromJid(element);
      if (res === null || res === "" || res === "null") {
        throw new Error("Only full jid are permitted: " + element);
      }
    });

    var datetime = new Date().getTime();

    // videoconference item
    var screen = {};
    screen[self.XMPP_SCREENSHARING.DATETIME_ATTR] = datetime;

    if (reinvitation) {
      screen[self.XMPP_SCREENSHARING.STATUS_ATTR] = self.XMPP_SCREENSHARING.STATUS.REINVITE;
    }

    else {
      screen[self.XMPP_SCREENSHARING.STATUS_ATTR] = self.XMPP_SCREENSHARING.STATUS.INIT;
    }

    // XMPP message stanza
    var msg = $msg({
      from : self.conn.jid
    }).c(self.XMPP_SCREENSHARING.ELEMENT_NAME, screen);

    var sent = [];

    // send one invitation to each participants and eventually to initator if this is a reinvitation
    $.each(participants, function(index, fulljid) {

      jsxc.stats.addEvent("jsxc.mmstream.screenSharing.sendInvitation");

      if (fulljid !== self.conn.jid) {

        var adressedMessage = $(msg.toString()).attr("to", fulljid);
        self.conn.send(adressedMessage);

        sent.push(fulljid);

      }

    });

    if (jsxc.mmstream.debug === true) {
      self._log("_sendScreensharingInvitations", {to : sent});
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
    }

    else {
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
  isChromeExtensionInstalled : function() {

    var self = jsxc.mmstream;
    var messages = self.chromeExtensionMessages;

    var defer = $.Deferred();

    if (self._isNavigatorChrome() === true) {

      /**
       * Before begin capturing, we have to ask for source id and wait for response
       */
      window.addEventListener("message", function(event) {

        if (event && event.data && event.data === messages.available) {
          defer.resolve();
        }

      });

      // if we have no response, reject promise
      // TODO: to improve
      setTimeout(function() {
        defer.reject("NoResponseFromExtension");
      }, 3000);

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

              defer.reject(error);

            });

      }
    });

    // ask for source id
    window.postMessage(messages.getScreenSourceId, '*');

    return defer.promise();

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
      self._log("_onIncomingCall", {videoconference : self.multimediacache});
    }

    // send signal to partner
    session.ring();

    var fulljid = session.peerID;
    var bid = jsxc.jidToBid(fulljid);

    // accept video call
    var acceptRemoteSession = function(localStream) {

      if (jsxc.mmstream.debug === true) {
        self._log("Call accepted", session);
      }

      session.addStream(localStream);
      session.accept();

    };

    // decline video call
    var declineRemoteSession = function() {

      if (jsxc.mmstream.debug === true) {
        self._log("Call declined", session);
      }

      session.end("decline", false);

      self._setUserStatus(fulljid, self.USER_STATUS.HAS_REJECT_CALL);

      // notify changes
      self._notifyMultimediacacheChanged();

      self.multimediacache.occupied = false;
    };

    var errorWhileAccessingLocalStream = function(error) {
      jsxc.gui.feedback("Erreur lors de l'accès à la caméra et au micro: " + error);
      self._log("Error while using audio/video", error);
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
            declineRemoteSession();
            errorWhileAccessingLocalStream(error);
          });
    }

    /**
     * Buddy participate to videoconference, accept his stream
     */

    else if (self._isBuddyParticipatingToVideoconference(fulljid) === true) {

      self._log("Participant accepted", {
        session : session, videoconference : self.multimediacache
      });

      if (jsxc.mmstream.debug === true) {
        self._log("Buddy accepted ", {
          fulljid : fulljid, videoconference : self.multimediacache
        });
      }

      // User type is not set here
      // self._setUserType(self.USER_TYPE.VIDEOCONF_PARTICIPANT);
      // self._notifyMultimediacacheChanged();

      // require permission on devices if needed
      self._requireLocalStream()
          .done(function(localStream) {
            acceptRemoteSession(localStream);
          })
          .fail(function(error) {
            declineRemoteSession();
            errorWhileAccessingLocalStream(error);
          });

    }

    /**
     * Buddy is sharing his screen
     */

    else if (self._isScreensharingInitiator(fulljid)) {

      // accept remote session with an empty mediastream object
      acceptRemoteSession(new MediaStream());

    }

    /**
     * Incoming call,
     * Show accept/decline confirmation dialog
     */

    else {

      // desktop notification
      jsxc.notification.notify(jsxc.t('Incoming_call'), jsxc.t('from_sender', {
        sender : bid
      }));

      self._log("Incoming call ", session);

      // check if another multimedia session is currently running
      if (self._isClientOccupied(fulljid) !== false) {
        declineRemoteSession();
        return;
      }

      self._setUserType(fulljid, self.USER_TYPE.SIMPLE_VIDEO_CALL);
      self._notifyMultimediacacheChanged();

      self.gui._showIncomingCallDialog(bid)
          .done(function() {

            // require permission on devices if needed
            self._requireLocalStream()
                .done(function(localStream) {
                  acceptRemoteSession(localStream);
                })
                .fail(function(error) {
                  declineRemoteSession();
                  errorWhileAccessingLocalStream(error);
                });

          })

          .fail(function() {
            jsxc.gui.feedback("Appel rejeté");
            declineRemoteSession();
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
    if (self.multimediacache.localStream !== null && self.multimediacache.localStream.active) {
      defer.resolve(self.multimediacache.localStream);
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
          self.multimediacache.localStream = localStream;
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

    // show media panel if needed
    if (jsxc.newgui.isMediapanelShown() !== true) {
      jsxc.newgui.toggleMediapanel();
    }

    // save session and stream
    if (!self.multimediacache.users[fulljid]) {
      self._createUserEntry(fulljid);
    }
    self.multimediacache.users[fulljid].session = session;
    self.multimediacache.users[fulljid].stream = stream;

    // show local video if needed
    if (self.gui.isLocalVideoShown() !== true &&
        self.getUserType(fulljid) !== self.USER_TYPE.SCREENSHARING_INITITATOR) {
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
    return self.multimediacache.users[fulljid] && self.multimediacache.users[fulljid].session ?
        self.multimediacache.users[fulljid].session : null;
  },

  /**
   * Return the active stream of user or null
   * @param fulljid
   * @private
   */
  getActiveStream : function(fulljid) {
    var self = jsxc.mmstream;
    return self.multimediacache.users[fulljid] && self.multimediacache.users[fulljid].stream ?
        self.multimediacache.users[fulljid].stream : null;
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

    if (self.multimediacache.users[fulljid]) {
      delete self.multimediacache.users[fulljid].session;
      delete self.multimediacache.users[fulljid].stream;
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

    $.each(self.multimediacache.users, function(index, item) {
      if (item.session) {
        res.push(item.session);
      }
    });

    return res;
  },

  /**
   * Call another user with video and audio stream
   *
   * This call is exclusive
   *
   * @param fullJid
   */
  startSimpleVideoCall : function(fulljid) {

    var self = jsxc.mmstream;

    var node = Strophe.getNodeFromJid(fulljid);

    // check if user connected
    if (self._isBuddyConnectingOrConnected(fulljid) === true) {
      jsxc.gui.feedback(node + " est déjà connecté ou en cours de connexion");
      return;
    }

    // check if another multimedia session is currently running
    if (self._isClientOccupied(null, true) !== false) {
      return;
    }

    self.checkNavigatorCompatibility("videoconference");

    self._startVideoCall(fulljid);
  },

  /**
   * Call user with audio / video stream
   *
   * This call is NOT exclusive
   *
   * @param fulljid
   * @param userType
   * @private
   */
  _startVideoCall : function(fulljid, userType) {

    var self = jsxc.mmstream;

    if (Strophe.getResourceFromJid(fulljid) === null) {
      throw new Error("JID must be full jid");
    }

    if (jsxc.mmstream.debug === true) {
      self._log("_startVideoCall ", fulljid);
    }

    // default user type is simple video call
    userType = typeof userType !== 'undefined' ? userType : self.USER_TYPE.SIMPLE_VIDEO_CALL;

    // change user type and status
    self._setUserStatus(fulljid, self.USER_STATUS.CONNECTING);
    self._setUserType(fulljid, userType);

    // notify changes
    self._notifyMultimediacacheChanged();

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

      jsxc.gui.feedback("Pas de réponse de " + Strophe.getNodeFromJid(fulljid) + " au bout de " +
          (self.HANGUP_IF_NO_RESPONSE / 1000) + " s., l'appel est abandonné.");

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
    if (!self.multimediacache.users[fulljid]) {
      self._createUserEntry(fulljid);
    }
    self.multimediacache.users[fulljid].jingleState = state;

    // mmstream status
    var status;

    if (state === "interrupted") {

      // inform user of problem
      jsxc.gui.feedback("Problème de connexion avec " + Strophe.getNodeFromJid(fulljid));

      status = self.USER_STATUS.CONNEXION_DISTURBED;
    }

    else if (state === "connecting") {
      // remove auto hangup timer
      self._removeAutoHangup(session.sid);
    }

    else if (state === "connected") {

      // remove auto hangup timer
      self._removeAutoHangup(session.sid);

      status = self.USER_STATUS.CONNECTED;

    }

    else if (state === "disconnected") {

      status = self.USER_STATUS.DISCONNECTED;

      // remove auto hangup if necessary
      self._removeAutoHangup(session.sid);

      // check if no connection is running
      if (self.getCurrentVideoSessions().length < 1) {

        // close local stream if necessary
        self.stopLocalStream();

        // turn off occupied flag to let people call
        self.multimediacache.occupied = false;

      }

    }

    // change status if necessary
    if (status) {

      self._setUserStatus(fulljid, status);

      // notify changes
      self._notifyMultimediacacheChanged([{fulljid : fulljid, status : status}]);

    }

  },

  /**
   * Check if client is occupied.
   *
   * If not, after call this function client will be.
   *
   * If it is, show a feedback to inform user that 'fulljid' tried to contact him
   *
   * @private
   */
  _isClientOccupied : function(fulljid, isInitiator) {

    var self = jsxc.mmstream;
    var node = fulljid ? Strophe.getNodeFromJid(fulljid) : '';

    var message;
    if (isInitiator === true) {
      message =
          "Vous ne pouvez pas effectuer cette action avant d'avoir terminé tous vos appels multimédia";
    }

    else {
      message = "<b>" + node + "</b> a éssayé de vous contacter mais vous êtes occupé.";
    }

    // check if another multimedia session is currently running
    if (self.multimediacache.occupied !== false) {
      jsxc.gui.feedback(message);
      return true;
    }

    // otherwise enable session flag
    self.multimediacache.occupied = true;

    if (jsxc.mmstream.debug) {
      self._log("Occupied: " + self.multimediacache.occupied, {fulljid : fulljid});
    }

    return false;
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

    $.each(self.multimediacache.users, function(fulljid) {
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

    $.each(stream.getTracks(), function(index, track) {

      track.stop();

    });

  },

  /**
   * Stop local stream and reset it
   */
  stopLocalStream : function() {

    var self = jsxc.mmstream;

    if (jsxc.mmstream.debug === true) {
      self._log("Stop local stream",
          [self.multimediacache.localStream, self.conn.jingle.localStream]);
    }

    if (self.multimediacache.localStream) {
      self._stopStream(self.multimediacache.localStream);
      self.multimediacache.localStream = null;
    }

    if (self.conn.jingle.localStream) {
      self._stopStream(self.conn.jingle.localStream);
      self.conn.jingle.localStream = null;
    }

    // stop video element
    var localVideo = $('#jsxc-media-panel #jsxc-local-video').get(0);
    if (localVideo) {
      localVideo.pause();
    }
  },

  /**
   * Attach a video stream with element
   *
   * Example: attachMediaStream($("<video>"), stream);
   *
   * Here another solution can be watch element and wait for visibility but for now there is no
   * largely compatible solutions
   *
   * @param stream
   * @param element
   */
  attachMediaStream : function(video, stream) {

    var self = jsxc.mmstream;

    var attach = function() {

      jsxc.debug("Attach media stream to video element", {element : video, stream : stream});

      self.conn.jingle.RTC.attachMediaStream(video.get(0), stream);

      //TODO: some browsers (Android Chrome, ...) want a user interaction before trigger play()
      try {
        video.get(0).play();
      } catch (e) {
        jsxc.error("Error while attaching video", {error : e});
      }

      jsxc.debug('Stream attached to element', {video : video, stream : stream});

    };

    // attach if visible
    if (video.is(':visible')) {
      attach();
    }

    // or ait until it does
    else {
      var interv = setInterval(function() {
        if (video.is(':visible')) {
          clearInterval(interv);
          attach();
        }
      }, 800);
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
   * Attach listeners on connect
   * @private
   */
  _registerListenersOnAttached : function() {

    var self = jsxc.mmstream;

    // if (self.conn.caps) {
    //   $(document).on('caps.strophe', self._onXmppEvent);
    // }

    $(document).on('init.window.jsxc', self.gui._initChatWindow);

  },

  /**
   * Called when
   */
  _onDisconnected : function() {

    var self = jsxc.mmstream;

    // remove listeners added when attached
    // $(document).off('caps.strophe', self._onXmppEvent);

    self.conn.deleteHandler(self.messageHandler);

    // stop local stream
    self.stopLocalStream();

    // reset videoconference cache and indicator
    self._clearMultimediacache();

  }

};

$(function() {

  var self = jsxc.mmstream;

  $(document).on('attached.jsxc', self.init);
  $(document).on('disconnected.jsxc', self._onDisconnected);
  $(document).on('removed.gui.jsxc', self.gui.removeGui);

});

