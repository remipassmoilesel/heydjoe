/*!
 * djoe v1.0.0 - 2016-10-11
 * 
 * Copyright (c) 2016  <br>
 * Released under the GPL-3.0 license
 * 
 * Please see 
 * 
 * @author 
 * @version 1.0.0
 * @license MIT
 */

/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	/*! This file is concatenated for the browser. */


	// at now, jsxc need to have some global vars
	//var jsxc = null, RTC = null, RTCPeerconnection = null;
	window.jsxc = null, window.RTC = null, window.RTCPeerconnection = null;

	(function ($) {
	    "use strict";

	/**
	 * JavaScript Xmpp Chat namespace
	 *
	 * @namespace jsxc
	 */
	jsxc = {

	  /** Version of jsxc */
	  version : '1.0.0',

	  /** True if i'm the master */
	  master : false,

	  /** True if the role allocation is finished */
	  role_allocation : false,

	  /** Timeout for keepalive */
	  to : [],

	  /** Timeout after normal keepalive starts */
	  toBusy : null,

	  /** Timeout for notification */
	  toNotification : null,

	  /** Timeout delay for notification */
	  toNotificationDelay : 500,

	  /** Interval for keep-alive */
	  keepalive : null,

	  /** True if jid, sid and rid was used to connect */
	  reconnect : false,

	  /** True if restore is complete */
	  restoreCompleted : false,

	  /** True if login through box */
	  triggeredFromBox : false,

	  /** True if logout through logout click */
	  triggeredFromLogout : false,

	  /** last values which we wrote into localstorage (IE workaround) */
	  ls : [],

	  stats : null,

	  /**
	   * storage event is even fired if I write something into storage (IE
	   * workaround) 0: conform, 1: not conform, 2: not shure
	   */
	  storageNotConform : null,

	  /** Timeout for storageNotConform test */
	  toSNC : null,

	  /** My bar id */
	  bid : null,

	  /** Some constants */
	  CONST : {
	    NOTIFICATION_DEFAULT : 'default',
	    NOTIFICATION_GRANTED : 'granted',
	    NOTIFICATION_DENIED : 'denied',
	    STATUS : ['offline', 'dnd', 'xa', 'away', 'chat', 'online'],
	    SOUNDS : {
	      MSG : 'incomingMessage.wav', CALL : 'Rotary-Phone6.mp3', NOTICE : 'Ping1.mp3'
	    },
	    REGEX : {
	      JID : new RegExp('\\b[^"&\'\\/:<>@\\s]+@[\\w-_.]+\\b', 'ig'),
	      URL : new RegExp(/(https?:\/\/|www\.)[^\s<>'"]+/gi)
	    },
	    NS : {
	      CARBONS : 'urn:xmpp:carbons:2', FORWARD : 'urn:xmpp:forward:0'
	    },
	    HIDDEN : 'hidden',
	    SHOWN : 'shown'
	  },

	  /**
	   * Parse a unix timestamp and return a formatted time string
	   *
	   * @memberOf jsxc
	   * @param {Object} unixtime
	   * @returns time of day and/or date
	   */
	  getFormattedTime : function(unixtime) {
	    var msgDate = new Date(parseInt(unixtime));
	    var day = ('0' + msgDate.getDate()).slice(-2);
	    var month = ('0' + (msgDate.getMonth() + 1)).slice(-2);
	    var year = msgDate.getFullYear();
	    var hours = ('0' + msgDate.getHours()).slice(-2);
	    var minutes = ('0' + msgDate.getMinutes()).slice(-2);
	    var dateNow = new Date();

	    var date = (typeof msgDate.toLocaleDateString === 'function') ? msgDate.toLocaleDateString() :
	    day + '.' + month + '.' + year;
	    var time = (typeof msgDate.toLocaleTimeString === 'function') ? msgDate.toLocaleTimeString() :
	    hours + ':' + minutes;

	    // compare dates only
	    dateNow.setHours(0, 0, 0, 0);
	    msgDate.setHours(0, 0, 0, 0);

	    if (dateNow.getTime() !== msgDate.getTime()) {
	      return date + ' ' + time;
	    }
	    return time;
	  },

	  throwOnStropheErrors : function() {

	    var stLogLevel = Strophe.LogLevel.WARN;

	    // override Strophe log function
	    Strophe.log = function(level, msg) {

	      if (level >= stLogLevel) {

	        var txtLevel = Object.keys(Strophe.LogLevel)[level] || level;

	        // save stack trace
	        var error = new Error("Strophe [" + txtLevel + "] " + msg);

	        // throw error out of log function
	        setTimeout(function() {
	          throw error;
	        }, 0);
	      }

	    };

	  },

	  /**
	   * Return the last fulljid received or null if no full jid is stored
	   *
	   * Update eventually the storage with the last full jid
	   *
	   */
	  getCurrentActiveJidForBid : function(bid) {

	    var fulljid = null;

	    if (!bid) {
	      throw new Error("Invalid argument: " + bid);
	    }

	    bid = jsxc.jidToBid(bid);

	    // get buddy data
	    var buddy = jsxc.storage.getUserItem('buddy', bid);

	    if (!buddy) {
	      throw new Error("Invalid buddy: " + bid);
	    }

	    if (buddy.type && buddy.type === "groupchat") {
	      throw new Error("Cannot update groupchat resource: " + bid);
	    }

	    // jid is present in buddy entrie, return it
	    if (buddy.jid && Strophe.getResourceFromJid(buddy.jid) !== null) {
	      return buddy.jid;
	    }

	    // jid is not complete so attach the last resource received and store it
	    else if (buddy.res && buddy.res.length > 0) {
	      fulljid = buddy.jid + "/" + buddy.res[0];
	      buddy.jid = fulljid;
	      jsxc.storage.setUserItem('buddy', bid, buddy);
	    }

	    // no res available
	    else {
	      //jsxc.warn("Invalid buddy entry, no resource available: ", buddy);

	      return null;
	    }

	    return fulljid;

	  },

	  /**
	   * Write debug message to console and to log.
	   *
	   * @memberOf jsxc
	   * @param {String} msg Debug message
	   * @param {Object} data
	   * @param {String} Could be info|warn|error|null
	   */
	  debug : function(msg, data, level) {

	    // default level
	    level = (level || 'INFO').trim().toUpperCase();

	    // modifying message
	    var formatted_msg = '[' + level + '] ' + msg;

	    // stringified data
	    var d = '';
	    if (data) {
	      // try to convert data to string
	      try {
	        // clone html snippet
	        d = $("<span>").prepend($(data).clone()).html();
	      } catch (err) {
	        try {
	          d = JSON.stringify(data);
	        } catch (err2) {
	          d = 'error while stringify, see js console';
	        }
	      }
	    }

	    // log to console
	    if (level === "ERROR") {
	      console.error(formatted_msg, data || '');
	    }

	    else {
	      console.log(formatted_msg, data || '');
	    }

	    // log in stat module if necessary
	    if (jsxc.stats && jsxc.stats.addLogEntry) {
	      jsxc.stats.addLogEntry(msg, level, data);
	    }

	    // keep in whole log
	    jsxc.log = jsxc.log + '$ ' + formatted_msg + ': ' + d + '\n';

	    // limit log size
	    var oversize = jsxc.log.length - 10000;
	    if (oversize > 200) {
	      jsxc.log = '.... [log truncated] \n' + jsxc.log.substring(oversize, jsxc.log.length);
	    }

	  },

	  /**
	   * Write warn message.
	   *
	   * @memberOf jsxc
	   * @param {String} msg Warn message
	   * @param {Object} data
	   */
	  warn : function(msg, data) {
	    jsxc.debug(msg, data, 'WARN');
	  },

	  /**
	   * Write error message.
	   *
	   * @memberOf jsxc
	   * @param {String} msg Error message
	   * @param {Object} data
	   */
	  error : function(msg, data) {
	    jsxc.debug(msg, data, 'ERROR');
	  },

	  /** debug log */
	  log : '',

	  /**
	   * Register a listener for disconnecting chat client if user
	   * refresh or leave the webpage
	   * @private
	   */
	  _disconnectBeforeUnload : function() {

	    if (jsxc.master === true) {

	      window.addEventListener("beforeunload", function(e) {

	        jsxc.xmpp.logout(false);

	        // here we call directly this method to be sure it have time to execute
	        jsxc.xmpp.disconnected();

	        // TODO: try to send "presence=unaivalable" from here ?

	        jsxc.error("Disconnected before leaving page");

	      }, false);

	    }

	  },

	  /**
	   * Return an HTML free string
	   * @param html
	   * @returns {*|string|string}
	   */
	  stripHtml : function(html) {
	    var tmp = document.createElement("div");
	    tmp.innerHTML = html;
	    return tmp.textContent || tmp.innerText || "";
	  },

	  /**
	   * Return true if buddy is online
	   * @param fjid
	   * @returns {*|user|boolean}
	   */
	  isBuddyOnline : function(fjid) {
	    var buddy = jsxc.storage.getUserItem("buddy", jsxc.jidToBid(fjid));
	    return buddy && jsxc.CONST.STATUS.indexOf("offline") !== buddy.status;
	  },

	  /**
	   * Return true if local storage is available
	   *
	   */
	  isLocalStorageAvailable : function() {

	    // check if storage available
	    try {

	      // Check localStorage
	      if (typeof(localStorage) === 'undefined') {
	        jsxc.error("Browser doesn't support localStorage.");
	        return false;
	      }

	    } catch (e) {
	      jsxc.error("Browser doesn't support localStorage.", e);
	      return false;
	    }

	    return true;
	  },

	  /**
	   * This function initializes important core functions and event handlers.
	   * Afterwards it performs the following actions in the given order:
	   *
	   * <ol>
	   *  <li>If (loginForm.ifFound = 'force' and form was found) or (jid or rid or
	   *    sid was not found) intercept form, and listen for credentials.</li>
	   *  <li>Attach with jid, rid and sid from storage, if no form was found or
	   *    loginForm.ifFound = 'attach'</li>
	   *  <li>Attach with jid, rid and sid from options.xmpp, if no form was found or
	   *    loginForm.ifFound = 'attach'</li>
	   * </ol>
	   *
	   * @memberOf jsxc
	   * @param {object} options See {@link jsxc.options}
	   */
	  init : function(options) {

	    // Log strophe errors
	    jsxc.throwOnStropheErrors();

	    if (jsxc.isLocalStorageAvailable() !== true) {

	      var showHeader = function() {

	        if ($('jsxc_noStorageWarning').length < 1) {

	          var header = '<div id="jsxc_noStorageWarning">' + jsxc.t('local_storage_warning') + '</div>';
	          $("body").prepend(header);

	          jsxc.error("No local storage available.");

	        }

	      };

	      setTimeout(showHeader, 500);

	      return;

	    }

	    if (options && options.loginForm && typeof options.loginForm.attachIfFound === 'boolean' &&
	        !options.loginForm.ifFound) {
	      // translate deprated option attachIfFound found to new ifFound
	      options.loginForm.ifFound = (options.loginForm.attachIfFound) ? 'attach' : 'pause';
	    }

	    if (options) {
	      // override default options
	      $.extend(true, jsxc.options, options);
	    }

	    jsxc.api.callback("onInit");

	    /**
	     * Getter method for options. Saved options will override default one.
	     *
	     * @param {string} key option key
	     * @returns default or saved option value
	     */
	    jsxc.options.get = function(key) {
	      if (jsxc.bid) {
	        var local = jsxc.storage.getUserItem('options') || {};

	        return (typeof local[key] !== 'undefined') ? local[key] : jsxc.options[key];
	      }

	      return jsxc.options[key];
	    };

	    /**
	     * Setter method for options. Will write into localstorage.
	     *
	     * @param {string} key option key
	     * @param {object} value option value
	     */
	    jsxc.options.set = function(key, value) {
	      jsxc.storage.updateItem('options', key, value, true);
	    };

	    jsxc.storageNotConform = jsxc.storage.getItem('storageNotConform');
	    if (jsxc.storageNotConform === null) {
	      jsxc.storageNotConform = 2;
	    }

	    /**
	     * Initialize i18n
	     */
	    jsxc.localization.init();

	    /**
	     * Stat module, after options.get and options.set definitions
	     */

	    jsxc.stats.init();
	    jsxc.stats.addEvent('jsxc.init');

	    if (jsxc.storage.getItem('debug') === true) {
	      jsxc.options.otr.debug = true;
	    }

	    // initailizing sha 1 tool
	    jsxc.sha1 = __webpack_require__(1);

	    // initializing rest api
	    jsxc.rest.init();

	    // help
	    jsxc.help.init();

	    // Register event listener for the storage event
	    window.addEventListener('storage', jsxc.storage.onStorage, false);

	    $(document).on('attached.jsxc', function() {
	      // Looking for logout element
	      if (jsxc.options.logoutElement !== null && $(jsxc.options.logoutElement).length > 0) {
	        var logout = function(ev) {
	          if (!jsxc.xmpp.conn || !jsxc.xmpp.conn.authenticated) {
	            return;
	          }

	          ev.stopPropagation();
	          ev.preventDefault();

	          jsxc.options.logoutElement = $(this);
	          jsxc.triggeredFromLogout = true;

	          jsxc.xmpp.logout();
	        };

	        jsxc.options.logoutElement = $(jsxc.options.logoutElement);

	        jsxc.options.logoutElement.off('click', null, logout).one('click', logout);
	      }
	    });

	    var isStorageAttachParameters = jsxc.storage.getItem('rid') && jsxc.storage.getItem('sid') &&
	        jsxc.storage.getItem('jid');
	    var isOptionsAttachParameters = jsxc.options.xmpp.rid && jsxc.options.xmpp.sid &&
	        jsxc.options.xmpp.jid;
	    var isForceLoginForm = jsxc.options.loginForm && jsxc.options.loginForm.ifFound === 'force' &&
	        jsxc.isLoginForm();

	    // Check if we have to establish a new connection
	    if ((!isStorageAttachParameters && !isOptionsAttachParameters) || isForceLoginForm) {

	      // clean up rid and sid
	      jsxc.storage.removeItem('rid');
	      jsxc.storage.removeItem('sid');

	      // Looking for a login form
	      if (!jsxc.isLoginForm()) {

	        if (jsxc.options.displayRosterMinimized()) {
	          // Show minimized roster
	          jsxc.storage.setUserItem('roster', 'hidden');
	          jsxc.gui.roster.init();
	          jsxc.gui.roster.noConnection();
	        }

	        return;
	      }

	      if (typeof jsxc.options.formFound === 'function') {
	        jsxc.options.formFound.call();
	      }

	      // create jquery object
	      var form = jsxc.options.loginForm.form = $(jsxc.options.loginForm.form);
	      var events = form.data('events') || {
	            submit : []
	          };
	      var submits = [];

	      // save attached submit events and remove them. Will be reattached
	      // in jsxc.submitLoginForm
	      $.each(events.submit, function(index, val) {
	        submits.push(val.handler);
	      });

	      form.data('submits', submits);
	      form.off('submit');

	      // Add jsxc login action to form
	      form.submit(function() {
	        jsxc.prepareLogin(function(settings) {
	          if (settings !== false) {
	            // settings.xmpp.onlogin is deprecated since v2.1.0
	            var enabled = (settings.loginForm && settings.loginForm.enable) ||
	                (settings.xmpp && settings.xmpp.onlogin);
	            enabled = enabled === "true" || enabled === true;

	            if (enabled) {
	              jsxc.options.loginForm.triggered = true;

	              jsxc.xmpp.login(jsxc.options.xmpp.jid, jsxc.options.xmpp.password);
	            }
	          } else {
	            jsxc.submitLoginForm();
	          }
	        });

	        // Trigger submit in jsxc.xmpp.connected()
	        return false;
	      });

	    } else if (!jsxc.isLoginForm() ||
	        (jsxc.options.loginForm && jsxc.options.loginForm.ifFound === 'attach')) {

	      // Restore old connection

	      if (typeof jsxc.storage.getItem('alive') !== 'number') {
	        jsxc.onMaster();
	      } else {
	        jsxc.checkMaster();
	      }
	    }

	  },

	  /**
	   * Attach to previous session if jid, sid and rid are available
	   * in storage or options (default behaviour also for {@link jsxc.init}).
	   *
	   * @memberOf jsxc
	   */
	  /**
	   * Start new chat session with given jid and password.
	   *
	   * @memberOf jsxc
	   * @param {string} jid Jabber Id
	   * @param {string} password Jabber password
	   */
	  /**
	   * Attach to new chat session with jid, sid and rid.
	   *
	   * @memberOf jsxc
	   * @param {string} jid Jabber Id
	   * @param {string} sid Session Id
	   * @param {string} rid Request Id
	   */
	  start : function() {
	    var args = arguments;

	    if (jsxc.role_allocation && !jsxc.master) {
	      jsxc.debug('There is an other master tab');

	      return false;
	    }

	    if (jsxc.xmpp.conn && jsxc.xmpp.connected) {
	      jsxc.debug('We are already connected');

	      return false;
	    }

	    if (args.length === 3) {
	      $(document).one('attached.jsxc', function() {
	        // save rid after first attachment
	        jsxc.xmpp.onRidChange(jsxc.xmpp.conn._proto.rid);

	        jsxc.onMaster();
	      });
	    }

	    jsxc.checkMaster(function() {

	      jsxc.xmpp.login.apply(this, args);

	    });
	  },

	  /**
	   * Returns true if login form is found.
	   *
	   * @memberOf jsxc
	   * @returns {boolean} True if login form was found.
	   */
	  isLoginForm : function() {
	    return jsxc.options.loginForm.form && jsxc.el_exists(jsxc.options.loginForm.form) &&
	        jsxc.el_exists(jsxc.options.loginForm.jid) && jsxc.el_exists(jsxc.options.loginForm.pass);
	  },

	  /**
	   * Load settings and prepare jid.
	   *
	   * @memberOf jsxc
	   * @param {string} username
	   * @param {string} password
	   * @param {function} cb Called after login is prepared with result as param
	   */
	  prepareLogin : function(username, password, cb) {
	    if (typeof username === 'function') {
	      cb = username;
	      username = null;
	    }
	    username = username || $(jsxc.options.loginForm.jid).val();
	    password = password || $(jsxc.options.loginForm.pass).val();

	    if (!jsxc.triggeredFromBox && (jsxc.options.loginForm.onConnecting === 'dialog' ||
	        typeof jsxc.options.loginForm.onConnecting === 'undefined')) {
	      jsxc.gui.showWaitAlert(jsxc.t('Logging_in'));
	    }

	    var settings;

	    if (typeof jsxc.options.loadSettings === 'function') {
	      settings = jsxc.options.loadSettings.call(this, username, password, function(s) {
	        jsxc._prepareLogin(username, password, cb, s);
	      });

	      if (typeof settings !== 'undefined') {
	        jsxc._prepareLogin(username, password, cb, settings);
	      }
	    } else {
	      jsxc._prepareLogin(username, password, cb);
	    }
	  },

	  /**
	   * Process xmpp settings and save loaded settings.
	   *
	   * @private
	   * @memberOf jsxc
	   * @param {string} username
	   * @param {string} password
	   * @param {function} cb Called after login is prepared with result as param
	   * @param {object} [loadedSettings] additonal options
	   */
	  _prepareLogin : function(username, password, cb, loadedSettings) {
	    if (loadedSettings === false) {
	      jsxc.warn('No settings provided');

	      cb(false);
	      return;
	    }

	    // prevent to modify the original object
	    var settings = $.extend(true, {}, jsxc.options);

	    if (loadedSettings) {
	      // overwrite current options with loaded settings;
	      settings = $.extend(true, settings, loadedSettings);
	    } else {
	      loadedSettings = {};
	    }

	    if (typeof settings.xmpp.username === 'string') {
	      username = settings.xmpp.username;
	    }

	    var resource = (settings.xmpp.resource) ? '/' + settings.xmpp.resource : '';
	    var domain = settings.xmpp.domain;
	    var jid;

	    if (username.match(/@(.*)$/)) {
	      jid = (username.match(/\/(.*)$/)) ? username : username + resource;
	    } else {
	      jid = username + '@' + domain + resource;
	    }

	    if (typeof jsxc.options.loginForm.preJid === 'function') {
	      jid = jsxc.options.loginForm.preJid(jid);
	    }

	    jsxc.bid = jsxc.jidToBid(jid);

	    settings.xmpp.username = jid.split('@')[0];
	    settings.xmpp.domain = jid.split('@')[1].split('/')[0];
	    settings.xmpp.resource = jid.split('@')[1].split('/')[1] || "";

	    if (!loadedSettings.xmpp) {
	      // force xmpp settings to be saved to storage
	      loadedSettings.xmpp = {};
	    }

	    // save loaded settings to storage
	    $.each(loadedSettings, function(key) {
	      var old = jsxc.options.get(key);
	      var val = settings[key];
	      val = $.extend(true, old, val);

	      jsxc.options.set(key, val);
	    });

	    jsxc.options.xmpp.jid = jid;
	    jsxc.options.xmpp.password = password;

	    cb(settings);
	  },

	  /**
	   * Called if the script is a slave
	   *
	   *  /!\ Modified, slave use is deprecated for now
	   *
	   *
	   */
	  onSlave : function() {

	    jsxc.debug('I am the slave.');

	    // call flag of method
	    jsxc.role_allocation = true;

	    // disconnect
	    if (jsxc.xmpp.conn) {
	      jsxc.xmpp.logout(true);
	    }

	    // show warning
	    if ($('#jsxc_slaveClientWarning').length < 1) {
	      var header = '<div id="jsxc_slaveClientWarning">' + jsxc.t('client_slave_warning') + '</div>';
	      $("body").prepend(header);
	    }

	    /**
	     *
	     * SLAVE UTILISATION DISABLED
	     *
	     * Instead of gui a warning message is displayed
	     *
	     */
	    // jsxc.bid = jsxc.jidToBid(jsxc.storage.getItem('jid'));
	    //
	    // jsxc.gui.init();
	    //
	    // jsxc.restoreRoster();
	    // jsxc.restoreWindows();
	    // jsxc.restoreCompleted = true;
	    //
	    // $(document).trigger('restoreCompleted.jsxc');
	  },

	  /**
	   * Called if the script is the master
	   */
	  onMaster : function() {
	    jsxc.debug('I am master.');

	    jsxc.master = true;

	    // Init local storage
	    jsxc.storage.setItem('alive', 0);
	    jsxc.storage.setItem('alive_busy', 0);

	    // Sending keepalive signal
	    jsxc.startKeepAlive();

	    jsxc.role_allocation = true;

	    // master have to be disconnected from client on unload
	    jsxc._disconnectBeforeUnload();

	    // Do not automatically connect on master
	    //jsxc.xmpp.login();
	  },

	  /**
	   * Checks if there is a master
	   *
	   * @param {function} [cb] Called if no master was found.
	   */
	  checkMaster : function(cb) {
	    jsxc.debug('check master');

	    cb = (cb && typeof cb === 'function') ? cb : jsxc.onMaster;

	    if (typeof jsxc.storage.getItem('alive') !== 'number') {
	      cb.call();
	    } else {
	      jsxc.to.push(window.setTimeout(cb, 1000));
	      jsxc.storage.ink('alive');
	    }
	  },

	  masterActions : function() {

	    if (!jsxc.xmpp.conn || !jsxc.xmpp.conn.authenticated) {
	      return;
	    }

	    //prepare notifications
	    var noti = jsxc.storage.getUserItem('notification');
	    noti = (typeof noti === 'number') ? noti : 2;
	    if (jsxc.options.notification && noti > 0 && jsxc.notification.hasSupport()) {
	      if (jsxc.notification.hasPermission()) {
	        jsxc.notification.init();
	      } else {
	        jsxc.notification.prepareRequest();
	      }
	    } else {
	      // No support => disable
	      jsxc.options.notification = false;
	    }

	    if (jsxc.options.get('otr').enable) {
	      // create or load DSA key
	      jsxc.otr.createDSA();
	    }

	  },

	  /**
	   * Start sending keep-alive signal
	   */
	  startKeepAlive : function() {
	    jsxc.keepalive = window.setInterval(jsxc.keepAlive, jsxc.options.timeout - 1000);
	  },

	  /**
	   * Sends the keep-alive signal to signal that the master is still there.
	   */
	  keepAlive : function() {
	    jsxc.storage.ink('alive');
	  },

	  /**
	   * Send one keep-alive signal with higher timeout, and than resume with
	   * normal signal
	   */
	  keepBusyAlive : function() {
	    if (jsxc.toBusy) {
	      window.clearTimeout(jsxc.toBusy);
	    }

	    if (jsxc.keepalive) {
	      window.clearInterval(jsxc.keepalive);
	    }

	    jsxc.storage.ink('alive_busy');
	    jsxc.toBusy = window.setTimeout(jsxc.startKeepAlive, jsxc.options.busyTimeout - 1000);
	  },

	  /**
	   * Generates a random integer number between 0 and max
	   *
	   * @param {Integer} max
	   * @return {Integer} random integer between 0 and max
	   */
	  random : function(max) {
	    return Math.floor(Math.random() * max);
	  },

	  /**
	   * Checks if there is a element with the given selector
	   *
	   * @param {String} selector jQuery selector
	   * @return {Boolean}
	   */
	  el_exists : function(selector) {
	    return $(selector).length > 0;
	  },

	  /**
	   * Creates a CSS compatible string from a JID
	   *
	   * @param {type} jid Valid Jabber ID
	   * @returns {String} css Compatible string
	   */
	  jidToCid : function(jid) {
	    jsxc.warn('jsxc.jidToCid is deprecated!');

	    var cid = Strophe.getBareJidFromJid(jid).replace('@', '-').replace(/\./g, '-').toLowerCase();

	    return cid;
	  },

	  /**
	   * Create comparable bar jid.
	   *
	   * @memberOf jsxc
	   * @param jid
	   * @returns comparable bar jid
	   */
	  jidToBid : function(jid) {
	    return Strophe.unescapeNode(Strophe.getBareJidFromJid(jid).toLowerCase());
	  },

	  /**
	   * Restore roster
	   */
	  restoreRoster : function() {
	    var buddies = jsxc.storage.getUserItem('buddylist');

	    if (!buddies || buddies.length === 0) {
	      jsxc.debug('No saved buddylist.');

	      jsxc.gui.roster.empty();

	      return;
	    }

	    $.each(buddies, function(index, value) {
	      jsxc.gui.roster.add(value);
	    });

	    jsxc.gui.roster.loaded = true;
	    $(document).trigger('cloaded.roster.jsxc');
	  },

	  /**
	   * Restore all windows
	   */
	  restoreWindows : function() {
	    var windows = jsxc.storage.getUserItem('windowlist');

	    if (windows === null) {
	      return;
	    }

	    $.each(windows, function(index, bid) {
	      var win = jsxc.storage.getUserItem('window', bid);

	      if (!win) {
	        jsxc.debug('Associated window-element is missing: ' + bid);
	        return true;
	      }

	      jsxc.gui.window.init(bid);

	      if (!win.minimize) {
	        jsxc.gui.window.show(bid);
	      } else {
	        jsxc.gui.window.hide(bid);
	      }

	      jsxc.gui.window.setText(bid, win.text);
	    });
	  },

	  /**
	   * This method submits the specified login form.
	   */
	  submitLoginForm : function() {
	    var form = jsxc.options.loginForm.form.off('submit');

	    // Attach original events
	    var submits = form.data('submits') || [];
	    $.each(submits, function(index, val) {
	      form.submit(val);
	    });

	    if (form.find('#submit').length > 0) {
	      form.find('#submit').click();
	    } else {
	      form.submit();
	    }
	  },

	  /**
	   * Escapes some characters to HTML character
	   */
	  escapeHTML : function(text) {
	    text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
	    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	  },

	  /**
	   * Removes all html tags.
	   *
	   * @memberOf jsxc
	   * @param text
	   * @returns stripped text
	   */
	  removeHTML : function(text) {
	    return $('<span>').html(text).text();
	  },

	  /**
	   * Executes only one of the given events
	   *
	   * @param {string} obj.key event name
	   * @param {function} obj.value function to execute
	   * @returns {string} namespace of all events
	   */
	  switchEvents : function(obj) {
	    var ns = Math.random().toString(36).substr(2, 12);
	    var self = this;

	    $.each(obj, function(key, val) {
	      $(document).one(key + '.' + ns, function() {
	        $(document).off('.' + ns);

	        val.apply(self, arguments);
	      });
	    });

	    return ns;
	  },

	  /**
	   * Checks if tab is hidden.
	   *
	   * @returns {boolean} True if tab is hidden
	   */
	  isHidden : function() {
	    var hidden = false;

	    if (typeof document.hidden !== 'undefined') {
	      hidden = document.hidden;
	    } else if (typeof document.webkitHidden !== 'undefined') {
	      hidden = document.webkitHidden;
	    } else if (typeof document.mozHidden !== 'undefined') {
	      hidden = document.mozHidden;
	    } else if (typeof document.msHidden !== 'undefined') {
	      hidden = document.msHidden;
	    }

	    // handle multiple tabs
	    if (hidden && jsxc.master) {
	      jsxc.storage.ink('hidden', 0);
	    } else if (!hidden && !jsxc.master) {
	      jsxc.storage.ink('hidden');
	    }

	    return hidden;
	  },

	  /**
	   * Checks if tab has focus.
	   *
	   * @returns {boolean} True if tabs has focus
	   */
	  hasFocus : function() {
	    var focus = true;

	    if (typeof document.hasFocus === 'function') {
	      focus = document.hasFocus();
	    }

	    if (!focus && jsxc.master) {
	      jsxc.storage.ink('focus', 0);
	    } else if (focus && !jsxc.master) {
	      jsxc.storage.ink('focus');
	    }

	    return focus;
	  },

	  /**
	   * Executes the given function in jsxc namespace.
	   *
	   * @memberOf jsxc
	   * @param {string} fnName Function name
	   * @param {array} fnParams Function parameters
	   * @returns Function return value
	   */
	  exec : function(fnName, fnParams) {
	    var fnList = fnName.split('.');
	    var fn = jsxc[fnList[0]];
	    var i;
	    for (i = 1; i < fnList.length; i++) {
	      fn = fn[fnList[i]];
	    }

	    if (typeof fn === 'function') {
	      return fn.apply(null, fnParams);
	    }
	  },

	  /**
	   * Hash string into 32-bit signed integer.
	   *
	   * @memberOf jsxc
	   * @param {string} str input string
	   * @returns {integer} 32-bit signed integer
	   */
	  hashStr : function(str) {
	    var hash = 0, i;

	    if (!str || str.length === 0) {
	      return hash;
	    }

	    for (i = 0; i < str.length; i++) {
	      hash = ((hash << 5) - hash) + str.charCodeAt(i);
	      hash |= 0; // Convert to 32bit integer
	    }

	    return hash;
	  },

	  isExtraSmallDevice : function() {
	    return $(window).width() < 500;
	  },

	  /**
	   * Debug tool for printing stack trace
	   *
	   */
	  stackTrace : function() {
	    var time = (new Date()).getTime();
	    console.error("Stack trace");
	    console.error("Time: " + time);
	    console.error((new Error()).stack);
	  }

	};


	/**
	 * Handle XMPP stuff.
	 *
	 * @namespace jsxc.xmpp
	 */
	jsxc.xmpp = {

	  conn : null, // connection

	  _showPresences : false,

	  _sentPresences : 0,

	  _receivedPresences : 0,

	  /**
	   * Timer for sending presences to server every n ms
	   * This interval is a HIGH frequency interval, used when user have interactions with GUI.
	   */
	  AUTO_PRESENCE_SENDING_INTERVAL : 4000,

	  /**
	   * This timer is used to send presences at LOW frequency.
	   *
	   * This is a workaround to avoid presence distribution problems at connexion,
	   * when reconnected, ...
	   */
	  LOW_PRESENCE_SENDING_INTERVAL : 12000,

	  /**
	   * Maximum sending, -1 to disable
	   */
	  AUTO_PRESENCE_SENDING_MAX : -1,

	  /**
	   * Timer reference for sending presence every n ms
	   */
	  _autoPresenceSend : null,

	  /**
	   * Return the node of the current user. Example: jean@something/client is connected so
	   * getCurrentNode() return jean
	   * @returns {*}
	   */
	  getCurrentNode : function() {
	    return Strophe.getNodeFromJid(jsxc.xmpp.conn.jid);
	  },

	  /**
	   * Create new connection or attach to old
	   *
	   * @name login
	   * @memberOf jsxc.xmpp
	   * @private
	   */
	  /**
	   * Create new connection with given parameters.
	   *
	   * @name login^2
	   * @param {string} jid
	   * @param {string} password
	   * @memberOf jsxc.xmpp
	   * @private
	   */
	  /**
	   * Attach connection with given parameters.
	   *
	   * @name login^3
	   * @param {string} jid
	   * @param {string} sid
	   * @param {string} rid
	   * @memberOf jsxc.xmpp
	   * @private
	   */
	  login : function() {

	    var self = jsxc.xmpp;

	    // check if not already connected
	    if (jsxc.xmpp.conn && jsxc.xmpp.conn.authenticated) {
	      jsxc.debug('Connection already authenticated.');
	      return;
	    }

	    var jid = null, password = null, sid = null, rid = null;

	    switch (arguments.length) {
	      case 2:
	        jid = arguments[0];
	        password = arguments[1];
	        break;
	      case 3:
	        jid = arguments[0];
	        sid = arguments[1];
	        rid = arguments[2];
	        break;
	      default:
	        sid = jsxc.storage.getItem('sid');
	        rid = jsxc.storage.getItem('rid');

	        if (sid !== null && rid !== null) {
	          jid = jsxc.storage.getItem('jid');
	        } else {
	          sid = jsxc.options.xmpp.sid || null;
	          rid = jsxc.options.xmpp.rid || null;
	          jid = jsxc.options.xmpp.jid;
	        }
	    }

	    // check if jid present
	    if (!jid) {
	      jsxc.warn('Jid required for login');

	      return;
	    }

	    // check if bid present
	    if (!jsxc.bid) {
	      jsxc.bid = jsxc.jidToBid(jid);
	    }

	    // check if url is present
	    var url = jsxc.options.get('xmpp').url;
	    if (!url) {
	      jsxc.warn('xmpp.url required for login');

	      return;
	    }

	    // Register eventlisteners
	    if (!(jsxc.xmpp.conn && jsxc.xmpp.conn.connected)) {

	      $(document).on('connected.jsxc', jsxc.xmpp.connected);
	      $(document).on('attached.jsxc', jsxc.xmpp.attached);
	      $(document).on('disconnected.jsxc', jsxc.xmpp.disconnected);
	      $(document).on('connfail.jsxc', jsxc.xmpp.onConnfail);
	      $(document).on('authfail.jsxc', jsxc.xmpp.onAuthFail);

	      Strophe.addNamespace('RECEIPTS', 'urn:xmpp:receipts');
	    }

	    // Create new connection (no login)
	    jsxc.xmpp.conn = new Strophe.Connection(url);

	    if (jsxc.storage.getItem('debug') === true) {
	      jsxc.xmpp.conn.xmlInput = function(data) {
	        jsxc.debug('<', data);
	      };
	      jsxc.xmpp.conn.xmlOutput = function(data) {
	        jsxc.debug('>', data);
	      };
	    }

	    jsxc.xmpp.conn.nextValidRid = jsxc.xmpp.onRidChange;

	    var callback = function(status, condition) {

	      jsxc.debug("Strophe connexion changed: " + Object.getOwnPropertyNames(Strophe.Status)[status],
	          {status : status, condition : condition});

	      switch (status) {
	        case Strophe.Status.CONNECTING:
	          $(document).trigger('connecting.jsxc');
	          break;
	        case Strophe.Status.CONNECTED:
	          jsxc.bid = jsxc.jidToBid(jsxc.xmpp.conn.jid.toLowerCase());
	          $(document).trigger('connected.jsxc');

	          if (jsxc.master === true) {
	            self.enableOnGuiActivityPresenceSending();
	            self.enableLowPresenceTimer();
	          }

	          break;
	        case Strophe.Status.ATTACHED:
	          $(document).trigger('attached.jsxc');
	          break;
	        case Strophe.Status.DISCONNECTED:
	          $(document).trigger('disconnected.jsxc');

	          self.disableAutoPresenceSending();
	          self.disableLowPresenceTimer();

	          break;
	        case Strophe.Status.CONNFAIL:
	          $(document).trigger('connfail.jsxc');
	          break;
	        case Strophe.Status.AUTHFAIL:
	          $(document).trigger('authfail.jsxc');
	          break;
	      }
	    };

	    if (jsxc.xmpp.conn.caps) {
	      jsxc.xmpp.conn.caps.node = 'djoe-jsxc-client';
	    }

	    if (sid && rid) {
	      jsxc.debug('Try to attach');
	      jsxc.debug('SID: ' + sid);

	      jsxc.reconnect = true;

	      jsxc.xmpp.conn.attach(jid, sid, rid, callback);
	    } else {
	      jsxc.debug('New connection');

	      if (jsxc.xmpp.conn.caps) {
	        // Add system handler, because user handler isn't called before
	        // we are authenticated
	        jsxc.xmpp.conn._addSysHandler(function(stanza) {
	          var from = jsxc.xmpp.conn.domain, c = stanza.querySelector('c'), ver = c.getAttribute(
	              'ver'), node = c.getAttribute('node');

	          var _jidNodeIndex = JSON.parse(localStorage.getItem('strophe.caps._jidNodeIndex')) || {};

	          jsxc.xmpp.conn.caps._jidVerIndex[from] = ver;
	          _jidNodeIndex[from] = node;

	          localStorage.setItem('strophe.caps._jidVerIndex',
	              JSON.stringify(jsxc.xmpp.conn.caps._jidVerIndex));
	          localStorage.setItem('strophe.caps._jidNodeIndex', JSON.stringify(_jidNodeIndex));
	        }, Strophe.NS.CAPS);
	      }

	      jsxc.xmpp.conn.connect(jid, password || jsxc.options.xmpp.password, callback);
	    }
	  },

	  /**
	   * If set to true, parameters and calls are logged
	   */
	  _debugPresences : false,

	  /**
	   * Last datetime of auto presence send
	   */
	  _lastAutoPresenceSent : -1,

	  /**
	   * Automatic sending of presence to inform all users at 'n' ms interval of our state and
	   * our resource (for multimedia stream per example)
	   */
	  launchAutoPresenceTimer : function() {

	    var self = jsxc.xmpp;

	    if (self._debugPresences === true) {

	      jsxc.debug(" ...Starting auto presence sending timer", {
	        interval : self.AUTO_PRESENCE_SENDING_INTERVAL, max : self.AUTO_PRESENCE_SENDING_MAX
	      });

	    }

	    // count only auto presences
	    var i = 0;

	    // clear previous sender if necessary
	    if (self._autoPresenceSend) {
	      clearInterval(self._autoPresenceSend);
	    }

	    // send presences in time interval
	    var autosend = function() {

	      if (!jsxc.xmpp.conn) {
	        clearInterval(self._autoPresenceSend);
	        //jsxc.debug("Not connected, stop auto-sending presences");
	        return;
	      }

	      // check last send
	      var now = new Date().getTime();

	      // too early, cancel sending
	      if ((now - self._lastAutoPresenceSent) < self.AUTO_PRESENCE_SENDING_INTERVAL) {
	        // console.log("To early, abort !");
	        return;
	      }

	      // console.log("On time !");

	      // just on time, save lat sent
	      self._lastAutoPresenceSent = now;

	      // send presence
	      self.sendPres(true);

	      i = i + 1;

	      // stop auto sending if necessary
	      if (self.AUTO_PRESENCE_SENDING_MAX > 0 && i > self.AUTO_PRESENCE_SENDING_MAX) {
	        self.disableAutoPresenceSending();
	      }

	    };

	    self._autoPresenceSend = setInterval(autosend, self.AUTO_PRESENCE_SENDING_INTERVAL);

	    // first call
	    autosend();

	  },

	  /**
	   * Send automatically presences when user is interacting with gui
	   */
	  enableOnGuiActivityPresenceSending : function() {

	    var self = jsxc.xmpp;
	    var gui = $("#jsxc-chat-sidebar");

	    jsxc.debug("Sending presences on gui activity");

	    if (jsxc.master) {
	      // remove eventually older timers
	      gui.off("mouseover", "*", self.launchAutoPresenceTimer);
	      gui.off("mouseout", "*", self.disableAutoPresenceSending);

	      // add timers
	      gui.mouseover(self.launchAutoPresenceTimer);
	      gui.mouseout(self.disableAutoPresenceSending);
	    }

	  },

	  /**
	   * Low presence timer id
	   */
	  _lowPresenceTimer : null,

	  /**
	   * Low presence send is necessary to inform user of our presence if XMPP server
	   * do not distribute presences to our buddylist at connexion
	   *
	   */
	  enableLowPresenceTimer : function() {

	    var self = jsxc.xmpp;

	    self._lowPresenceTimer = setInterval(function() {
	      jsxc.xmpp.sendPres(true);
	    }, self.LOW_PRESENCE_SENDING_INTERVAL);

	  },

	  disableLowPresenceTimer : function() {
	    var self = jsxc.xmpp;
	    clearInterval(self._lowPresenceTimer);
	  },

	  /**
	   * Stop automatic sending of presence
	   */
	  disableAutoPresenceSending : function() {

	    var self = jsxc.xmpp;

	    if (self._debugPresences === true) {
	      jsxc.debug("Stopping auto presence sending timer", {
	        interval : self.AUTO_PRESENCE_SENDING_INTERVAL, max : self.AUTO_PRESENCE_SENDING_MAX
	      });
	    }

	    clearInterval(self._autoPresenceSend);

	  },

	  /**
	   * Logs user out of his xmpp session and does some clean up.
	   *
	   * @param {boolean} complete If set to false, roster will not be removed
	   * @returns {Boolean}
	   */
	  logout : function() {

	    var self = jsxc.xmpp;

	    // send the last presence to inform of disconnection
	    // have to be sent only by master
	    if (jsxc.master === true) {
	      if (self.conn) {
	        self.conn.send($pres({
	          type : "unavailable"
	        }));
	      }
	    }

	    // instruct all tabs
	    jsxc.storage.removeItem('sid');

	    // clean up
	    jsxc.storage.removeUserItem('buddylist');
	    jsxc.storage.removeUserItem('windowlist');
	    jsxc.storage.removeUserItem('unreadMsg');

	    if (jsxc.xmpp.conn === null) {
	      return true;
	    }

	    // Hide dropdown menu
	    $('body').click();

	    // restore all otr objects
	    $.each(jsxc.storage.getUserItem('otrlist') || {}, function(i, val) {
	      jsxc.otr.create(val);
	    });

	    var numOtr = Object.keys(jsxc.otr.objects || {}).length + 1;
	    var disReady = function() {
	      if (--numOtr <= 0) {
	        jsxc.xmpp.conn.flush();

	        setTimeout(function() {
	          if (jsxc.xmpp.conn) {
	            jsxc.xmpp.conn.disconnect();
	          }
	        }, 600);
	      }
	    };

	    // end all private conversations
	    $.each(jsxc.otr.objects || {}, function(key, obj) {
	      if (obj.msgstate === OTR.CONST.MSGSTATE_ENCRYPTED) {
	        obj.endOtr.call(obj, function() {
	          obj.init.call(obj);
	          jsxc.otr.backup(key);

	          disReady();
	        });
	      } else {
	        disReady();
	      }
	    });

	    disReady();

	    // Trigger real logout in jsxc.xmpp.disconnected()
	    return false;
	  },

	  /**
	   * Triggered if connection is established
	   *
	   * @private
	   */
	  connected : function() {

	    jsxc.xmpp.conn.pause();

	    jsxc.xmpp.initNewConnection();

	    jsxc.xmpp.saveSessionParameter();

	    if (jsxc.options.loginForm.triggered) {
	      switch (jsxc.options.loginForm.onConnected || 'submit') {
	        case 'submit':
	          jsxc.submitLoginForm();
	          return;
	        case false:
	          return;
	      }
	    }

	    // start chat

	    jsxc.gui.dialog.close();

	    jsxc.xmpp.conn.resume();
	    jsxc.onMaster();

	    $(document).trigger('attached.jsxc');
	  },

	  /**
	   * Triggered if connection is attached
	   *
	   * @private
	   */
	  attached : function() {

	    jsxc.xmpp.conn.addHandler(jsxc.xmpp.onRosterChanged, 'jabber:iq:roster', 'iq', 'set');
	    jsxc.xmpp.conn.addHandler(jsxc.xmpp.onMessage, null, 'message', 'chat');
	    jsxc.xmpp.conn.addHandler(jsxc.xmpp.onReceived, null, 'message');
	    jsxc.xmpp.conn.addHandler(jsxc.xmpp.onPresence, null, 'presence');

	    jsxc.gui.init();

	    var caps = jsxc.xmpp.conn.caps;
	    var domain = jsxc.xmpp.conn.domain;

	    if (caps) {
	      var conditionalEnable = function() {
	      };

	      if (jsxc.options.get('carbons').enable) {
	        conditionalEnable = function() {
	          if (jsxc.xmpp.conn.caps.hasFeatureByJid(domain, jsxc.CONST.NS.CARBONS)) {
	            jsxc.xmpp.carbons.enable();
	          }
	        };

	        $(document).on('caps.strophe', function onCaps(ev, from) {

	          if (from !== domain) {
	            return;
	          }

	          conditionalEnable();

	          $(document).off('caps.strophe', onCaps);
	        });
	      }

	      if (typeof caps._knownCapabilities[caps._jidVerIndex[domain]] === 'undefined') {
	        var _jidNodeIndex = JSON.parse(localStorage.getItem('strophe.caps._jidNodeIndex')) || {};

	        jsxc.debug('Request server capabilities');

	        caps._requestCapabilities(jsxc.xmpp.conn.domain, _jidNodeIndex[domain],
	            caps._jidVerIndex[domain]);
	      } else {
	        // We know server caps
	        conditionalEnable();
	      }
	    }

	    // Only load roaster if necessary
	    if (!jsxc.reconnect || !jsxc.storage.getUserItem('buddylist')) {
	      // in order to not overide existing presence information, we send
	      // pres first after roster is ready
	      $(document).one('cloaded.roster.jsxc', jsxc.xmpp.sendPres);

	      var iq = $iq({
	        type : 'get'
	      }).c('query', {
	        xmlns : 'jabber:iq:roster'
	      });

	      jsxc.xmpp.conn.sendIQ(iq, jsxc.xmpp.onRoster);
	    } else {
	      jsxc.xmpp.sendPres();

	      if (!jsxc.restoreCompleted) {
	        jsxc.restoreRoster();
	        jsxc.restoreWindows();
	        jsxc.restoreCompleted = true;

	        $(document).trigger('restoreCompleted.jsxc');
	      }
	    }

	    jsxc.xmpp.saveSessionParameter();

	    jsxc.masterActions();
	  },

	  saveSessionParameter : function() {

	    var nomJid = jsxc.jidToBid(jsxc.xmpp.conn.jid).toLowerCase() + '/' +
	        Strophe.getResourceFromJid(jsxc.xmpp.conn.jid);

	    // Save sid and jid
	    jsxc.storage.setItem('sid', jsxc.xmpp.conn._proto.sid);
	    jsxc.storage.setItem('jid', nomJid);
	  },

	  initNewConnection : function() {
	    // make shure roster will be reloaded
	    jsxc.storage.removeUserItem('buddylist');

	    jsxc.storage.removeUserItem('windowlist');
	    jsxc.storage.removeUserItem('own');
	    jsxc.storage.removeUserItem('avatar', 'own');
	    jsxc.storage.removeUserItem('otrlist');
	    jsxc.storage.removeUserItem('unreadMsg');

	    // reset user options
	    jsxc.storage.removeUserElement('options', 'RTCPeerConfig');
	  },

	  /**
	   * Sends presence stanza to server.
	   */
	  sendPres : function(lightPresence) {

	    var self = jsxc.xmpp;

	    // count presences sent
	    self._sentPresences += 1;

	    // disco stuff
	    if (jsxc.xmpp.conn.disco && !lightPresence) {
	      jsxc.xmpp.conn.disco.addIdentity('client', 'web', 'heyDjoe');
	      jsxc.xmpp.conn.disco.addFeature(Strophe.NS.DISCO_INFO);
	      jsxc.xmpp.conn.disco.addFeature(Strophe.NS.RECEIPTS);
	    }

	    // create presence stanza
	    var pres = $pres();

	    if (jsxc.xmpp.conn.caps && !lightPresence) {
	      // attach caps
	      pres.c('c', jsxc.xmpp.conn.caps.generateCapsAttrs()).up();
	    }

	    var presState = jsxc.storage.getUserItem('presence') || 'online';
	    if (presState !== 'online') {
	      pres.c('show').t(presState).up();
	    }

	    var priority = jsxc.options.get('priority');
	    if (priority && typeof priority[presState] !== 'undefined' &&
	        parseInt(priority[presState]) !== 0) {
	      pres.c('priority').t(priority[presState]).up();
	    }

	    //jsxc.debug('Send presence', pres);
	    if (self._showPresences === true) {
	      jsxc.debug('Send presence', {count : self._sentPresences});
	    }
	    jsxc.xmpp.conn.send(pres);
	  },

	  /**
	   * Triggered if lost connection
	   *
	   * @private
	   */
	  disconnected : function() {
	    jsxc.debug('disconnected');

	    jsxc.storage.removeItem('jid');
	    jsxc.storage.removeItem('sid');
	    jsxc.storage.removeItem('rid');
	    jsxc.storage.removeItem('hidden');
	    jsxc.storage.removeUserItem('avatar', 'own');
	    jsxc.storage.removeUserItem('otrlist');

	    $(document).off('connected.jsxc', jsxc.xmpp.connected);
	    $(document).off('attached.jsxc', jsxc.xmpp.attached);
	    $(document).off('disconnected.jsxc', jsxc.xmpp.disconnected);
	    $(document).off('connfail.jsxc', jsxc.xmpp.onConnfail);
	    $(document).off('authfail.jsxc', jsxc.xmpp.onAuthFail);

	    jsxc.xmpp.conn = null;

	    jsxc.gui.roster.noConnection();

	    window.clearInterval(jsxc.keepalive);
	    jsxc.role_allocation = false;
	    jsxc.master = false;
	    jsxc.storage.removeItem('alive');

	    jsxc.error("Disconnected from JSXC");

	  },

	  /**
	   * Triggered on connection fault
	   *
	   * @param {String} condition information why we lost the connection
	   * @private
	   */
	  onConnfail : function(ev, condition) {
	    jsxc.debug('XMPP connection failed: ' + condition);

	    if (jsxc.options.loginForm.triggered) {
	      jsxc.submitLoginForm();
	    }
	  },

	  /**
	   * Triggered on auth fail.
	   *
	   * @private
	   */
	  onAuthFail : function() {

	    if (jsxc.options.loginForm.triggered) {
	      switch (jsxc.options.loginForm.onAuthFail || 'ask') {
	        case 'ask':
	          jsxc.gui.showAuthFail();
	          break;
	        case 'submit':
	          jsxc.submitLoginForm();
	          break;
	        case 'quiet':
	        case false:
	          return;
	      }
	    }
	  },

	  /**
	   * Triggered on initial roster load
	   *
	   * @param {dom} iq
	   * @private
	   */
	  onRoster : function(iq) {
	    /*
	     * <iq from='' type='get' id=''> <query xmlns='jabber:iq:roster'> <item
	     * jid='' name='' subscription='' /> ... </query> </iq>
	     */

	    jsxc.debug('Load roster', iq);

	    var buddies = [];

	    $(iq).find('item').each(function() {
	      var jid = $(this).attr('jid');
	      var name = $(this).attr('name') || jid;
	      var bid = jsxc.jidToBid(jid);
	      var sub = $(this).attr('subscription');

	      buddies.push(bid);

	      jsxc.storage.removeUserItem('res', bid);

	      jsxc.storage.saveBuddy(bid, {
	        jid : jid, name : name, status : 0, sub : sub, res : []
	      });

	      jsxc.gui.roster.add(bid);
	    });

	    if (buddies.length === 0) {
	      jsxc.gui.roster.empty();
	    }

	    jsxc.storage.setUserItem('buddylist', buddies);

	    // load bookmarks
	    jsxc.xmpp.bookmarks.load();

	    jsxc.gui.roster.loaded = true;
	    jsxc.debug('Roster loaded');
	    $(document).trigger('cloaded.roster.jsxc');
	  },

	  /**
	   * Triggerd on roster changes
	   *
	   * @param {dom} iq
	   * @returns {Boolean} True to preserve handler
	   * @private
	   */
	  onRosterChanged : function(iq) {
	    /*
	     * <iq from='' type='set' id=''> <query xmlns='jabber:iq:roster'> <item
	     * jid='' name='' subscription='' /> </query> </iq>
	     */

	    jsxc.debug('onRosterChanged', iq);

	    $(iq).find('item').each(function() {
	      var jid = $(this).attr('jid');
	      var name = $(this).attr('name') || jid;
	      var bid = jsxc.jidToBid(jid);
	      var sub = $(this).attr('subscription');
	      // var ask = $(this).attr('ask');

	      // subscription have to be removed
	      if (sub === 'remove') {
	        jsxc.gui.roster.purge(bid);
	      }

	      // subscription have to be added or updated
	      else {
	        var bl = jsxc.storage.getUserItem('buddylist');

	        // user is not in buddy list, add it
	        if (bl.indexOf(bid) < 0) {
	          bl.push(bid);
	          jsxc.storage.setUserItem('buddylist', bl);
	        }

	        // save buddy informations
	        jsxc.storage.saveBuddy(bid, {
	          jid : jid, name : name, sub : sub
	        });

	        // add roster element if not present
	        if (jsxc.gui.roster.getItem(bid).length < 1) {
	          jsxc.gui.roster.add(bid);
	        }

	        // else just update it
	        else {
	          jsxc.gui.update(bid);
	          jsxc.gui.roster.reorder(bid);
	        }
	      }

	      // Remove pending friendship request from notice list
	      if (sub === 'from' || sub === 'both') {
	        var notices = jsxc.storage.getUserItem('notices');
	        var noticeKey = null, notice;

	        for (noticeKey in notices) {
	          notice = notices[noticeKey];

	          if (notice.fnName === 'gui.showApproveDialog' && notice.fnParams[0] === jid) {
	            jsxc.debug('Remove notice with key ' + noticeKey);

	            jsxc.notice.remove(noticeKey);
	          }
	        }
	      }
	    });

	    if (!jsxc.storage.getUserItem('buddylist') ||
	        jsxc.storage.getUserItem('buddylist').length === 0) {
	      jsxc.gui.roster.empty();
	    }

	    // preserve handler
	    return true;
	  },

	  /**
	   * Change own presence to pres.
	   *
	   * @memberOf jsxc.gui
	   * @param pres {CONST.STATUS} New presence state
	   * @param external {boolean} True if triggered from other tab.
	   */
	  changeOwnPresence : function(pres, external) {

	    if (typeof pres === "undefined") {
	      throw new Error("Presence cannot be undefined: " + pres);
	    }

	    if (external !== true) {
	      jsxc.storage.setUserItem('presence', pres);
	    }

	    if (jsxc.master) {
	      jsxc.xmpp.sendPres();
	    }

	    $(document).trigger('ownpresence.jsxc', pres);
	  },

	  /**
	   * Triggered on incoming presence stanzas
	   *
	   * @param {dom} presence
	   * @private
	   */
	  onPresence : function(presence) {
	    /*
	     * <presence xmlns='jabber:client' type='unavailable' from='' to=''/>
	     *
	     * <presence xmlns='jabber:client' from='' to=''> <priority>5</priority>
	     * <c xmlns='http://jabber.org/protocol/caps'
	     * node='http://psi-im.org/caps' ver='caps-b75d8d2b25' ext='ca cs
	     * ep-notify-2 html'/> </presence>
	     *
	     * <presence xmlns='jabber:client' from='' to=''> <show>chat</show>
	     * <status></status> <priority>5</priority> <c
	     * xmlns='http://jabber.org/protocol/caps' node='http://psi-im.org/caps'
	     * ver='caps-b75d8d2b25' ext='ca cs ep-notify-2 html'/> </presence>
	     */

	    var self = jsxc.xmpp;

	    if (self._showPresences === true) {
	      jsxc.debug('onPresence', {
	        presence : presence, count : self._receivedPresences
	      });
	    }

	    // count presences
	    self._receivedPresences += 1;

	    // presence type
	    var ptype = $(presence).attr('type');

	    // possible fulljid of sender
	    var from = $(presence).attr('from');

	    // full jid of presence from
	    // /!\ May be not a full jid
	    var jid = from.toLowerCase();

	    // ressource of sender
	    var r = Strophe.getResourceFromJid(from);
	    var bid = jsxc.jidToBid(jid);

	    // ignore own presence
	    if (bid === jsxc.jidToBid(jsxc.xmpp.conn.jid)) {
	      return true;
	    }

	    // data on buddy will be stored on browser
	    var data = jsxc.storage.getUserItem('buddy', bid) || {};

	    // array of ressources that is stored on browser
	    // ressources can be connected or not
	    var res = jsxc.storage.getUserItem('res', bid) || {};
	    var status = null;
	    var xVCard = $(presence).find('x[xmlns="vcard-temp:x:update"]');

	    /**
	     * Check presence type
	     */

	    // ignore error presences
	    if (ptype === 'error') {
	      $(document).trigger('error.presence.jsxc', [from, presence]);

	      var error = $(presence).find('error');

	      jsxc.error(
	          '[XMPP] ' + error.attr('code') + ' ' + error.find(">:first-child").prop('tagName'));
	      return true;
	    }

	    // incoming friendship request
	    if (ptype === 'subscribe') {
	      var bl = jsxc.storage.getUserItem('buddylist');

	      // here we can be disconnected
	      if (bl === null) {
	        return true;
	      }

	      if (bl.indexOf(bid) > -1) {
	        jsxc.debug('Auto approve contact request, because he is already in our contact list.');

	        jsxc.xmpp.resFriendReq(jid, true);
	        if (data.sub !== 'to') {
	          jsxc.xmpp.addBuddy(jid, data.name);
	        }

	        return true;
	      }

	      jsxc.storage.setUserItem('friendReq', {
	        jid : jid, approve : -1
	      });
	      jsxc.notice.add(jsxc.t('Friendship_request'), jsxc.t('from') + ' ' + jid,
	          'gui.showApproveDialog', [jid]);

	      return true;
	    }

	    // disconnection presences
	    else if (ptype === 'unavailable' || ptype === 'unsubscribed') {
	      status = jsxc.CONST.STATUS.indexOf('offline');
	    }

	    // custom presences
	    else {
	      var show = $(presence).find('show').text();
	      if (show === '') {
	        status = jsxc.CONST.STATUS.indexOf('online');
	      } else {
	        status = jsxc.CONST.STATUS.indexOf(show);
	      }
	    }

	    /**
	     * Reorganize client resources
	     *
	     * Resources represent possible several XMPP clients attached to one account
	     * The most recent connected resource must appear in priority
	     * because even if a client is supposed to signal his disconnection,
	     * it may not happen
	     */

	    // add current resource to resource array
	    res[r] = status;

	    // max status will be stored in buddy entry and will represent buddy status
	    var maxStatus = 0;

	    // create an resource array sorted by status
	    // will be stored in buddy entry, with at first position the most recent connected resource
	    var sortedRes = [];
	    $.each(res, function(resource, status) {

	      // remove unneeded resources: "null", null, 'offline', ...
	      if (resource === null || resource === "null" || status === 0) {
	        delete res[resource];
	        return true;
	      }

	      // store max status
	      if (status > maxStatus) {
	        maxStatus = status;
	      }

	      // populate the resource array
	      if (resource !== r) {
	        sortedRes.push(resource);
	      }
	    });

	    // last resource on first index, only if status is not offline
	    if (status !== 0) {
	      sortedRes.unshift(r);
	    }

	    data.res = sortedRes;

	    // notify is buddy has come online, and only buddies
	    if (data.status === 0 && maxStatus > 0 && data.type !== 'groupchat') {
	      jsxc.notification.notify({
	        title : data.name, msg : 'Est connecté', source : bid, force : true
	      });
	    }

	    // change status of stored data
	    if (data.type === 'groupchat') {
	      data.status = status;
	    } else {
	      data.status = maxStatus;
	    }

	    // change jid only if necessary, if resource is correct and if not groupchat
	    if (r !== null && r !== "null" && r.length > 1 && status !== 0 && data.type !== "groupchat") {

	      data.jid = jid;

	      if (jsxc.gui.window.get(bid).length > 0) {
	        jsxc.gui.window.get(bid).data('jid', jid);
	      }

	    }

	    // Looking for avatar
	    if (xVCard.length > 0 && data.type !== 'groupchat') {
	      var photo = xVCard.find('photo');

	      if (photo.length > 0 && photo.text() !== data.avatar) {
	        jsxc.storage.removeUserItem('avatar', data.avatar);
	        data.avatar = photo.text();
	      }
	    }

	    jsxc.storage.setUserItem('buddy', bid, data);
	    jsxc.storage.setUserItem('res', bid, res);

	    if (self._showPresences === true) {
	      jsxc.debug('Presence (' + from + '): ' + status);
	    }

	    jsxc.gui.update(bid);
	    jsxc.gui.window.checkBuddy(bid);
	    jsxc.gui.roster.reorder(bid);

	    $(document).trigger('presence.jsxc', [from, status, presence]);

	    // preserve handler
	    return true;
	  },

	  /**
	   * Triggered on incoming message stanzas
	   *
	   * @param {dom} presence
	   * @returns {Boolean}
	   * @private
	   */
	  onMessage : function(stanza) {

	    var forwarded = $(stanza).find('forwarded[xmlns="' + jsxc.CONST.NS.FORWARD + '"]');
	    var message, carbon;

	    if (forwarded.length > 0) {
	      message = forwarded.find('> message');
	      forwarded = true;
	      carbon = $(stanza).find('> [xmlns="' + jsxc.CONST.NS.CARBONS + '"]');

	      if (carbon.length === 0) {
	        carbon = false;
	      }

	      jsxc.debug('Incoming forwarded message', message);
	    } else {
	      message = stanza;
	      forwarded = false;
	      carbon = false;

	      jsxc.debug('Incoming message', message);
	    }

	    var body = $(message).find('body:first').text();

	    if (!body || (body.match(/\?OTR/i) && forwarded)) {
	      return true;
	    }

	    var type = $(message).attr('type');
	    var from = $(message).attr('from');
	    var mid = $(message).attr('id');
	    var bid;

	    var delay = $(message).find('delay[xmlns="urn:xmpp:delay"]');

	    var stamp = (delay.length > 0) ? new Date(delay.attr('stamp')) : new Date();
	    stamp = stamp.getTime();

	    if (carbon) {
	      var direction = (carbon.prop("tagName") === 'sent') ? jsxc.Message.OUT : jsxc.Message.IN;
	      bid = jsxc.jidToBid((direction === 'out') ? $(message).attr('to') : from);

	      jsxc.gui.window.postMessage({
	        bid : bid,
	        direction : direction,
	        msg : body,
	        encrypted : false,
	        forwarded : forwarded,
	        stamp : stamp
	      });

	      return true;

	    } else if (forwarded) {
	      // Someone forwarded a message to us

	      body = from + ' ' + jsxc.t('to') + ' ' + $(stanza).attr('to') + '"' + body + '"';

	      from = $(stanza).attr('from');
	    }

	    var jid = jsxc.jidToBid(from);
	    bid = jsxc.jidToBid(jid);
	    var data = jsxc.storage.getUserItem('buddy', bid);
	    var request = $(message).find("request[xmlns='urn:xmpp:receipts']");

	    // jid not in roster
	    if (data === null) {

	      // load eventual previous messages
	      var unknownHistory = jsxc.storage.getUserItem('unknown-user-chat-history', bid) || [];

	      // show notice if necessary
	      if (unknownHistory.length < 1) {
	        jsxc.notice.add(jsxc.t('unknown_user'),
	            jsxc.t('you_receive_message_from_unknown_user') + " " + Strophe.getNodeFromJid(bid),
	            'gui.showUnknownSender', [bid]);
	      }

	      // keep message to eventually restore it
	      var messageToPost = {
	        bid : bid,
	        direction : jsxc.Message.IN,
	        msg : body,
	        encrypted : false,
	        forwarded : forwarded,
	        stamp : stamp
	      };

	      // save history, only 10 last messages
	      unknownHistory.push(messageToPost);
	      jsxc.storage.setUserItem('unknown-user-chat-history', bid, unknownHistory.slice(-10));

	      return true;
	    }

	    var win = jsxc.gui.window.init(bid);

	    // If we now the full jid, we use it
	    if (type === 'chat' && Strophe.getResourceFromJid(from) !== null) {
	      win.data('jid', from);
	      jsxc.storage.updateUserItem('buddy', bid, {
	        jid : from
	      });
	    }

	    $(document).trigger('message.jsxc', [from, body]);

	    // create related otr object
	    if (jsxc.master && !jsxc.otr.objects[bid]) {
	      jsxc.otr.create(bid);
	    }

	    if (!forwarded && mid !== null && request.length && data !== null &&
	        (data.sub === 'both' || data.sub === 'from') && type === 'chat') {
	      // Send received according to XEP-0184
	      jsxc.xmpp.conn.send($msg({
	        to : from
	      }).c('received', {
	        xmlns : 'urn:xmpp:receipts', id : mid
	      }));
	    }

	    if (jsxc.otr.objects.hasOwnProperty(bid)) {
	      jsxc.otr.objects[bid].receiveMsg(body, {
	        stamp : stamp, forwarded : forwarded
	      });
	    } else {
	      jsxc.gui.window.postMessage({
	        bid : bid,
	        direction : jsxc.Message.IN,
	        msg : body,
	        encrypted : false,
	        forwarded : forwarded,
	        stamp : stamp
	      });
	    }

	    // preserve handler
	    return true;
	  },

	  /**
	   * Triggerd if the rid changed
	   *
	   * @param {integer} rid next valid request id
	   * @private
	   */
	  onRidChange : function(rid) {
	    jsxc.storage.setItem('rid', rid);
	  },

	  /**
	   * response to friendship request
	   *
	   * @param {string} from jid from original friendship req
	   * @param {boolean} approve
	   */
	  resFriendReq : function(from, approve) {

	    if (jsxc.master) {

	      jsxc.xmpp.conn.send($pres({
	        to : from, type : (approve) ? 'subscribed' : 'unsubscribed'
	      }));

	      if (approve === true) {
	        jsxc.api.callback("onBuddyAccepted", [from]);
	      }

	      jsxc.storage.removeUserItem('friendReq');
	      jsxc.gui.dialog.close();

	    } else {
	      jsxc.storage.updateUserItem('friendReq', 'approve', approve);
	    }
	  },

	  /**
	   * Add buddy to my friends
	   *
	   * @param {string} username jid
	   * @param {string} alias
	   */
	  addBuddy : function(username, alias) {
	    var bid = jsxc.jidToBid(username);

	    if (jsxc.master) {
	      // add buddy to roster (trigger onRosterChanged)
	      var iq = $iq({
	        type : 'set'
	      }).c('query', {
	        xmlns : 'jabber:iq:roster'
	      }).c('item', {
	        jid : username, name : alias || ''
	      });
	      jsxc.xmpp.conn.sendIQ(iq);

	      // send subscription request to buddy (trigger onRosterChanged)
	      jsxc.xmpp.conn.send($pres({
	        to : username, type : 'subscribe'
	      }));

	      jsxc.api.callback("onBuddyAdded", [username]);

	      jsxc.storage.removeUserItem('add_' + bid);
	    } else {
	      jsxc.storage.setUserItem('add_' + bid, {
	        username : username, alias : alias || null
	      });
	    }

	  },

	  /**
	   * Remove buddy from my friends
	   *
	   * @param {type} jid
	   */
	  removeBuddy : function(jid) {
	    var bid = jsxc.jidToBid(jid);

	    // Shortcut to remove buddy from roster and cancel all subscriptions
	    var iq = $iq({
	      type : 'set'
	    }).c('query', {
	      xmlns : 'jabber:iq:roster'
	    }).c('item', {
	      jid : jsxc.jidToBid(jid), subscription : 'remove'
	    });
	    jsxc.xmpp.conn.sendIQ(iq);

	    jsxc.gui.roster.purge(bid);

	  },

	  /**
	   * Triggered on incoming messages, whatever the type of
	   * @param stanza
	   * @returns {boolean}
	   */
	  onReceived : function(stanza) {

	    // check if composing presence
	    var composing = $(stanza).find("composing[xmlns='http://jabber.org/protocol/chatstates']");

	    if (composing.length > 0) {

	      var type = $(stanza).attr("type");
	      var from = $(stanza).attr("from");

	      // ignore own notifications in groupchat
	      if (type === "groupchat" && Strophe.getResourceFromJid(from) === jsxc.xmpp.getCurrentNode()) {
	        return true;
	      }

	      jsxc.gui.window.showComposingPresence(from, type);

	      // stop but keep handler
	      return true;
	    }

	    // check if invitation to conference
	    var invitation = $(stanza).find("x[xmlns='jabber:x:conference']");

	    if (invitation.length > 0) {

	      var buddyName = Strophe.getNodeFromJid($(stanza).attr("from"));

	      var roomjid = invitation.attr("jid");

	      var reason = invitation.attr("reason");
	      reason = reason ? "Motif: " + reason : "";
	      
	      jsxc.notice.add(jsxc.t('conversation_invitation'),
	          buddyName + " " + jsxc.t('invite_you_in_conversation'), 'gui.showJoinConversationDialog',
	          [roomjid, buddyName]);

	      // stop but keep handler
	      return true;
	    }

	    // show received acknowledgement
	    var received = $(stanza).find("received[xmlns='urn:xmpp:receipts']");

	    if (received.length) {
	      var receivedId = received.attr('id');
	      var message = new jsxc.Message(receivedId);

	      message.received();
	    }

	    return true;
	  },

	  /**
	   * Public function to send message.
	   *
	   * @memberOf jsxc.xmpp
	   * @param bid css jid of user
	   * @param msg message
	   * @param uid unique id
	   */
	  sendMessage : function(bid, msg, uid) {
	    if (jsxc.otr.objects.hasOwnProperty(bid)) {
	      jsxc.otr.objects[bid].sendMsg(msg, uid);
	    } else {
	      jsxc.xmpp._sendMessage(jsxc.gui.window.get(bid).data('jid'), msg, uid);
	    }
	  },

	  /**
	   * Create message stanza and send it.
	   *
	   * @memberOf jsxc.xmpp
	   * @param jid Jabber id
	   * @param msg Message
	   * @param uid unique id
	   * @private
	   */
	  _sendMessage : function(jid, msg, uid) {
	    var data = jsxc.storage.getUserItem('buddy', jsxc.jidToBid(jid)) || {};
	    var isBar = (jsxc.jidToBid(jid) === jid);
	    var type = data.type || 'chat';

	    var xmlMsg = $msg({
	      to : jid, type : type, id : uid
	    }).c('body').t(msg);

	    if (jsxc.xmpp.carbons.enabled && msg.match(/^\?OTR/)) {
	      xmlMsg.up().c("private", {
	        xmlns : jsxc.CONST.NS.CARBONS
	      });
	    }

	    if (type === 'chat' &&
	        (isBar || jsxc.xmpp.conn.caps.hasFeatureByJid(jid, Strophe.NS.RECEIPTS))) {
	      // Add request according to XEP-0184
	      xmlMsg.up().c('request', {
	        xmlns : 'urn:xmpp:receipts'
	      });
	    }

	    jsxc.xmpp.conn.send(xmlMsg);
	  },

	  /**
	   * This function loads a vcard.
	   *
	   * @memberOf jsxc.xmpp
	   * @param bid
	   * @param cb
	   * @param error_cb
	   */
	  loadVcard : function(bid, cb, error_cb) {
	    if (jsxc.master) {
	      jsxc.xmpp.conn.vcard.get(cb, bid, error_cb);
	    } else {
	      jsxc.storage.setUserItem('vcard', bid, 'request:' + (new Date()).getTime());

	      $(document).one('loaded.vcard.jsxc', function(ev, result) {
	        if (result && result.state === 'success') {
	          cb($(result.data).get(0));
	        } else {
	          error_cb();
	        }
	      });
	    }
	  },

	  /**
	   * Retrieves capabilities.
	   *
	   * @memberOf jsxc.xmpp
	   * @param jid
	   * @returns List of known capabilities
	   */
	  getCapabilitiesByJid : function(jid) {
	    if (jsxc.xmpp.conn) {
	      return jsxc.xmpp.conn.caps.getCapabilitiesByJid(jid);
	    }

	    var jidVerIndex = JSON.parse(localStorage.getItem('strophe.caps._jidVerIndex')) || {};
	    var knownCapabilities = JSON.parse(localStorage.getItem('strophe.caps._knownCapabilities')) ||
	        {};

	    if (jidVerIndex[jid]) {
	      return knownCapabilities[jidVerIndex[jid]];
	    }

	    return null;
	  },

	  /**
	   * Test if jid has given features
	   *
	   * @param  {string}   jid     Jabber id
	   * @param  {string[]} feature Single feature or list of features
	   * @param  {Function} cb      Called with the result as first param.
	   * @return {boolean}          True, if jid has all given features. Null, if we do not know it
	   *     currently.
	   */
	  hasFeatureByJid : function(jid, feature, cb) {
	    var conn = jsxc.xmpp.conn;
	    cb = cb || function() {
	        };

	    if (!feature) {
	      return false;
	    }

	    if (!$.isArray(feature)) {
	      feature = $.makeArray(feature);
	    }

	    var check = function(knownCapabilities) {

	      jsxc.debug("knownCapabilities", knownCapabilities);

	      if (!knownCapabilities) {
	        return null;
	      }
	      var i;
	      for (i = 0; i < feature.length; i++) {
	        if (knownCapabilities['features'].indexOf(feature[i]) < 0) {
	          return false;
	        }
	      }
	      return true;
	    };

	    if (conn.caps._jidVerIndex[jid] && conn.caps._knownCapabilities[conn.caps._jidVerIndex[jid]]) {
	      var hasFeature = check(conn.caps._knownCapabilities[conn.caps._jidVerIndex[jid]]);
	      cb(hasFeature);

	      return hasFeature;
	    }

	    $(document).on('strophe.caps', function(ev, j, capabilities) {

	      if (j === jid) {
	        cb(check(capabilities));

	        $(document).off(ev);
	      }
	    });

	    return null;
	  }
	};

	/**
	 * Handle carbons (XEP-0280);
	 *
	 * @namespace jsxc.xmpp.carbons
	 */
	jsxc.xmpp.carbons = {
	  enabled : false,

	  /**
	   * Enable carbons.
	   *
	   * @memberOf jsxc.xmpp.carbons
	   * @param cb callback
	   */
	  enable : function(cb) {
	    var iq = $iq({
	      type : 'set'
	    }).c('enable', {
	      xmlns : jsxc.CONST.NS.CARBONS
	    });

	    jsxc.xmpp.conn.sendIQ(iq, function() {
	      jsxc.xmpp.carbons.enabled = true;

	      jsxc.debug('Carbons enabled');

	      if (cb) {
	        cb.call(this);
	      }
	    }, function(stanza) {
	      jsxc.warn('Could not enable carbons', stanza);
	    });
	  },

	  /**
	   * Disable carbons.
	   *
	   * @memberOf jsxc.xmpp.carbons
	   * @param cb callback
	   */
	  disable : function(cb) {
	    var iq = $iq({
	      type : 'set'
	    }).c('disable', {
	      xmlns : jsxc.CONST.NS.CARBONS
	    });

	    jsxc.xmpp.conn.sendIQ(iq, function() {
	      jsxc.xmpp.carbons.enabled = false;

	      jsxc.debug('Carbons disabled');

	      if (cb) {
	        cb.call(this);
	      }
	    }, function(stanza) {
	      jsxc.warn('Could not disable carbons', stanza);
	    });
	  },

	  /**
	   * Enable/Disable carbons depending on options key.
	   *
	   * @memberOf jsxc.xmpp.carbons
	   * @param err error message
	   */
	  refresh : function(err) {
	    if (err === false) {
	      return;
	    }

	    if (jsxc.options.get('carbons').enable) {
	      return jsxc.xmpp.carbons.enable();
	    }

	    return jsxc.xmpp.carbons.disable();
	  }
	};

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

	  SCREENSHARING_INVITATION_EXPIRATION : 10000,

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

	    // shortcut for strophe connexion
	    self.conn = jsxc.xmpp.conn;

	    self.updateTurnCredentials();

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
	    var from = $(stanza).attr("from");

	    // ignore eventual messages from current user
	    if (from === self.conn.jid) {
	      //self._log("Ignoring message from current user: ", stanza, "ERROR");

	      // keep handler
	      return true;
	    }

	    // check if stanza is a videoconference invitation
	    var video = $(stanza).find(self.XMPP_VIDEOCONFERENCE.ELEMENT_NAME);
	    var screen = $(stanza).find(self.XMPP_SCREENSHARING.ELEMENT_NAME);
	    // var node = Strophe.getNodeFromJid(from);
	    var status;

	    /**
	     * Videoconference message
	     */
	    if (video.length > 0) {

	      status = video.attr(self.XMPP_VIDEOCONFERENCE.STATUS_ATTR);

	      if (jsxc.mmstream.debug) {
	        self._log("_onMessageReceived: " + status, {status : status, stanza : stanza});
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

	      else if (status === self.XMPP_SCREENSHARING.STATUS.DECLINED) {
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
	   * If user accept, a confirmation is sent to initiator
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
	    var node = Strophe.getNodeFromJid(from);

	    var decline = function() {
	      self._sendScreensharingConfirmationMessage(self.XMPP_SCREENSHARING.STATUS.DECLINED, datetime,
	          from);
	    };

	    if (self._isNavigatorChrome() === false) {
	      jsxc.gui.feedback("__i18nid_:user_try_to_share_screen_but_only_chromium_is_supported",
	          {user : node}, 'warn');
	      decline();
	      return;
	    }

	    if (self.isVideoCallsDisabled() === true) {
	      jsxc.gui.feedback("__i18nid_:user_try_to_share_screen_but_media_disabled", {user : node},
	          'warn');
	      decline();
	      return;
	    }

	    // check if occupied AFTER disable calls
	    if (self._isClientOccupied(from) !== false) {
	      decline();
	      return;
	    }

	    if (now - datetime > self.SCREENSHARING_INVITATION_EXPIRATION) {
	      jsxc.gui.feedback("__i18nid_:received_screensharing_invitation_but_outdated");
	      decline();
	      return;
	    }

	    self.gui._showIncomingScreensharingDialog(from)
	        .then(function() {
	          jsxc.gui.feedback("__i18nid_:screen_sharing_accepted");

	          self._setUserType(from, self.USER_TYPE.SCREENSHARING_INITITATOR);

	          self._sendScreensharingConfirmationMessage(self.XMPP_SCREENSHARING.STATUS.ACCEPT,
	              datetime, from);
	        })
	        .fail(function() {
	          jsxc.gui.feedback("__i18nid_:screen_sharing_refused");
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
	    var node = Strophe.getNodeFromJid(from);

	    self._setUserStatus(from, self.USER_STATUS.HAS_REJECT_CALL);

	    jsxc.gui.feedback("__i18nid_:screensharing_refused_by", {user : node}, 'warn');

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
	                .fail(function() {
	                  jsxc.gui.feedback("__i18nid_:error_while_accessing_camera_and_micro", null,
	                      'warn');
	                  self.multimediacache.occupied = false;
	                });

	          })
	          .fail(function() {
	            jsxc.gui.feedback("__i18nid_:invitation_refused", null, 'warn');
	            self.multimediacache.occupied = false;
	          });
	    }

	    // case 2: Maybe I have to call people was disconnected
	    else {

	      jsxc.gui.feedback("__i18nid_:user_have_been_reinvited_by", {
	        user : target_node, from : Strophe.getNodeFromJid(from)
	      });

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

	    // check if calls are disabled
	    if (self.isVideoCallsDisabled() === true) {

	      jsxc.gui.feedback("__i18nid_:user_tried_to_invite_you_in_videoconference_but_media_disabled",
	          {user : initiator_node}, 'warn');

	      self._declineVideconference(initiator, participants, invitationId, "Occupied");

	      return;
	    }

	    // check if another multimedia session is currently running
	    // AFTER disable calls
	    if (self._isClientOccupied(initiator) !== false) {
	      self._declineVideconference(initiator, participants, invitationId, "Occupied");
	      return;
	    }

	    // check how many participants
	    if (participants.length < 1) {
	      self._log('Too few participants', {stanza : stanza, participants : participants}, 'ERROR');
	      jsxc.gui.feedback("__i18nid_:you_received_videoconference_invitation_but_invalid",
	          {user : initiator_node}, 'warn');
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
	                decline(jsxc.t('access_camera_micro_refused'), error);
	              });

	        })

	        // video conference is rejected
	        .fail(function(error) {
	          decline(jsxc.t('invitation_refused'), error);
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
	    var error = [];

	    // check if a participant to videoconference
	    if (self.multimediacache.userList.indexOf(fulljid) < 0 &&
	        self.multimediacache.initiator !== fulljid) {
	      error = ['__i18nid_:user_do_not_participate_videoconference', {user : node}];
	    }

	    // check if user connected
	    if (self._isBuddyConnectingOrConnected(fulljid) === true) {
	      error = ['__i18nid_:user_already_connected_or_connecting', {user : node}];
	    }

	    if (error.length > 0) {
	      jsxc.gui.feedback(error[0], error[1], 'warn');
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
	              node + " invite you again in videoconference", initiator,
	              self.XMPP_VIDEOCONFERENCE.STATUS.REINVITATION, fulljid);

	          jsxc.gui.feedback("__i18nid_:invitation_sent");

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

	    // close dialog if needed
	    jsxc.gui.dialog.close('video_conference_incoming');

	    // show toast
	    jsxc.gui.feedback("__i18nid_:videoconference_have_been_canceled_by",
	        {user : Strophe.getNodeFromJid(from)}, 'warn');

	    setTimeout(function() {
	      self._clearMultimediacache();
	    }, 1000);

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
	        "Videoconference accepted by " + Strophe.getNodeFromJid(self.conn.jid);

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
	        "Videoconference rejected by " + Strophe.getNodeFromJid(self.conn.jid);

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
	        messageTxt || "Videoconference initated by " + Strophe.getNodeFromJid(initiator);

	    if (reinvitationTarget) {
	      video[self.XMPP_VIDEOCONFERENCE.REINVITE_ATTR] = reinvitationTarget;
	    }

	    // XMPP message stanza
	    var msg = $msg({
	      from : self.conn.jid
	    }).c(self.XMPP_VIDEOCONFERENCE.ELEMENT_NAME, video);

	    var sent = [];

	    // send one invitation to each participants and eventually to initiator if this is a
	    // reinvitation
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
	   * fulljidArray MUST NOT contain initiator jid
	   *
	   * @param fulljidArray
	   */
	  startVideoconference : function(fulljidArray, message) {

	    var self = jsxc.mmstream;

	    jsxc.stats.addEvent("jsxc.mmstream.multimediacache.start");

	    if (self.isVideoCallsDisabled() === true) {
	      jsxc.gui.feedback("__i18nid_:multimedia_calls_are_disabled");
	      self._log('Calls are disabled');
	      return;
	    }

	    if (!fulljidArray || fulljidArray.constructor !== Array) {
	      throw new Error("Illegal argument: " + fulljidArray);
	    }

	    if (fulljidArray.length > self.VIDEOCONFERENCE_MAX_PARTICIPANTS) {
	      throw new Error("Too much participants. Number: " + fulljidArray.length + " / Max: " +
	          self.VIDEOCONFERENCE_MAX_PARTICIPANTS);
	    }

	    if (fulljidArray.length < 2) {
	      throw new Error("Too few participants. Number: " + fulljidArray.length);
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

	            jsxc.gui.feedback("__i18nid_:videconference_will_start_soon");

	          } catch (error) {

	            self._log("Error while starting videoconference: ", error, "ERROR");

	            jsxc.gui.feedback("__i18nid_:error_while_sending_invitations", null, 'warn');

	            self.multimediacache.occupied = false;
	          }
	        })

	        // user cannot access to camera
	        .fail(function() {
	          jsxc.gui.feedback("__i18nid_:access_camera_micro_refused");

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

	    if (self.isVideoCallsDisabled() === true) {
	      jsxc.gui.feedback("__i18nid_:multimedia_calls_are_disabled");
	      self._log('Calls are disabled');
	      return;
	    }

	    jsxc.stats.addEvent("jsxc.mmstream.screensharing.multipart.start");

	    // check if navigator compatible
	    self.checkNavigatorCompatibility("videoconference");

	    // TODO: check if all participants connected ?

	    // check if another multimedia session is currently running
	    if (self._isClientOccupied(null, true) !== false) {
	      return;
	    }

	    jsxc.gui.feedback("__i18nid_:screen_sharing_will_soon_begin");

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
	          jsxc.gui.feedback("__i18nid_:unable_to_catch_screen_please_allow_or_install_extension",
	              null, 'warn');
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
	      jsxc.gui.feedback("__i18nid_:user_already_connected_or_connecting", {user : node}, 'warn');
	      return;
	    }

	    // ask confirmation
	    self.gui._showReinviteUserConfirmationDialog(Strophe.getNodeFromJid(fulljid), "emit")

	        .then(function() {

	          jsxc.gui.feedback("__i18nid_:invitation_sent");

	          // invite all participants
	          self._sendScreensharingInvitations([fulljid], true);

	        })

	        .fail(function() {

	          jsxc.gui.feedback("__i18nid_:operation_canceled");

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

	    // send one invitation to each participants and eventually to initiator if this is a
	    // reinvitation
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
	        message = "__i18nid_:internet_explorer_videoconference_warning";
	      }
	    }

	    else if (task === "screensharing") {
	      if (self._isNavigatorChrome() !== true) {
	        message = "__i18nid_:screensharing_use_chromium_or_chrome";
	      }
	    }

	    else {
	      throw new Error("Unknown task: " + task);
	    }

	    if (message !== "") {
	      jsxc.gui.feedback(message);
	      throw new Error(jsxc.t('message'));
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

	    var screenStreamListener = function(event) {

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

	              window.removeEventListener("message", screenStreamListener);

	              defer.resolve(stream);

	            },

	            // error
	            function(error) {

	              jsxc.error('Screen stream refused', {error : error});

	              self._log("Screen capture declined");

	              jsxc.stats.addEvent("jsxc.mmstream.screensharing.streamRefused");

	              window.removeEventListener("message", screenStreamListener);

	              defer.reject(error);

	            });

	      }
	    };

	    window.addEventListener("message", screenStreamListener);

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

	    if (self.isVideoCallsDisabled() === true) {

	      var node = Strophe.getNodeFromJid(session.peerID);
	      jsxc.gui.feedback("__i18nid_:user_tried_to_contact_you_but_media_disabled", {user : node},
	          'warn');

	      session.end("decline", false);

	      return;
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

	    jsxc.gui.feedback("__i18nid_:file_transfert_incoming_but_not_implemented_yet", null, 'warn');

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
	      jsxc.gui.feedback("__i18nid_:error_while_accessing_camera_and_micro", null, 'warn');
	      self._log("Error while using audio/video", error);
	    };

	    /**
	     * Auto accept calls if specified - only for debug purposes
	     */
	    if (self.auto_accept_debug === true) {

	      if (jsxc.mmstream.debug === true) {
	        self._log("Auto accept call - debug mode");
	      }

	      jsxc.notification.notify("Appel vidéo", "Call accepted automatically: " + bid);

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
	            jsxc.gui.feedback("__i18nid_:call_refused", null, 'warn');
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
	      self._log('_onRemoteStreamAdded', [session, stream]);
	    }

	    if (self.isVideoCallsDisabled() === true) {
	      self._log('Calls are disabled');
	      return;
	    }

	    // TODO check if video and audio is present
	    // var isVideoDevice = stream.getVideoTracks().length > 0;
	    // var isAudioDevice = stream.getAudioTracks().length > 0;

	    var fulljid = session.peerID;

	    // display video stream
	    self.gui._showVideoStream(stream, fulljid);

	    // show media panel if needed
	    jsxc.newgui.toggleMediapanel(true);

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

	    // check if no connection is running
	    if (self.getCurrentVideoSessions().length < 1) {

	      // turn off occupied flag to let people call
	      self.multimediacache.occupied = false;

	    }

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

	    if (self.isVideoCallsDisabled() === true) {
	      jsxc.gui.feedback("__i18nid_:multimedia_calls_are_disabled", null, 'warn');
	      self._log('Calls are disabled');
	      return;
	    }

	    jsxc.stats.addEvent("jsxc.mmstream.videocall.simplecall");

	    // check if user connected
	    if (self._isBuddyConnectingOrConnected(fulljid) === true) {
	      jsxc.gui.feedback("__i18nid_:user_already_connected_or_connecting", {user : node}, 'warn');
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

	          jsxc.gui.feedback("__i18nid_:access_camera_micro_refused", null, 'warn');

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

	      jsxc.gui.feedback("__i18nid_:no_response_after_n_seconds_cancel_call", {
	        user : Strophe.getNodeFromJid(fulljid), time : (self.HANGUP_IF_NO_RESPONSE / 1000)
	      }, 'warn');

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

	      jsxc.gui.feedback("__i18nid_:connection_problem_with",
	          {user : Strophe.getNodeFromJid(fulljid)}, 'warn');

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
	      message = ["__i18nid_:cannot_perform_action_before_end_multimedia_call", null];
	    }

	    else {
	      message = ["__i18nid_:tried_to_contact_you_but_you_are_occupied", {user : node}];
	    }

	    // check if another multimedia session is currently running
	    if (self.multimediacache.occupied !== false) {
	      jsxc.gui.feedback(message[0], message[1], 'warn');
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

	  _videoCallsDisabled : false,

	  /**
	   * Disable all video calls
	   *
	   */
	  disableVideoCalls : function() {
	    // here option is not stored in localstorage
	    // jsxc.options.set('disableVideoCalls', true);

	    jsxc.mmstream._videoCallsDisabled = true;
	  },

	  enableVideoCalls : function() {
	    // here option is not stored in localstorage
	    // jsxc.options.set('disableVideoCalls', false);

	    jsxc.mmstream._videoCallsDisabled = false;
	  },

	  /**
	   * Return true if video calls are disabled
	   * @returns {boolean}
	   */
	  isVideoCallsDisabled : function() {
	    return jsxc.mmstream._videoCallsDisabled;
	  },

	  /**
	   * Checks if cached configuration is valid and if necessary update it.
	   *
	   * @memberOf jsxc.webrtc
	   * @param {string} [url]
	   */
	  updateTurnCredentials : function(url) {

	    // var self = jsxc.mmstream;

	    var peerConfig = jsxc.options.get('RTCPeerConfig');
	    url = url || peerConfig.url;

	    if (typeof url !== "string") {
	      throw new Error("Invalid URL for retrieve turn credentials");
	    }

	    var req = $.ajax(url, {

	      async : true,

	      dataType : 'json',

	      /**
	       * Request success
	       * @param data
	       */
	      success : function(data) {
	        // save configuration
	        peerConfig.iceServers = data;
	        jsxc.options.set('RTCPeerConfig', peerConfig);
	      },

	      /**
	       * Error while requesting
	       */
	      error : function() {
	        jsxc.error("Unable to find TURN credentials", {arguments : arguments});
	      }

	    });

	    return req;
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


	/**
	 * Gui part of the multimedia stream  manager
	 *
	 */
	jsxc.mmstream.gui = {

	  mediapanel : null,

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

	        jsxc.gui.feedback("__i18nid_:call_finished_system_reseted");

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
	            jsxc.gui.feedback("__i18nid_:connection_closed_with", {user : node}, 'warn');
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
	      it.text(jsxc.t('no_connections_now'));
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

	      // user is participating to sreensharing, and we are initiator. add link to reinvite
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
	    jsxc.newgui.addMediaRessource(videoCtr, jsxc.t('my_screen'), {titleControls : [hangup]});

	    // attach video after append elements
	    mmstream.attachMediaStream(video, mmstream.multimediacache.screenStream);

	    // toggle media panel if necessary
	    newgui.toggleMediapanel(true);
	  },

	  /**
	   * Show a dialog explaining how to install screen sharing extension
	   */
	  showInstallScreenSharingExtensionDialog : function() {

	    // show dialog
	    jsxc.gui.dialog.open(jsxc.gui.template.get('installChromeExtension'), {
	      'noClose' : true
	    });

	    $("#jsxc-chrome-extension-link").click(function() {
	      window.open(jsxc.options.get('chromeExtensionURL'));
	    });

	    $("#jsxc_dialog .jsxc_closeInstallChromeExtension").click(function() {
	      jsxc.gui.dialog.close();
	    });

	    $("#jsxc_dialog .jsxc_reloadInstallChromeExtension").click(function() {
	      location.reload();
	    });

	    // add animated gif
	    $('#jsxc_installationIllustration').show().attr('src',
	        jsxc.options.root + '/img/install-chrome-extension.gif');

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
	    videoCtr.append(
	        '<div class="jsxc_connectionInProgress">' + jsxc.t('connection_in_progress') + '</div>');

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
	    jsxc.newgui.addMediaRessource(videoCtr, node,
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
	          jsxc.gui.feedback("__i18nid_:error_while_accessing_camera_and_micro", null, 'warn');
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

	    var dialog = jsxc.gui.dialog.open(
	        jsxc.gui.template.get('reinviteUser_' + mode, Strophe.getNodeFromJid(bid)), {
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

	    // hide chat sidebar and video panel
	    newgui.toggleChatSidebar(false);
	    newgui.toggleMediapanel(false);

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

	      jsxc.newgui.toggleMediapanel(true);
	    });

	    // attach video stream
	    var video = $("#jsxc_dialog video");
	    var stream = jsxc.mmstream.getActiveStream(fulljid);

	    if (stream) {
	      mmstream.attachMediaStream(video, stream);
	    }

	    else {
	      $("#jsxc_dialog h3").text(jsxc.t('video_unavailable'));

	      self._log("Stream is null", {
	        fulljid : fulljid, stream : stream
	      }, 'ERROR');

	    }

	  }

	};

	/* global Favico, emojione*/
	/**
	 * Handle functions for chat window's and buddylist
	 *
	 * @namespace jsxc.gui
	 */
	jsxc.gui = {
	  /** Smilie token to file mapping */
	  emotions : [['O:-) O:)', 'innocent'], ['>:-( >:( &gt;:-( &gt;:(', 'angry'],
	    [':-) :)', 'slight_smile'], [':-D :D', 'grin'], [':-( :(', 'disappointed'], [';-) ;)', 'wink'],
	    [':-P :P', 'stuck_out_tongue'], ['=-O', 'astonished'], [':kiss: :-*', 'kissing_heart'],
	    ['8-) :cool:', 'sunglasses'], [':-X :X', 'zipper_mouth'], [':yes:', 'thumbsup'],
	    [':no:', 'thumbsdown'], [':beer:', 'beer'], [':coffee:', 'coffee'], [':devil:', 'smiling_imp'],
	    [':kiss: :kissing:', 'kissing'], ['@->-- @-&gt;--', 'rose'], [':music:', 'musical_note'],
	    [':love:', 'heart_eyes'], [':heart:', 'heart'], [':brokenheart:', 'broken_heart'],
	    [':zzz:', 'zzz'], [':wait:', 'hand_splayed']],

	  favicon : null,

	  regShortNames : null,

	  emoticonList : {
	    'core' : {
	      ':klaus:' : ['klaus'],
	      ':jabber:' : ['jabber'],
	      ':xmpp:' : ['xmpp'],
	      ':jsxc:' : ['jsxc'],
	      ':owncloud:' : ['owncloud']
	    }, 'emojione' : emojione.emojioneList
	  },

	  /**
	   * Different uri query actions as defined in XEP-0147.
	   *
	   * @namespace jsxc.gui.queryActions
	   */
	  queryActions : {
	    /** xmpp:JID?message[;body=TEXT] */
	    message : function(jid, params) {
	      var win = jsxc.gui.window.open(jsxc.jidToBid(jid));

	      if (params && typeof params.body === 'string') {
	        win.find('.jsxc_textinput').val(params.body);
	      }
	    },

	    /** xmpp:JID?remove */
	    remove : function(jid) {
	      jsxc.gui.showRemoveDialog(jsxc.jidToBid(jid));
	    },

	    /** xmpp:JID?subscribe[;name=NAME] */
	    subscribe : function(jid, params) {
	      jsxc.gui.showContactDialog(jid);

	      if (params && typeof params.name) {
	        $('#jsxc_alias').val(params.name);
	      }
	    },

	    /** xmpp:JID?vcard */
	    vcard : function(jid) {
	      jsxc.gui.showVcard(jid);
	    },

	    /** xmpp:JID?join[;password=TEXT] */
	    join : function(jid, params) {
	      var password = (params && params.password) ? params.password : null;

	      jsxc.muc.showJoinChat(jid, password);
	    }
	  },

	  /**
	   * Creates application skeleton.
	   *
	   * This function is called every time we are attached
	   *
	   * @memberOf jsxc.gui
	   */
	  init : function() {

	    // gui already exist, return
	    if ($('#jsxc-root').length > 0) {
	      return;
	    }

	    // We need these templates often, so we creates some template jquery objects
	    jsxc.gui.windowTemplate = $(jsxc.gui.template.get('chatWindow'));
	    jsxc.gui.buddyTemplate = $(jsxc.gui.template.get('rosterBuddy'));

	    // Append GUI on document
	    jsxc.debug("Adding GUI and roster init");

	    var skeleton = $("<div id='jsxc-root'></div>");
	    skeleton.append($(jsxc.gui.template.get('newgui_chatsidebar')));
	    skeleton.append($(jsxc.gui.template.get('newgui_mediapanel')));

	    $(jsxc.options.rosterAppend + ':first').append(skeleton);

	    // window list must stay here, otherwise too mush style problems appear
	    $(jsxc.options.rosterAppend + ':first').append($(jsxc.gui.template.get('windowList')));

	    // new gui init
	    jsxc.newgui.init();
	    jsxc.gui.interactions.init();

	    // init roster element
	    jsxc.gui.roster.init();

	    jsxc.gui.tooltip('#jsxc-root');
	    jsxc.gui.tooltip('#jsxc_windowList');

	    jsxc.gui.regShortNames = new RegExp(emojione.regShortNames.source + '|(' +
	        Object.keys(jsxc.gui.emoticonList.core).join('|') + ')', 'gi');

	    $(window).resize(jsxc.gui.updateWindowListSB);
	    $('#jsxc_windowList').resize(jsxc.gui.updateWindowListSB);

	    $('#jsxc_windowListSB .jsxc_scrollLeft').click(function() {
	      jsxc.gui.scrollWindowListBy(-200);
	    });
	    $('#jsxc_windowListSB .jsxc_scrollRight').click(function() {
	      jsxc.gui.scrollWindowListBy(200);
	    });

	    $('#jsxc_windowListSB .jsxc_closeAllWindows').click(function() {
	      jsxc.gui.closeAllChatWindows();
	    });

	    $('#jsxc_windowList').on('wheel', function(ev) {
	      if ($('#jsxc_windowList').data('isOver')) {
	        jsxc.gui.scrollWindowListBy((ev.originalEvent.wheelDelta > 0) ? 200 : -200);
	      }
	    });

	    var fo = jsxc.options.get('favicon');
	    if (fo && fo.enable) {
	      jsxc.gui.favicon = new Favico({
	        animation : 'pop', bgColor : fo.bgColor, textColor : fo.textColor
	      });

	      jsxc.gui.favicon.badge(jsxc.storage.getUserItem('unreadMsg') || 0);
	    }

	    // prepare regexp for emotions
	    $.each(jsxc.gui.emotions, function(i, val) {
	      // escape characters
	      var reg = val[0].replace(/(\/|\||\*|\.|\+|\?|\^|\$|\(|\)|\[|\]|\{|\})/g, '\\$1');
	      reg = '(' + reg.split(' ').join('|') + ')';
	      jsxc.gui.emotions[i][2] = new RegExp(reg, 'g');
	    });

	    // change own presence informations
	    var updatePresenceInformations = function(event, pres) {
	      jsxc.gui.updatePresence('own', pres);
	    };

	    // add listener for own presences, and remove it on time
	    $(document).on('ownpresence.jsxc', updatePresenceInformations);
	    $(document).on('disconnected.jsxc', function() {
	      $(document).off('ownpresence.jsxc', updatePresenceInformations);
	    });

	    // remove all window chen disconnected
	    $(document).on('disconnected.jsxc', function() {
	      jsxc.gui.closeAllChatWindows();
	    });
	  },

	  /**
	   * Close all chat windows
	   */
	  closeAllChatWindows : function() {

	    var defer = $.Deferred();

	    var wins = $("#jsxc_windowList .jsxc_windowItem");
	    var toClose = wins.length;
	    var closed = 0;

	    if (wins.length < 1) {
	      defer.resolve();
	    }

	    else {

	      $("#jsxc_windowList .jsxc_windowItem").each(function() {
	        jsxc.gui.window.close($(this).data('bid'), function() {
	          closed++;

	          if (closed >= toClose) {
	            defer.resolve();
	          }
	        });
	      });

	      // replace list after close all, to avoid future window appear out of screen
	      $('#jsxc_windowList ul').css('right', '0px');

	    }

	    return defer.promise();
	  },

	  /**
	   * Init tooltip plugin for given jQuery selector.
	   *
	   * @param {String} selector jQuery selector
	   * @memberOf jsxc.gui
	   */
	  tooltip : function(selector) {
	    $(selector).tooltip({
	      tooltipClass : "jsxc-custom-tooltip", show : {
	        delay : 1000
	      }, content : function() {
	        return $(this).attr('title').replace(/\n/g, '<br />');
	      }
	    });
	  },

	  /**
	   * Updates Information in roster and chatbar
	   *
	   * @param {String} bid bar jid
	   */
	  update : function(bid) {
	    var data = jsxc.storage.getUserItem('buddy', bid);

	    if (!data) {
	      jsxc.debug('No data for ' + bid);
	      return;
	    }

	    var ri = jsxc.gui.roster.getItem(bid); // roster item from user
	    var we = jsxc.gui.window.get(bid); // window element from user
	    var ue = ri.add(we); // both
	    var spot = $('.jsxc_spot[data-bid="' + bid + '"]');

	    // Attach data to corresponding roster item
	    ri.data(data);

	    // Add online status
	    jsxc.gui.updatePresence(bid, jsxc.CONST.STATUS[data.status]);

	    // limite name length to preserve ticks
	    var max = 21;
	    var dspName = "";
	    if (data.name) {
	      dspName = data.name.length > max ? data.name.substring(0, max - 3) + "..." : data.name;
	    }

	    // Change name and add title
	    ue.find('.jsxc_name:first').add(spot).text(dspName).attr('title', jsxc.t('is_', {
	      status : jsxc.t(jsxc.CONST.STATUS[data.status])
	    }));

	    // Update gui according to encryption state
	    switch (data.msgstate) {
	      case 0:
	        we.find('.jsxc_transfer').removeClass('jsxc_enc jsxc_fin').attr('title',
	            jsxc.t('your_connection_is_unencrypted'));
	        we.find('.jsxc_settings .jsxc_verification').addClass('jsxc_disabled');
	        we.find('.jsxc_settings .jsxc_transfer').text(jsxc.t('start_private'));
	        break;
	      case 1:
	        we.find('.jsxc_transfer').addClass('jsxc_enc').attr('title',
	            jsxc.t('your_connection_is_encrypted'));
	        we.find('.jsxc_settings .jsxc_verification').removeClass('jsxc_disabled');
	        we.find('.jsxc_settings .jsxc_transfer').text(jsxc.t('close_private'));
	        break;
	      case 2:
	        we.find('.jsxc_settings .jsxc_verification').addClass('jsxc_disabled');
	        we.find('.jsxc_transfer').removeClass('jsxc_enc').addClass('jsxc_fin').attr('title',
	            jsxc.t('your_buddy_closed_the_private_connection'));
	        we.find('.jsxc_settings .jsxc_transfer').text(jsxc.t('close_private'));
	        break;
	    }

	    // update gui according to verification state
	    if (data.trust) {
	      we.find('.jsxc_transfer').addClass('jsxc_trust').attr('title',
	          jsxc.t('your_buddy_is_verificated'));
	    } else {
	      we.find('.jsxc_transfer').removeClass('jsxc_trust');
	    }

	    // update gui according to subscription state
	    if (data.sub && data.sub !== 'both') {
	      ue.addClass('jsxc_oneway');
	    } else {
	      ue.removeClass('jsxc_oneway');
	    }

	    var info = jsxc.jidToBid(data.jid) + '\n';
	    info += jsxc.t('Subscription') + ': ' + jsxc.t(data.sub) + '\n';
	    info += jsxc.t('Status') + ': ' + jsxc.t(jsxc.CONST.STATUS[data.status]);

	    ri.find('.jsxc_name').attr('title', info);

	    jsxc.gui.updateAvatar(ri.add(we.find('.jsxc_bar')), data.jid, data.avatar);
	  },

	  /**
	   * Update avatar on all given elements.
	   *
	   * @memberOf jsxc.gui
	   * @param {jQuery} el Elements with subelement .jsxc_avatar
	   * @param {string} jid Jid
	   * @param {string} aid Avatar id (sha1 hash of image)
	   */
	  updateAvatar : function(el, jid, aid) {

	    var setAvatar = function(src) {
	      if (src === 0 || src === '0') {
	        if (typeof jsxc.options.defaultAvatar === 'function') {
	          jsxc.options.defaultAvatar.call(el, jid);
	          return;
	        }
	        jsxc.gui.avatarPlaceholder(el.find('.jsxc_avatar'), jid);
	        return;
	      }

	      el.find('.jsxc_avatar').removeAttr('style');

	      el.find('.jsxc_avatar').css({
	        'background-image' : 'url(' + src + ')', 'text-indent' : '999px'
	      });
	    };

	    if (typeof aid === 'undefined') {
	      setAvatar(0);
	      return;
	    }

	    var avatarSrc = jsxc.storage.getUserItem('avatar', aid);

	    if (avatarSrc !== null) {
	      setAvatar(avatarSrc);
	    } else {
	      var handler_cb = function(stanza) {
	        jsxc.debug('vCard', stanza);

	        var vCard = $(stanza).find("vCard > PHOTO");
	        var src;

	        if (vCard.length === 0) {
	          jsxc.debug('No photo provided');
	          src = '0';
	        } else if (vCard.find('EXTVAL').length > 0) {
	          src = vCard.find('EXTVAL').text();
	        } else {
	          var img = vCard.find('BINVAL').text();
	          var type = vCard.find('TYPE').text();
	          src = 'data:' + type + ';base64,' + img;
	        }

	        // concat chunks
	        src = src.replace(/[\t\r\n\f]/gi, '');

	        jsxc.storage.setUserItem('avatar', aid, src);
	        setAvatar(src);
	      };

	      var error_cb = function(msg) {
	        jsxc.warn('Could not load vcard.', msg);

	        jsxc.storage.setUserItem('avatar', aid, 0);
	        setAvatar(0);
	      };

	      // workaround for https://github.com/strophe/strophejs/issues/172
	      if (jsxc.jidToBid(jid) === jsxc.jidToBid(jsxc.xmpp.conn.jid)) {
	        jsxc.xmpp.conn.vcard.get(handler_cb, error_cb);
	      } else {
	        jsxc.xmpp.conn.vcard.get(handler_cb, jsxc.jidToBid(jid), error_cb);
	      }
	    }
	  },

	  /**
	   * Updates scrollbar handlers.
	   *
	   * SB are shown if there are more than 2 windows
	   *
	   * @memberOf jsxc.gui
	   */
	  updateWindowListSB : function() {

	    var newgui = jsxc.newgui;
	    var wins = $("#jsxc_windowList .jsxc_window");
	    var sb = $('#jsxc_windowListSB');

	    if (wins.length > 1) {

	      if (sb.css('display') !== 'block') {
	        sb.css({
	          opacity : 0, display : 'block'
	        }).animate({
	          opacity : 1
	        }, newgui.OPACITY_ANIMATION_DURATION);
	      }

	    }

	    else {

	      if (sb.css('display') === 'block') {
	        sb.animate({
	          opacity : 0
	        }, newgui.OPACITY_ANIMATION_DURATION, function() {
	          sb.css({
	            display : 'none'
	          });
	        });
	      }

	    }

	  },

	  /**
	   * Scroll window list by offset.
	   *
	   * @memberOf jsxc.gui
	   * @param offset
	   */
	  scrollWindowListBy : function(offset) {

	    var scrollWidth = $('#jsxc_windowList>ul').width();
	    var width = $('#jsxc_windowList').width();
	    var el = $('#jsxc_windowList>ul');
	    var right = parseInt(el.css('right')) - offset;
	    var padding = $("#jsxc_windowListSB").width();

	    if (scrollWidth < width) {
	      return;
	    }

	    if (right > 0) {
	      right = 0;
	    }

	    if (right < width - scrollWidth - padding) {
	      right = width - scrollWidth - padding;
	    }

	    el.css('right', right + 'px');
	  },

	  /**
	   * Returns the window element
	   *
	   * @deprecated Use {@link jsxc.gui.window.get} instead.
	   * @param {String} bid
	   * @returns {jquery} jQuery object of the window element
	   */
	  getWindow : function(bid) {

	    jsxc.warn('jsxc.gui.getWindow is deprecated!');

	    return jsxc.gui.window.get(bid);
	  },

	  /**
	   Transform list in menu. Structure must be like that:
	   <container id="idToPass">
	   <ul>
	   <li>Menu elements 1</li>
	   <li>Menu elements 2</li>
	   <li>Menu elements ...</li>
	   </ul>
	   </container>

	   With timeout for closing

	   * @memberof jsxc.gui
	   */
	  toggleList : function(el) {

	    var self = el || $(this);

	    self.disableSelection();

	    self.addClass('jsxc_list');

	    var ul = self.find('ul');
	    var slideUp = null;

	    slideUp = function() {

	      self.removeClass('jsxc_opened');

	      $('body').off('click', null, slideUp);
	    };

	    $(this).click(function() {

	      if (!self.hasClass('jsxc_opened')) {
	        // hide other lists
	        $('body').click();
	        $('body').one('click', slideUp);
	      } else {
	        $('body').off('click', null, slideUp);
	      }

	      window.clearTimeout(ul.data('timer'));

	      self.toggleClass('jsxc_opened');

	      return false;

	    }).mouseleave(function() {
	      ul.data('timer', window.setTimeout(slideUp, 2000));
	    }).mouseenter(function() {
	      window.clearTimeout(ul.data('timer'));
	    });
	  },

	  /**
	   * Creates and show loginbox
	   */
	  showLoginBox : function() {
	    // Set focus to password field
	    $(document).on("complete.dialog.jsxc", function() {
	      $('#jsxc_password').focus();
	    });

	    jsxc.gui.dialog.open(jsxc.gui.template.get('loginBox'));

	    var alert = $('#jsxc_dialog').find('.jsxc_alert');
	    alert.hide();

	    $('#jsxc_dialog').find('form').submit(function(ev) {

	      ev.preventDefault();

	      $(this).find('button[data-jsxc-loading-text]').trigger('btnloading.jsxc');

	      jsxc.options.loginForm.form = $(this);
	      jsxc.options.loginForm.jid = $(this).find('#jsxc_username');
	      jsxc.options.loginForm.pass = $(this).find('#jsxc_password');

	      jsxc.triggeredFromBox = true;
	      jsxc.options.loginForm.triggered = false;

	      jsxc.prepareLogin(function(settings) {
	        if (settings === false) {
	          onAuthFail();
	        } else {
	          $(document).on('authfail.jsxc', onAuthFail);

	          jsxc.xmpp.login();
	        }
	      });
	    });

	    function onAuthFail() {
	      alert.show();
	      jsxc.gui.dialog.resize();

	      $('#jsxc_dialog').find('button').trigger('btnfinished.jsxc');

	      $('#jsxc_dialog').find('input').one('keypress', function() {
	        alert.hide();
	        jsxc.gui.dialog.resize();
	      });
	    }
	  },

	  /**
	   * Creates and show the fingerprint dialog
	   *
	   * @param {String} bid
	   */
	  showFingerprints : function(bid) {
	    jsxc.gui.dialog.open(jsxc.gui.template.get('fingerprintsDialog', bid));
	  },

	  /**
	   * Creates and show the verification dialog
	   *
	   * @param {String} bid
	   */
	  showVerification : function(bid) {

	    // Check if there is a open dialog
	    if ($('#jsxc_dialog').length > 0) {
	      setTimeout(function() {
	        jsxc.gui.showVerification(bid);
	      }, 3000);
	      return;
	    }

	    // verification only possible if the connection is encrypted
	    if (jsxc.storage.getUserItem('buddy', bid).msgstate !== OTR.CONST.MSGSTATE_ENCRYPTED) {
	      jsxc.warn('Connection not encrypted');
	      return;
	    }

	    jsxc.gui.dialog.open(jsxc.gui.template.get('authenticationDialog', bid), {
	      name : 'smp'
	    });

	    // Add handler

	    $('#jsxc_dialog > div:gt(0)').hide();
	    $('#jsxc_dialog > div:eq(0) button').click(function() {

	      $(this).siblings().removeClass('active');
	      $(this).addClass('active');
	      $(this).get(0).blur();

	      $('#jsxc_dialog > div:gt(0)').hide();
	      $('#jsxc_dialog > div:eq(' + ($(this).index() + 1) + ')').show().find('input:first').focus();
	    });

	    // Manual
	    $('#jsxc_dialog > div:eq(1) .jsxc_submit').click(function() {
	      if (jsxc.master) {
	        jsxc.otr.objects[bid].trust = true;
	      }

	      jsxc.storage.updateUserItem('buddy', bid, 'trust', true);

	      jsxc.gui.dialog.close('smp');

	      jsxc.storage.updateUserItem('buddy', bid, 'trust', true);
	      jsxc.gui.window.postMessage({
	        bid : bid, direction : jsxc.Message.SYS, msg : jsxc.t('conversation_is_now_verified')
	      });
	      jsxc.gui.update(bid);
	    });

	    // Question
	    $('#jsxc_dialog > div:eq(2) .jsxc_submit').click(function() {
	      var div = $('#jsxc_dialog > div:eq(2)');
	      var sec = div.find('#jsxc_secret2').val();
	      var quest = div.find('#jsxc_quest').val();

	      if (sec === '' || quest === '') {
	        // Add information for the user which form is missing
	        div.find('input[value=""]').addClass('jsxc_invalid').keyup(function() {
	          if ($(this).val().match(/.*/)) {
	            $(this).removeClass('jsxc_invalid');
	          }
	        });
	        return;
	      }

	      if (jsxc.master) {
	        jsxc.otr.sendSmpReq(bid, sec, quest);
	      } else {
	        jsxc.storage.setUserItem('smp', bid, {
	          sec : sec, quest : quest
	        });
	      }

	      jsxc.gui.dialog.close('smp');

	      jsxc.gui.window.postMessage({
	        bid : bid, direction : jsxc.Message.SYS, msg : jsxc.t('authentication_query_sent')
	      });
	    });

	    // Secret
	    $('#jsxc_dialog > div:eq(3) .jsxc_submit').click(function() {
	      var div = $('#jsxc_dialog > div:eq(3)');
	      var sec = div.find('#jsxc_secret').val();

	      if (sec === '') {
	        // Add information for the user which form is missing
	        div.find('#jsxc_secret').addClass('jsxc_invalid').keyup(function() {
	          if ($(this).val().match(/.*/)) {
	            $(this).removeClass('jsxc_invalid');
	          }
	        });
	        return;
	      }

	      if (jsxc.master) {
	        jsxc.otr.sendSmpReq(bid, sec);
	      } else {
	        jsxc.storage.setUserItem('smp', bid, {
	          sec : sec, quest : null
	        });
	      }

	      jsxc.gui.dialog.close('smp');

	      jsxc.gui.window.postMessage({
	        bid : bid, direction : 'sys', msg : jsxc.t('authentication_query_sent')
	      });
	    });
	  },

	  /**
	   * Create and show approve friendship request dialog
	   *
	   * @param {type} from valid jid
	   */
	  showApproveDialog : function(from) {

	    jsxc.gui.dialog.open(jsxc.gui.template.get('approveDialog'), {
	      'noClose' : true
	    });

	    $('#jsxc_dialog .jsxc_their_jid').text(Strophe.getNodeFromJid(from));

	    $('#jsxc_dialog .jsxc_deny').click(function(ev) {
	      ev.stopPropagation();

	      jsxc.xmpp.resFriendReq(from, false);

	      jsxc.gui.dialog.close();
	    });

	    $('#jsxc_dialog .jsxc_approve').click(function(ev) {
	      ev.stopPropagation();

	      var data = jsxc.storage.getUserItem('buddy', jsxc.jidToBid(from));

	      jsxc.xmpp.resFriendReq(from, true);

	      // If friendship is not mutual show contact dialog
	      if (!data || data.sub !== 'both') {
	        jsxc.gui.showContactDialog(from);
	      }
	    });
	  },

	  /**
	   * Create and show join discussion dialog
	   *
	   * @param {type} from valid jid
	   */
	  showJoinConversationDialog : function(roomjid, buddyName) {

	    jsxc.gui.dialog.open(jsxc.gui.template.get('joinConversationDialog'), {
	      'noClose' : true
	    });

	    $('#jsxc_dialog .jsxc_buddyName').text(Strophe.getNodeFromJid(buddyName));

	    $('#jsxc_dialog .jsxc_deny').click(function(ev) {
	      ev.stopPropagation();

	      jsxc.gui.feedback("__i18nid_:invitation_refused");

	      jsxc.gui.dialog.close();
	    });

	    $('#jsxc_dialog .jsxc_approve').click(function(ev) {
	      ev.stopPropagation();

	      jsxc.gui.dialog.close();

	      // clean up
	      jsxc.gui.window.clear(roomjid);
	      jsxc.storage.setUserItem('member', roomjid, {});

	      // TODO: set title and subject ?
	      jsxc.muc.join(roomjid, jsxc.xmpp.getCurrentNode(), null, null, null, true, true);

	      // open window
	      jsxc.gui.window.open(roomjid);
	    });
	  },

	  /**
	   * Create and show dialog to add a buddy
	   *
	   * @param {string} [username] jabber id
	   */
	  showContactDialog : function(username) {
	    jsxc.gui.dialog.open(jsxc.gui.template.get('contactDialog'));

	    // If we got a friendship request, we would display the username in our
	    // response
	    if (username) {
	      $('#jsxc_username').val(username);
	    }

	    $('#jsxc_username').keyup(function() {
	      if (typeof jsxc.options.getUsers === 'function') {
	        var val = $(this).val();
	        $('#jsxc_userlist').empty();

	        if (val !== '') {
	          jsxc.options.getUsers.call(this, val, function(list) {
	            $.each(list || {}, function(uid, displayname) {
	              var option = $('<option>');
	              option.attr('data-username', uid);
	              option.attr('data-alias', displayname);

	              option.attr('value', uid).appendTo('#jsxc_userlist');

	              if (uid !== displayname) {
	                option.clone().attr('value', displayname).appendTo('#jsxc_userlist');
	              }
	            });
	          });
	        }
	      }
	    });

	    $('#jsxc_username').on('input', function() {
	      var val = $(this).val();
	      var option = $('#jsxc_userlist').find(
	          'option[data-username="' + val + '"], option[data-alias="' + val + '"]');

	      if (option.length > 0) {
	        $('#jsxc_username').val(option.attr('data-username'));
	        $('#jsxc_alias').val(option.attr('data-alias'));
	      }
	    });

	    $('#jsxc_dialog form').submit(function(ev) {
	      ev.preventDefault();

	      var username = $('#jsxc_username').val();
	      var alias = $('#jsxc_alias').val();

	      if (!username.match(/@(.*)$/)) {
	        username += '@' + Strophe.getDomainFromJid(jsxc.storage.getItem('jid'));
	      }

	      // Check if the username is valid
	      if (!username || !username.match(jsxc.CONST.REGEX.JID)) {
	        // Add notification
	        $('#jsxc_username').addClass('jsxc_invalid').keyup(function() {
	          if ($(this).val().match(jsxc.CONST.REGEX.JID)) {
	            $(this).removeClass('jsxc_invalid');
	          }
	        });
	        return false;
	      }
	      jsxc.xmpp.addBuddy(username, alias);

	      jsxc.gui.dialog.close();

	      return false;
	    });
	  },

	  /**
	   * Create and show dialog to remove a buddy
	   *
	   * @param {type} bid
	   * @returns {undefined}
	   */
	  showRemoveDialog : function(bid) {

	    jsxc.gui.dialog.open(jsxc.gui.template.get('removeDialog', bid));

	    var data = jsxc.storage.getUserItem('buddy', bid);

	    $('#jsxc_dialog .jsxc_remove').click(function(ev) {
	      ev.stopPropagation();

	      if (jsxc.master) {
	        jsxc.xmpp.removeBuddy(data.jid);
	      } else {
	        // inform master
	        jsxc.storage.setUserItem('deletebuddy', bid, {
	          jid : data.jid
	        });
	      }

	      jsxc.gui.dialog.close();
	    });
	  },

	  showRemoveManyDialog : function(bidArray) {

	    // show dialog
	    jsxc.gui.dialog.open(jsxc.gui.template.get('removeManyDialog'), {
	      'noClose' : true
	    });

	    var templateList = $('#jsxc_dialog .jsxc_elementsToRemove');

	    // show what will be deleted
	    $.each(bidArray, function(index, element) {
	      templateList.append($("<li>").text(element));
	    });

	    // delete if OK
	    $('#jsxc_dialog .jsxc_remove').click(function(ev) {
	      ev.stopPropagation();

	      $.each(bidArray, function(index, element) {

	        jsxc.xmpp.removeBuddy(element);

	        var data = jsxc.storage.getUserItem('buddy', element);
	        var type = data ? data.type : null;

	        if (type === "groupchat") {
	          jsxc.xmpp.bookmarks.delete(element, false);
	        }

	      });

	      // close dialog
	      jsxc.gui.dialog.close();

	      jsxc.gui.feedback('__i18nid_:elements_have_been_deleted', {
	        nbr : bidArray.length
	      });
	    });

	    $('#jsxc_dialog .jsxc_cancel').click(function() {
	      jsxc.gui.dialog.close();
	      jsxc.gui.feedback("__i18nid_:operation_canceled");
	    });

	  },

	  _feedbackI18nMark : '__i18nid_:',

	  /**
	   * Show a feedback message. Type can be 'info' or 'warn'.
	   *
	   * If message is prefixed with: '__i18nid_:' it will be used as an i18n id.
	   *
	   * @param selector
	   * @returns {JQuery|jQuery|HTMLElement}
	   */
	  feedback : function(message, subst, type, timeout) {

	    var self = jsxc.gui;

	    var defaultType = "info";

	    // message is an i18n id
	    if (message.indexOf(self._feedbackI18nMark) === 0) {
	      var i18nid = message.substring(self._feedbackI18nMark.length, message.length);
	      message = jsxc.t(i18nid, subst);

	      // throw error if id is invalid
	      if (message.indexOf(i18nid) !== -1) {
	        var err = new Error("Invalid i18n id: " + message);
	        setTimeout(function() {
	          throw err;
	        }, 0);
	      }
	    }

	    var bgColors = {
	      info : '#1a1a1a', warn : '#320400'
	    };
	    var icons = {
	      info : 'info', warn : 'warning'
	    };

	    // show the toast
	    $.toast({
	      text : message, // Text that is to be shown in the toast
	      icon : icons[type || defaultType], // Type of toast icon
	      showHideTransition : 'slide', // fade, slide or plain
	      allowToastClose : true, // Boolean value true or false
	      hideAfter : timeout || 3000, // false to make it sticky or number representing the miliseconds
	                                   // as time after which toast needs to be hidden
	      stack : 3, // false if there should be only one toast at a time or a number representing the
	                 // maximum number of toasts to be shown at a time
	      position : 'top-center', // bottom-left or bottom-right or bottom-center or top-left or
	                               // top-right or top-center or mid-center or an object representing
	                               // the left, right, top, bottom values
	      textAlign : 'left',  // Text alignment i.e. left, right or center
	      loader : false,  // Whether to show loader or not. True by default
	      bgColor : bgColors[type || defaultType], // background color of toast
	    });

	  },

	  /**
	   * Show a dialog asking for new etherpad document name, and return a promise
	   */
	  showEtherpadCreationDialog : function(selectedJids) {

	    var defer = $.Deferred();

	    // show dialog
	    jsxc.gui.dialog.open(jsxc.gui.template.get('etherpadCreation'), {
	      'noClose' : true
	    });

	    // create user list to invite
	    var buddyList = jsxc.gui.widgets.createBuddyList("#jsxc_dialog #jsxc-etherpad-dialog-buddylist",
	        selectedJids);

	    $('#jsxc_dialog .jsxc_confirm').click(function(ev) {
	      ev.stopPropagation();

	      // get name of pad
	      var name = $("#jsxc_dialog .jsxc-etherpad-name").val() || "";

	      if(name.length < 3){
	        // TODO show error
	        return;
	      }

	      // get selected items
	      var jids = [];
	      var selectedItems = $("#jsxc_dialog #jsxc-etherpad-dialog-buddylist .jsxc-checked");
	      $.each(selectedItems, function(index, item) {
	        jids.push($(item).data('bid'));
	      });

	      jsxc.gui.dialog.close();

	      defer.resolve({
	        name : name, buddies : jids
	      });

	    });

	    $('#jsxc_dialog .jsxc_cancel').click(function(ev) {
	      ev.stopPropagation();

	      jsxc.gui.dialog.close();

	      defer.reject("user canceled");

	    });

	    $('#jsxc_dialog .jsxc_refresh').click(function(ev) {
	      ev.stopPropagation();

	      jsxc.gui.feedback('__i18nid_:update_in_progress');

	      buddyList.updateBuddyList();
	    });

	    return defer.promise();

	  },

	  /**
	   * Show a dialog asking for new etherpad document name, and return a promise
	   */
	  showSelectContactsDialog : function() {

	    var defer = $.Deferred();

	    // show dialog
	    jsxc.gui.dialog.open(jsxc.gui.template.get('selectContacts'), {
	      'noClose' : true
	    });

	    // create user list to invite
	    var buddyList = jsxc.gui.widgets.createBuddyList("#jsxc_dialog #jsxc-invite-dialog-buddylist");

	    $('#jsxc_dialog .jsxc_confirm').click(function(ev) {
	      ev.stopPropagation();

	      // get selected items
	      var jids = [];
	      var selectedItems = $("#jsxc_dialog #jsxc-invite-dialog-buddylist .jsxc-checked");
	      $.each(selectedItems, function(index, item) {
	        jids.push($(item).data('bid'));
	      });

	      jsxc.gui.dialog.close();

	      defer.resolve(jids);

	    });

	    $('#jsxc_dialog .jsxc_cancel').click(function(ev) {
	      ev.stopPropagation();

	      jsxc.gui.dialog.close();

	      defer.reject("user canceled");

	    });

	    $('#jsxc_dialog .jsxc_refresh').click(function(ev) {
	      ev.stopPropagation();

	      jsxc.gui.feedback('__i18nid_:update_in_progress');

	      buddyList.updateBuddyList();
	    });

	    return defer.promise();

	  },

	  /**
	   * Show a dialog asking for new etherpad document name, and return a promise
	   *
	   *
	   * @param from : jid of sender
	   * @param padId
	   * @param invitationId
	   * @returns {*}
	   */
	  showIncomingEtherpadDialog : function(from, padId, invitationId) {

	    var defer = $.Deferred();

	    // show dialog
	    jsxc.gui.dialog.open(jsxc.gui.template.get('incomingEtherpad', Strophe.getNodeFromJid(from)));

	    $('#jsxc_dialog .jsxc_confirm').click(function(ev) {
	      ev.stopPropagation();

	      jsxc.gui.dialog.close();

	      jsxc.gui.feedback("__i18nid_:etherpad_openning_in_progress");
	      jsxc.etherpad.openpad(padId);

	      defer.resolve("accepted");

	    });

	    $('#jsxc_dialog .jsxc_cancel').click(function(ev) {
	      ev.stopPropagation();

	      jsxc.gui.dialog.close();

	      jsxc.etherpad._sendEtherpadRefusedMessage(from, padId, invitationId);

	      jsxc.gui.feedback("__i18nid_:etherpad_refused");

	    });

	    return defer.promise();

	  },

	  /**
	   * Show a dialog to select a conversation
	   *
	   * @param {type} bid
	   * @returns {undefined}
	   */
	  showConversationSelectionDialog : function() {

	    var defer = $.Deferred();

	    jsxc.gui.dialog.open(jsxc.gui.template.get('selectConversations'));

	    var conversList = jsxc.gui.widgets.createConversationList("#jsxc_dialogConversationList");

	    $('#jsxc_dialog .jsxc_confirm').click(function(ev) {
	      ev.stopPropagation();

	      // get selected elements
	      var selItems = $("#jsxc_dialogConversationList .jsxc-checked");
	      var res = [];

	      $.each(selItems, function(index, element) {
	        res.push($(element).data('conversjid'));
	      });

	      jsxc.gui.dialog.close();

	      defer.resolve(res);

	    });

	    $('#jsxc_dialog .jsxc_cancel').click(function(ev) {
	      ev.stopPropagation();

	      defer.reject("user canceled");

	    });

	    $('#jsxc_dialog .jsxc_refresh').click(function(ev) {
	      ev.stopPropagation();

	      jsxc.gui.feedback('__i18nid_:update_in_progress');

	      conversList.updateConversationList();
	    });

	    return defer.promise();
	  },

	  /**
	   * Create and show a wait dialog
	   *
	   * @param {type} msg message to display to the user
	   * @returns {undefined}
	   */
	  showWaitAlert : function(msg) {
	    jsxc.gui.dialog.open(jsxc.gui.template.get('waitAlert', null, msg), {
	      'noClose' : true
	    });
	  },

	  /**
	   * Create and show a wait dialog
	   *
	   * @param {type} msg message to display to the user
	   * @returns {undefined}
	   */
	  showAlert : function(msg) {
	    jsxc.gui.dialog.open(jsxc.gui.template.get('alert', null, msg));
	  },

	  /**
	   * Create and show a auth fail dialog
	   *
	   * @returns {undefined}
	   */
	  showAuthFail : function() {
	    jsxc.gui.dialog.open(jsxc.gui.template.get('authFailDialog'));

	    if (jsxc.options.loginForm.triggered !== false) {
	      $('#jsxc_dialog .jsxc_cancel').hide();
	    }

	    $('#jsxc_dialog .jsxc_retry').click(function() {
	      jsxc.gui.dialog.close();
	    });

	    $('#jsxc_dialog .jsxc_cancel').click(function() {
	      jsxc.submitLoginForm();
	    });
	  },

	  /**
	   * Create and show a confirm dialog
	   *
	   * @param {String} msg Message
	   * @param {function} confirm
	   * @param {function} dismiss
	   * @returns {undefined}
	   */
	  showConfirmDialog : function(msg, confirm, dismiss) {
	    jsxc.gui.dialog.open(jsxc.gui.template.get('confirmDialog', null, msg), {
	      noClose : true
	    });

	    if (confirm) {
	      $('#jsxc_dialog .jsxc_confirm').click(confirm);
	    }

	    if (dismiss) {
	      $('#jsxc_dialog .jsxc_dismiss').click(dismiss);
	    }
	  },

	  /**
	   * Show about dialog.
	   *
	   * @memberOf jsxc.gui
	   */
	  showAboutDialog : function() {
	    jsxc.gui.dialog.open(jsxc.gui.template.get('aboutDialog'));

	    $('#jsxc_dialog .jsxc_debuglog').click(function() {
	      jsxc.gui.showDebugLog();
	    });

	    $('#jsxc_dialog .jsxc_spaceInvasion').click(function() {
	      jsxc.api.spaceInvasion();
	    });
	  },

	  /**
	   * Show debug log.
	   *
	   * @memberOf jsxc.gui
	   */
	  showDebugLog : function() {
	    var userInfo = '<h3>User information</h3>';

	    if (navigator) {
	      var key;
	      for (key in navigator) {
	        if (typeof navigator[key] === 'string') {
	          userInfo += '<b>' + key + ':</b> ' + navigator[key] + '<br />';
	        }
	      }
	    }

	    if ($.fn && $.fn.jquery) {
	      userInfo += '<b>jQuery:</b> ' + $.fn.jquery + '<br />';
	    }

	    if (window.screen) {
	      userInfo += '<b>Height:</b> ' + window.screen.height + '<br />';
	      userInfo += '<b>Width:</b> ' + window.screen.width + '<br />';
	    }

	    userInfo += '<b>jsxc version:</b> ' + jsxc.version + '<br />';

	    jsxc.gui.dialog.open(
	        '<div class="jsxc_log">' + userInfo + '<h3>Log</h3><pre>' + jsxc.escapeHTML(jsxc.log) +
	        '</pre></div>');
	  },

	  /**
	   * Show vCard of user with the given bar jid.
	   *
	   * @memberOf jsxc.gui
	   * @param {String} jid
	   */
	  showVcard : function(jid) {
	    var bid = jsxc.jidToBid(jid);
	    jsxc.gui.dialog.open(jsxc.gui.template.get('vCard', bid));

	    var data = jsxc.storage.getUserItem('buddy', bid);

	    if (data) {
	      // Display resources and corresponding information
	      var i, j, res, identities, identity = null, cap, client;
	      for (i = 0; i < data.res.length; i++) {
	        res = data.res[i];

	        identities = [];
	        cap = jsxc.xmpp.getCapabilitiesByJid(bid + '/' + res);

	        if (cap !== null && cap.identities !== null) {
	          identities = cap.identities;
	        }

	        client = '';
	        for (j = 0; j < identities.length; j++) {
	          identity = identities[j];
	          if (identity.category === 'client') {
	            if (client !== '') {
	              client += ',\n';
	            }

	            client += identity.name + ' (' + identity.type + ')';
	          }
	        }

	        var status = jsxc.storage.getUserItem('res', bid)[res];

	        $('#jsxc_dialog ul.jsxc_vCard').append(
	            '<li class="jsxc_sep"><strong>' + jsxc.t('Resource') + ':</strong> ' + res + '</li>');
	        $('#jsxc_dialog ul.jsxc_vCard').append(
	            '<li><strong>' + jsxc.t('Client') + ':</strong> ' + client + '</li>');
	        $('#jsxc_dialog ul.jsxc_vCard').append(
	            '<li><strong>' + jsxc.t('Status') + ':</strong> ' + jsxc.t(jsxc.CONST.STATUS[status]) +
	            '</li>');
	      }
	    }

	    var printProp = function(el, depth) {
	      var content = '';

	      el.each(function() {
	        var item = $(this);
	        var children = $(this).children();

	        content += '<li>';

	        var prop = jsxc.t(item[0].tagName);

	        if (prop !== ' ') {
	          content += '<strong>' + prop + ':</strong> ';
	        }

	        if (item[0].tagName === 'PHOTO') {

	        } else if (children.length > 0) {
	          content += '<ul>';
	          content += printProp(children, depth + 1);
	          content += '</ul>';
	        } else if (item.text() !== '') {
	          content += jsxc.escapeHTML(item.text());
	        }

	        content += '</li>';

	        if (depth === 0 && $('#jsxc_dialog ul.jsxc_vCard').length > 0) {
	          if ($('#jsxc_dialog ul.jsxc_vCard li.jsxc_sep:first').length > 0) {
	            $('#jsxc_dialog ul.jsxc_vCard li.jsxc_sep:first').before(content);
	          } else {
	            $('#jsxc_dialog ul.jsxc_vCard').append(content);
	          }
	          content = '';
	        }
	      });

	      if (depth > 0) {
	        return content;
	      }
	    };

	    var failedToLoad = function() {
	      if ($('#jsxc_dialog ul.jsxc_vCard').length === 0) {
	        return;
	      }

	      $('#jsxc_dialog p').remove();

	      var content = '<p>';
	      content += jsxc.t('Sorry_your_buddy_doesnt_provide_any_information');
	      content += '</p>';

	      $('#jsxc_dialog').append(content);
	    };

	    jsxc.xmpp.loadVcard(bid, function(stanza) {

	      if ($('#jsxc_dialog ul.jsxc_vCard').length === 0) {
	        return;
	      }

	      $('#jsxc_dialog p').remove();

	      var photo = $(stanza).find("vCard > PHOTO");

	      if (photo.length > 0) {
	        var img = photo.find('BINVAL').text();
	        var type = photo.find('TYPE').text();
	        var src = 'data:' + type + ';base64,' + img;

	        if (photo.find('EXTVAL').length > 0) {
	          src = photo.find('EXTVAL').text();
	        }

	        // concat chunks
	        src = src.replace(/[\t\r\n\f]/gi, '');

	        var img_el = $('<img class="jsxc_vCard" alt="avatar" />');
	        img_el.attr('src', src);

	        $('#jsxc_dialog h3').before(img_el);
	      }

	      if ($(stanza).find('vCard').length === 0 ||
	          ($(stanza).find('vcard > *').length === 1 && photo.length === 1)) {
	        failedToLoad();
	        return;
	      }

	      printProp($(stanza).find('vcard > *'), 0);

	    }, failedToLoad);
	  },

	  /**
	   Open a dialog box with misc settings.

	   */
	  showSettings : function() {

	    jsxc.gui.dialog.open(jsxc.gui.template.get('settings'));

	    if (jsxc.options.get('xmpp').overwrite === 'false' ||
	        jsxc.options.get('xmpp').overwrite === false) {
	      $('.jsxc_fieldsetXmpp').parent().hide();
	    }

	    $('#jsxc_dialog form').each(function() {
	      var self = $(this);

	      self.find('input[type!="submit"]').each(function() {
	        var id = this.id.split("-");
	        var prop = id[0];
	        var key = id[1];
	        var type = this.type;

	        var data = jsxc.options.get(prop);

	        if (data && typeof data[key] !== 'undefined') {
	          if (type === 'checkbox') {
	            if (data[key] !== 'false' && data[key] !== false) {
	              this.checked = 'checked';
	            }
	          } else {
	            $(this).val(data[key]);
	          }
	        }
	      });
	    });

	    $('#jsxc_dialog form').submit(function() {

	      var self = $(this);
	      var data = {};

	      self.find('input[type!="submit"]').each(function() {
	        var id = this.id.split("-");
	        var prop = id[0];
	        var key = id[1];
	        var val;
	        var type = this.type;

	        if (type === 'checkbox') {
	          val = this.checked;
	        } else {
	          val = $(this).val();
	        }

	        if (!data[prop]) {
	          data[prop] = {};
	        }

	        data[prop][key] = val;
	      });

	      $.each(data, function(key, val) {
	        jsxc.options.set(key, val);
	      });

	      var cb = function(success) {
	        if (typeof self.attr('data-onsubmit') === 'string') {
	          jsxc.exec(self.attr('data-onsubmit'), [success]);
	        }

	        setTimeout(function() {
	          if (success) {
	            self.find('button[type="submit"]').switchClass('btn-primary', 'btn-success');
	          } else {
	            self.find('button[type="submit"]').switchClass('btn-primary', 'btn-danger');
	          }
	          setTimeout(function() {
	            self.find('button[type="submit"]').switchClass('btn-danger btn-success', 'btn-primary');
	          }, 2000);
	        }, 200);
	      };

	      jsxc.options.saveSettinsPermanent.call(this, data, cb);

	      return false;
	    });
	  },

	  /**
	   * Show prompt for notification permission.
	   *
	   * @memberOf jsxc.gui
	   */
	  showRequestNotification : function() {

	    jsxc.switchEvents({
	      'notificationready.jsxc' : function() {
	        jsxc.gui.dialog.close();
	        jsxc.notification.init();
	        jsxc.storage.setUserItem('notification', 1);
	      }, 'notificationfailure.jsxc' : function() {
	        jsxc.gui.dialog.close();
	        jsxc.options.notification = false;
	        jsxc.storage.setUserItem('notification', 0);
	      }
	    });

	    jsxc.gui.showConfirmDialog(jsxc.t('Should_we_notify_you_'), function() {
	      jsxc.gui.dialog.open(jsxc.gui.template.get('pleaseAccept'), {
	        noClose : true
	      });

	      jsxc.notification.requestPermission();
	    }, function() {
	      $(document).trigger('notificationfailure.jsxc');
	    });
	  },

	  /**
	   * Show a warning if an unknown sender sent messages
	   *
	   * @param bid
	   * @param acceptMessage
	   */
	  showUnknownSender : function(bid) {

	    var node = Strophe.getNodeFromJid(bid);

	    jsxc.gui.showConfirmDialog(jsxc.t('unknown_sender_confirmation', {user: node}),

	        /**
	         * User accept to see messages
	         */
	        function() {

	          jsxc.gui.dialog.close();

	          var node = Strophe.getNodeFromJid(bid);

	          // save buddy
	          jsxc.storage.saveBuddy(bid, {
	            jid : bid, name : node, status : 0, sub : 'none', res : []
	          });

	          // init window and post reveived messages
	          jsxc.gui.window.init(bid);

	          var history = jsxc.storage.getUserItem('unknown-user-chat-history', bid);

	          // clear history
	          jsxc.storage.setUserItem('unknown-user-chat-history', bid, []);

	          $.each(history, function(index, message) {
	            jsxc.gui.window.postMessage(message);
	          });

	          jsxc.gui.window.open(bid);

	        },

	        /**
	         * User refused to see messages
	         */
	        function() {
	          jsxc.storage.setUserItem('unknown-user-chat-history', bid, []);
	        });

	  },

	  /**
	   * Update all presence objects for given user.
	   *
	   * @memberOf jsxc.gui
	   * @param bid bar jid of user.
	   * @param {CONST.STATUS} pres New presence state.
	   */
	  updatePresence : function(bid, pres) {

	    if (bid === 'own') {
	      if (pres === 'dnd') {
	        $('#jsxc_menu .jsxc_muteNotification').addClass('jsxc_disabled');
	        jsxc.notification.muteSound(true);
	      } else {
	        $('#jsxc_menu .jsxc_muteNotification').removeClass('jsxc_disabled');

	        if (!jsxc.options.get('muteNotification')) {
	          jsxc.notification.unmuteSound(true);
	        }
	      }
	    }

	    $('[data-bid="' + bid + '"]').each(function() {
	      var el = $(this);

	      el.attr('data-status', pres);

	      if (el.find('.jsxc_avatar').length > 0) {
	        el = el.find('.jsxc_avatar');
	      }

	      el.removeClass('jsxc_' + jsxc.CONST.STATUS.join(' jsxc_')).addClass('jsxc_' + pres);
	    });
	  },

	  /**
	   * Switch read state to UNread and increase counter.
	   *
	   * @memberOf jsxc.gui
	   * @param bid
	   */
	  unreadMsg : function(bid) {
	    var winData = jsxc.storage.getUserItem('window', bid) || {};
	    var count = (winData && winData.unread) || 0;
	    count = (count === true) ? 1 : count + 1; //unread was boolean (<2.1.0)

	    // update user counter
	    winData.unread = count;
	    jsxc.storage.setUserItem('window', bid, winData);

	    // update counter of total unread messages
	    var total = jsxc.storage.getUserItem('unreadMsg') || 0;
	    total++;
	    jsxc.storage.setUserItem('unreadMsg', total);

	    if (jsxc.gui.favicon) {
	      jsxc.gui.favicon.badge(total);
	    }

	    jsxc.gui._unreadMsg(bid, count);
	  },

	  /**
	   * Switch read state to UNread.
	   *
	   * @memberOf jsxc.gui
	   * @param bid
	   * @param count
	   */
	  _unreadMsg : function(bid, count) {
	    var win = jsxc.gui.window.get(bid);

	    if (typeof count !== 'number') {
	      // get counter after page reload
	      var winData = jsxc.storage.getUserItem('window', bid);
	      count = (winData && winData.unread) || 1;
	      count = (count === true) ? 1 : count; //unread was boolean (<2.1.0)
	    }

	    var el = jsxc.gui.roster.getItem(bid).add(win);

	    el.addClass('jsxc_unreadMsg');
	    el.find('.jsxc_unread').text(count);
	  },

	  /**
	   * Switch read state to read.
	   *
	   * @memberOf jsxc.gui
	   * @param bid
	   */
	  readMsg : function(bid) {
	    var win = jsxc.gui.window.get(bid);
	    var winData = jsxc.storage.getUserItem('window', bid);
	    var count = (winData && winData.unread) || 0;
	    count = (count === true) ? 0 : count; //unread was boolean (<2.1.0)

	    var el = jsxc.gui.roster.getItem(bid).add(win);
	    el.removeClass('jsxc_unreadMsg');
	    el.find('.jsxc_unread').text(0);

	    // update counters if not called from other tab
	    if (count > 0) {
	      // update counter of total unread messages
	      var total = jsxc.storage.getUserItem('unreadMsg') || 0;
	      total -= count;
	      jsxc.storage.setUserItem('unreadMsg', total);

	      if (jsxc.gui.favicon) {
	        jsxc.gui.favicon.badge(total);
	      }

	      jsxc.storage.updateUserItem('window', bid, 'unread', 0);
	    }
	  },

	  /**
	   * This function searches for URI scheme according to XEP-0147.
	   *
	   * @memberOf jsxc.gui
	   * @param container In which element should we search?
	   */
	  detectUriScheme : function(container) {
	    container = (container) ? $(container) : $('body');

	    container.find("a[href^='xmpp:']").each(function() {

	      var element = $(this);
	      var href = element.attr('href').replace(/^xmpp:/, '');
	      var jid = href.split('?')[0];
	      var action, params = {};

	      if (href.indexOf('?') < 0) {
	        action = 'message';
	      } else {
	        var pairs = href.substring(href.indexOf('?') + 1).split(';');
	        action = pairs[0];

	        var i, key, value;
	        for (i = 1; i < pairs.length; i++) {
	          key = pairs[i].split('=')[0];
	          value =
	              (pairs[i].indexOf('=') > 0) ? pairs[i].substring(pairs[i].indexOf('=') + 1) : null;

	          params[decodeURIComponent(key)] = decodeURIComponent(value);
	        }
	      }

	      if (typeof jsxc.gui.queryActions[action] === 'function') {
	        element.addClass('jsxc_uriScheme jsxc_uriScheme_' + action);

	        element.off('click').click(function(ev) {
	          ev.stopPropagation();

	          jsxc.gui.queryActions[action].call(jsxc, jid, params);

	          return false;
	        });
	      }
	    });
	  },

	  detectEmail : function(container) {
	    container = (container) ? $(container) : $('body');

	    container.find('a[href^="mailto:"],a[href^="xmpp:"]').each(function() {
	      var spot = $("<span>X</span>").addClass("jsxc_spot");
	      var href = $(this).attr("href").replace(/^ *(mailto|xmpp):/, "").trim();

	      if (href !== '' && href !== jsxc.jidToBid(jsxc.storage.getItem("jid"))) {
	        var bid = jsxc.jidToBid(href);
	        var self = $(this);
	        var s = self.prev();

	        if (!s.hasClass('jsxc_spot')) {
	          s = spot.clone().attr('data-bid', bid);

	          self.before(s);
	        }

	        s.off('click');

	        if (jsxc.storage.getUserItem('buddy', bid)) {
	          jsxc.gui.update(bid);
	          s.click(function() {
	            jsxc.gui.window.open(bid);

	            return false;
	          });
	        } else {
	          s.click(function() {
	            jsxc.gui.showContactDialog(href);

	            return false;
	          });
	        }
	      }
	    });
	  },

	  avatarPlaceholder : function(el, seed, text) {
	    text = text || seed;

	    var options = jsxc.options.get('avatarplaceholder') || {};
	    var hash = jsxc.hashStr(seed);

	    var hue = Math.abs(hash) % 360;
	    var saturation = options.saturation || 90;
	    var lightness = options.lightness || 65;

	    el.css({
	      'background-color' : 'hsl(' + hue + ', ' + saturation + '%, ' + lightness + '%)',
	      'color' : '#fff',
	      'font-weight' : 'bold',
	      'text-align' : 'center',
	      'line-height' : el.height() + 'px',
	      'font-size' : el.height() * 0.6 + 'px'
	    });

	    if (typeof text === 'string' && text.length > 0) {
	      el.text(text[0].toUpperCase());
	    }
	  },

	  /**
	   * Replace shortname emoticons with images.
	   *
	   * @param  {string} str text with emoticons as shortname
	   * @return {string} text with emoticons as images
	   */
	  shortnameToImage : function(str) {
	    str = str.replace(jsxc.gui.regShortNames, function(shortname) {
	      if (typeof shortname === 'undefined' || shortname === '' ||
	          (!(shortname in jsxc.gui.emoticonList.emojione) &&
	          !(shortname in jsxc.gui.emoticonList.core))) {
	        return shortname;
	      }

	      var src, filename;

	      if (jsxc.gui.emoticonList.core[shortname]) {
	        filename =
	            jsxc.gui.emoticonList.core[shortname][jsxc.gui.emoticonList.core[shortname].length -
	            1].replace(/^:([^:]+):$/, '$1');
	        src = jsxc.options.root + '/img/emotions/' + filename + '.svg';
	      } else if (jsxc.gui.emoticonList.emojione[shortname]) {
	        filename =
	            jsxc.gui.emoticonList.emojione[shortname][jsxc.gui.emoticonList.emojione[shortname].length -
	            1];
	        src = jsxc.options.root + '/lib/emojione/assets/svg/' + filename + '.svg';
	      }

	      var div = $('<div>');

	      div.addClass('jsxc_emoticon');
	      div.css('background-image', 'url(' + src + ')');
	      div.attr('title', shortname);

	      return div.prop('outerHTML');
	    });

	    return str;
	  }
	};

	/**
	 * Wrapper for dialog
	 *
	 * @namespace jsxc.gui.dialog
	 */
	jsxc.gui.dialog = {
	  /**
	   * Open a Dialog.
	   *
	   * @memberOf jsxc.gui.dialog
	   * @param {String} data Data of the dialog
	   * @param {Object} [o] Options for the dialog
	   * @param {Boolean} [o.noClose] If true, hide all default close options
	   * @returns {jQuery} Dialog object
	   */
	  open : function(data, o) {

	    var opt = $.extend({
	      name : ''
	    }, o);

	    $.magnificPopup.open({
	      items : {
	        src : '<div data-name="' + opt.name + '" id="jsxc_dialog">' + data + '</div>'
	      }, type : 'inline', modal : opt.noClose, callbacks : {
	        beforeClose : function() {
	          $(document).trigger('cleanup.dialog.jsxc');
	        }, afterClose : function() {
	          $(document).trigger('close.dialog.jsxc');
	        }, open : function() {
	          $('#jsxc_dialog .jsxc_close').click(function(ev) {
	            ev.preventDefault();

	            jsxc.gui.dialog.close();
	          });

	          $('#jsxc_dialog form').each(function() {
	            var form = $(this);

	            form.find('button[data-jsxc-loading-text]').each(function() {
	              var btn = $(this);

	              btn.on('btnloading.jsxc', function() {
	                if (!btn.prop('disabled')) {
	                  btn.prop('disabled', true);

	                  btn.data('jsxc_value', btn.text());

	                  btn.text(btn.attr('data-jsxc-loading-text'));
	                }
	              });

	              btn.on('btnfinished.jsxc', function() {
	                if (btn.prop('disabled')) {
	                  btn.prop('disabled', false);

	                  btn.text(btn.data('jsxc_value'));
	                }
	              });
	            });
	          });

	          jsxc.gui.dialog.resize();

	          $(document).trigger('complete.dialog.jsxc');
	        }
	      }
	    });

	    return $('#jsxc_dialog');
	  },

	  /**
	   * If no name is provided every dialog will be closed,
	   * otherwise only dialog with given name is closed.
	   *
	   * @param {string} [name] Close only dialog with the given name
	   */
	  close : function(name) {
	    jsxc.debug('close dialog');

	    if (typeof name === 'string' && name.length > 0 &&
	        !jsxc.el_exists('#jsxc_dialog[data-name=' + name + ']')) {
	      return;
	    }

	    $.magnificPopup.close();
	  },

	  /**
	   * Resizes current dialog.
	   *
	   * @param {Object} options e.g. width and height
	   */
	  resize : function() {

	  }
	};


	/**
	 * Load message object with given uid.
	 * 
	 * @class Message
	 * @memberOf jsxc
	 * @param {string} uid Unified identifier from message object
	 */
	/**
	 * Create new message object.
	 *
	 * @class Message
	 * @memberOf jsxc
	 * @param {object} args New message properties
	 * @param {string} args.bid
	 * @param {direction} args.direction
	 * @param {string} args.msg
	 * @param {boolean} args.encrypted
	 * @param {boolean} args.forwarded
	 * @param {boolean} args.sender
	 * @param {integer} args.stamp
	 * @param {object} args.attachment Attached data
	 * @param {string} args.attachment.name File name
	 * @param {string} args.attachment.size File size
	 * @param {string} args.attachment.type File type
	 * @param {string} args.attachment.data File data
	 */

	jsxc.Message = function() {

	   /** @member {string} */
	   this._uid = null;

	   /** @member {boolean} */
	   this._received = false;

	   /** @member {boolean} */
	   this.encrypted = false;

	   /** @member {boolean} */
	   this.forwarded = false;

	   /** @member {integer} */
	   this.stamp = new Date().getTime();

	   if (typeof arguments[0] === 'string' && arguments[0].length > 0 && arguments.length === 1) {
	      this._uid = arguments[0];

	      this.load(this._uid);
	   } else if (typeof arguments[0] === 'object' && arguments[0] !== null) {
	      $.extend(this, arguments[0]);
	   }

	   if (!this._uid) {
	      this._uid = new Date().getTime() + ':msg';
	   }
	};

	/**
	 * Load message properties.
	 *
	 * @memberof jsxc.Message
	 * @param  {string} uid
	 */
	jsxc.Message.prototype.load = function(uid) {
	   var data = jsxc.storage.getUserItem('msg', uid);

	   if (!data) {
	      jsxc.debug('Could not load message with uid ' + uid);
	   }

	   $.extend(this, data);
	};

	/**
	 * Save message properties and create thumbnail.
	 *
	 * @memberOf jsxc.Message
	 * @return {Message} this object
	 */
	jsxc.Message.prototype.save = function() {
	   var history;

	   if (this.bid) {
	      history = jsxc.storage.getUserItem('history', this.bid) || [];

	      if (history.indexOf(this._uid) < 0) {
	         if (history.length > jsxc.options.get('numberOfMsg')) {
	            jsxc.Message.delete(history.pop());
	         }
	      } else {
	         history = null;
	      }
	   }

	   if (Image && this.attachment && this.attachment.type.match(/^image\//i) && this.attachment.data) {
	      var sHeight, sWidth, sx, sy;
	      var dHeight = 100,
	         dWidth = 100;
	      var canvas = $("<canvas>").get(0);

	      canvas.width = dWidth;
	      canvas.height = dHeight;

	      var ctx = canvas.getContext("2d");
	      var img = new Image();

	      img.src = this.attachment.data;

	      if (img.height > img.width) {
	         sHeight = img.width;
	         sWidth = img.width;
	         sx = 0;
	         sy = (img.height - img.width) / 2;
	      } else {
	         sHeight = img.height;
	         sWidth = img.height;
	         sx = (img.width - img.height) / 2;
	         sy = 0;
	      }

	      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, dWidth, dHeight);

	      this.attachment.thumbnail = canvas.toDataURL();

	      if (this.direction === 'out') {
	         // save storage
	         this.attachment.data = null;
	      }
	   }

	   var data;

	   if (this.attachment && this.attachment.size > jsxc.options.maxStorableSize && this.direction === 'in') {
	      jsxc.debug('Attachment to large to store');

	      data = this.attachment.data;
	      this.attachment.data = null;
	      this.attachment.persistent = false;

	      //TODO inform user
	   }

	   jsxc.storage.setUserItem('msg', this._uid, this);

	   if (history) {
	      history.unshift(this._uid);

	      jsxc.storage.setUserItem('history', this.bid, history);
	   }

	   if (data && this.attachment) {
	      this.attachment.data = data;
	   }

	   return this;
	};

	/**
	 * Remove object from storage.
	 * 
	 * @memberOf jsxc.Message
	 */
	jsxc.Message.prototype.delete = function() {
	   jsxc.Message.delete(this._uid);
	};

	/**
	 * Returns object as jquery object.
	 *
	 * @memberOf jsxc.Message
	 * @return {jQuery} Representation in DOM
	 */
	jsxc.Message.prototype.getDOM = function() {
	   return jsxc.Message.getDOM(this._uid);
	};

	/**
	 * Mark message as received.
	 * 
	 * @memberOf jsxc.Message
	 */
	jsxc.Message.prototype.received = function() {
	   this._received = true;
	   this.save();

	   this.getDOM().addClass('jsxc_received');
	};

	/**
	 * Returns true if the message was already received.
	 *
	 * @memberOf jsxc.Message
	 * @return {boolean} true means received
	 */
	jsxc.Message.prototype.isReceived = function() {
	   return this._received;
	};

	/**
	 * Remove message with uid.
	 *
	 * @memberOf jsxc.Message
	 * @static
	 * @param  {string} uid message uid
	 */
	jsxc.Message.delete = function(uid) {
	   var data = jsxc.storage.getUserItem('msg', uid);

	   if (data) {
	      jsxc.storage.removeUserItem('msg', uid);

	      if (data.bid) {
	         var history = jsxc.storage.getUserItem('history', data.bid) || [];

	         history = $.grep(history, function(el) {
	            return el !== uid;
	         });

	         jsxc.storage.setUserItem('history', data.bid);
	      }
	   }
	};

	/**
	 * Returns message object as jquery object.
	 *
	 * @memberOf jsxc.Message
	 * @static
	 * @param  {string} uid message uid
	 * @return {jQuery} jQuery representation in DOM
	 */
	jsxc.Message.getDOM = function(uid) {
	   return $('#' + uid.replace(/:/g, '-'));
	};

	/**
	 * Message direction can be incoming, outgoing or system.
	 * 
	 * @typedef {(jsxc.Message.IN|jsxc.Message.OUT|jsxc.Message.SYS)} direction
	 */

	/**
	 * @constant
	 * @type {string}
	 * @default
	 */
	jsxc.Message.IN = 'in';

	/**
	 * @constant
	 * @type {string}
	 * @default
	 */
	jsxc.Message.OUT = 'out';

	/**
	 * @constant
	 * @type {string}
	 * @default
	 */
	jsxc.Message.SYS = 'sys';

	/**
	 * API for manipulating JSXC
	 *
	 */

	jsxc.api = {

	  /**
	   * Availables events can be used for register callbacks
	   */
	  _availableEvents : ['onReconnectRequest', 'onBuddyAdded', 'onBuddyAccepted', "onInit"],

	  /**
	   * Registered callbacks
	   */
	  _callbacks : {},

	  /**
	   * Register callback will be internally called on events. Events can be:
	   * <ul>
	   *   <li>reconnect</li>
	   *   <li>onBuddyAdded</li>
	   * </ul>
	   *
	   * Argument must be an object like this:
	   * {
	   *    "event": function(){},
	   *    "event": function(){},
	   *    "event": function(){},
	   * }
	   *
	   * This method be used before JSXC init
	   *
	   * @param callbacks
	   */
	  registerCallbacks : function(callbacks) {

	    var self = jsxc.api;

	    // check arguments
	    $.each(callbacks, function(event, element) {

	      if (self._availableEvents.indexOf(event) < 0) {
	        throw new Error("Unknown event: " + event + " / Availables: " + self._availableEvents);
	      }

	      if (typeof element !== "function") {
	        throw new Error("Invalid callback, must be a function: " + (typeof element));
	      }

	    });

	    self._callbacks = callbacks;

	  },

	  /**
	   * Add a custom module to JSXC API
	   *
	   * Argument must look like this:
	   *
	   * {
	   *    name: "validJavascriptModuleName",
	   *    module: {....}
	   * }
	   *
	   */
	  registerCustomModule : function(module) {

	    var self = jsxc.api;

	    if (typeof self[module.name] !== "undefined") {
	      throw new Error("Module already exist: " + module.name);
	    }

	    self[module.name] = module.module;

	  },

	  /**
	   * Call all te callbacks bind with an event.
	   *
	   * Return the number of callbacks called
	   *
	   * @param arguments
	   */
	  callback : function(targetEvent, targetArguments) {

	    var self = jsxc.api;

	    var called = 0;

	    // check arguments
	    if (self._availableEvents.indexOf(targetEvent) < 0) {
	      throw new Error("Unknown event: " + targetEvent + " / Availables: " + self._availableEvents);
	    }

	    targetArguments = targetArguments || [];

	    if (targetArguments.constructor !== Array) {
	      throw new Error("Invalid arguments specified (must provide an array): " + targetArguments);
	    }

	    // call registered callbacks
	    $.each(self._callbacks, function(event, callback) {

	      if (event === targetEvent) {

	        try {

	          callback.apply(callback, targetArguments);

	          called++;

	        } catch (e) {
	          jsxc.error("Error in jsxc.api.callback", e);
	        }

	      }

	    });

	    return called;

	  },

	  /**
	   * Show a toast with message
	   * @param message
	   * @param type
	   * @param timeout
	   */
	  feedback : function(message, subst, type, timeout) {
	    jsxc.gui.feedback(message, subst, type, timeout);
	  },

	  /**
	   * Open chat window bound to the specified jid
	   *
	   * Jid can be a full jid or a bare jid
	   *
	   * @param login
	   */
	  openChatWindow : function(jid) {

	    if (!jid) {
	      jsxc.gui.feedback("__i18nid_:not_a_valid_user", {user : jid}, 'warn');
	      return;
	    }

	    var self = jsxc.api;
	    var bid = jsxc.jidToBid(jid);
	    var node = Strophe.getNodeFromJid(jid);

	    if (!node) {
	      jsxc.gui.feedback("__i18nid_:not_a_valid_user", {user : jid}, 'warn');
	      return;
	    }

	    self.checkIfConnectedOrThrow();

	    var bl = jsxc.storage.getUserItem('buddylist');

	    // if user isn't in buddylist, create a buddy list entry
	    // with no suscription
	    if (bl.indexOf(jid) < 0) {

	      // Do not add contact in buddylist to distinguish him from buddies
	      // bl.push(bid);
	      // jsxc.storage.setUserItem('buddylist', bl);

	      jsxc.storage.setUserItem('buddy', bid, {
	        jid : jid,
	        name : node,
	        status : 0,
	        sub : 'none',
	        msgstate : 0,
	        transferReq : -1,
	        trust : false,
	        res : [],
	        type : 'chat'
	      });

	      jsxc.gui.roster.add(bid);
	    }

	    // open chat window
	    jsxc.gui.window.open(bid);

	  },

	  /**
	   * Start a new conversation with given JIDs
	   *
	   * If an error occur, feedbacks are shown
	   *
	   */
	  createNewConversationWith : function(jidArray) {

	    var createAndInvite = true;

	    if (!jidArray || jidArray.constructor !== Array || jidArray.length < 1) {
	      jsxc.gui.feedback("__i18nid_:you_must_select_one_person", null, 'warn');
	      return;
	    }

	    $.each(jidArray, function(index, element) {
	      if (element.match(/.+@.+\..+/i) === null) {
	        jsxc.gui.feedback("__i18nid_:not_a_valid_user", {user : element}, 'warn');
	        createAndInvite = false;
	      }
	    });

	    if (createAndInvite === true) {

	      // create conversation
	      jsxc.muc.createNewConversationWith(jidArray);
	    }

	  },

	  /**
	   * Return the buddy list
	   */
	  getBuddyList : function() {
	    return jsxc.storage.getUserItem('buddylist') || [];
	  },

	  isConnected : function() {
	    return jsxc.xmpp.conn !== null;
	  },

	  /**
	   * Check if we are connected, if not show feedback, open roster and throw exception
	   */
	  checkIfConnectedOrThrow : function() {

	    var self = jsxc.api;

	    if (self.isConnected() !== true) {

	      self.feedback("__i18nid_:you_are_not_connected", null, 'warn');

	      throw new Error("Not connected");
	    }
	  },

	  spaceInvasion : function() {

	    var self = jsxc.help;

	    var root = jsxc.options.root + "/lib/AlienInvasion/";

	    // close all dialogs if necessary
	    jsxc.gui.dialog.close();

	    // initialize gui only if necessary
	    if (!self._alreadyInitalized || self._alreadyInitalized !== true) {

	      self._alreadyInitalized = true;

	      // $('head').append('<link rel="stylesheet" href="' + root + 'base.css" type="text/css" />');

	      var template = $("<div id='alienInvasionContainer'></div>");

	      // hide template for now
	      template.css({display : 'none'});

	      // append canvas and script tags
	      template.append("<canvas id='alienInvasionCanvas' width='320' height='480'></canvas>");
	      template.append(
	          "<div><a href='https://github.com/cykod/AlienInvasion/' target='_blank' style='font-size: 0.7em'>" +
	          "Thanks to https://github.com/cykod/AlienInvasion/</a></div>");
	      template.append("<script src='" + root + "engine.js'></script><script src='" + root +
	          "game.js'></script>");

	      // show dialog
	      $("body").append(template);

	      // initialize game
	      setTimeout(function() {
	        Game.initialize("alienInvasionCanvas", sprites, startGame, root);
	      }, 1000);

	      // listen opening and closing
	      template.on('dialogopen', function() {
	        template.css({display : 'block'});
	      });

	      // listen opening and closing
	      template.on('dialogclose', function() {
	        template.css({display : 'none'});
	      });

	    }

	    // show dialog
	    $("#alienInvasionContainer").dialog({

	      title : "Alien invasion !",

	      width : 353,

	      height : 600,

	      resizable : false
	    });

	  },

	  /**
	   * Show a toast and disconnect user
	   */
	  disconnect : function() {
	    jsxc.gui.feedback("__i18nid_:disconnecting");
	    jsxc.xmpp.logout(false);
	  },

	  /**
	   * Reconnect user. Try to call an registered callback or show the default connexion panel
	   */
	  reconnect : function() {

	    var newgui = jsxc.newgui;

	    var called = jsxc.api.callback("onReconnectRequest");

	    if (called < 1) {

	      newgui.toggleChatSidebar(true);

	      if (newgui.isConnexionMenuShown() !== true) {
	        newgui.toggleConnexionMenu();
	      }

	    }
	  },

	  /**
	   * Start a simple video call with given JID
	   * @param bid
	   */
	  startSimpleVideoCall : function(bid) {

	    if (!bid) {
	      jsxc.gui.feedback("__i18nid_:you_must_select_one_person", null, 'warn');
	      return;
	    }

	    var node = Strophe.getNodeFromJid(bid);
	    var buddy = jsxc.storage.getUserItem('buddy', bid);

	    if (!buddy) {
	      jsxc.gui.feedback("__i18nid_:not_a_valid_user", {user : node}, 'warn');
	      return;
	    }

	    if (buddy.status === jsxc.CONST.STATUS.indexOf("offline")) {
	      jsxc.gui.feedback("__i18nid_:is_not_connected", {user : node});
	      return;
	    }

	    var jid = jsxc.getCurrentActiveJidForBid(bid);
	    if (jid === null) {
	      jsxc.gui.feedback("__i18nid_:is_not_available", {user : node});
	      return;
	    }

	    jsxc.gui.feedback("__i18nid_:videocall_in_progress");

	    jsxc.mmstream.startSimpleVideoCall(jid);

	  }

	};
	/**
	 * Etherpad integration
	 * @type {{openpad: jsxc.etherpad.openpad}}
	 */

	jsxc.etherpad = {

	  XMPP_INVITATIONS : {

	    XMPP_ELEMENT_NAME : "etherpad",

	    PADID_ATTR : "padid",

	    ALL_USERS_ATTR : "allusers",

	    INVITATIONID_ATTR : "id",

	    STATUS_ATTR : "status",

	    STATUS_INVITATION : "invitation",

	    STATUS_REFUSED : "refused"

	  },

	  _init : function() {

	    var self = jsxc.etherpad;

	    self.conn = jsxc.xmpp.conn;

	    self._messageHandler = self.conn.addHandler(jsxc.etherpad._onMessageReceived, null, 'message');
	  },

	  /**
	   * Return true if Etherpad is enabled
	   * @returns {boolean}
	   */
	  isEtherpadEnabled : function() {
	    var opts = jsxc.options.get("etherpad");
	    return opts.enabled === true;
	  },

	  /**
	   * Return a link corresponding to an pad id
	   * @param padId
	   * @returns {string}
	   */
	  getEtherpadLinkFor : function(padId) {

	    if (typeof padId === "undefined") {
	      throw new Error("Invalid pad id: " + padId);
	    }

	    var opts = jsxc.options.get("etherpad");
	    return opts.ressource + 'p/' + padId +
	        '?showControls=true&showChat=false&showLineNumbers=true&useMonospaceFont=true';
	  },

	  /**
	   * Return the code to embed to display pad
	   * @param padId
	   * @returns {string}
	   * @private
	   */
	  _getEmbeddedCode : function(padId) {
	    return '<iframe class="jsxc-etherpad-frame" name="embed_readwrite" src="' +
	        jsxc.etherpad.getEtherpadLinkFor(padId) + '" style="width: 750px; height: 85%"></iframe>';
	  },

	  /**
	   * Open a new pad in a window
	   * @param bid
	   */
	  openpad : function(padId) {

	    var self = jsxc.etherpad;
	    var newgui = jsxc.newgui;

	    jsxc.stats.addEvent('jsxc.etherpad.openpad');

	    if (self.isEtherpadEnabled() === false) {
	      jsxc.warn('Etherpad not enabled');
	      jsxc.gui.feedback("__i18nid_:etherpad_not_enabled", null, "warn");
	      return;
	    }

	    jsxc.debug("Openning new pad", padId);

	    // get etherpad iframe
	    var embedded = self._getEmbeddedCode(padId);

	    // add link to open pad in a new window
	    var link = $(
	        '<a class="jsxc-etherpad-new-window-link">' + jsxc.t('open_pad_in_new_window') + '</a>');
	    link.click(function() {

	      // open pad in a new window
	      window.open(self.getEtherpadLinkFor(padId), '_blank');

	      // close existing pad, to avoid connection problems
	      jsxc.newgui.removeMediaRessource($(this).parents(".jsxc-media-ressource"));

	    });

	    newgui.addMediaRessource(embedded + link.toString(), 'Etherpad: ' + padId);

	    // toggle media panel if necessary
	    newgui.toggleMediapanel(true);

	  },

	  /**
	   * Send invitations to join a pad. Not using a particular XEP for now.
	   * @param padId
	   * @param jidArray
	   */
	  sendInvitations : function(padId, jidArray) {

	    jsxc.debug("Sending etherpad invitations", {padId : padId, jidArray : jidArray});

	    var self = jsxc.etherpad;

	    if (self.conn === null) {
	      throw new Error("Disconnected");
	    }

	    if (!padId) {
	      throw new Error("Invalid argument: " + padId);
	    }

	    if (!jidArray || !jidArray.length) {
	      throw new Error("Invalid argument: " + jidArray);
	    }

	    var invitation = {};
	    invitation[self.XMPP_INVITATIONS.PADID_ATTR] = padId;
	    invitation[self.XMPP_INVITATIONS.ALL_USERS_ATTR] = jidArray.join(",");
	    invitation[self.XMPP_INVITATIONS.STATUS_ATTR] = self.XMPP_INVITATIONS.STATUS_INVITATION;
	    invitation[self.XMPP_INVITATIONS.INVITATIONID_ATTR] = self.conn.getUniqueId();

	    // XMPP message stanza
	    var msg = $msg({
	      from : self.conn.jid
	    }).c(self.XMPP_INVITATIONS.XMPP_ELEMENT_NAME, invitation);

	    var sent = [];

	    // send to everybody
	    $.each(jidArray, function(index, jid) {

	      if (jid !== self.conn.jid) {
	        var adressedMessage = $(msg.toString()).attr("to", jid);
	        self.conn.send(adressedMessage);

	        sent.push(jid);
	      }

	    });

	    jsxc.stats.addEvent('jsxc.etherpad.invitationsSent');

	  },

	  /**
	   * Send an XMPP message notifying that document is refused by user.
	   * @private
	   */
	  _sendEtherpadRefusedMessage : function(to, padId, invitationId) {

	    jsxc.debug("Sending etherpad refused message", {invitationId : invitationId});

	    var self = jsxc.etherpad;

	    if (!to) {
	      throw new Error("Invalid argument: " + padId);
	    }
	    if (!padId) {
	      throw new Error("Invalid argument: " + padId);
	    }
	    if (!invitationId) {
	      throw new Error("Invalid argument: " + invitationId);
	    }

	    var message = {};
	    message[self.XMPP_INVITATIONS.PADID_ATTR] = padId;
	    message[self.XMPP_INVITATIONS.STATUS_ATTR] = self.XMPP_INVITATIONS.STATUS_REFUSED;
	    message[self.XMPP_INVITATIONS.INVITATIONID_ATTR] = invitationId;

	    // XMPP message stanza
	    var msg = $msg({
	      from : self.conn.jid, to : to
	    }).c(self.XMPP_INVITATIONS.XMPP_ELEMENT_NAME, message);

	    // send message
	    self.conn.send(msg);

	  },

	  /**
	   * Check if we receive an etherpad invitation
	   * @private
	   */
	  _onMessageReceived : function(stanza) {

	    var self = jsxc.etherpad;

	    // ignore eventual messages from current user
	    if ($(stanza).attr("from") === self.conn.jid) {
	      //self._log("Ignoring message from current user: ", stanza, "ERROR");

	      // keep handler
	      return true;
	    }

	    // check if stanza is a videoconference invitation
	    var etherpad = $(stanza).find(self.XMPP_INVITATIONS.XMPP_ELEMENT_NAME);

	    if (etherpad.length > 0) {

	      var from = $(stanza).attr("from");
	      var node = Strophe.getNodeFromJid(from);
	      var padId = etherpad.attr(self.XMPP_INVITATIONS.PADID_ATTR);
	      var invitationId = etherpad.attr(self.XMPP_INVITATIONS.INVITATIONID_ATTR);

	      var status = (etherpad.attr('status') || '').trim();

	      // we have been just invited
	      if (self.XMPP_INVITATIONS.STATUS_INVITATION === status) {

	        jsxc.notice.add(jsxc.t('etherpad_invitation'),
	            node + " " + jsxc.t('invite_you_to_share_etherpad'), 'gui.showIncomingEtherpadDialog',
	            [from, padId, invitationId]);

	      }

	      // someone refused a pad
	      else if (self.XMPP_INVITATIONS.STATUS_REFUSED === status) {
	        jsxc.gui.feedback("__i18nid_:has_refused_pad", {user : node});
	      }

	    }

	    // preserve handler
	    return true;

	  },

	  /**
	   * Called when we are disconnected from XMPP server.
	   *
	   * Allows to remove handlers
	   *
	   * @private
	   */
	  _onDisconnected : function() {

	    var self = jsxc.etherpad;

	    self.conn.deleteHandler(self._messageHandler);

	  }

	};

	$(function() {

	  var self = jsxc.etherpad;

	  $(document).on('attached.jsxc', self._init);
	  $(document).on('disconnected.jsxc', self._onDisconnected);

	});

	/**
	 * Here go all interactions from the new interface
	 *
	 * All init functions are called onlys once, when GUI is preparing, whenever disconnections happend
	 *
	 */
	jsxc.gui.interactions = {

	  init : function() {

	    var self = jsxc.gui.interactions;

	    self._initSettingsMenu();

	    self._initHelpMenu();

	    self._initActionMenu();

	    self._initSearchMenu();

	    self._initStatusMenu();

	    self._initNotificationsMenu();

	  },

	  /**
	   * Add a listener to connexion events and remove it when disconnected
	   * @param callback
	   * @private
	   */
	  _addAttachedListener : function(callback) {
	    $(document).on('attached.jsxc', callback);
	    $(document).on('disconnected.jsxc', function() {
	      $(document).off('attached.jsxc', callback);
	    });
	  },

	  /**
	   * Return checked elements from search user panel
	   * @returns {JQuery|*|jQuery|HTMLElement}
	   * @private
	   */
	  _getCheckedSearchUsers : function() {
	    return $(".jsxc-search-users-results .jsxc-checked");
	  },

	  /**
	   * Init the status panel, at bottom of the chat sidebar
	   * @private
	   */
	  _initStatusMenu : function() {

	    // var self = jsxc.gui.interactions;
	    var newgui = jsxc.newgui;

	    var loginBtn = $('#jsxc-status-bar .jsxc-login-button');
	    var logoutBtn = $('#jsxc-status-bar .jsxc-logout-button');

	    // listen connection state to display informations and controls
	    $(document).on('ownpresence.jsxc', function() {
	      newgui.updateOwnPresenceIndicator();
	    });

	    $(document).on('attached.jsxc', function() {
	      newgui.updateOwnPresenceIndicator();
	    });

	    $(document).on('disconnected.jsxc', function() {
	      newgui.updateOwnPresenceIndicator(true);
	      newgui.hideAndShow(loginBtn, logoutBtn);
	    });

	    $(document).on('connected.jsxc', function() {
	      newgui.hideAndShow(logoutBtn, loginBtn);
	    });
	    newgui.updateOwnPresenceIndicator();

	    // log out button
	    logoutBtn.click(function() {
	      jsxc.api.disconnect();
	      jsxc.newgui.toggleBuddyList();
	    });

	    // login button
	    loginBtn.click(function() {
	      jsxc.api.reconnect();
	    });

	    // show login / logout on connect
	    if (jsxc.xmpp.conn) {
	      newgui.hideAndShow(logoutBtn, loginBtn);
	    }

	    // make status bar selectable
	    var statusSelect = $("#jsxc-status-bar .jsxc-select-status");
	    statusSelect.change(function() {

	      jsxc.xmpp.changeOwnPresence(statusSelect.val());

	      jsxc.gui.feedback("__i18nid_:status_updated");

	    });

	  },

	  /**
	   * Menu where user can create conversations, make call, ...
	   * @private
	   */
	  _initActionMenu : function() {

	    // var self = jsxc.gui.interactions;
	    var mmstream = jsxc.mmstream;
	    var newgui = jsxc.newgui;

	    /**
	     * Start a multi user chat
	     * =======================
	     *
	     */
	    $('#jsxc-chat-sidebar .jsxc-action_new-conversation').click(function() {

	      var selected = [];
	      newgui.getCheckedBuddiesOrAskFor()
	          .then(function(results) {
	            $.each(results, function(index, element) {
	              selected.push(element);
	            });

	            jsxc.api.createNewConversationWith(selected);
	          })
	          .fail(function() {
	            jsxc.gui.feedback("__i18nid_:operation_canceled");
	          });

	    });

	    /**
	     * Delete buddies or conversations
	     * ===============================
	     */

	    $('.jsxc-action_delete-buddies').click(function() {

	      newgui.getCheckedElementsOrAskFor()

	          .then(function(buddies) {

	            // check if buddies are checked
	            if (buddies.length < 1) {
	              jsxc.gui.feedback("__i18nid_:you_must_select_at_least_one_element", null, 'warn');
	              return;
	            }

	            // get bid
	            var bidArray = [];
	            $.each(buddies, function(index, element) {
	              bidArray.push(element);
	            });

	            // show confirmation dialog
	            jsxc.gui.showRemoveManyDialog(bidArray);

	          })

	          .fail(function() {
	            jsxc.gui.feedback("__i18nid_:operation_canceled");
	          });

	    });

	    /**
	     * Invite users in conversation
	     * ============================
	     */
	    $('#jsxc-main-menu .jsxc-action_invite-in-conversation').click(function() {

	      newgui.getCheckedBuddiesOrAskFor()
	          .then(function(buddies) {

	            if (buddies.length < 1) {
	              jsxc.gui.feedback("__i18nid_:you_must_select_one_person", null, 'warn');
	              return;
	            }

	            var toInvite = [];
	            $.each(buddies, function(index, element) {
	              toInvite.push(element);
	            });

	            // show dialog
	            jsxc.gui.showConversationSelectionDialog()

	            // user clicks OK
	                .done(function(conversations) {

	                  if (conversations.length < 1) {
	                    jsxc.gui.feedback("__i18nid_:you_must_select_one_person", null, 'warn');
	                    return;
	                  }

	                  $.each(conversations, function(index, cjid) {
	                    jsxc.muc.inviteParticipants(cjid, toInvite);
	                  });

	                  if(toInvite.length > 1){
	                    jsxc.gui.feedback("__i18nid_:users_have_been_invited", {users: toInvite.join(', ')});
	                  }
	                  else {
	                    jsxc.gui.feedback("__i18nid_:user_have_been_invited", {user: toInvite[0]});
	                  }

	                })

	                .fail(function() {
	                  jsxc.gui.feedback("__i18nid_:operation_canceled");
	                });
	          })
	          .fail(function() {
	            jsxc.gui.feedback("__i18nid_:operation_canceled");
	          });

	    });

	    /**
	     * Etherpad doc creation
	     * =====================
	     */
	    $("#jsxc-main-menu .jsxc-action_new-etherpad-document").click(function() {

	      // check if some buddies are already selected
	      var selected = newgui.getCheckedBuddies();

	      // show dialog
	      jsxc.gui.showEtherpadCreationDialog(selected)

	          .then(function(res) {

	            jsxc.gui.feedback("__i18nid_:document_will_be_opened");

	            jsxc.etherpad.openpad(res.name);

	            if (res.buddies.length > 0) {
	              jsxc.etherpad.sendInvitations(res.name, res.buddies);
	            }
	          })

	          .fail(function() {
	            jsxc.gui.feedback("__i18nid_:operation_canceled");
	          });

	    });

	    /**
	     * Video call
	     * ==========
	     *
	     */
	    $("#jsxc-main-menu .jsxc-action_video-call").click(function() {

	      // get selected budies
	      newgui.getCheckedBuddiesOrAskFor()

	          .then(function(buddies) {

	            if (buddies.length < 1) {
	              jsxc.gui.feedback("__i18nid_:you_must_select_one_person", null, 'warn');
	              return;
	            }

	            // get full jid of buddies
	            var fjidArray = [];
	            var unavailables = [];
	            $.each(buddies, function(index, element) {

	              var fjid = jsxc.getCurrentActiveJidForBid(element);

	              if (fjid === null || jsxc.isBuddyOnline(element) === false) {
	                unavailables.push(Strophe.getNodeFromJid(element));
	              } else {
	                fjidArray.push(jsxc.getCurrentActiveJidForBid(element));
	              }

	            });

	            // check how many participants are unavailable
	            if (unavailables.length === 1) {
	              jsxc.gui.feedback("__i18nid_:is_not_available", {user : unavailables[0]});
	              return;
	            }

	            else if (unavailables.length > 1) {
	              jsxc.gui.feedback("__i18nid_:are_not_available", {users : unavailables.join(", ")});
	              return;
	            }

	            // call buddies
	            $.each(fjidArray, function(index, fjid) {
	              mmstream.startSimpleVideoCall(fjid);
	            });

	          })
	          .fail(function() {
	            jsxc.gui.feedback("__i18nid_:operation_canceled");
	          });

	    });

	    /**
	     * Video conférence
	     * ================
	     *
	     */
	    $("#jsxc-main-menu .jsxc-action_videoconference").click(function() {

	      // get selected budies
	      newgui.getCheckedBuddiesOrAskFor()

	          .then(function(buddies) {

	            if (buddies.length < 2) {
	              jsxc.gui.feedback("__i18nid_:you_must_select_two_persons", null, 'warn');
	              return;
	            }

	            if (buddies.length > mmstream.VIDEOCONFERENCE_MAX_PARTICIPANTS) {
	              jsxc.gui.feedback("__i18nid_:videoconference_is_limited_to_6");
	              return;
	            }

	            // get full jid of buddies
	            var fjidArray = [];
	            var unavailables = [];
	            $.each(buddies, function(index, element) {

	              var fjid = jsxc.getCurrentActiveJidForBid(element);

	              if (fjid === null || jsxc.isBuddyOnline(element) === false) {
	                unavailables.push(Strophe.getNodeFromJid(element));
	              } else {
	                fjidArray.push(jsxc.getCurrentActiveJidForBid(element));
	              }

	            });

	            // check how many participants are unavailable
	            if (unavailables.length === 1) {
	              jsxc.gui.feedback("__i18nid_:is_not_available", {user : unavailables[0]});
	              return;
	            }

	            else if (unavailables.length > 1) {
	              jsxc.gui.feedback("__i18nid_:are_not_available", {users : unavailables.join(", ")});
	              return;
	            }

	            // start videoconference
	            mmstream.startVideoconference(fjidArray);

	          })
	          .fail(function() {
	            jsxc.gui.feedback("__i18nid_:operation_canceled");
	          });

	    });

	    /**
	     * Screen sharing
	     * ===============
	     *
	     */
	    $("#jsxc-main-menu .jsxc-action_screensharing").click(function() {

	      // get selected budies
	      newgui.getCheckedBuddiesOrAskFor()

	          .then(function(buddies) {

	            if (buddies.length < 1) {
	              jsxc.gui.feedback("__i18nid_:you_must_select_one_person", null, 'warn');
	              return;
	            }

	            mmstream.checkNavigatorCompatibility("screensharing");

	            mmstream.isChromeExtensionInstalled()

	                .fail(function() {
	                  mmstream.gui.showInstallScreenSharingExtensionDialog();
	                  return;
	                })

	                .then(function() {

	                  // get full jid of buddies
	                  var fjidArray = [];
	                  var unavailables = [];
	                  $.each(buddies, function(index, element) {

	                    var fjid = jsxc.getCurrentActiveJidForBid(element);

	                    if (fjid === null || jsxc.isBuddyOnline(element) === false) {
	                      unavailables.push(Strophe.getNodeFromJid(element));
	                    } else {
	                      fjidArray.push(jsxc.getCurrentActiveJidForBid(element));
	                    }

	                  });

	                  // check how many participants are unavailable
	                  if (unavailables.length === 1) {
	                    jsxc.gui.feedback("__i18nid_:is_not_available", {user : unavailables[0]});
	                    return;
	                  }

	                  else if (unavailables.length > 1) {
	                    jsxc.gui.feedback("__i18nid_:are_not_available",
	                        {users : unavailables.join(", ")});
	                    return;
	                  }

	                  // call buddies
	                  mmstream.startScreenSharingMultiPart(fjidArray);

	                });
	          });

	    });

	  },

	  /**
	   * Setting menu, where user can mute notifications, see 'About dialog', ...
	   * @private
	   */
	  _initHelpMenu : function() {

	    // var self = jsxc.gui.interactions;
	    // var newgui = jsxc.newgui;
	    // var mmstream = jsxc.mmstream;
	    // var notification = jsxc.notification;

	    var tutorials = jsxc.help.getAllTutorials();

	    var list = $('#jsxc-help-tutorial-list');

	    // list all tutorials
	    $.each(tutorials, function(id, element) {

	      var li = $('<li>').text(element.description).click(function() {
	        jsxc.help.launchTutorial(id);
	      });

	      list.append(li);

	    });

	  },

	  /**
	   * Setting menu, where user can mute notifications, see 'About dialog', ...
	   * @private
	   */
	  _initSettingsMenu : function() {

	    // var self = jsxc.gui.interactions;
	    var newgui = jsxc.newgui;
	    var mmstream = jsxc.mmstream;
	    var notification = jsxc.notification;

	    /**
	     * Open settings menu
	     * ==================
	     */
	    $('#jsxc-chat-sidebar .jsxc-toggle-settings').click(function(event) {
	      newgui.toggleSettingsMenu();
	      event.stopPropagation();
	    });

	    /**
	     * Open help menu
	     * ==================
	     */
	    $('#jsxc-chat-sidebar .jsxc-toggle-help').click(function(event) {
	      newgui.toggleHelpMenu();
	      event.stopPropagation();
	    });

	    /**
	     * Show collected datas
	     * ==================
	     */
	    $('#jsxc-chat-sidebar .jsxc-action_showCollectedDatas').click(function(event) {
	      window.open(jsxc.options.stats.destinationUrl + "/visualization/");
	      event.stopPropagation();
	    });

	    /**
	     * Clear local history of conversations
	     * ====================================
	     */
	    $('#jsxc-settings-menu .jsxc-action_clearLocalHistory').click(function() {

	      var buddies = jsxc.storage.getUserItem("buddylist") || [];

	      $.each(buddies, function(index, jid) {
	        jsxc.gui.window.clear(jid);
	      });

	      jsxc.gui.feedback("__i18nid_:local_history_clean_success");

	    });

	    /**
	     * Install screensharing extension
	     * ===============================
	     */
	    $('#jsxc-settings-menu .jsxc-action_installScreenSharingExtension').click(function() {
	      mmstream.gui.showInstallScreenSharingExtensionDialog();
	    });

	    /**
	     * About dialog
	     * ============
	     */
	    $('#jsxc-settings-menu .jsxc-show-about-dialog').click(function() {
	      jsxc.gui.showAboutDialog();
	    });

	    /**
	     * Mute sounds
	     * ===========
	     */
	    var muteIndicator = jsxc.newgui.createStateIndicator('.jsxc-action_toggleMuteMode');
	    muteIndicator.toggleState(!notification.isSoundMuted());

	    $('#jsxc-settings-menu .jsxc-action_toggleMuteMode').click(function() {

	      muteIndicator.toggleState();

	      if (muteIndicator.getState() === false) {
	        notification.muteSound();
	      }

	      else {
	        notification.unmuteSound();
	      }

	    });

	    /**
	     * Show / Hide notifications
	     * =========================
	     */
	    var notifIndicator = jsxc.newgui.createStateIndicator('.jsxc-action_toggleNotifications');
	    notifIndicator.toggleState(notification.isNotificationShowed());

	    $('#jsxc-settings-menu .jsxc-action_toggleNotifications').click(function() {

	      notifIndicator.toggleState();

	      if (notifIndicator.getState() === true) {

	        // request permission if needed
	        if (notification.hasPermission() !== true) {
	          jsxc.gui.showRequestNotification();
	        }

	        notification.showNotifications();
	      }

	      else {
	        notification.hideNotifications();
	      }

	    });

	    var videoIndicator = jsxc.newgui.createStateIndicator('.jsxc-action_disableVideoCalls');
	    videoIndicator.toggleState(mmstream.isVideoCallsDisabled());

	    $('#jsxc-settings-menu .jsxc-action_disableVideoCalls').click(function() {

	      videoIndicator.toggleState();

	      if (videoIndicator.getState() === true) {
	        mmstream.disableVideoCalls();
	      }

	      else {
	        mmstream.enableVideoCalls();
	      }

	    });

	  },

	  /**
	   * Search panel XEP 0055 where users can search other users to invite them
	   * @private
	   */
	  _initSearchMenu : function() {

	    var self = jsxc.gui.interactions;
	    // var newgui = jsxc.newgui;

	    /**
	     * Invite users
	     * ============
	     */
	    $("#jsxc-chat-sidebar-search-invite").click(function() {

	      var checkedElements = self._getCheckedSearchUsers();

	      if (checkedElements.length < 1) {
	        jsxc.gui.feedback("__i18nid_:you_must_select_one_person", null, 'warn');
	        return false;
	      }

	      var invited = [];
	      $.each(checkedElements, function(index, element) {

	        var jqi = $(element);
	        var i = jqi.data('jid');

	        jsxc.xmpp.addBuddy(i);
	        invited.push(Strophe.getNodeFromJid(i));

	        jqi.removeClass('jsxc-checked');

	      });

	      if(invited.length > 1){
	        jsxc.gui.feedback("__i18nid_:users_have_been_invited", {users: invited.join(', ')});
	      }
	      else {
	        jsxc.gui.feedback("__i18nid_:user_have_been_invited", {user: invited[0]});
	      }

	      var entries = $(".jsxc-search-users-results .jsxc-search-user-entry");

	      // clean search space
	      entries.animate({
	        'opacity' : "0"
	      }, 700, function() {
	        entries.remove();
	      });

	    });

	    /**
	     * Chat with users
	     * ============
	     */
	    $("#jsxc-chat-sidebar-search-chat").click(function() {

	      var checkedElements = self._getCheckedSearchUsers();

	      if (checkedElements.length < 1) {
	        jsxc.gui.feedback("__i18nid_:you_must_select_one_person", null, 'warn');
	        return false;
	      }

	      $.each(checkedElements, function(index, element) {
	        var jid = $(element).data('jid');
	        jsxc.api.openChatWindow(jid);
	      });

	      var entries = $(".jsxc-search-users-results .jsxc-search-user-entry");

	      // clean search space
	      entries.animate({
	        'opacity' : "0"
	      }, 700, function() {
	        entries.remove();
	      });

	    });

	  },

	  /**
	   * Where user can manage notifications: reject or accept them, remove them....
	   * @private
	   */
	  _initNotificationsMenu : function() {

	    /**
	     * Reject all notifications
	     * ========================
	     *
	     */
	    $('#jsxc-manage-notifications .jsxc-action_rejectAllNotifications').click(function() {

	      if ($('#jsxc-notifications ul li[data-nid]').length < 1) {
	        jsxc.gui.feedback("__i18nid_:no_notifications_to_reject");
	        return;
	      }

	      jsxc.gui.showConfirmDialog(jsxc.t("are_you_sure_to_clean_all_notifications"),

	          function() {

	            jsxc.gui.dialog.close();

	            $('#jsxc-notifications ul li[data-nid]').each(function() {
	              jsxc.notice.remove($(this).data('nid'));
	            });

	            jsxc.gui.feedback('__i18nid_:notifications_rejected');
	          },

	          function() {
	            jsxc.gui.feedback('__i18nid_:operation_canceled');
	          });

	    });

	    /**
	     * Show notifications parameters
	     * =============================
	     */
	    $('#jsxc-manage-notifications .jsxc-action_notificationsParameters').click(function() {
	      jsxc.newgui.toggleSettingsMenu();
	    });

	  }

	};
	/**
	 *
	 * New GUI added on original JSXC GUI
	 *
	 * Gui is divided in two parts: mediapanel on the top of sreen and chat sidebar on right.
	 * Here all stuff to initiate this GUI go here (openning, closing, ...) except "functionnnalities"
	 * that have to be in 'gui.interactions'
	 *
	 *
	 * @memberOf jsxc
	 */
	jsxc.newgui = {

	  // TODO: onSlave
	  // TODO: onHTTP/HTTPS
	  // TODO: onLocalStorageUnavailable...

	  /**
	   * Sidebar of deployed chat sidebar
	   */
	  SIDEBAR_CONTENT_HEIGHT : '480px',

	  MEDIAPANEL_HEIGHT : '550px',

	  /**
	   * Animation of toggling chat side bar, in ms
	   */
	  SIDEBAR_ANIMATION_DURATION : '1500',

	  SCROLL_ANIMATION_DURATION : '500',

	  FLOATING_MENU_ANIMATION_DURATION : '800',

	  OPACITY_ANIMATION_DURATION : '500',

	  /**
	   * Half of the animation duration
	   */
	  STATE_INDICATOR_ANIMATION_DURATION : 100,

	  _log : function(message, data, level) {
	    jsxc.debug('[NGUI] ' + message, data, level);
	  },

	  /**
	   * If true, buddies displayed in buddy list are selectionnable
	   */
	  _selectionMode : true,

	  _searchTimer : 0,

	  /**
	   * Init gui
	   */
	  init : function() {

	    var self = jsxc.newgui;

	    /**
	     * Header: Always visible
	     *
	     */

	    // open and close video panel
	    var togglevideo = $("#jsxc-chat-sidebar-header .jsxc-toggle-mediapanel");
	    togglevideo.click(function(event) {
	      self.toggleMediapanel();
	      event.stopPropagation();
	    });

	    // filter users and conversations
	    var buddyFilter = $("#jsxc-new-gui-filter-users");
	    var conversationFilter = $("#jsxc-new-gui-filter-conversations");

	    buddyFilter.click(function() {
	      self.toggleBuddyFilter('buddies');
	      buddyFilter.addClass("jsxc-active-filter");
	      conversationFilter.removeClass("jsxc-active-filter");
	    });

	    conversationFilter.click(function() {
	      self.toggleBuddyFilter('conversations');
	      conversationFilter.addClass("jsxc-active-filter");
	      buddyFilter.removeClass("jsxc-active-filter");
	    });

	    // activate buddy on launch
	    self.toggleBuddyFilter('buddies');
	    buddyFilter.addClass("jsxc-active-filter");

	    // selection mode
	    $("#jsxc-select-buddies").click(function() {
	      self.toggleSelectionMode();
	    });

	    $("#jsxc-chat-sidebar-header").click(function() {

	      // show buddy list on open
	      if (self.chatSidebarContent.isMainContentVisible() === false &&
	          self.isChatSidebarShown() === false) {
	        self.chatSidebarContent.showMainContent();
	      }

	      self.toggleChatSidebar();

	    });

	    // close media panel
	    $("#jsxc-mediapanel .jsxc-close-mediapanel").click(function() {
	      self.toggleMediapanel();
	    });

	    // close chat sidebar
	    $("#jsxc-chat-sidebar .jsxc-close-chatsidebar").click(function() {
	      self.toggleChatSidebar();
	    });

	    // add openning action
	    $("#jsxc-toggle-actions").click(function() {
	      self.toggleActionsMenu();
	    });

	    // XEP 0055 User search panel
	    self._initSearchPanel();

	    // where user can manage notifications
	    self._initNotificationsPanel();

	    // (re) connexion panel
	    self._initConnexionMenu();

	    // optionnal
	    // self.initMediaPanelMouseNavigation();

	    self.toggleBuddyFilter("buddies");

	    // display name in status bar
	    $(document).on('attached.jsxc', function() {
	      self.updateStatusBarUserName();
	    });
	    self.updateStatusBarUserName();

	    // hide etherpad control if needed
	    if (jsxc.options.etherpad.enabled !== true) {
	      $(".jsxc-action_new-etherpad-document").css({"display" : "none"});
	    }

	    // update header on presence and on notice received
	    $(document).on('presence.jsxc', self.updateChatSidebarHeader);
	    $(document).on('notice.jsxc', self.updateChatSidebarHeader);
	    $(document).on('attached.jsxc', self.updateChatSidebarHeader);
	    $(document).on('disconnected.jsxc', self.updateChatSidebarHeader.bind(self, true));
	    self.updateChatSidebarHeader();

	    // init multimedia stream gui
	    jsxc.mmstream.gui._initGui();
	  },

	  /**
	   * Utility to toggle a floating menu visible or hidden
	   * @param menuSelector
	   * @param buttonSelector
	   * @param attachment
	   * @param targetAttachment
	   * @param offset
	   * @private
	   */
	  _toggleFloatingMenu : function(menuSelector, buttonSelector, attachment, targetAttachment,
	      offset) {

	    var self = jsxc.newgui;
	    var menu = $(menuSelector);

	    if (menu.hasClass('jsxc-deploy') === false) {

	      menu.addClass("jsxc-deploy");

	      // show menu
	      menu.css({
	        'opacity' : '0', 'display' : 'block'
	      });

	      // pin menu to button
	      new Tether({
	        element : menuSelector,
	        target : buttonSelector,
	        attachment : attachment,
	        targetAttachment : targetAttachment,
	        offset : offset || '5px 5px'
	      });

	      // animate openning
	      menu.animate({
	        opacity : 1
	      }, self.FLOATING_MENU_ANIMATION_DURATION, function() {

	      });

	    }

	    else {

	      menu.removeClass("jsxc-deploy");

	      // animate closing
	      menu.animate({
	        opacity : 0
	      }, self.FLOATING_MENU_ANIMATION_DURATION, function() {

	        // hide menu
	        menu.css({
	          'display' : 'none'
	        });

	      });

	    }

	  },

	  /**
	   * Utility to hide one element and show a second one with animations
	   * @param toShow
	   * @param toHide
	   */
	  hideAndShow : function(toShow, toHide) {

	    var self = jsxc.newgui;

	    // hide old element
	    toHide.animate({
	      opacity : 0
	    }, self.OPACITY_ANIMATION_DURATION, function() {
	      toHide.css('display', 'none');

	      // show new one
	      toShow.css({
	        'display' : 'inline-block', 'opacity' : 0
	      });
	      toShow.animate({
	        'opacity' : '1'
	      }, self.OPACITY_ANIMATION_DURATION);
	    });

	  },

	  /**
	   * Create a state indicator informing user that something is turned on or off
	   */
	  createStateIndicator : function(selector) {

	    var self = jsxc.newgui;

	    if (!selector) {
	      throw new Error("Invalid argument: " + selector);
	    }

	    // root maybe containing other elements
	    var root = $(selector);

	    // indicator off / on
	    var indicator = $(
	        '<span class="jsxc_stateIndicator">&nbsp;<span class="jsxc_stateIndicator_on">on</span> | ' +
	        '<span class="jsxc_stateIndicator_off">off</span></span>');

	    root.append(indicator);

	    var on = indicator.find('.jsxc_stateIndicator_on');
	    var off = indicator.find('.jsxc_stateIndicator_off');

	    var duration = self.STATE_INDICATOR_ANIMATION_DURATION;

	    /**
	     * State of indicator. True: on, false: off
	     * @type {boolean}
	     */
	    var indicatorState = false;

	    var ret = {

	      /**
	       * The root of the indicator
	       */
	      root : indicator,

	      getState : function() {
	        return indicatorState;
	      },

	      /**
	       * Toggle state on | off
	       */
	      toggleState : function(state) {

	        if (typeof state === 'undefined') {
	          state = !indicatorState;
	          indicatorState = state;
	        }

	        if (state === true) {

	          off.animate({
	                color : 'black', opacity : 0.3
	              }, duration,

	              function() {

	                on.animate({
	                  color : 'blue', opacity : 1
	                }, duration);

	              });
	        }

	        else {

	          on.animate({
	                color : 'black', opacity : 0.5
	              }, duration,

	              function() {

	                off.animate({
	                  color : 'blue', opacity : 1
	                }, duration);

	              });
	        }

	      }

	    };

	    return ret;
	  }

	};
	/**
	 * All stuff needed by media panel, the folding panelon top of window
	 */
	$.extend(jsxc.newgui, {

	  /**
	   * Return an JQuery object selecting all media ressources displayed
	   * @returns {*|JQuery|jQuery|HTMLElement}
	   */
	  getAllDisplayedMediaRessource : function() {
	    return $("#jsxc-mediapanel .jsxc-media-ressource");
	  },

	  /**
	   * Toggle video panel
	   *
	   * If video panel have to be shown, chat sidebar have too
	   *
	   * @param callbackWhenFinished
	   */
	  toggleMediapanel : function(state, callbackWhenFinished) {

	    var self = jsxc.newgui;

	    // if state not specified, invert it
	    if (typeof state === 'undefined' || state === null) {
	      state = !self.isMediapanelShown();
	    }

	    // nothing to do, return
	    if (state === self.isMediapanelShown()) {
	      if (callbackWhenFinished) {
	        callbackWhenFinished();
	      }
	      return;
	    }

	    var mediapanel = $("#jsxc-mediapanel");

	    // deploy media panel
	    if (state === true) {

	      mediapanel.find(".jsxc-close-mediapanel").css({
	        display : 'block'
	      });

	      // add box shadow
	      mediapanel.css("box-shadow", "3px 3px 3px 3px rgba(0, 0, 0, 0.1)");

	      mediapanel.animate({
	        height : self.MEDIAPANEL_HEIGHT
	      }, self.SIDEBAR_ANIMATION_DURATION, function() {

	        // Animation complete.
	        mediapanel.addClass("jsxc-deploy");

	        if (callbackWhenFinished) {
	          callbackWhenFinished();
	        }
	      });

	    }

	    else {

	      mediapanel.find(".jsxc-close-mediapanel").css({
	        display : 'none'
	      });

	      mediapanel.animate({
	        height : '0px'
	      }, self.SIDEBAR_ANIMATION_DURATION, function() {

	        // Animation complete.
	        mediapanel.removeClass("jsxc-deploy");

	        // remove box shadow
	        mediapanel.css("box-shadow", "none");

	        if (callbackWhenFinished) {
	          callbackWhenFinished();
	        }
	      });

	    }
	  },

	  /**
	   * Return true if chat sidebar is shown
	   */
	  isMediapanelShown : function() {
	    return $("#jsxc-mediapanel").hasClass("jsxc-deploy");
	  },

	  /**
	   * Open a ressource in media panel
	   * @param ressource
	   */
	  openMediaRessource : function(ressource) {

	    var self = jsxc.newgui;
	    var ress = jsxc.ressources;

	    // show media panel if necessary
	    self.toggleMediapanel(true);

	    //retrieve prefix of ressource
	    var prefix = ressource.substring(0, ressource.indexOf(":"));

	    var ressourceOnly = ressource.substring(prefix.length + 1, ressource.length);

	    self._log("openMediaRessource: ", {
	      ressource : ressource, prefix : prefix, ressourceOnly : ressourceOnly
	    });

	    var embedded = ress.getEmbeddedFor(prefix, ressourceOnly);

	    // add ressource only if needed
	    if (embedded) {
	      self.addMediaRessource(embedded, ressourceOnly);
	    }

	  },

	  /**
	   * Remove a media ressource
	   * @param container
	   */
	  removeMediaRessource : function(container) {

	    var self = jsxc.newgui;

	    if (!container) {
	      throw new Error("Invalid argument: " + container);
	    }

	    container.animate({
	      opacity : "0"
	    }, self.OPACITY_ANIMATION_DURATION, function() {
	      container.remove();
	    });

	  },

	  /**
	   * Add a ressource in media panel, wrapped in container
	   *
	   * @param htmlContent
	   * @param title
	   * @param ressource
	   * @private
	   */
	  addMediaRessource : function(htmlContent, title, options) {

	    var self = jsxc.newgui;

	    var defaultOptions = {
	      /**
	       * Controls availables next the title
	       *
	       * If null, a close cross will be happend
	       */
	      titleControls : null
	    };

	    options = $.extend(defaultOptions, options);

	    // container for ressource
	    var container = $('<div class="jsxc-media-ressource"></div>').append(htmlContent);

	    // displayable title, not too long
	    var dspTitle = title.length > 30 ? title.substring(0, 27) + "..." : title;

	    // header with title and close cross
	    var ressHeader = $("<h1 class='jsxc-title'>" + dspTitle + "</h1>").attr('title', title);
	    container.prepend(ressHeader);

	    // add close control next the title
	    if (!options.titleControls) {

	      var closeHeader = $("<span class='jsxc-close-ressource'></span>");
	      closeHeader.click(function() {
	        self.removeMediaRessource(container);
	      });

	      ressHeader.append(closeHeader);
	    }

	    // user provide custom controls, add them
	    else {
	      ressHeader.append(options.titleControls);
	    }

	    self._log("addMediaRessource", {title : title, container : container});

	    // append ressource
	    $("#jsxc-mediapanel-right").append(container);

	  }

	});

	/**
	 * All stuff needed by chat sidebar, displayed at the bottom right of screen
	 */
	$.extend(jsxc.newgui, {

	  /**
	   * Management the middle of the chat sidebar, to display of remove several contents
	   * @memberOf jsxc.newgui
	   */
	  chatSidebarContent : {

	    /**
	     * Return a find search resuts with all possible displayable viewports
	     * @returns {*|jQuery}
	     */
	    getAllContents : function() {
	      return $('#jsxc-sidebar-content-viewport').find(".jsxc-viewport-content");
	    },

	    showMainContent : function() {
	      var self = jsxc.newgui.chatSidebarContent;
	      self._setContentVisible("jsxc-buddy-list-container");
	    },

	    showContent : function(contentId) {
	      var self = jsxc.newgui.chatSidebarContent;
	      self._setContentVisible(contentId);
	    },

	    isMainContentVisible : function() {
	      return jsxc.newgui.chatSidebarContent.isContentVisible("jsxc-buddy-list-container");
	    },

	    isContentVisible : function(contentId) {

	      var element = $("#" + contentId);

	      if (element.length < 1) {
	        throw new Error("Unable to find: " + contentId);
	      }

	      return element.css("display") === "block";

	    },

	    toggleContent : function(contentId) {

	      var self = jsxc.newgui.chatSidebarContent;

	      // check if content shown
	      var visible = self.isContentVisible(contentId);

	      if (visible) {
	        self.showMainContent();
	      }

	      else {
	        self._setContentVisible(contentId);
	      }

	    },

	    _setContentVisible : function(contentId) {

	      var self = jsxc.newgui.chatSidebarContent;

	      self.getAllContents().each(function() {
	        $(this).css('display', 'none');
	      });

	      // the corresponding panel we have to show after hiding the visible
	      var toDisplay = $('#jsxc-sidebar-content-viewport #' + contentId);

	      if (toDisplay.length < 1) {
	        throw new Error("Unable to find ID: " + contentId);
	      } else {

	        // display element transparent
	        toDisplay.css({
	          opacity : 0, display : 'block'
	        });

	        // animate opacity
	        toDisplay.animate({
	          opacity : 1
	        }, self.OPACITY_ANIMATION_DURATION);

	      }

	    }

	  },

	  /**
	   * Update the name displayed on bottom of the chat sidebar
	   */
	  updateStatusBarUserName : function() {

	    if (jsxc.xmpp.conn) {
	      $("#jsxc-status-bar .jsxc-user-name").text(Strophe.getNodeFromJid(jsxc.xmpp.conn.jid));
	    }

	    else {
	      $("#jsxc-status-bar .jsxc-user-name").text(jsxc.t('disconnected'));
	    }

	  },

	  /**
	   * Notifications panel, where are displayed all notifications
	   * @private
	   */
	  _initNotificationsPanel : function() {

	    var self = jsxc.newgui;

	    // add openning action
	    $("#jsxc-main-menu .jsxc-action_manage-notifications").click(function() {
	      self.toggleNotificationsMenu();
	    });

	  },

	  /**
	   * Update the top of the chat sidebar to display notices or others
	   */
	  updateChatSidebarHeader : function(disconnected) {

	    var self = jsxc.newgui;

	    var headerContent = $("#jsxc-chat-sidebar-header .jsxc-header-content");
	    headerContent.empty();
	    headerContent.off('click');

	    // we are disconnected
	    if (disconnected === true) {
	      headerContent.append('<span>Déconnecté</span>');
	    }

	    // if notifications, display them
	    else if (jsxc.notice.getNotificationsNumber() > 0) {

	      headerContent.append(
	          '<span><span class="jsxc_menu_notif_number"></span> ' + jsxc.t('notification_s') +
	          '</span>');

	      // open notifications on click
	      headerContent.click(function(event) {
	        event.stopPropagation();

	        self.toggleChatSidebar(true);

	        self.toggleNotificationsMenu();

	      });

	      jsxc.notice.updateNotificationNumbers();

	    }

	    // if not, display online buddies
	    else {
	      var online = $('#jsxc_buddylist li[data-status!="offline"][data-type="chat"]').length;

	      var message;
	      if (online === 0) {
	        message = jsxc.t('no_activity');
	      }

	      else if (online === 1) {
	        message = jsxc.t('one_person_online');
	      }

	      else {
	        message = jsxc.t('persons_online', {nbr : online});
	      }

	      headerContent.append('<span>' + message + '</span>');
	    }

	    // keep handler if used like this
	    return true;

	  },

	  /**
	   * Update user indicator in the bottom of chat sidebar
	   */
	  updateOwnPresenceIndicator : function(disconnection) {

	    var statusSelect = $("#jsxc-status-bar .jsxc-select-status");
	    var username = $('#jsxc-status-bar .jsxc-user-name');
	    var pres = jsxc.storage.getUserItem('presence') || 'online';
	    var selectedPres = statusSelect ? statusSelect.val() : null;

	    username.removeClass('jsxc_online jsxc_chat jsxc_away jsxc_xa jsxc_dnd jsxc_offline');

	    // we are connected
	    if (jsxc.xmpp.conn && disconnection !== true) {

	      // change icon of user name
	      username.addClass('jsxc_' + pres);

	      if (statusSelect) {

	        // check if status was not changed programmatically
	        if (statusSelect.attr("disabled") === "disabled") {
	          statusSelect.attr('disabled', false);
	        }

	        if (selectedPres !== pres) {
	          statusSelect.val(pres);
	        }

	      }

	    }

	    // we are disconnected
	    else {
	      username.addClass('jsxc_offline');
	      username.addClass('user');

	      if (statusSelect) {
	        statusSelect.val("novalue");
	        statusSelect.attr("disabled", true);
	      }

	    }

	  },

	  /**
	   * Search user panel (XEP 0055)
	   * @private
	   */
	  _initSearchPanel : function() {

	    var self = jsxc.newgui;

	    $(".jsxc-action_search-user").click(function() {
	      self.chatSidebarContent.showContent('jsxc-search-users');
	    });

	    var searchBar = $('#jsxc-chat-sidebar-search');

	    searchBar.keyup(function() {

	      var terms = searchBar.val();

	      clearTimeout(self._searchTimer);
	      self._searchTimer = setTimeout(function() {

	        jsxc.debug("Search: " + terms);

	        jsxc.xmpp.search.searchUsers(terms).then(function(results) {
	          self._displayUserSearchResults(results);
	        }).fail(function(error) {
	          self._displayUserSearchError(error);
	        });

	      }, 700);

	    });

	  },

	  /**
	   * Called when we have to display search user results. Results can be selected to invite buddies.
	   * @param results
	   * @private
	   */
	  _displayUserSearchResults : function(results) {

	    var list = $("#jsxc-chat-sidebar .jsxc-search-users-results");

	    list.empty();

	    var displayed = 0;
	    var ownJid = jsxc.jidToBid(jsxc.xmpp.conn.jid);

	    $.each(results, function(index, element) {

	      if (element.jid === ownJid) {
	        // do not display but continue
	        return true;
	      }

	      var res = $("<div class='jsxc-search-user-entry'></div>").text(element.username);
	      res.css({
	        display : 'block', opacity : 0
	      });

	      res.data('jid', element.jid);

	      // element to show is a buddy, an special icon is displayed and switched with checked icon on
	      // selection
	      if (element._is_buddy === true) {
	        res.attr('title', element.username + ' ' + jsxc.t('is_in_your_roster'));
	        res.addClass('jsxc-search-result-buddie');
	        res.click(function() {

	          if (res.hasClass('jsxc-search-result-buddie')) {
	            res.removeClass('jsxc-search-result-buddie');
	            res.addClass('jsxc-checked');
	          } else {
	            res.removeClass('jsxc-checked');
	            res.addClass('jsxc-search-result-buddie');
	          }

	        });
	      }

	      // element to show is not a buddy
	      else {
	        res.attr('title', element.username + ' ' + jsxc.t('is_not_in_your_roster'));
	        res.click(function() {
	          res.toggleClass('jsxc-checked');
	        });
	      }

	      list.append(res);

	      res.animate({
	        'opacity' : 1
	      });

	      displayed++;
	    });

	    if (displayed < 1) {
	      list.append("<div class='jsxc-search-user-entry'>" + jsxc.t('no_result') + "</div>");
	      return;
	    }

	  },

	  /**
	   * Called when an error occur while searching in user list
	   *
	   * @param error
	   * @private
	   */
	  _displayUserSearchError : function(error) {

	    var list = $("#jsxc-chat-sidebar-search .jsxc-search-users-results");

	    list.empty();

	    list.append("<div>" + jsxc.t('error_while_searching', {err : error}) + "</div>");

	  },

	  /**
	   * Open or close notifications panem
	   */
	  toggleNotificationsMenu : function() {
	    jsxc.newgui.chatSidebarContent.toggleContent('jsxc-manage-notifications');
	  },

	  /**
	   * Init the connexion panel
	   * @private
	   */
	  _initConnexionMenu : function() {

	    var self = jsxc.newgui;

	    // display warning if connexion time > 10s
	    var connexionTimerValueMs = 12000;
	    var connexionTimerId = -1;

	    /**
	     * Display a standby message while connecting
	     * @param visible
	     */
	    var showStandBy = function(visible) {

	      var standby = $("#jsxc-connexion-menu #jsxc-login-standby");

	      if (visible === true) {
	        standby.css({'display' : 'block', 'opacity' : 0})
	            .animate({opacity : 1}, self.OPACITY_ANIMATION_DURATION);
	      }

	      else {
	        standby.css({'display' : 'none', 'opacity' : 0});
	      }
	    };

	    /**
	     * Display a warning message in case of anormal fail of connection
	     * @param visible
	     */
	    var showWarning = function(visible) {

	      var warning = $("#jsxc-connexion-menu #jsxc-login-warning");

	      if (visible === true) {
	        warning.css({'display' : 'block', 'opacity' : 0})
	            .animate({opacity : 1}, self.OPACITY_ANIMATION_DURATION);
	      }

	      else {
	        warning.css({'display' : 'none', 'opacity' : 0});
	      }
	    };

	    /**
	     * Watch if connexion take too logn time
	     */
	    var watchConnexionTimer = function() {

	      // display warning
	      showStandBy(false);
	      showWarning(true);

	      jsxc.gui.feedback('__i18nid_:connection_fail', null, 'warn');

	      // reset jsxc
	      jsxc.xmpp.logout();
	      jsxc.xmpp.disconnected();

	    };

	    /**
	     * Triggered if credentials are invalid
	     */
	    var authFail = function() {

	      clearTimeout(connexionTimerId);

	      jsxc.gui.feedback('__i18nid_:bad_credentials', null, 'warn');

	      showStandBy(false);

	      // reset jsxc
	      jsxc.xmpp.logout();
	      jsxc.xmpp.disconnected();

	    };

	    /**
	     * Triggered if connection fail
	     */
	    var connFail = function() {

	      clearTimeout(connexionTimerId);

	      jsxc.gui.feedback('__i18nid_:connection_fail', null, 'warn');

	      showStandBy(false);

	      // reset jsxc
	      jsxc.xmpp.logout();
	      jsxc.xmpp.disconnected();

	    };

	    /**
	     * Triggered if connexion success
	     */
	    var connSuccess = function() {

	      clearTimeout(connexionTimerId);

	      // reset fields
	      $('#jsxc-connexion-login').val('');
	      $('#jsxc-connexion-password').val('');

	      // remove uneeded hadndlers
	      $(document).off('authfail.jsxc', authFail);
	      $(document).off('disconnected.jsxc', connFail);
	      $(document).off('connected.jsxc', connSuccess);

	      jsxc.gui.feedback('__i18nid_:connection_success');

	      showStandBy(false);

	      self.toggleBuddyList();

	    };

	    /**
	     * Click on "Connection" button
	     */
	    $('#jsxc-connexion-menu #jsxc-connexion-submit').click(function() {

	      if (jsxc.xmpp.conn) {
	        jsxc.gui.feedback('__i18nid_:you_are_already_connected');
	        return;
	      }

	      // check login and password
	      var login = $('#jsxc-connexion-login').val();
	      var password = $('#jsxc-connexion-password').val();

	      if (!login || login.indexOf('@') !== -1) {
	        jsxc.gui.feedback('__i18nid_:bad_id', null, 'warn');
	        return;
	      }

	      login = login + "@" + jsxc.options.xmpp.domain;

	      if (!password) {
	        jsxc.gui.feedback('__i18nid_:bad_password', null, 'warn');
	        return;
	      }

	      showWarning(false);
	      showStandBy(true);

	      // authentication fail
	      $(document).off('authfail.jsxc', authFail);
	      $(document).one('authfail.jsxc', authFail);

	      // connexion fail
	      $(document).off('disconnected.jsxc', connFail);
	      $(document).one('disconnected.jsxc', connFail);

	      // connexion success
	      $(document).off('connected.jsxc', connSuccess);
	      $(document).one('connected.jsxc', connSuccess);

	      // connexion
	      try {

	        connexionTimerId = setTimeout(watchConnexionTimer, connexionTimerValueMs);

	        jsxc.xmpp.login(login, password);

	      } catch (e) {
	        jsxc.error(e);
	        jsxc.gui.feedback('__i18nid_:error_while_connecting', null, 'warn');

	        showStandBy(false);
	      }

	    });

	  },

	  /**
	   * Open or close settings menu
	   */
	  toggleConnexionMenu : function() {
	    jsxc.newgui.chatSidebarContent.toggleContent('jsxc-connexion-menu');
	  },

	  /**
	   * Return true if chat sidebar is shown
	   */
	  isConnexionMenuShown : function() {
	    return jsxc.newgui.chatSidebarContent.isContentVisible('jsxc-connexion-menu');
	  },

	  /**
	   * Open or close settings menu
	   */
	  toggleActionsMenu : function() {
	    jsxc.newgui.chatSidebarContent.toggleContent('jsxc-main-menu');
	  },

	  /**
	   * EXPERIMENTAL
	   * Allow users to navigate on mediapanel without scrollbars
	   */
	  initMediaPanelMouseNavigation : function() {

	    // var self = jsxc.newgui;

	    var mpanel = $("#jsxc-mediapanel-right");
	    var lastMove;

	    mpanel.mousemove(function(event) {

	      console.log(event.pageX, event.pageY);

	      // do not operate if mouse too down
	      if (event.pageY > 150) {
	        return true;
	      }

	      // first move
	      if (!lastMove) {
	        lastMove = event.pageX;

	        // keep handler
	        return true;
	      }

	      // get dimensions of panel
	      var frameSize = mpanel.width();
	      var viewportSize = 0;
	      mpanel.find("div.jsxc-media-ressource").each(function() {
	        viewportSize += $(this).width();
	      });

	      if (viewportSize > frameSize) {

	        var factor = viewportSize / frameSize;

	        // get direction
	        var direction = lastMove - event.pageX;

	        mpanel.scrollLeft(mpanel.scrollLeft() - direction * factor);

	      }

	      lastMove = event.pageX;

	    });

	  },

	  /**
	   * Buddylist filter. Allow to show only buddies or conversations.
	   *
	   * For historical reasons, buddies and conversations are stored in same
	   * containers.
	   *
	   * @param mode
	   */
	  toggleBuddyFilter : function(mode) {

	    var self = jsxc.newgui;
	    var roster = jsxc.gui.roster;

	    self._log("toggleBuddyFilter: " + mode);

	    self.toggleSelectionMode(false);

	    // set filter for future adding
	    roster.setFilterMode(mode);

	    var list = self._getBuddyList();

	    // hide all
	    list.each(function() {
	      $(this).css({
	        'opacity' : 0
	      });
	    });

	    var hideElement = function(element) {
	      element.css("display", "none");
	    };

	    var showElement = function(element) {

	      element.css({
	        display : 'block'
	      });

	      element.animate({
	        opacity : 1
	      }, self.OPACITY_ANIMATION_DURATION);

	    };

	    var applyBuddie = mode === 'buddies' ? showElement : hideElement;
	    var applyConversation = mode === 'conversations' ? showElement : hideElement;

	    list.each(function() {
	      var element = $(this);

	      if (element.data('type') === 'chat') {
	        applyBuddie(element);
	      } else {
	        applyConversation(element);
	      }

	    });

	    // show buddy panel if necessary
	    // at end of all treatments !
	    if (self.chatSidebarContent.isMainContentVisible() !== true) {
	      self.chatSidebarContent.showMainContent();
	    }

	  },

	  /**
	   * Unselect all buddies and conversations
	   */
	  unselectAllElements : function() {

	    var self = jsxc.newgui;

	    self._getBuddyList().find('.jsxc-checked').removeClass('jsxc-checked');

	    self._updateSelectedCount();

	  },

	  /**
	   * Update buddy count next the selection mode button
	   */
	  _updateSelectedCount : function() {

	    var self = jsxc.newgui;

	    var count = self._getBuddyList().find('.jsxc-checked').length;

	    var text = count > 0 ? '(' + count + ')' : '';

	    $('#jsxc-select-buddies .jsxc-selected-number').text(text);

	  },

	  /**
	   * Toggle selection mode in chat sidebar
	   *
	   * When enabled selection mode allow user to select multiple users with ticks
	   *
	   * @param enabled
	   */
	  toggleSelectionMode : function(enabled) {

	    var self = jsxc.newgui;

	    var list = self._getBuddyList();

	    enabled = typeof enabled !== 'undefined' ? enabled : !self._selectionMode;
	    self._selectionMode = enabled;

	    // show main content if necessary
	    if (self.chatSidebarContent.isMainContentVisible() !== true) {
	      self.chatSidebarContent.showMainContent();
	    }

	    // enable selection mode
	    if (self._selectionMode === true) {

	      $('#jsxc-select-buddies').addClass("jsxc-checked");

	      // remove all click handler and replace it by selector
	      list.each(function() {

	        var element = $(this);
	        element.off('click');

	        element.on('click', function() {

	          var toDecorate = $(this).find('div.jsxc_name');
	          self._toggleBuddySelected(toDecorate);

	          self._updateSelectedCount();
	        });

	      });

	      self._updateSelectedCount();

	    }

	    // disable selection mode
	    else {

	      $('#jsxc-select-buddies').removeClass("jsxc-checked");

	      self.unselectAllElements();

	      // remove all click handler and replace it by selector
	      list.each(function() {

	        var element = $(this);
	        element.off('click');

	        element.find(".jsxc-checked").removeClass("jsxc-checked");

	        element.click(function() {
	          jsxc.gui.window.open(element.data("bid"));
	        });

	      });

	    }

	  },

	  _toggleBuddySelected : function(toDecorate) {

	    var className = 'jsxc-checked';
	    if (toDecorate.hasClass(className)) {
	      toDecorate.removeClass(className);
	    } else {
	      toDecorate.addClass(className);
	    }
	    return toDecorate;
	  },

	  /**
	   * Return an JQuery instance of the buddy list ( li )
	   * @returns {*|JQuery|jQuery|HTMLElement}
	   * @private
	   */
	  _getBuddyList : function() {

	    // TODO check selection method
	    return $("#jsxc_buddylist li.jsxc_rosteritem");

	  },

	  /**
	   * Get all checked elements from buddylist, conversations AND buddies
	   *
	   * If no one is selected, ask user about
	   *
	   * @returns {Array}
	   * @private
	   */
	  getCheckedElementsOrAskFor : function(buddiesOnly) {

	    var self = jsxc.newgui;
	    buddiesOnly = typeof buddiesOnly !== 'undefined' ? buddiesOnly : false;

	    var defer = $.Deferred();

	    var rslt = self.getCheckedElements(buddiesOnly);

	    // some elements are checked, return them
	    if (rslt.length > 0) {

	      // unselect all, to prevent mistakes
	      self.unselectAllElements();

	      defer.resolve(rslt);
	    }

	    // no elements checked, show BUDDY selection dialog only
	    else {
	      jsxc.gui.showSelectContactsDialog()
	          .then(function(result) {
	            defer.resolve(result);
	          })
	          .fail(function() {
	            defer.reject("canceled");
	          });
	    }

	    return defer.promise();

	  },

	  /**
	   * Get checked elements from buddylist, and only the buddies
	   *
	   * If no one is selected, ask user about
	   *
	   * @returns {Array}
	   * @private
	   */
	  getCheckedBuddiesOrAskFor : function() {
	    return jsxc.newgui.getCheckedElementsOrAskFor(true);
	  },

	  /**
	   * Return checked elements
	   */
	  getCheckedElements : function(buddiesOnly) {

	    var self = jsxc.newgui;

	    buddiesOnly = typeof buddiesOnly !== 'undefined' ? buddiesOnly : false;

	    var all = self._getBuddyList();
	    var rslt = [];

	    // search for checked elements
	    all.each(function() {

	      var element = $(this);

	      // continue if we need only buddies
	      if (buddiesOnly === true && element.data('type') === 'groupchat') {
	        return true;
	      }

	      if (element.find(".jsxc-checked").length > 0) {
	        rslt.push(element.data('jid'));
	      }

	    });

	    return rslt;

	  },

	  /**
	   * Return checked buddies
	   */
	  getCheckedBuddies : function() {
	    var self = jsxc.newgui;
	    return self.getCheckedElements(true);
	  },

	  /**
	   * Return true if chat sidebar is shown
	   */
	  isChatSidebarShown : function() {
	    return $("#jsxc-chat-sidebar-content").hasClass("jsxc-deploy");
	  },

	  /**
	   * Open or close buddy list
	   */
	  toggleBuddyList : function() {
	    jsxc.newgui.chatSidebarContent.toggleContent('jsxc-buddy-list-container');
	  },

	  /**
	   * Open or close settings menu
	   */
	  toggleSettingsMenu : function() {
	    jsxc.newgui.chatSidebarContent.toggleContent('jsxc-settings-menu');
	  },

	  /**
	   * Open or close settings menu
	   */
	  toggleHelpMenu : function() {
	    jsxc.newgui.chatSidebarContent.toggleContent('jsxc-help-menu');
	  },

	  /**
	   * Show / hide the panel where we can search users
	   */
	  toggleSearchPanel : function() {

	    var self = jsxc.newgui;

	    if (self.chatSidebarContent.isContentVisible('jsxc-search-users') !== true) {
	      self.chatSidebarContent.showContent('jsxc-search-users');
	    } else {
	      self.chatSidebarContent.showMainContent();
	    }

	  },

	  /**
	   * Show / hide the chat sidebar
	   */
	  toggleChatSidebar : function(state, callbackWhenFinished) {

	    var self = jsxc.newgui;

	    // if state not specified, invert it
	    if (typeof state === 'undefined' || state === null) {
	      state = !self.isChatSidebarShown();
	    }

	    // nothing to do, return
	    if (state === self.isChatSidebarShown()) {
	      if (callbackWhenFinished) {
	        callbackWhenFinished();
	      }
	      return;
	    }

	    var content = $("#jsxc-chat-sidebar-content");
	    var settings = $("#jsxc-chat-sidebar .jsxc-toggle-settings");
	    var help = $("#jsxc-chat-sidebar .jsxc-toggle-help");
	    var closeCross = $('#jsxc-chat-sidebar .jsxc-close-chatsidebar');

	    // deploy chat side bar
	    if (state === true) {

	      // show close button
	      closeCross.css({
	        opacity : '0', display : 'inline-block'
	      });
	      closeCross.animate({
	        opacity : 1
	      });

	      // show settings button
	      settings.css({
	        opacity : '0', display : 'inline-block'
	      });
	      settings.animate({
	        opacity : 1
	      });

	      // show help button
	      help.css({
	        opacity : '0', display : 'inline-block'
	      });
	      help.animate({
	        opacity : 1
	      });

	      // raise sidebar
	      content.animate({
	        height : self.SIDEBAR_CONTENT_HEIGHT
	      }, self.SIDEBAR_ANIMATION_DURATION, function() {

	        // Animation complete.
	        content.addClass("jsxc-deploy");

	        if (callbackWhenFinished) {
	          callbackWhenFinished();
	        }
	      });

	    }

	    else {

	      // hide close button
	      closeCross.animate({
	        opacity : 0
	      });

	      // hide settings button
	      settings.animate({
	        opacity : 0
	      });

	      // hide help button
	      help.animate({
	        opacity : 0
	      });

	      // drop down sidebar
	      content.animate({
	        height : '0px'
	      }, self.SIDEBAR_ANIMATION_DURATION, function() {

	        // Animation complete.
	        content.removeClass("jsxc-deploy");

	        settings.css({
	          display : 'none'
	        });

	        help.css({
	          display : 'none'
	        });

	        closeCross.css({
	          display : 'none'
	        });

	        if (callbackWhenFinished) {
	          callbackWhenFinished();
	        }
	      });

	    }

	  }
	});
	/**
	 * Handle functions related to the gui of the roster
	 *
	 * @namespace jsxc.gui.roster
	 */
	jsxc.gui.roster = {

	  /** True if roster is initialised */
	  ready : false,

	  /** True if all items are loaded */
	  loaded : false,

	  /**
	   * Init the roster skeleton
	   *
	   * @memberOf jsxc.gui.roster
	   * @returns {undefined}
	   */
	  init : function() {
	    
	    // display or hide offline buddies
	    if (jsxc.options.get('hideOffline')) {
	      $('#jsxc_buddylist').addClass('jsxc_hideOffline');
	    }

	    // mute sounds
	    if (jsxc.options.get('muteNotification')) {
	      jsxc.notification.muteSound();
	    }

	    var pres = jsxc.storage.getUserItem('presence') || 'online';
	    jsxc.xmpp.changeOwnPresence(pres);

	    jsxc.notice.load();

	    jsxc.gui.roster.ready = true;

	    $(document).trigger('ready.roster.jsxc');

	  },

	  /**
	   * Create roster item and add it to the roster
	   *
	   * @param {String} bid bar jid
	   */
	  add : function(bid) {

	    var self = jsxc.gui.roster;

	    var data = jsxc.storage.getUserItem('buddy', bid);

	    if (!data) {
	      throw new Error("Invalid buddy: " + bid);
	    }

	    var bud = jsxc.gui.buddyTemplate.clone().attr('data-bid', bid).attr('data-type',
	        data.type || 'chat');

	    // hide element if filter is enabled
	    self.setVisibilityByFilter(bud);

	    jsxc.gui.roster.insert(bid, bud);

	    bud.click(function() {
	      jsxc.gui.window.open(bid);
	    });

	    bud.find('.jsxc_msg').click(function() {
	      jsxc.gui.window.open(bid);

	      return false;
	    });

	    jsxc.gui.update(bid);

	    var history = jsxc.storage.getUserItem('history', bid) || [];
	    var i = 0;
	    while (history.length > i) {
	      var message = new jsxc.Message(history[i]);
	      if (message.direction !== jsxc.Message.SYS) {
	        $('[data-bid="' + bid + '"]').find('.jsxc_lastmsg .jsxc_text').html(
	            jsxc.stripHtml(message.msg));
	        break;
	      }
	      i++;
	    }

	    $(document).trigger('add.roster.jsxc', [bid, data, bud]);
	  },

	  availablesFilterModes : ['buddies', 'conversations'],

	  filterMode : 'buddies', // buddies || conversations

	  setFilterMode : function(mode) {

	    var self = jsxc.gui.roster;

	    if (self.availablesFilterModes.indexOf(mode) === -1) {
	      throw new Error("Unknown mode: " + mode);
	    }

	    self.filterMode = mode;
	  },

	  setVisibilityByFilter : function(li) {

	    var self = jsxc.gui.roster;

	    var hideElement = function(element) {
	      element.css("display", "none");
	    };

	    var showElement = function(element) {
	      element.css({
	        display : 'block'
	      });
	    };

	    var type = li.data('type');
	    if (type === 'chat') {

	      if (self.filterMode === 'buddies') {
	        showElement(li);
	      }

	      else {
	        hideElement(li);
	      }

	    }

	    // groupchat
	    else if (type === "groupchat") {

	      if (self.filterMode === 'buddies') {
	        hideElement(li);
	      }

	      else {
	        showElement(li);
	      }

	    }

	    else {
	      throw new Error("Unkown type: " + type);
	    }
	  },

	  getItem : function(bid) {
	    return $("#jsxc_buddylist > li[data-bid='" + bid + "']");
	  },

	  /**
	   * Insert roster item. First order: online > away > offline. Second order:
	   * alphabetical of the name
	   *
	   * @param {type} bid
	   * @param {jquery} li roster item which should be insert
	   * @returns {undefined}
	   */
	  insert : function(bid, li) {

	    var data = jsxc.storage.getUserItem('buddy', bid);
	    var listElements = $('#jsxc_buddylist > li');
	    var insert = false;

	    // Insert buddy with no mutual friendship to the end
	    var status = (data.sub === 'both') ? data.status : -1;

	    listElements.each(function() {

	      var thisStatus = ($(this).data('sub') === 'both') ? $(this).data('status') : -1;

	      if (($(this).data('name').toLowerCase() > data.name.toLowerCase() && thisStatus === status) ||
	          thisStatus < status) {

	        $(this).before(li);
	        insert = true;

	        return false;
	      }
	    });

	    if (!insert) {
	      li.appendTo('#jsxc_buddylist');
	    }
	  },

	  /**
	   * Initiate reorder of roster item
	   *
	   * @param {type} bid
	   * @returns {undefined}
	   */
	  reorder : function(bid) {
	    jsxc.gui.roster.insert(bid, jsxc.gui.roster.remove(bid));
	  },

	  /**
	   * Removes buddy from roster
	   *
	   * @param {String} bid bar jid
	   * @return {JQueryObject} Roster list element
	   */
	  remove : function(bid) {

	    var res = jsxc.gui.roster.getItem(bid).detach();

	    // It is a bad idea to trigger here. Remove is used in reorder, so events are too many
	    // $(document).trigger('remove.roster.jsxc', [bid]);

	    return res;
	  },

	  /**
	   * Removes buddy from roster and clean up
	   *
	   * @param {String} bid bar compatible jid
	   */
	  purge : function(bid) {
	    if (jsxc.master) {
	      jsxc.storage.removeUserItem('buddy', bid);
	      jsxc.storage.removeUserItem('otr', bid);
	      jsxc.storage.removeUserItem('otr_version_' + bid);
	      jsxc.storage.removeUserItem('chat', bid);
	      jsxc.storage.removeUserItem('window', bid);
	      jsxc.storage.removeUserElement('buddylist', bid);
	      jsxc.storage.removeUserElement('windowlist', bid);
	    }

	    jsxc.gui.window._close(bid);
	    jsxc.gui.roster.remove(bid);
	  },

	  /**
	   * Create input element for rename action
	   *
	   * @param {type} bid
	   * @returns {undefined}
	   */
	  rename : function(bid) {
	    var name = jsxc.gui.roster.getItem(bid).find('.jsxc_name');
	    var options = jsxc.gui.roster.getItem(bid).find('.jsxc_lastmsg, .jsxc_more');
	    var input = $('<input type="text" name="name"/>');

	    // hide more menu
	    $('body').click();

	    options.hide();
	    name = name.replaceWith(input);

	    input.val(name.text());
	    input.keypress(function(ev) {
	      if (ev.which !== 13) {
	        return;
	      }

	      options.css('display', '');
	      input.replaceWith(name);
	      jsxc.gui.roster._rename(bid, $(this).val());

	      $('html').off('click');
	    });

	    // Disable html click event, if click on input
	    input.click(function() {
	      return false;
	    });

	    $('html').one('click', function() {
	      options.css('display', '');
	      input.replaceWith(name);
	      jsxc.gui.roster._rename(bid, input.val());
	    });
	  },

	  /**
	   * Rename buddy
	   *
	   * @param {type} bid
	   * @param {type} newname new name of buddy
	   * @returns {undefined}
	   */
	  _rename : function(bid, newname) {
	    if (jsxc.master) {
	      var d = jsxc.storage.getUserItem('buddy', bid) || {};

	      if (d.type === 'chat') {
	        var iq = $iq({
	          type : 'set'
	        }).c('query', {
	          xmlns : 'jabber:iq:roster'
	        }).c('item', {
	          jid : jsxc.jidToBid(d.jid), name : newname
	        });
	        jsxc.xmpp.conn.sendIQ(iq);
	      } else if (d.type === 'groupchat') {
	        jsxc.xmpp.bookmarks.add(bid, newname, d.nickname, d.autojoin);
	      }
	    }

	    jsxc.storage.updateUserItem('buddy', bid, 'name', newname);
	    jsxc.gui.update(bid);
	  },

	  /**
	   * Shows a text with link to a login box that no connection exists.
	   */
	  noConnection : function() {

	    $('#jsxc_buddylist').empty();

	    $('#jsxc_buddylist').find(".jsxc_rosterIsEmptyMessage").remove();

	    var reconnectMsg = $("<div class='jsxc-reconnect-message'>Vous êtes déconnecté</div>");
	    reconnectMsg.click(function() {
	      jsxc.api.reconnect();
	    });

	    $('#jsxc_buddylist').append(reconnectMsg);

	    $(document).one('attached.jsxc', function() {
	      $('#jsxc_buddylist').find(".jsxc-reconnect-message").remove();
	    });

	  },

	  /**
	   * Shows a text with link to add a new buddy.
	   *
	   * @memberOf jsxc.gui.roster
	   */
	  empty : function() {

	    var text = $(
	        '<p class="jsxc_rosterIsEmptyMessage">' + jsxc.t('empty_roster_message') + '</p>');

	    text.click(function() {
	      jsxc.newgui.toggleSearchPanel();
	    });

	    var buddyList = $('#jsxc_buddylist');

	    if (buddyList.find(".jsxc_rosterIsEmptyMessage").length < 1) {
	      buddyList.prepend(text);

	      $(document).one('add.roster.jsxc', function() {
	        $('#jsxc_buddylist').find(".jsxc_rosterIsEmptyMessage").remove();
	      });
	    }

	  }
	};

	jsxc.gui.template = {};

	/**
	 * Return requested template and replace all placeholder
	 *
	 * @memberOf jsxc.gui.template;
	 * @param {type} name template name
	 * @param {type} bid
	 * @param {type} msg
	 * @returns {String} HTML Template
	 */
	jsxc.gui.template.get = function(name, bid, msg) {

	  // common placeholder
	  var ph = {
	    my_priv_fingerprint : jsxc.storage.getUserItem('priv_fingerprint') ?
	        jsxc.storage.getUserItem('priv_fingerprint').replace(/(.{8})/g, '$1 ') :
	        jsxc.t('not_available'),
	    my_jid : jsxc.storage.getItem('jid') || '',
	    my_node : Strophe.getNodeFromJid(jsxc.storage.getItem('jid') || '') || '',
	    root : jsxc.options.root,
	    app_name : jsxc.options.app_name,
	    version : jsxc.version
	  };

	  // placeholder depending on bid
	  if (bid) {
	    var data = jsxc.storage.getUserItem('buddy', bid);

	    $.extend(ph, {
	      bid_priv_fingerprint : (data && data.fingerprint) ?
	          data.fingerprint.replace(/(.{8})/g, '$1 ') : jsxc.t('not_available'),
	      bid_jid : bid,
	      bid_name : (data && data.name) ? data.name : bid
	    });
	  }

	  // placeholder depending on msg
	  if (msg) {
	    $.extend(ph, {
	      msg : msg
	    });
	  }

	  var ret = jsxc.gui.template[name];

	  if (typeof(ret) === 'string') {
	    // prevent 404
	    ret = ret.replace(/\{\{root\}\}/g, ph.root);

	    // convert to string

	    // ret = $('<div>').append($(ret).i18n()).html();
	    ret = $('<div>').append(jsxc.localization.processHtmlString(ret)).html();

	    // replace placeholders
	    ret = ret.replace(/\{\{([a-zA-Z0-9_\-]+)\}\}/g, function(s, key) {
	      return (typeof ph[key] === 'string') ? ph[key] : s;
	    });

	    return ret;
	  }

	  jsxc.debug('Template not available: ' + name);
	  return name;
	};

	jsxc.gui.widgets = {

	  /**
	   * Create a selectable conversation list
	   *
	   *
	   * <p>Each item contains data:
	   *
	   * <p>'data-conversjid'
	   *
	   *
	   * @param selector
	   */
	  createConversationList : function(selector) {

	    var root = $(selector);
	    root.empty();

	    root.addClass("jsxc_conversation-list-container");

	    // add list
	    var list = $("<ul class='jsxc-conversation-list'></ul>");
	    root.append(list);

	    // update lists
	    var updateConversationList = function() {

	      list.empty();

	      // iterate buddies
	      var conversList = jsxc.storage.getLocaleBuddyListBJID();
	      var conversNumber = 0;
	      $.each(conversList, function(index, jid) {

	        // check type of element: buddie / conversation
	        var infos = jsxc.storage.getUserItem('buddy', jsxc.jidToBid(jid));

	        if ((infos.type === 'groupchat') !== true) {
	          return true;
	        }

	        var conversName = Strophe.getNodeFromJid(jid);

	        // create list element
	        var li = $("<li></li>")
	            .text(conversName)
	            .data('conversjid', jid)
	            .click(function() {
	              $(this).toggleClass("jsxc-checked");
	            });

	        list.append(li);

	        conversNumber++;

	      });

	      if (conversNumber < 1) {
	        // create list element
	        var li = $("<li></li>")
	            .text(jsxc.t("no_conversation"))
	            .data('conversjid', null);

	        list.append(li);
	      }

	    };

	    // first update
	    updateConversationList();

	    return {
	      /**
	       * Jquery object on root
	       */
	      "root" : root,

	      /**
	       * Update list
	       */
	      "updateConversationList" : updateConversationList
	    };

	  },

	  /**
	   * Create a buddy list. To retrieve selected elements select $("#listId .ui-selected");
	   *
	   *
	   * <p>Each item contains data:
	   *
	   * <p>'data-conversjid'
	   *
	   *
	   * @param selector
	   */
	  createBuddyList : function(selector, selectedJids) {

	    selectedJids = selectedJids || [];

	    var root = $(selector);
	    root.empty();

	    root.addClass("jsxc_buddy-list-container");

	    // add list
	    var list = $("<ul class='jsxc-selectable-buddy-list'></ul>");
	    root.append(list);

	    // update lists
	    var updateBuddyList = function() {

	      list.empty();

	      // iterate buddies
	      var buddyList = jsxc.storage.getLocaleBuddyListBJID();
	      var buddyNumber = 0;
	      $.each(buddyList, function(index, jid) {

	        var bid = jsxc.jidToBid(jid);

	        // check type of element: buddie / conversation
	        var infos = jsxc.storage.getUserItem('buddy', bid);

	        if (infos.type === 'groupchat') {
	          return true;
	        }

	        var buddyName = Strophe.getNodeFromJid(jid);

	        // create list element
	        var li = $("<li></li>")
	            .text(buddyName)
	            .data('bid', bid)
	            .click(function() {
	              $(this).toggleClass("jsxc-checked");
	            });

	        if (selectedJids.indexOf(jid) > -1) {
	          li.addClass('jsxc-checked');
	        }

	        list.append(li);

	        buddyNumber++;

	      });

	      if (buddyNumber < 1) {
	        // create list element
	        var li = $("<li></li>")
	            .text(jsxc.t("no_contact"))
	            .data('bid', null);

	        list.append(li);
	      }

	    };

	    // first update
	    updateBuddyList();

	    return {
	      /**
	       * Jquery object on root
	       */
	      "root" : root,

	      /**
	       * Update list
	       */
	      "updateBuddyList" : updateBuddyList
	    };

	  }

	};
	/**
	 * Handle functions related to the gui of the window
	 *
	 * @namespace jsxc.gui.window
	 */
	jsxc.gui.window = {

	  /**
	   * Interval between composing chat state sends
	   */
	  sendComposingIntervalMs : 900,

	  /**
	   *
	   */
	  hideComposingNotifDelay : 3000,

	  /**
	   * Show a composing presence from jid specified in argument. JID can be a room jid or a person jid
	   * @param from
	   */
	  showComposingPresence : function(from, type) {

	    var bid = jsxc.jidToBid(from);
	    var user = type === "chat" ? Strophe.getNodeFromJid(from) : Strophe.getResourceFromJid(from);

	    // iterate window list
	    $('#jsxc_windowList .jsxc_windowItem').each(function() {

	      // the window element, where are stored informations
	      var self = $(this);

	      var winBid = self.data("bid");

	      // check conversation
	      if (winBid === bid) {

	        // add user in array if necessary
	        var usersComposing = self.data("users-composing") || [];
	        if (usersComposing.indexOf(user) === -1) {
	          usersComposing.push(user);
	          self.data("users-composing", usersComposing);
	        }

	        var textarea = self.find(".jsxc_textarea");
	        var composingNotif = textarea.find(".jsxc_userComposing");

	        // scroll to bottom
	        jsxc.gui.window.scrollDown(winBid);

	        // change text
	        var msg = usersComposing.length > 1 ? jsxc.t('are_writing') :
	            jsxc.t('is_writing');

	        // notification not present, add it
	        if (composingNotif.length < 1) {

	          composingNotif = $("<div class='jsxc_userComposing jsxc_chatmessage jsxc_sys'></div>");
	          composingNotif.css({opacity : 0, display : 'block'});
	          composingNotif.html(usersComposing.join(", ") + msg);

	          textarea.append(composingNotif);

	          composingNotif.animate({opacity : 1}, 600);
	        }

	        // notification present, modify it and show it if necessary
	        else {
	          composingNotif.html(usersComposing.join(", ") + msg);

	          if (composingNotif.css('opacity') !== '1') {
	            composingNotif.animate({opacity : 1}, 600);
	          }
	        }

	        // hide notification after delay
	        if ($(this).data("composingTimeout")) {
	          clearTimeout($(this).data("composingTimeout"));
	        }

	        $(this).data("composingTimeout",

	            setTimeout(function() {

	              composingNotif.animate({opacity : 0},

	                  600,

	                  function() {
	                    composingNotif.remove();
	                  });

	              // empty user list
	              self.data("usersComposing", []);

	            }, jsxc.gui.window.hideComposingNotifDelay));

	        // show only one presence
	        return false;
	      }

	    });
	  },

	  /**
	   * Init a window skeleton, if necessary, or return existing window
	   *
	   * @memberOf jsxc.gui.window
	   * @param {String} bid
	   * @returns {jQuery} Window object
	   */
	  init : function(bid) {

	    // if window already exist, return the existing one
	    if (jsxc.gui.window.get(bid).length > 0) {
	      return jsxc.gui.window.get(bid);
	    }

	    var win = jsxc.gui.windowTemplate.clone().attr('data-bid', bid).appendTo(
	        '#jsxc_windowList > ul');
	    var data = jsxc.storage.getUserItem('buddy', bid);

	    // Attach jid to window
	    win.data('jid', data.jid);

	    // Add handler

	    // @TODO generalize this. Duplicate of jsxc.roster.add
	    var expandClick = function() {
	      win.trigger('extra.jsxc');

	      $('body').click();

	      if (!win.find('.jsxc_menu').hasClass('jsxc_open')) {
	        win.find('.jsxc_menu').addClass('jsxc_open');

	        $('body').one('click', function() {
	          win.find('.jsxc_menu').removeClass('jsxc_open');
	        });
	      }

	      return false;
	    };

	    win.find('.jsxc_more').click(expandClick);

	    win.find('.jsxc_verification').click(function() {
	      jsxc.gui.showVerification(bid);
	    });

	    win.find('.jsxc_fingerprints').click(function() {
	      jsxc.gui.showFingerprints(bid);
	    });

	    win.find('.jsxc_transfer').click(function() {
	      jsxc.otr.toggleTransfer(bid);
	    });

	    win.find('.jsxc_bar').click(function() {
	      jsxc.gui.window.toggle(bid);
	    });

	    win.find('.jsxc_close').click(function() {
	      jsxc.gui.window.close(bid);
	    });

	    win.find('.jsxc_clear').click(function() {
	      jsxc.gui.window.clear(bid);
	    });

	    win.find('.jsxc_sendFile').click(function() {
	      $('body').click();

	      jsxc.gui.window.sendFile(bid);
	    });

	    win.find('.jsxc_tools').click(function() {
	      return false;
	    });

	    // last composing state sent time is stored here
	    win.data('lastComposingStateSent', -1);

	    win.find('.jsxc_textinput').keyup(function(ev) {
	      var body = $(this).val();

	      if (ev.which === 13) {
	        body = '';
	      }

	      jsxc.storage.updateUserItem('window', bid, 'text', body);

	      if (ev.which === 27) {
	        jsxc.gui.window.close(bid);
	      }

	      // send composing presence
	      if (jsxc.xmpp.conn) {

	        var now = new Date().getTime();
	        var last = win.data('lastComposingStateSent');

	        // send only every 'n' ms interval
	        if (last === "-1" || (now - last) > jsxc.gui.window.sendComposingIntervalMs) {

	          var type = win.hasClass('jsxc_groupchat') ? 'groupchat' : 'chat';

	          jsxc.xmpp.conn.chatstates.sendComposing(bid, type);

	          win.data('lastComposingStateSent', now);
	        }

	      }

	    }).keypress(function(ev) {
	      if (ev.which !== 13 || !$(this).val()) {
	        return;
	      }

	      jsxc.gui.window.postMessage({
	        bid : bid, direction : jsxc.Message.OUT, msg : $(this).val()
	      });

	      $(this).val('');
	    }).focus(function() {
	      // remove unread flag
	      jsxc.gui.readMsg(bid);
	    }).mouseenter(function() {
	      $('#jsxc_windowList').data('isOver', true);
	    }).mouseleave(function() {
	      $('#jsxc_windowList').data('isOver', false);
	    });

	    win.find('.jsxc_textarea').click(function() {
	      // check if user clicks element or selects text
	      if (typeof getSelection === 'function' && !getSelection().toString()) {
	        win.find('.jsxc_textinput').focus();
	      }
	    });

	    win.find('.jsxc_textarea').slimScroll({
	      height : '234px', distance : '3px'
	    });

	    win.find('.jsxc_name').disableSelection();

	    win.find('.slimScrollDiv').resizable({
	      handles : 'w, nw, n', minHeight : 234, minWidth : 250, resize : function(event, ui) {
	        jsxc.gui.window.resize(win, ui);
	      }, start : function() {
	        win.removeClass('jsxc_normal');
	      }, stop : function() {
	        win.addClass('jsxc_normal');
	      }
	    });

	    win.find('.jsxc_window').css('bottom', -1 * win.find('.jsxc_fade').height());

	    if ($.inArray(bid, jsxc.storage.getUserItem('windowlist')) < 0) {

	      // add window to windowlist
	      var wl = jsxc.storage.getUserItem('windowlist') || [];
	      wl.push(bid);
	      jsxc.storage.setUserItem('windowlist', wl);

	      // init window element in storage
	      jsxc.storage.setUserItem('window', bid, {
	        minimize : true, text : '', unread : 0
	      });

	      jsxc.gui.window.hide(bid);
	    } else {

	      if (jsxc.storage.getUserItem('window', bid).unread) {
	        jsxc.gui._unreadMsg(bid);
	      }
	    }

	    $.each(jsxc.gui.emotions, function(i, val) {
	      var ins = val[0].split(' ')[0];
	      var li = $('<li>');
	      li.append(jsxc.gui.shortnameToImage(':' + val[1] + ':'));
	      li.find('div').attr('title', ins);
	      li.click(function() {
	        win.find('input').val(win.find('input').val() + ins);
	        win.find('input').focus();
	      });
	      win.find('.jsxc_emoticons ul').prepend(li);
	    });

	    jsxc.gui.toggleList.call(win.find('.jsxc_emoticons'));

	    jsxc.gui.window.restoreChat(bid);

	    jsxc.gui.update(bid);

	    jsxc.gui.updateWindowListSB();

	    // create related otr object
	    if (jsxc.master && !jsxc.otr.objects[bid]) {
	      jsxc.otr.create(bid);
	    } else {
	      jsxc.otr.enable(bid);
	    }

	    jsxc.gui.window.checkBuddy(bid);

	    $(document).trigger('init.window.jsxc', [win]);

	    return win;
	  },

	  /**
	   * Check status and presence suscribtion of buddy to display warnings in chat window
	   * @param bid
	   */
	  checkBuddy : function(bid) {

	    if (!bid) {
	      throw new Error("Invalid argument: " + bid);
	    }

	    // retrieve window
	    var win = jsxc.gui.window.get(bid);
	    if (win.length < 1) {
	      // jsxc.debug("Buddy checks aborted, unable to find window", {bid : bid, win : win});
	      return;
	    }

	    // retrieve informations
	    var node = Strophe.getNodeFromJid(bid);
	    var data = jsxc.storage.getUserItem('buddy', bid);

	    // remove old warnings
	    win.find('.jsxc-warning-offline').remove();
	    win.find('.jsxc-warning-notbuddy').remove();

	    // show warning if user is not a buddy
	    if (data.sub !== "both") {
	      win.find('.jsxc_textarea').prepend("<div class='jsxc-warning-notbuddy'><i>" + node +
	          "</i> " + jsxc.t('not_a_contact_chat_warning') + "</div>");
	    }

	    else {

	      // display warning if buddy is offline
	      if (data.status === jsxc.CONST.STATUS.indexOf('offline')) {
	        win.find('.jsxc_textarea').prepend(
	            "<div class='jsxc-warning-offline'><i>" + node + "</i> est à présent déconnecté</div>");
	      }

	    }

	  },

	  /**
	   * Resize given window to given size. If no size is provided the window is resized to the default
	   * size.
	   *
	   * @param  {(string|jquery)} win Bid or window object
	   * @param  {object} ui    The size has to be in the format {size:{width: [INT], height: [INT]}}
	   * @param  {boolean} [outer] If true the given size is used as outer dimensions.
	   */
	  resize : function(win, ui, outer) {
	    var bid;

	    if (typeof win === 'object') {
	      bid = win.attr('data-bid');
	    } else if (typeof win === 'string') {
	      bid = win;
	      win = jsxc.gui.window.get(bid);
	    } else {
	      jsxc.warn('jsxc.gui.window.resize has to be called either with bid or window object.');
	      return;
	    }

	    if (!win.attr('data-default-height')) {
	      win.attr('data-default-height', win.find('.ui-resizable').height());
	    }

	    if (!win.attr('data-default-width')) {
	      win.attr('data-default-width', win.find('.ui-resizable').width());
	    }

	    var outer_height_diff = (outer) ?
	    win.find('.jsxc_window').outerHeight() - win.find('.ui-resizable').height() : 0;

	    ui = $.extend({
	      size : {
	        width : parseInt(win.attr('data-default-width')),
	        height : parseInt(win.attr('data-default-height')) + outer_height_diff
	      }
	    }, ui || {});

	    if (outer) {
	      ui.size.height -= outer_height_diff;
	    }

	    win.find('.slimScrollDiv').css({
	      width : ui.size.width, height : ui.size.height
	    });

	    win.width(ui.size.width);

	    win.find('.jsxc_textarea').slimScroll({
	      height : ui.size.height
	    });

	    // var offset = win.find('.slimScrollDiv').position().top;
	    //win.find('.jsxc_emoticons').css('top', (ui.size.height + offset + 6) + 'px');

	    $(document).trigger('resize.window.jsxc', [win, bid, ui.size]);
	  },

	  fullsize : function(bid) {
	    var win = jsxc.gui.window.get(bid);
	    var size = jsxc.options.viewport.getSize();

	    size.width -= 10;
	    size.height -= win.find('.jsxc_bar').outerHeight() + win.find('.jsxc_textinput').outerHeight();

	    jsxc.gui.window.resize(win, {
	      size : size
	    });
	  },

	  /**
	   * Returns the window element
	   *
	   * @param {String} bid
	   * @returns {jquery} jQuery object of the window element
	   */
	  get : function(id) {
	    return $("li.jsxc_windowItem[data-bid='" + jsxc.jidToBid(id) + "']");
	  },

	  /**
	   * Open a window, related to the bid. If the window doesn't exist, it will be
	   * created.
	   *
	   * @param {String} bid
	   * @returns {jQuery} Window object
	   */
	  open : function(bid) {

	    var win = jsxc.gui.window.init(bid);

	    jsxc.gui.window.show(bid);
	    jsxc.gui.window.highlight(bid);

	    return win;
	  },

	  /**
	   * Close chatwindow and clean up
	   *
	   * @param {String} bid bar jid
	   */
	  close : function(bid, callBackWhenFinished) {

	    var win = jsxc.gui.window.get(bid);
	    if (win.length === 0) {
	      jsxc.warn('Want to close a window, that is not open.');
	      return;
	    }

	    // animate closing
	    win.find(".jsxc_window").animate({
	          "height" : "0px"
	        }, 500,

	        function() {

	          jsxc.storage.removeUserElement('windowlist', bid);
	          jsxc.storage.removeUserItem('window', bid);

	          // delete data from unknown sender
	          if (jsxc.storage.getUserItem('buddylist') && jsxc.storage.getUserItem('buddylist').indexOf(bid) < 0) {
	            jsxc.storage.removeUserItem('buddy', bid);
	            jsxc.storage.removeUserItem('chat', bid);
	          }

	          jsxc.gui.window._close(bid);

	          if(callBackWhenFinished){
	            callBackWhenFinished();
	          }
	        });
	  },

	  /**
	   * Close chatwindow
	   *
	   * @param {String} bid
	   */
	  _close : function(bid) {
	    jsxc.gui.window.get(bid).remove();
	    jsxc.gui.updateWindowListSB();
	  },

	  /**
	   * Toggle between minimize and maximize of the text area
	   *
	   * @param {String} bid bar jid
	   */
	  toggle : function(bid) {

	    var win = jsxc.gui.window.get(bid);

	    if (win.parents("#jsxc_windowList").length === 0) {
	      return;
	    }

	    if (win.hasClass('jsxc_min')) {
	      jsxc.gui.window.show(bid);
	    } else {
	      jsxc.gui.window.hide(bid);
	    }

	    jsxc.gui.updateWindowListSB();
	  },

	  /**
	   * Maximize text area and save
	   *
	   * @param {String} bid
	   */
	  show : function(bid) {

	    jsxc.storage.updateUserItem('window', bid, 'minimize', false);

	    return jsxc.gui.window._show(bid);
	  },

	  /**
	   * Maximize text area
	   *
	   * @param {String} bid
	   * @returns {undefined}
	   */
	  _show : function(bid) {
	    var win = jsxc.gui.window.get(bid);
	    var duration = 0;

	    win.removeClass('jsxc_min').addClass('jsxc_normal');
	    win.find('.jsxc_window').css('bottom', '0');

	    setTimeout(function() {
	      var padding = $("#jsxc_windowListSB").width();
	      var innerWidth = $('#jsxc_windowList>ul').width();
	      var outerWidth = $('#jsxc_windowList').width() - padding;

	      if (innerWidth > outerWidth) {
	        var offset = parseInt($('#jsxc_windowList>ul').css('right'));
	        var width = win.outerWidth(true);

	        var right = innerWidth - win.position().left - width + offset;
	        var left = outerWidth - (innerWidth - win.position().left) - offset;

	        if (left < 0) {
	          jsxc.gui.scrollWindowListBy(left * -1);
	        }

	        if (right < 0) {
	          jsxc.gui.scrollWindowListBy(right);
	        }
	      }
	    }, duration);

	    // If the area is hidden, the scrolldown function doesn't work. So we
	    // call it here.
	    jsxc.gui.window.scrollDown(bid);

	    if (jsxc.restoreCompleted) {
	      win.find('.jsxc_textinput').focus();
	    }

	    win.trigger('show.window.jsxc');
	  },

	  /**
	   * Minimize text area and save
	   *
	   * @param {String} [bid]
	   */
	  hide : function(bid) {
	    var hide = function(bid) {
	      jsxc.storage.updateUserItem('window', bid, 'minimize', true);

	      jsxc.gui.window._hide(bid);
	    };

	    if (bid) {
	      hide(bid);
	    } else {
	      $('#jsxc_windowList > ul > li').each(function() {
	        var el = $(this);

	        if (!el.hasClass('jsxc_min')) {
	          hide(el.attr('data-bid'));
	        }
	      });
	    }
	  },

	  /**
	   * Minimize text area
	   *
	   * @param {String} bid
	   */
	  _hide : function(bid) {
	    var win = jsxc.gui.window.get(bid);

	    win.removeClass('jsxc_normal').addClass('jsxc_min');
	    win.find('.jsxc_window').css('bottom', -1 * win.find('.jsxc_fade').height());

	    win.trigger('hidden.window.jsxc');
	  },

	  /**
	   * Highlight window
	   *
	   * @param {type} bid
	   */
	  highlight : function(bid) {
	    var el = jsxc.gui.window.get(bid).find(' .jsxc_bar');

	    if (!el.is(':animated')) {
	      el.effect('highlight', {
	        color : 'orange'
	      }, 2000);
	    }
	  },

	  /**
	   * Scroll chat area to the bottom
	   *
	   * @param {String} bid bar jid
	   */
	  scrollDown : function(bid) {
	    var chat = jsxc.gui.window.get(bid).find('.jsxc_textarea');

	    // check if chat exist
	    if (chat.length === 0) {
	      return;
	    }

	    chat.slimScroll({
	      scrollTo : (chat.get(0).scrollHeight + 'px')
	    });
	  },

	  /**
	   * Write Message to chat area and save. Check border cases and remove html.
	   *
	   * @function postMessage
	   * @memberOf jsxc.gui.window
	   * @param {jsxc.Message} message object to be send
	   * @return {jsxc.Message} maybe modified message object
	   */
	  /**
	   * Create message object from given properties, write Message to chat area
	   * and save. Check border cases and remove html.
	   *
	   * @function postMessage
	   * @memberOf jsxc.gui.window
	   * @param {object} args New message properties
	   * @param {string} args.bid
	   * @param {direction} args.direction
	   * @param {string} args.msg
	   * @param {boolean} args.encrypted
	   * @param {boolean} args.forwarded
	   * @param {boolean} args.sender
	   * @param {integer} args.stamp
	   * @param {object} args.attachment Attached data
	   * @param {string} args.attachment.name File name
	   * @param {string} args.attachment.size File size
	   * @param {string} args.attachment.type File type
	   * @param {string} args.attachment.data File data
	   * @return {jsxc.Message} maybe modified message object
	   */
	  postMessage : function(message) {

	    if (typeof message === 'object' && !(message instanceof jsxc.Message)) {
	      message = new jsxc.Message(message);
	    }

	    var data = jsxc.storage.getUserItem('buddy', message.bid);
	    var html_msg = message.msg;

	    // remove html tags and reencode html tags
	    message.msg = jsxc.removeHTML(message.msg);
	    message.msg = jsxc.escapeHTML(message.msg);

	    // exceptions:

	    if (message.direction === jsxc.Message.OUT && data.msgstate === OTR.CONST.MSGSTATE_FINISHED &&
	        message.forwarded !== true) {
	      message.direction = jsxc.Message.SYS;
	      message.msg = jsxc.t('your_message_wasnt_send_please_end_your_private_conversation');
	    }

	    if (message.direction === jsxc.Message.OUT && data.msgstate === OTR.CONST.MSGSTATE_FINISHED) {
	      message.direction = 'sys';
	      message.msg = jsxc.t('unencrypted_message_received') + ' ' + message.msg;
	    }

	    message.encrypted = message.encrypted || data.msgstate === OTR.CONST.MSGSTATE_ENCRYPTED;

	    try {
	      message.save();
	    } catch (err) {
	      jsxc.warn('Unable to save message.', err);

	      message = new jsxc.Message({
	        msg : 'Unable to save that message. Please clear some chat histories.',
	        direction : jsxc.Message.SYS
	      });
	    }

	    if (message.direction === 'in' &&
	        !jsxc.gui.window.get(message.bid).find('.jsxc_textinput').is(":focus")) {
	      jsxc.gui.unreadMsg(message.bid);

	      $(document).trigger('postmessagein.jsxc', [message.bid, html_msg]);
	    }

	    if (message.direction === jsxc.Message.OUT && jsxc.master && message.forwarded !== true &&
	        html_msg) {
	      jsxc.xmpp.sendMessage(message.bid, html_msg, message._uid);
	    }

	    jsxc.gui.window._postMessage(message);

	    if (message.direction === 'out' && message.msg === '?' &&
	        jsxc.options.get('theAnswerToAnything') !== false) {
	      if (typeof jsxc.options.get('theAnswerToAnything') === 'undefined' ||
	          (Math.random() * 100 % 42) < 1) {
	        jsxc.options.set('theAnswerToAnything', true);

	        jsxc.gui.window.postMessage(new jsxc.Message({
	          bid : message.bid, direction : jsxc.Message.SYS, msg : '42'
	        }));
	      }
	    }

	    return message;
	  },

	  /**
	   * Write Message to chat area
	   *
	   * @param {String} bid bar jid
	   * @param {Object} post Post object with direction, msg, uid, received
	   * @param {Bool} restore If true no highlights are used
	   */
	  _postMessage : function(message, restore) {
	    var bid = message.bid;
	    var win = jsxc.gui.window.get(bid);
	    var msg = message.msg;
	    var direction = message.direction;
	    var uid = message._uid;

	    // remove user composing notifications
	    win.find(".jsxc_userComposing").remove();

	    if (win.find('.jsxc_textinput').is(':not(:focus)') && direction === jsxc.Message.IN &&
	        !restore) {
	      jsxc.gui.window.highlight(bid);
	    }

	    // msg = msg.replace(jsxc.CONST.REGEX.URL, function(url) {
	    //
	    //   var href = (url.match(/^https?:\/\//i)) ? url : 'http://' + url;
	    //
	    //   // @TODO use jquery element builder
	    //   return '<a href="' + href + '" target="_blank">' + url + '</a>';
	    // });

	    // search ressources and replace urls
	    msg = jsxc.ressources.processRessourcesInText(msg);

	    // msg = msg.replace(
	    //     new RegExp('(xmpp:)?(' + jsxc.CONST.REGEX.JID.source + ')(\\?[^\\s]+\\b)?', 'i'),
	    //     function(match, protocol, jid, action) {
	    //       if (protocol === 'xmpp:') {
	    //         if (typeof action === 'string') {
	    //           jid += action;
	    //         }
	    //
	    //         // @TODO use jquery element builder
	    //         return '<a href="xmpp:' + jid + '">xmpp:' + jid + '</a>';
	    //       }
	    //
	    //       // @TODO use jquery element builder
	    //       return '<a href="mailto:' + jid + '" target="_blank">mailto:' + jid + '</a>';
	    //     });

	    // replace emoticons from XEP-0038 and pidgin with shortnames
	    $.each(jsxc.gui.emotions, function(i, val) {
	      msg = msg.replace(val[2], ':' + val[1] + ':');
	    });

	    // translate shortnames to images
	    msg = jsxc.gui.shortnameToImage(msg);

	    // replace line breaks
	    msg = msg.replace(/(\r\n|\r|\n)/g, '<br />');

	    var msgDiv = $("<div>"), msgTsDiv = $("<div>");
	    msgDiv.addClass('jsxc_chatmessage jsxc_' + direction);
	    msgDiv.attr('id', uid.replace(/:/g, '-'));
	    msgDiv.html('<div>' + msg + '</div>');
	    msgTsDiv.addClass('jsxc_timestamp');
	    msgTsDiv.text(jsxc.getFormattedTime(message.stamp));

	    if (message.isReceived() || false) {
	      msgDiv.addClass('jsxc_received');
	    }

	    if (message.forwarded) {
	      msgDiv.addClass('jsxc_forwarded');
	    }

	    if (message.encrypted) {
	      msgDiv.addClass('jsxc_encrypted');
	    }

	    if (message.attachment && message.attachment.name) {
	      var attachment = $('<div>');
	      attachment.addClass('jsxc_attachment');
	      attachment.addClass('jsxc_' + message.attachment.type.replace(/\//, '-'));
	      attachment.addClass('jsxc_' + message.attachment.type.replace(/^([^/]+)\/.*/, '$1'));

	      if (message.attachment.persistent === false) {
	        attachment.addClass('jsxc_notPersistent');
	      }

	      if (message.attachment.data) {
	        attachment.addClass('jsxc_data');
	      }

	      if (message.attachment.type.match(/^image\//) && message.attachment.thumbnail) {
	        $('<img alt="preview">').attr('src', message.attachment.thumbnail).attr('title',
	            message.attachment.name).appendTo(attachment);
	      } else {
	        attachment.text(message.attachment.name);
	      }

	      if (message.attachment.data) {
	        attachment = $('<a>').append(attachment);
	        attachment.attr('href', message.attachment.data);
	        attachment.attr('download', message.attachment.name);
	      }

	      msgDiv.find('div').first().append(attachment);
	    }

	    if (direction === 'sys') {
	      jsxc.gui.window.get(bid).find('.jsxc_textarea').append('<div style="clear:both"/>');
	    } else if (typeof message.stamp !== 'undefined') {
	      msgDiv.append(msgTsDiv);
	    }

	    if (direction !== 'sys') {
	      $('[data-bid="' + bid + '"]').find('.jsxc_lastmsg .jsxc_text').html(jsxc.stripHtml(msg));
	    }

	    if (jsxc.Message.getDOM(uid).length > 0) {
	      jsxc.Message.getDOM(uid).replaceWith(msgDiv);
	    } else {
	      win.find('.jsxc_textarea').append(msgDiv);
	    }

	    if (typeof message.sender === 'object' && message.sender !== null) {
	      var title = '';
	      var avatarDiv = $('<div>');
	      avatarDiv.addClass('jsxc_avatar').prependTo(msgDiv);

	      if (typeof message.sender.jid === 'string') {
	        msgDiv.attr('data-bid', jsxc.jidToBid(message.sender.jid));

	        var data = jsxc.storage.getUserItem('buddy', jsxc.jidToBid(message.sender.jid)) || {};
	        jsxc.gui.updateAvatar(msgDiv, jsxc.jidToBid(message.sender.jid), data.avatar);

	        title = jsxc.jidToBid(message.sender.jid);
	      }

	      if (typeof message.sender.name === 'string') {
	        msgDiv.attr('data-name', message.sender.name);

	        if (typeof message.sender.jid !== 'string') {
	          jsxc.gui.avatarPlaceholder(avatarDiv, message.sender.name);
	        }

	        if (title !== '') {
	          title = '\n' + title;
	        }

	        title = message.sender.name + title;

	        msgTsDiv.text(msgTsDiv.text() + ' ' + message.sender.name);
	      }

	      avatarDiv.attr('title', jsxc.escapeHTML(title));

	      if (msgDiv.prev().length > 0 &&
	          msgDiv.prev().find('.jsxc_avatar').attr('title') === avatarDiv.attr('title')) {
	        avatarDiv.css('visibility', 'hidden');
	      }
	    }

	    jsxc.gui.detectUriScheme(win);
	    jsxc.gui.detectEmail(win);

	    jsxc.gui.window.scrollDown(bid);
	  },

	  /**
	   * Set text into input area
	   *
	   * @param {type} bid
	   * @param {type} text
	   * @returns {undefined}
	   */
	  setText : function(bid, text) {
	    jsxc.gui.window.get(bid).find('.jsxc_textinput').val(text);
	  },

	  /**
	   * Load old log into chat area
	   *
	   * @param {type} bid
	   * @returns {undefined}
	   */
	  restoreChat : function(bid) {
	    var chat = jsxc.storage.getUserItem('chat', bid);

	    // convert legacy storage structure introduced in v3.0.0
	    if (chat) {
	      while (chat !== null && chat.length > 0) {
	        var c = chat.pop();

	        c.bid = bid;
	        c._uid = c.uid;
	        delete c.uid;

	        var message = new jsxc.Message(c);
	        message.save();

	        jsxc.gui.window._postMessage(message, true);
	      }

	      jsxc.storage.removeUserItem('chat', bid);
	    }

	    var history = jsxc.storage.getUserItem('history', bid);

	    while (history !== null && history.length > 0) {
	      var uid = history.pop();

	      jsxc.gui.window._postMessage(new jsxc.Message(uid), true);
	    }
	  },

	  /**
	   * Clear chat history
	   *
	   * @param {type} bid
	   * @returns {undefined}
	   */
	  clear : function(bid) {
	    // deprecated
	    jsxc.storage.removeUserItem('chat', bid);

	    var history = jsxc.storage.getUserItem('history', bid) || [];

	    history.map(function(id) {
	      jsxc.storage.removeUserItem('msg', id);
	    });

	    jsxc.storage.setUserItem('history', bid, []);

	    var win = jsxc.gui.window.get(bid);

	    if (win.length > 0) {
	      win.find('.jsxc_textarea').empty();
	    }
	  },

	  /**
	   * Mark message as received.
	   *
	   * @param  {string} bid
	   * @param  {string} uid message id
	   * @deprecated since v3.0.0. Use {@link jsxc.Message.received}.
	   */
	  receivedMessage : function(bid, uid) {
	    jsxc.warn('Using deprecated receivedMessage.');

	    var message = new jsxc.Message(uid);

	    message.received();
	  },

	  updateProgress : function(message, sent, size) {
	    var div = message.getDOM();
	    var span = div.find('.jsxc_timestamp span');

	    if (span.length === 0) {
	      div.find('.jsxc_timestamp').append('<span>');
	      span = div.find('.jsxc_timestamp span');
	    }

	    span.text(' ' + Math.round(sent / size * 100) + '%');

	    if (sent === size) {
	      span.remove();

	      message.received();
	    }
	  },

	  showOverlay : function(bid, content, allowClose) {
	    var win = jsxc.gui.window.get(bid);

	    win.find('.jsxc_overlay .jsxc_body').empty().append(content);
	    win.find('.jsxc_overlay .jsxc_close').off('click').click(function() {
	      jsxc.gui.window.hideOverlay(bid);
	    });

	    if (allowClose !== true) {
	      win.find('.jsxc_overlay .jsxc_close').hide();
	    } else {
	      win.find('.jsxc_overlay .jsxc_close').show();
	    }

	    win.addClass('jsxc_showOverlay');
	  },

	  hideOverlay : function(bid) {
	    var win = jsxc.gui.window.get(bid);

	    win.removeClass('jsxc_showOverlay');
	  },

	  selectResource : function(bid, text, cb, res) {
	    res = res || jsxc.storage.getUserItem('res', bid) || [];
	    cb = cb || function() {
	        };

	    if (res.length > 0) {
	      var content = $('<div>');
	      var list = $('<ul>'), i, li;

	      for (i = 0; i < res.length; i++) {
	        li = $('<li>');

	        li.append($('<a>').text(res[i]));
	        li.appendTo(list);
	      }

	      list.find('a').click(function(ev) {
	        ev.preventDefault();

	        jsxc.gui.window.hideOverlay(bid);

	        cb({
	          status : 'selected', result : $(this).text()
	        });
	      });

	      if (text) {
	        $('<p>').text(text).appendTo(content);
	      }

	      list.appendTo(content);

	      jsxc.gui.window.showOverlay(bid, content);
	    } else {
	      cb({
	        status : 'unavailable'
	      });
	    }
	  },

	  smpRequest : function(bid, question) {
	    var content = $('<div>');

	    var p = $('<p>');
	    p.text(jsxc.t('smpRequestReceived'));
	    p.appendTo(content);

	    var abort = $('<button>');
	    abort.text(jsxc.t('Abort'));
	    abort.click(function() {
	      jsxc.gui.window.hideOverlay(bid);
	      jsxc.storage.removeUserItem('smp', bid);

	      if (jsxc.master && jsxc.otr.objects[bid]) {
	        jsxc.otr.objects[bid].sm.abort();
	      }
	    });
	    abort.appendTo(content);

	    var verify = $('<button>');
	    verify.text(jsxc.t('Verify'));
	    verify.addClass('jsxc_btn jsxc_btn-primary');
	    verify.click(function() {
	      jsxc.gui.window.hideOverlay(bid);

	      jsxc.otr.onSmpQuestion(bid, question);
	    });
	    verify.appendTo(content);

	    jsxc.gui.window.showOverlay(bid, content);
	  },

	  sendFile : function(jid) {
	    var bid = jsxc.jidToBid(jid);
	    var win = jsxc.gui.window.get(bid);
	    var res = Strophe.getResourceFromJid(jid);

	    if (!res) {
	      jid = win.data('jid');
	      res = Strophe.getResourceFromJid(jid);

	      var fileCapableRes = jsxc.webrtc.getCapableRes(jid, jsxc.webrtc.reqFileFeatures);
	      var resources = Object.keys(jsxc.storage.getUserItem('res', bid)) || [];

	      if (res === null && resources.length === 1 && fileCapableRes.length === 1) {
	        res = fileCapableRes[0];
	        jid = bid + '/' + res;
	      } else if (fileCapableRes.indexOf(res) < 0) {
	        jsxc.gui.window.selectResource(bid, jsxc.t('Your_contact_uses_multiple_clients_'),
	            function(data) {
	              if (data.status === 'unavailable') {
	                jsxc.gui.window.hideOverlay(bid);
	              } else if (data.status === 'selected') {
	                jsxc.gui.window.sendFile(bid + '/' + data.result);
	              }
	            }, fileCapableRes);

	        return;
	      }
	    }

	    var msg = $('<div><div><label><input type="file" name="files" /><label></div></div>');
	    msg.addClass('jsxc_chatmessage');

	    jsxc.gui.window.showOverlay(bid, msg, true);

	    msg.find('label').click();

	    msg.find('[type="file"]').change(function(ev) {
	      var file = ev.target.files[0]; // FileList object

	      if (!file) {
	        return;
	      }

	      var attachment = $('<div>');
	      attachment.addClass('jsxc_attachment');
	      attachment.addClass('jsxc_' + file.type.replace(/\//, '-'));
	      attachment.addClass('jsxc_' + file.type.replace(/^([^/]+)\/.*/, '$1'));

	      msg.empty().append(attachment);

	      if (FileReader && file.type.match(/^image\//)) {
	        var img = $('<img alt="preview">').attr('title', file.name);
	        img.attr('src', jsxc.options.get('root') + '/img/loading.gif');
	        img.appendTo(attachment);

	        var reader = new FileReader();

	        reader.onload = function() {
	          img.attr('src', reader.result);
	        };

	        reader.readAsDataURL(file);
	      } else {
	        attachment.text(file.name + ' (' + file.size + ' byte)');
	      }

	      $('<button>').addClass('jsxc_btn jsxc_btn-primary').text(jsxc.t('Send')).click(function() {
	        var sess = jsxc.webrtc.sendFile(jid, file);

	        jsxc.gui.window.hideOverlay(bid);

	        var message = jsxc.gui.window.postMessage({
	          _uid : sess.sid + ':msg', bid : bid, direction : 'out', attachment : {
	            name : file.name,
	            size : file.size,
	            type : file.type,
	            data : (file.type.match(/^image\//)) ? img.attr('src') : null
	          }
	        });

	        sess.sender.on('progress', function(sent, size) {
	          jsxc.gui.window.updateProgress(message, sent, size);
	        });

	        msg.remove();

	      }).appendTo(msg);

	      $('<button>').addClass('jsxc_btn jsxc_btn-default').text(jsxc.t('Abort')).click(function() {
	        jsxc.gui.window.hideOverlay(bid);
	      }).appendTo(msg);
	    });
	  }
	};

	/**
	 * Help module of chat client
	 *
	 */

	jsxc.help = {

	  currentTutorial : null,

	  tutorials : {},

	  /**
	   * Get an array containing all tutorials
	   */
	  getAllTutorials : function() {

	    var self = jsxc.help;

	    var res = {};

	    $.each(self.tutorials, function(index, element) {
	      res[index] = element();
	    });

	    return res;
	  },

	  /**
	   * Launch a visual tutorial
	   * @param name
	   */
	  launchTutorial : function(name) {

	    var self = jsxc.help;

	    jsxc.stats.addEvent("jsxc.help.tutorial." + name);

	    jsxc.debug("Launching tutorial", name);

	    // TODO: Check if a tutorial is already running

	    if (typeof self.tutorials[name] === "undefined") {
	      throw new Error("Invalid tutorial name: " + name);
	    }

	    // make tutorial, AFTER document is ready and chat client is initiate
	    var tutorial = self.tutorials[name]();

	    // configure tour
	    var tour = new Shepherd.Tour({

	      defaults : {
	        classes : 'shepherd-theme-default jsxc-help-tutorial-message',
	        scrollTo : true,
	        showCancelLink : true,
	        buttons : [{
	          text : 'x', action : function() {
	            Shepherd.activeTour.cancel();
	          }
	        }, {
	          text : '<', action : function() {
	            Shepherd.activeTour.back();
	          }
	        }, {
	          text : '>', action : function() {
	            Shepherd.activeTour.next();
	          }
	        }]
	      }
	    });

	    // add steps
	    $.each(tutorial.steps, function(index, step) {

	      // add title if not present
	      if (typeof step.title === 'undefined') {
	        step.title = tutorial.description;
	      }

	      tour.addStep(step);
	    });

	    // launch tutorial
	    tour.start();

	  },

	  /**
	   * Initialization of all tutorials
	   */
	  init : function() {

	    var self = jsxc.help;

	    /**
	     * Options:
	     * --------
	     *
	     * beforeShowPromise: func.bind(this, arg1,...) // A function that returns a promise. When the
	     * promise resolves, the rest of
	     *                                              // the show code for the step will execute.
	     *
	     * tetherOptions: {
	     *
	     *    targetOffset: '0 200px' // move pop 200px to the right
	     *    targetOffset: '200px 0'  // move pop 200px to the bottom
	     *
	     * }
	     *
	     *
	     *
	     */

	    self.tutorials["interface"] = function() {

	      return {

	        description : jsxc.t('interface_visit'),

	        steps : [

	          {
	            text : jsxc.t('you_will_discover_interface'),
	            beforeShowPromise : self._setAllGuiVisible.bind(self, false)
	          },

	          {
	            attachTo : {element : '#jsxc-chat-sidebar-content', on : 'left'},

	            text : [jsxc.t('conversation_panel_description'),
	              jsxc.t('conversation_panel_description_2'),],

	            beforeShowPromise : self._setAllGuiVisible.bind(self, true)

	          },

	          {
	            attachTo : {element : '.jsxc-toggle-mediapanel', on : 'top'},

	            text : [jsxc.t('multimedia_panel_description'),
	              jsxc.t('multimedia_panel_description_2')],

	            beforeShowPromise : self._setAllGuiVisible.bind(self, true),

	            when : {
	              'show' : function() {
	                self._highlightElement('.jsxc-toggle-mediapanel');
	              }
	            }

	          },

	          {
	            attachTo : {element : '#jsxc-new-gui-filter-conversations', on : 'left'},

	            text : [jsxc.t('sidebar_filters_description')],

	            beforeShowPromise : self._setAllGuiVisible.bind(self, true),

	            when : {
	              'show' : function() {
	                self._highlightElement('#jsxc-new-gui-filter-conversations');
	                self._highlightElement('#jsxc-new-gui-filter-users');
	              }
	            }
	          },

	          {
	            attachTo : {element : '#jsxc-sidebar-content-viewport', on : 'left'},

	            text : [jsxc.t('roster_description'), jsxc.t('roster_description_2')],

	            when : {

	              'before-show' : function() {
	                $('#jsxc-new-gui-filter-users').trigger('click');
	              },

	              'show' : function() {
	                self._highlightElement('#jsxc_buddylist');
	              }

	            },

	            beforeShowPromise : self._setAllGuiVisible.bind(self, true)

	          },

	          {
	            attachTo : {element : '#jsxc-toggle-actions', on : 'top'},

	            text : [jsxc.t('main_menu_description'), jsxc.t('main_menu_description_2')],

	            when : {
	              'before-show' : function() {
	                $('#jsxc-toggle-actions').trigger('click');
	              },

	              'show' : function() {
	                self._highlightElement('#jsxc-toggle-actions');
	              }
	            },

	            beforeShowPromise : self._setAllGuiVisible.bind(self, true),

	            tetherOptions : {

	              targetOffset : '-20px 0'

	            }

	          },

	          {
	            attachTo : {element : '#jsxc-select-buddies', on : 'left'},

	            text : [jsxc.t('selection_button_description'),
	              jsxc.t('selection_button_description_2')],

	            when : {
	              'before-show' : function() {

	                jsxc.newgui.chatSidebarContent.showMainContent();

	                setTimeout(function() {
	                  $('#jsxc-select-buddies').trigger('click');
	                }, 700);
	              },

	              'show' : function() {
	                self._highlightElement('#jsxc-select-buddies');
	              }
	            },

	            beforeShowPromise : self._setAllGuiVisible.bind(self, true)

	          },

	          {
	            attachTo : {element : '#jsxc-chat-sidebar .jsxc-toggle-settings', on : 'top'},

	            text : [jsxc.t('settings_description'), jsxc.t('settings_description_2')],

	            when : {
	              'before-show' : function() {
	                $('#jsxc-chat-sidebar .jsxc-toggle-settings').trigger('click');
	              },

	              'show' : function() {
	                self._highlightElement('.jsxc-toggle-settings');
	              }

	            },

	            beforeShowPromise : self._setAllGuiVisible.bind(self, true)

	          },

	          {
	            attachTo : {element : '#jsxc-status-bar', on : 'left'},

	            text : [
	              jsxc.t('status_panel_description'),
	              jsxc.t('status_panel_description_2')],

	            beforeShowPromise : self._setAllGuiVisible.bind(self, true),

	            when : {
	              'show' : function() {
	                self._highlightElement('#jsxc-status-bar');
	              }
	            }

	          },

	          {

	            text : [jsxc.t('end_of_interface_visit')],

	            beforeShowPromise : self._setAllGuiVisible.bind(self, true)

	          }

	        ]
	      };

	    };

	  },

	  /**
	   * Set side bar visible or not and return a promise which will be resolved when
	   * it is done
	   * @private
	   */
	  _setChatSidebarVisible : function(state) {

	    var p = new Promise(function(resolve) {
	      jsxc.newgui.toggleChatSidebar(state, function() {
	        resolve();
	      });
	    });

	    return p;

	  },

	  /**
	   * Set side bar visible or not and return a promise which will be resolved when
	   * it is done
	   * @private
	   */
	  _setMediapanelVisible : function(state) {

	    var p = new Promise(function(resolve) {
	      jsxc.newgui.toggleMediapanel(state, function() {
	        resolve();
	      });
	    });

	    return p;

	  },

	  /**
	   * Set side bar visible or not and return a promise which will be resolved when
	   * it is done
	   * @private
	   */
	  _clearAllWindows : function() {

	    var p = new Promise(function(resolve, reject) {
	      jsxc.gui.closeAllChatWindows().then(function() {
	        resolve();
	      })
	          .fail(function() {
	            reject();
	          });
	    });

	    return p;

	  },

	  /**
	   * Set all gui visibility and return a promise which will be resolved when finished
	   * @param state
	   * @returns {*}
	   * @private
	   */
	  _setAllGuiVisible : function(state) {

	    var self = jsxc.help;

	    var promises = [self._setChatSidebarVisible(state), self._setMediapanelVisible(state)];
	    if (!state) {
	      promises.push(self._clearAllWindows());
	    }

	    return Promise.all(promises);

	  },

	  /**
	   * Make element blink to show it to user
	   * @param selector
	   * @private
	   */
	  _highlightElement : function(selector) {

	    var jq = $(selector);

	    if (jq.length < 1) {
	      throw new Error("Invalid selector: " + selector);
	    }

	    var previous = jq.css('opacity');

	    var howManyTimes = 4;

	    var i = 0;

	    var interval = setInterval(function() {

	      if (i > howManyTimes) {
	        clearInterval(interval);

	        jq.css({
	          'opacity' : previous || '1'
	        });

	        return;
	      }

	      jq.animate({
	        'opacity' : i % 2 === 0 ? 0.2 : 1
	      }, 400);

	      i++;

	    }, 500);

	  }

	};
	jsxc.localization = {

	  /**
	   * If set to true, will translation will throw an error if an i18n id is not found.
	   * Sometimes when id and translation are the same false positive errors ae thrown.
	   */
	  debug : false,

	  init : function() {

	    // detect language
	    var lang;
	    if (jsxc.storage.getItem('lang') !== null) {
	      lang = jsxc.storage.getItem('lang');
	    } else if (jsxc.options.autoLang && navigator.language) {
	      lang = navigator.language.substr(0, 2);
	    } else {
	      lang = jsxc.options.defaultLang;
	    }

	    jsxc.stats.addEvent('jsxc.lang.' + lang);

	    /**
	     *
	     *
	     *
	     *
	     *
	     *
	     *
	     *
	     */

	    /* jshint ignore:start */

	    /**
	     *
	     *
	     *
	     *
	     *
	     *
	     *
	     *
	     */

	    // import i18n relative to tmp/. Import only amd module, not jquery.
	    jsxc.i18n = __webpack_require__(2);

	    // shortcut
	    jsxc.t = function() {

	      var res = jsxc.i18n.translate.apply(jsxc.i18n.translate, arguments);
	      var id = arguments[0];

	      // throw an error if id is invalid
	      if (jsxc.localization.debug === true) {

	        if (res.indexOf(id) !== -1) {
	          var err = new Error('Invalid i18n id: ' + id);
	          setTimeout(function() {
	            throw err;
	          }, 0);
	        }

	      }

	      return res;
	    };

	    // initialize i18n translator
	    jsxc.i18n.init({
	      lng : lang,
	      fallbackLng : 'en',
	      resStore : chatclient_I18next_ressource_store, // use localStorage and set expiration to a day
	      useLocalStorage : true,
	      localStorageExpirationTime : 60 * 60 * 24 * 1000,
	      debug : jsxc.storage.getItem('debug') === true
	    });

	    /**
	     *
	     *
	     *
	     *
	     *
	     *
	     *
	     *
	     */

	    /* jshint ignore:end */

	    /**
	     *
	     *
	     *
	     *
	     *
	     *
	     *
	     *
	     */
	  },

	  processHtmlString : function(str, options) {

	    var o = jsxc.i18n.options;

	    return $(str).each(function() {

	      // localize element itself
	      jsxc.localization._localize($(this), options);

	      // localize childs
	      var elements = $(this).find('[' + o.selectorAttr + ']');
	      elements.each(function() {
	        jsxc.localization._localize($(this), options);
	      });

	    });

	  },

	  _parse : function(ele, key, options) {

	    var o = jsxc.i18n.options;

	    if (key.length === 0) {
	      return;
	    }

	    var attr = 'text';

	    if (key.indexOf('[') === 0) {
	      var parts = key.split(']');
	      key = parts[1];
	      attr = parts[0].substr(1, parts[0].length - 1);
	    }

	    if (key.indexOf(';') === key.length - 1) {
	      key = key.substr(0, key.length - 2);
	    }

	    var optionsToUse;
	    if (attr === 'html') {
	      optionsToUse =
	          o.defaultValueFromContent ? $.extend({defaultValue : ele.html()}, options) : options;
	      ele.html(jsxc.t(key, optionsToUse));
	    } else if (attr === 'text') {
	      optionsToUse =
	          o.defaultValueFromContent ? $.extend({defaultValue : ele.text()}, options) : options;
	      ele.text(jsxc.t(key, optionsToUse));
	    } else if (attr === 'prepend') {
	      optionsToUse =
	          o.defaultValueFromContent ? $.extend({defaultValue : ele.html()}, options) : options;
	      ele.prepend(jsxc.t(key, optionsToUse));
	    } else if (attr === 'append') {
	      optionsToUse =
	          o.defaultValueFromContent ? $.extend({defaultValue : ele.html()}, options) : options;
	      ele.append(jsxc.t(key, optionsToUse));
	    } else if (attr.indexOf("data-") === 0) {
	      var dataAttr = attr.substr(("data-").length);
	      optionsToUse =
	          o.defaultValueFromContent ? $.extend({defaultValue : ele.data(dataAttr)}, options) :
	              options;
	      var translated = jsxc.t(key, optionsToUse);
	      //we change into the data cache
	      ele.data(dataAttr, translated);
	      //we change into the dom
	      ele.attr(attr, translated);
	    } else {
	      optionsToUse =
	          o.defaultValueFromContent ? $.extend({defaultValue : ele.attr(attr)}, options) : options;
	      ele.attr(attr, jsxc.t(key, optionsToUse));
	    }
	  },

	  _localize : function(ele, options) {

	    var o = jsxc.i18n.options;

	    var key = ele.attr(o.selectorAttr);
	    if (!key && typeof key !== 'undefined' && key !== false) {
	      key = ele.text() || ele.val();
	    }
	    if (!key) {
	      return;
	    }

	    var target = ele, targetSelector = ele.data("i18n-target");
	    if (targetSelector) {
	      target = ele.find(targetSelector) || ele;
	    }

	    if (!options && o.useDataAttrOptions === true) {
	      options = ele.data("i18n-options");
	    }
	    options = options || {};

	    if (key.indexOf(';') >= 0) {
	      var keys = key.split(';');

	      $.each(keys, function(m, k) {
	        if (k !== '') {
	          jsxc.localization._parse(target, k, options);
	        }
	      });

	    } else {
	      jsxc.localization._parse(target, key, options);
	    }

	    if (o.useDataAttrOptions === true) {
	      ele.data("i18n-options", options);
	    }
	  }
	};

	/**
	 * Test cases of multiple multimedia stream module
	 *
	 *
	 * /!\ Be careful, here you can manipulate real data of JSXC client
	 *
	 * @type {{}}
	 */

	jsxc.mmstream.testCases = [

	  {
	    name : "Video participants selection",

	    testCase : function(assert) {

	      var self = jsxc.mmstream;

	      /**
	       * Example test case
	       *
	       */

	      var remi = "remi@heydjoe.xmpp/eeee";
	      var david = "david@heydjoe.xmpp/eeee";
	      var yohann = "yohann@heydjoe.xmpp/eeee";

	      var participants = [david, yohann];

	      var computed1 = {

	        remi : jsxc.mmstream._whichUsersMustWeCall(remi, participants, remi),

	        david : jsxc.mmstream._whichUsersMustWeCall(remi, participants, david),

	        yohann : jsxc.mmstream._whichUsersMustWeCall(remi, participants, yohann)
	      };

	      var result1 = {
	        "remi" : ["yohann@heydjoe.xmpp/eeee", "david@heydjoe.xmpp/eeee"],

	        "david" : [],

	        "yohann" : ["david@heydjoe.xmpp/eeee"]
	      };

	      //console.log(expected1);

	      assert.ok(JSON.stringify(computed1) === JSON.stringify(result1),
	          "Destinations selection ok (demo)");

	      /**
	       * Complete test case
	       *
	       */

	      var domain = "@domain.xmpp";

	      var nodes = ['a', 'b', 'c', 'd', 'f', 'g', 'h', 'i'];

	      participants = [];

	      var initiator = "e" + domain;

	      // create a fake list of participants
	      $.each(nodes, function(index, node) {
	        participants.push(node + domain);
	      });

	      var computed2 = {};

	      $.each(participants.concat([initiator]), function(index, part) {
	        computed2[part] = self._whichUsersMustWeCall(initiator, participants, part);
	      });

	      var expected2 = {
	        "a@domain.xmpp" : ["b@domain.xmpp", "c@domain.xmpp", "d@domain.xmpp"],
	        "b@domain.xmpp" : ["c@domain.xmpp", "d@domain.xmpp"],
	        "c@domain.xmpp" : ["d@domain.xmpp"],
	        "d@domain.xmpp" : [],
	        "f@domain.xmpp" : ["g@domain.xmpp", "h@domain.xmpp", "i@domain.xmpp", "a@domain.xmpp",
	          "b@domain.xmpp", "c@domain.xmpp", "d@domain.xmpp"],
	        "g@domain.xmpp" : ["h@domain.xmpp", "i@domain.xmpp", "a@domain.xmpp", "b@domain.xmpp",
	          "c@domain.xmpp", "d@domain.xmpp"],
	        "h@domain.xmpp" : ["i@domain.xmpp", "a@domain.xmpp", "b@domain.xmpp", "c@domain.xmpp",
	          "d@domain.xmpp"],
	        "i@domain.xmpp" : ["a@domain.xmpp", "b@domain.xmpp", "c@domain.xmpp", "d@domain.xmpp"],
	        "e@domain.xmpp" : ["f@domain.xmpp", "g@domain.xmpp", "h@domain.xmpp", "i@domain.xmpp",
	          "a@domain.xmpp", "b@domain.xmpp", "c@domain.xmpp", "d@domain.xmpp"]
	      };

	      assert.ok(JSON.stringify(computed2) === JSON.stringify(expected2),
	          "Destinations selection (complete)");

	    }
	  },

	  {
	    name : "Utility methods for videoconference",

	    testCase : function(assert) {

	      var self = jsxc.mmstream;

	      var user = "a@domain.xmpp/heyhey";

	      self._setUserStatus(user, self.USER_STATUS.READY);
	      assert.ok(self._isBuddyReady(user) === true, "test status = READY");

	      self._setUserType(user, self.USER_TYPE.VIDEOCONF_INITIATOR);
	      assert.ok(self._isBuddyParticipatingToVideoconference(user) === true,
	          " test status = PARTICIPATING 1");

	      self._setUserType(user, self.USER_TYPE.VIDEOCONF_PARTICIPANT);
	      assert.ok(self._isBuddyParticipatingToVideoconference(user) === true,
	          " test status = PARTICIPATING 2");

	      self._setUserStatus(user, self.USER_STATUS.REJECTED);
	      assert.ok(self._isBuddyParticipatingToVideoconference(user) !== true,
	          " test status = PARTICIPATING 3");

	      // delte user after, to not alter JSXC service
	      delete self.multimediacache.users[user];

	    }
	  }

	];

	$(function() {

	});






































	/**
	 * Implements Multi-User Chat (XEP-0045).
	 *
	 * @namespace jsxc.muc
	 */
	jsxc.muc = {
	  /** strophe connection */
	  conn : null,

	  /** some constants */
	  CONST : {
	    AFFILIATION : {
	      ADMIN : 'statVisualition',
	      MEMBER : 'member',
	      OUTCAST : 'outcast',
	      OWNER : 'owner',
	      NONE : 'none'
	    }, ROLE : {
	      MODERATOR : 'moderator', PARTICIPANT : 'participant', VISITOR : 'visitor', NONE : 'none'
	    }, ROOMSTATE : {
	      INIT : 0, ENTERED : 1, EXITED : 2, AWAIT_DESTRUCTION : 3, DESTROYED : 4
	    }, ROOMCONFIG : {
	      INSTANT : 'instant'
	    }
	  },

	  /**
	   * Initialize muc plugin.
	   *
	   * @private
	   * @memberof jsxc.muc
	   * @param {object} o Options
	   */
	  init : function(o) {
	    var self = jsxc.muc;
	    self.conn = jsxc.xmpp.conn;

	    var options = o || jsxc.options.get('muc');

	    if (!options || typeof options.server !== 'string') {
	      jsxc.debug('Discover muc service');

	      // prosody does not respond, if we send query before initial presence was sent
	      setTimeout(function() {
	        self.conn.disco.items(Strophe.getDomainFromJid(self.conn.jid), null, function(items) {
	          $(items).find('item').each(function() {
	            var jid = $(this).attr('jid');
	            var discovered = false;

	            self.conn.disco.info(jid, null, function(info) {
	              var mucFeature = $(info).find('feature[var="' + Strophe.NS.MUC + '"]');
	              var mucIdentity = $(info).find('identity[category="conference"][type="text"]');

	              if (mucFeature.length > 0 && mucIdentity.length > 0) {

	                jsxc.debug('muc service found', jid);

	                jsxc.options.set('muc', {
	                  server : jid, name : $(info).find('identity').attr('name')
	                });

	                discovered = true;

	                self.init();
	              }
	            });

	            return !discovered;
	          });
	        });
	      }, 1000);

	      return;
	    }

	    if (jsxc.gui.roster.ready) {
	      self.initMenu();
	    } else {
	      $(document).one('ready.roster.jsxc', jsxc.muc.initMenu);
	    }

	    $(document).on('presence.jsxc', jsxc.muc.onPresence);
	    $(document).on('error.presence.jsxc', jsxc.muc.onPresenceError);

	    self.conn.addHandler(self.onGroupchatMessage, null, 'message', 'groupchat');
	    self.conn.addHandler(self.onErrorMessage, null, 'message', 'error');
	    self.conn.muc.roomNames = jsxc.storage.getUserItem('roomNames') || [];
	  },

	  /**
	   * Add entry to menu.
	   *
	   * @memberOf jsxc.muc
	   */
	  initMenu : function() {
	    var li = $('<li>').attr('class', 'jsxc_joinChat jsxc_groupcontacticon').text(
	        jsxc.t('Join_chat'));

	    li.click(jsxc.muc.showJoinChat);

	    $('#jsxc_menu ul .jsxc_about').before(li);
	  },

	  /**
	   * Open join dialog.
	   *
	   * @memberOf jsxc.muc
	   * @param {string} [r] - room jid
	   * @param {string} [p] - room password
	   */
	  showJoinChat : function(r, p) {
	    var self = jsxc.muc;
	    var dialog = jsxc.gui.dialog.open(jsxc.gui.template.get('joinChat'));

	    // hide second step button
	    dialog.find('.jsxc_join').hide();

	    // prepopulate room jid
	    if (typeof r === 'string') {
	      dialog.find('#jsxc_room').val(r);
	    }

	    // prepopulate room password
	    if (typeof p === 'string') {
	      dialog.find('#jsxc_password').val(p);
	    }

	    // display conference server
	    dialog.find('#jsxc_server').val(jsxc.options.get('muc').server);

	    // handle error response
	    var error_handler = function(event, condition, room) {
	      var msg;

	      switch (condition) {
	        case 'not-authorized':
	          // password-protected room
	          msg = jsxc.t('A_password_is_required');
	          break;
	        case 'registration-required':
	          // members-only room
	          msg = jsxc.t('You_are_not_on_the_member_list');
	          break;
	        case 'forbidden':
	          // banned users
	          msg = jsxc.t('You_are_banned_from_this_room');
	          break;
	        case 'conflict':
	          // nickname conflict
	          msg = jsxc.t('Your_desired_nickname_');
	          break;
	        case 'service-unavailable':
	          // max users
	          msg = jsxc.t('The_maximum_number_');
	          break;
	        case 'item-not-found':
	          // locked or non-existing room
	          msg = jsxc.t('This_room_is_locked_');
	          break;
	        case 'not-allowed':
	          // room creation is restricted
	          msg = jsxc.t('You_are_not_allowed_to_create_');
	          break;
	        default:
	          jsxc.warn('Unknown muc error condition: ' + condition);
	          msg = jsxc.t('Error') + ': ' + condition;
	      }

	      // clean up strophe.muc rooms
	      var roomIndex = self.conn.muc.roomNames.indexOf(room);

	      if (roomIndex > -1) {
	        self.conn.muc.roomNames.splice(roomIndex, 1);
	        delete self.conn.muc.rooms[room];
	      }

	      dialog.find('.jsxc_warning').text(msg);
	    };

	    $(document).on('error.muc.jsxc', error_handler);

	    $(document).on('close.dialog.jsxc', function() {
	      $(document).off('error.muc.jsxc', error_handler);
	    });

	    // load room list
	    self.conn.muc.listRooms(jsxc.options.get('muc').server, function(stanza) {

	      // workaround: chrome does not display dropdown arrow for dynamically filled datalists
	      $('#jsxc_roomlist option:last').remove();

	      $(stanza).find('item').each(function() {
	        var r = $('<option>');
	        var rjid = $(this).attr('jid').toLowerCase();
	        var rnode = Strophe.getNodeFromJid(rjid);
	        var rname = $(this).attr('name') || rnode;

	        r.text(rname);
	        r.attr('data-jid', rjid);
	        r.attr('value', rnode);

	        $('#jsxc_roomlist select').append(r);
	      });

	      var set = $(stanza).find('set[xmlns="http://jabber.org/protocol/rsm"]');

	      if (set.length > 0) {
	        var count = set.find('count').text() || '?';

	        dialog.find('.jsxc_inputinfo').removeClass('jsxc_waiting').text(jsxc.t('Could_load_only', {
	          count : count
	        }));
	      } else {
	        dialog.find('.jsxc_inputinfo').hide();
	      }
	    }, function() {
	      jsxc.warn('Could not load rooms');

	      // room autocompletion is a comfort feature, so it is not necessary to inform the user
	      dialog.find('.jsxc_inputinfo').hide();
	    });

	    dialog.find('#jsxc_nickname').attr('placeholder', Strophe.getNodeFromJid(self.conn.jid));

	    dialog.find('#jsxc_bookmark').change(function() {
	      if ($(this).prop('checked')) {
	        $('#jsxc_autojoin').prop('disabled', false);
	        $('#jsxc_autojoin').parent('.checkbox').removeClass('disabled');
	      } else {
	        $('#jsxc_autojoin').prop('disabled', true).prop('checked', false);
	        $('#jsxc_autojoin').parent('.checkbox').addClass('disabled');
	      }
	    });

	    dialog.find('.jsxc_continue').click(function(ev) {
	      ev.preventDefault();

	      var room = ($('#jsxc_room').val()) ? jsxc.jidToBid($('#jsxc_room').val()) : null;
	      var nickname = $('#jsxc_nickname').val() || Strophe.getNodeFromJid(self.conn.jid);
	      var password = $('#jsxc_password').val() || null;

	      if (!room || !room.match(/^[^"&\'\/:<>@\s]+$/i)) {
	        $('#jsxc_room').addClass('jsxc_invalid').keyup(function() {
	          if ($(this).val()) {
	            $(this).removeClass('jsxc_invalid');
	          }
	        });
	        return false;
	      }

	      if (!room.match(/@(.*)$/)) {
	        room += '@' + jsxc.options.get('muc').server;
	      }

	      if (jsxc.xmpp.conn.muc.roomNames.indexOf(room) < 0) {
	        // not already joined

	        var discoReceived = function(roomName, subject) {
	          // we received the room information

	          jsxc.gui.dialog.resize();

	          dialog.find('.jsxc_continue').hide();

	          dialog.find('.jsxc_join').show().effect('highlight', {
	            color : 'green'
	          }, 4000);

	          dialog.find('.jsxc_join').click(function(ev) {
	            ev.preventDefault();

	            var bookmark = $("#jsxc_bookmark").prop("checked");
	            var autojoin = $('#jsxc_autojoin').prop('checked');

	            // clean up
	            jsxc.gui.window.clear(room);
	            jsxc.storage.setUserItem('member', room, {});

	            self.join(room, nickname, password, roomName, subject, bookmark, autojoin);

	            return false;
	          });
	        };

	        dialog.find('.jsxc_msg').append(
	            $('<p>').text(jsxc.t('Loading_room_information')).addClass('jsxc_waiting'));
	        jsxc.gui.dialog.resize();

	        self.conn.disco.info(room, null, function(stanza) {
	          dialog.find('.jsxc_msg').html('<p>' + jsxc.t('This_room_is') + '</p>');

	          var table = $('<table>');

	          $(stanza).find('feature').each(function() {
	            var feature = $(this).attr('var');

	            if (feature !== '' && jsxc.i18n.exists(feature)) {
	              var tr = $('<tr>');

	              $('<td>').text(feature).appendTo(tr);
	              tr.appendTo(table);

	              // Original, removed when shifting i18n from jquery plugin to object
	              // $('<td>').text(jsxc.t(feature + '.keyword')).appendTo(tr);
	              // $('<td>').text(jsxc.t(feature + '.keyword')).appendTo(tr);
	              // $('<td>').text(jsxc.t(feature + '.description')).appendTo(tr);
	              // tr.appendTo(table);
	            }
	          });

	          dialog.find('.jsxc_msg').append(table);

	          var roomName = $(stanza).find('identity').attr('name');
	          var subject = $(stanza).find('field[var="muc#roominfo_subject"]').attr('label');

	          //TODO display subject, number of occupants, etc.

	          discoReceived(roomName, subject);
	        }, function() {
	          dialog.find('.jsxc_msg').empty();
	          $('<p>').text(jsxc.t('Room_not_found_')).appendTo(dialog.find('.jsxc_msg'));

	          discoReceived();
	        });
	      } else {
	        dialog.find('.jsxc_warning').text(jsxc.t('You_already_joined_this_room'));
	      }

	      return false;
	    });

	    dialog.find('input').keydown(function(ev) {

	      if (ev.which !== 13) {
	        // reset messages and room information

	        dialog.find('.jsxc_warning').empty();

	        if (dialog.find('.jsxc_continue').is(":hidden")) {
	          dialog.find('.jsxc_continue').show();
	          dialog.find('.jsxc_join').hide().off('click');
	          dialog.find('.jsxc_msg').empty();
	          jsxc.gui.dialog.resize();
	        }

	        return;
	      }

	      if (!dialog.find('.jsxc_continue').is(":hidden")) {
	        dialog.find('.jsxc_continue').click();
	      } else {
	        dialog.find('.jsxc_join').click();
	      }
	    });
	  },

	  /**
	   * Request and show room configuration.
	   *
	   * @memberOf jsxc.muc
	   * @param  {string} room - room jid
	   */
	  showRoomConfiguration : function(room) {
	    var self = jsxc.muc;

	    self.conn.muc.configure(room, function(stanza) {

	      var form = Strophe.x.Form.fromXML(stanza);

	      window.f = form;
	      self._showRoomConfiguration(room, form);
	    }, function() {
	      jsxc.debug('Could not load room configuration');

	      //TODO show error
	    });
	  },

	  /**
	   * Show room configuration.
	   *
	   * @private
	   * @memberOf jsxc.muc
	   * @param  {string} room - room jid
	   * @param  {Strophe.x.Form} config - current room config as Form object
	   */
	  _showRoomConfiguration : function(room, config) {
	    var self = jsxc.muc;
	    var dialog = jsxc.gui.dialog.open(jsxc.muc.helper.formToHTML(config));
	    var form = dialog.find('form');

	    var submit = $('<button>');
	    submit.addClass('btn btn-primary');
	    submit.attr('type', 'submit');
	    submit.text(jsxc.t('Join'));

	    var cancel = $('<button>');
	    cancel.addClass('btn btn-default');
	    cancel.attr('type', 'button');
	    cancel.text(jsxc.t('Cancel'));

	    var formGroup = $('<div>');
	    formGroup.addClass('form-group');
	    $('<div>').addClass('col-sm-offset-6 col-sm-6').appendTo(formGroup);
	    formGroup.find('>div').append(cancel);
	    formGroup.find('>div').append(submit);

	    form.append(formGroup);

	    form.submit(function(ev) {
	      ev.preventDefault();

	      var config = Strophe.x.Form.fromHTML(form.get(0));
	      self.conn.muc.saveConfiguration(room, config, function() {
	        jsxc.storage.updateUserItem('buddy', room, 'config', config);

	        jsxc.debug('Room configuration saved.');
	      }, function() {
	        jsxc.warn('Could not save room configuration.');

	        //TODO display error
	      });

	      jsxc.gui.dialog.close();

	      return false;
	    });

	    cancel.click(function() {
	      self.conn.muc.cancelConfigure(room);

	      jsxc.gui.dialog.close();
	    });
	  },

	  /**
	   * Join the given room.
	   *
	   * @memberOf jsxc.muc
	   * @param {string} room Room jid
	   * @param {string} nickname Desired nickname
	   * @param {string} [password] Password
	   * @param {string} [roomName] Room alias
	   * @param {string} [subject] Current subject
	   */
	  join : function(room, nickname, password, roomName, subject, bookmark, autojoin,
	      additionnalDatas) {

	    var self = jsxc.muc;

	    if (typeof room === "undefined") {
	      throw new Error("Illegal argument for room name: ", {arguments : arguments});
	    }

	    var datas = {
	      jid : room,
	      name : roomName || room,
	      sub : 'both',
	      type : 'groupchat',
	      state : self.CONST.ROOMSTATE.INIT,
	      subject : subject,
	      bookmarked : bookmark || false,
	      autojoin : autojoin || false,
	      nickname : nickname,
	      config : null
	    };

	    if (additionnalDatas) {
	      $.extend(datas, additionnalDatas);
	    }

	    // save room configuration in localstorage
	    jsxc.storage.setUserItem('buddy', room, datas);

	    // join room
	    jsxc.xmpp.conn.muc.join(room, nickname, null, null, null, password);

	    // save bookmark
	    if (bookmark) {
	      jsxc.xmpp.bookmarks.add(room, roomName, nickname, autojoin);
	    }
	  },

	  /**
	   * Leave given room.
	   *
	   * @memberOf jsxc.muc
	   * @param {string} room Room jid
	   */
	  leave : function(room) {
	    var self = jsxc.muc;
	    var own = jsxc.storage.getUserItem('ownNicknames') || {};
	    var data = jsxc.storage.getUserItem('buddy', room) || {};

	    if (data.state === self.CONST.ROOMSTATE.ENTERED) {
	      self.conn.muc.leave(room, own[room], function() {
	        self.onExited(room);
	      });
	    } else {
	      self.onExited(room);
	    }
	  },

	  /**
	   * Clean up after we exited a room.
	   *
	   * @private
	   * @memberOf jsxc.muc
	   * @param {string} room Room jid
	   */
	  onExited : function(room) {
	    var self = jsxc.muc;
	    var own = jsxc.storage.getUserItem('ownNicknames') || {};
	    var roomdata = jsxc.storage.getUserItem('buddy', room) || {};

	    jsxc.storage.setUserItem('roomNames', self.conn.muc.roomNames);

	    delete own[room];
	    jsxc.storage.setUserItem('ownNicknames', own);
	    jsxc.storage.removeUserItem('member', room);
	    jsxc.storage.removeUserItem('chat', room);

	    jsxc.gui.window.close(room);

	    jsxc.storage.updateUserItem('buddy', room, 'state', self.CONST.ROOMSTATE.EXITED);

	    if (!roomdata.bookmarked) {
	      jsxc.gui.roster.purge(room);
	    }
	  },

	  /**
	   * Destroy the given room.
	   *
	   * @memberOf jsxc.muc
	   * @param {string} room Room jid
	   * @param {function} handler_cb Function to handle the successful destruction
	   * @param {function} error_cb Function to handle an error
	   */
	  destroy : function(room, handler_cb, error_cb) {
	    var self = jsxc.muc;
	    var roomdata = jsxc.storage.getUserItem('buddy', room);

	    jsxc.storage.updateUserItem('buddy', room, 'state', self.CONST.ROOMSTATE.AWAIT_DESTRUCTION);
	    jsxc.gui.window.postMessage({
	      bid : room, direction : jsxc.Message.SYS, msg : jsxc.t('This_room_will_be_closed')
	    });

	    var iq = $iq({
	      to : room, type : "set"
	    }).c("query", {
	      xmlns : Strophe.NS.MUC_OWNER
	    }).c("destroy");

	    jsxc.muc.conn.sendIQ(iq.tree(), handler_cb, error_cb);

	    if (roomdata.bookmarked) {
	      jsxc.xmpp.bookmarks.delete(room);
	    }
	  },

	  /**
	   * Close the given room.
	   *
	   * @memberOf jsxc.muc
	   * @param room Room jid
	   */
	  close : function(room) {
	    var self = jsxc.muc;
	    var roomdata = jsxc.storage.getUserItem('buddy', room) || {};

	    self.emptyMembers(room);

	    var roomIndex = self.conn.muc.roomNames.indexOf(room);

	    if (roomIndex > -1) {
	      self.conn.muc.roomNames.splice(roomIndex, 1);
	      delete self.conn.muc.rooms[room];
	    }

	    jsxc.storage.setUserItem('roomNames', self.conn.muc.roomNames);

	    if (roomdata.state === self.CONST.ROOMSTATE.AWAIT_DESTRUCTION) {
	      self.onExited(room);
	    }

	    roomdata.state = self.CONST.ROOMSTATE.DESTROYED;

	    jsxc.storage.setUserItem('buddy', room, roomdata);
	  },

	  /**
	   * Init group chat window.
	   *
	   * @private
	   * @memberOf jsxc.muc
	   * @param event Event
	   * @param {jQuery} win Window object
	   */
	  initWindow : function(event, win) {
	    var self = jsxc.muc;

	    if (!jsxc.xmpp.conn) {
	      $(document).one('attached.jsxc', function() {
	        self.initWindow(null, win);
	      });
	      return;
	    }

	    var data = win.data();
	    var bid = jsxc.jidToBid(data.jid);
	    var roomdata = jsxc.storage.getUserItem('buddy', bid);

	    if (roomdata.type !== 'groupchat') {
	      return;
	    }

	    win.addClass('jsxc_groupchat');

	    var own = jsxc.storage.getUserItem('ownNicknames') || {};
	    var ownNickname = own[bid];
	    var mlIcon = $('<div class="jsxc_members"></div>');

	    win.find('.jsxc_tools > .jsxc_settings').after(mlIcon);

	    var ml = $('<div class="jsxc_memberlist"><ul></ul></div>');
	    win.find('.jsxc_fade').prepend(ml);

	    ml.on('wheel', function(ev) {
	      jsxc.muc.scrollMemberListBy(bid, (ev.originalEvent.wheelDelta > 0) ? 50 : -50);
	    });

	    // toggle member list
	    var toggleMl = function(ev) {
	      if (ev) {
	        ev.preventDefault();
	      }

	      var slimOptions = {};
	      var ul = ml.find('ul:first');
	      var slimHeight = null;

	      ml.toggleClass('jsxc_expand');

	      if (ml.hasClass('jsxc_expand')) {
	        $('body').click();
	        $('body').one('click', toggleMl);

	        ul.mouseleave(function() {
	          ul.data('timer', window.setTimeout(toggleMl, 2000));
	        }).mouseenter(function() {
	          window.clearTimeout(ul.data('timer'));
	        }).css('left', '0px');

	        var maxHeight = win.find(".jsxc_textarea").height() * 0.8;
	        var innerHeight = ml.find('ul').height() + 3;
	        slimHeight = (innerHeight > maxHeight) ? maxHeight : innerHeight;

	        slimOptions = {
	          distance : '3px',
	          height : slimHeight + 'px',
	          width : '100%',
	          color : '#fff',
	          opacity : '0.5'
	        };

	        ml.css('height', slimHeight + 'px');
	      } else {
	        slimOptions = {
	          destroy : true
	        };

	        ul.attr('style', '');
	        ml.css('height', '');

	        window.clearTimeout(ul.data('timer'));
	        $('body').off('click', null, toggleMl);
	        ul.off('mouseleave mouseenter');
	      }

	      ul.slimscroll(slimOptions);

	      return false;
	    };

	    mlIcon.click(toggleMl);

	    win.on('resize', function() {
	      // update member list position
	      jsxc.muc.scrollMemberListBy(bid, 0);
	    });

	    var settingsList = win.find('.jsxc_settings ul');

	    // add invitation
	    var inviteLink = $('<a class="jsxc_inviteUsers"><span>'+jsxc.t('invite_in_conversation')+'</span></a>');
	    inviteLink.click(function() {

	      jsxc.gui.showSelectContactsDialog()

	      // operation was accepted
	          .then(function(jids) {

	            // check if enought users to invite
	            if (jids.length < 1) {
	              jsxc.gui.feedback("_i18nid_:you_must_select_one_person", null, 'warn');
	            }

	            // invite users
	            jsxc.muc.inviteParticipants(win.data("bid"), jids);

	            var invited = [];
	            $.each(jids, function(index, jid) {
	              invited.push(Strophe.getNodeFromJid(jid));
	            });

	            // report
	            if(invited.length > 1){
	              jsxc.gui.feedback("__i18nid_:users_have_been_invited", {users: invited.join(', ')});
	            }
	            else {
	              jsxc.gui.feedback("__i18nid_:user_have_been_invited", {user: invited[0]});
	            }

	          })

	          // operation was canceled
	          .fail(function() {
	            jsxc.gui.feedback('__i18nid_:operation_canceled');
	          });

	    });
	    settingsList.prepend($('<li>').append(inviteLink));

	    // add pad link
	    var padLink = $('<a class="jsxc_openpad"><span>' + jsxc.t('open_shared_pad') + '</span></a>');
	    padLink.click(function() {

	      jsxc.gui.feedback('__i18nid_:etherpad_openning_in_progress');

	      var padId = bid.substr(0, 26).replace(/[^a-z0-9]+/gi, "") + "_" +
	          jsxc.sha1.hash(bid).substr(0, 22);

	      padId = padId.toLocaleLowerCase();

	      jsxc.etherpad.openpad(padId);

	    });
	    settingsList.prepend($('<li>').append(padLink));

	    // add destroy link
	    var destroy = $('<a>');
	    destroy.text(jsxc.t('Destroy'));
	    destroy.addClass('jsxc_destroy');
	    destroy.hide();
	    destroy.click(function() {
	      self.destroy(bid);
	    });

	    settingsList.append($('<li>').append(destroy));

	    if (roomdata.state > self.CONST.ROOMSTATE.INIT) {
	      var member = jsxc.storage.getUserItem('member', bid) || {};

	      $.each(member, function(nickname, val) {
	        self.insertMember(bid, nickname, val);

	        if (nickname === ownNickname && val.affiliation === self.CONST.AFFILIATION.OWNER) {
	          destroy.show();
	        }
	      });
	    }

	    var leave = $('<a>');
	    leave.text(jsxc.t('Leave'));
	    leave.addClass('jsxc_leave');
	    leave.click(function() {
	      self.leave(bid);
	    });

	    win.find('.jsxc_settings ul').append($('<li>').append(leave));
	  },

	  /**
	   * Triggered on incoming presence stanzas.
	   *
	   * @private
	   * @memberOf jsxc.muc
	   * @param event
	   * @param {string} from Jid
	   * @param {integer} status Online status between 0 and 5
	   * @param {string} presence Presence stanza
	   */
	  onPresence : function(event, from, status, presence) {

	    if (!from) {
	      return true;
	    }

	    var self = jsxc.muc;
	    var room = jsxc.jidToBid(from);
	    var roomdata = jsxc.storage.getUserItem('buddy', room);
	    var xdata = $(presence).find('x[xmlns^="' + Strophe.NS.MUC + '"]');

	    if (self.conn.muc.roomNames.indexOf(room) < 0 || xdata.length === 0) {
	      return true;
	    }

	    var res = Strophe.getResourceFromJid(from) || '';
	    var nickname = Strophe.unescapeNode(res);
	    var own = jsxc.storage.getUserItem('ownNicknames') || {};
	    var member = jsxc.storage.getUserItem('member', room) || {};
	    var codes = [];

	    xdata.find('status').each(function() {
	      var code = $(this).attr('code');

	      jsxc.debug('[muc][code]', code);

	      codes.push(code);
	    });

	    if (roomdata.state === self.CONST.ROOMSTATE.INIT) {
	      // successfully joined

	      jsxc.storage.setUserItem('roomNames', jsxc.xmpp.conn.muc.roomNames);

	      if (jsxc.gui.roster.getItem(room).length < 1) {
	        var bl = jsxc.storage.getUserItem('buddylist');
	        bl.push(room);
	        jsxc.storage.setUserItem('buddylist', bl);

	        jsxc.gui.roster.add(room);
	      }

	      if ($('#jsxc_dialog').length > 0) {
	        // User joined the room manually
	        jsxc.gui.window.open(room);
	        jsxc.gui.dialog.close();
	      }
	    }

	    var jid = xdata.find('item').attr('jid') || null;

	    if (status === 0) {
	      if (xdata.find('destroy').length > 0) {
	        // room has been destroyed
	        member = {};

	        jsxc.gui.window.postMessage({
	          bid : room, direction : jsxc.Message.SYS, msg : jsxc.t('This_room_has_been_closed')
	        });

	        self.close(room);
	      } else {
	        delete member[nickname];

	        self.removeMember(room, nickname);

	        var newNickname = xdata.find('item').attr('nick');

	        if (codes.indexOf('303') > -1 && newNickname) {
	          // user changed his nickname

	          newNickname = Strophe.unescapeNode(newNickname);

	          // prevent to display enter message
	          member[newNickname] = {};

	          jsxc.gui.window.postMessage({
	            bid : room, direction : jsxc.Message.SYS, msg : jsxc.t('is_now_known_as', {
	              oldNickname : nickname, newNickname : newNickname, escapeInterpolation : true
	            })
	          });
	        } else if (codes.length === 0 || (codes.length === 1 && codes.indexOf('110') > -1)) {
	          // normal user exit
	          jsxc.gui.window.postMessage({
	            bid : room, direction : jsxc.Message.SYS, msg : jsxc.t('left_the_building', {
	              nickname : nickname, escapeInterpolation : true
	            })
	          });
	        }
	      }
	    } else {
	      // new member joined

	      if (!member[nickname] && own[room]) {
	        jsxc.gui.window.postMessage({
	          bid : room, direction : jsxc.Message.SYS, msg : jsxc.t('entered_the_room', {
	            nickname : nickname, escapeInterpolation : true
	          })
	        });
	      }

	      member[nickname] = {
	        jid : jid,
	        status : status,
	        roomJid : from,
	        affiliation : xdata.find('item').attr('affiliation'),
	        role : xdata.find('item').attr('role')
	      };

	      self.insertMember(room, nickname, member[nickname]);
	    }

	    jsxc.storage.setUserItem('member', room, member);

	    $.each(codes, function(index, code) {
	      // call code functions and trigger event

	      if (typeof self.onStatus[code] === 'function') {
	        self.onStatus[code].call(this, room, nickname, member[nickname] || {}, xdata);
	      }

	      $(document).trigger('status.muc.jsxc',
	          [code, room, nickname, member[nickname] || {}, presence]);
	    });

	    return true;
	  },

	  /**
	   * Handle group chat presence errors.
	   *
	   * @memberOf jsxc.muc
	   * @param event
	   * @param {string} from Jid
	   * @param {string} presence Presence stanza
	   * @returns {Boolean} Returns true on success
	   */
	  onPresenceError : function(event, from, presence) {

	    if (!from) {
	      return true;
	    }

	    var self = jsxc.muc;
	    var xdata = $(presence).find('x[xmlns="' + Strophe.NS.MUC + '"]');
	    var room = jsxc.jidToBid(from);

	    if (xdata.length === 0 || self.conn.muc.roomNames.indexOf(room) < 0) {
	      return true;
	    }

	    var error = $(presence).find('error');
	    var condition = error.children()[0].tagName;

	    jsxc.debug('[muc][error]', condition);

	    $(document).trigger('error.muc.jsxc', [condition, room]);

	    return true;
	  },

	  /**
	   * Handle status codes. Every function gets room jid, nickname, member data and xdata.
	   *
	   * @memberOf jsxc.muc
	   */
	  onStatus : {

	    /** Inform user that presence refers to itself */
	    110 : function(room, nickname, data) {

	      var self = jsxc.muc;
	      var own = jsxc.storage.getUserItem('ownNicknames') || {};

	      own[room] = nickname;
	      jsxc.storage.setUserItem('ownNicknames', own);

	      if (data.affiliation === self.CONST.AFFILIATION.OWNER) {
	        jsxc.gui.window.get(room).find('.jsxc_destroy').show();
	      }

	      var roomdata = jsxc.storage.getUserItem('buddy', room);

	      if (roomdata.state === self.CONST.ROOMSTATE.INIT) {
	        roomdata.state = self.CONST.ROOMSTATE.ENTERED;

	        jsxc.storage.setUserItem('buddy', room, roomdata);
	      }
	    },
	    /** Inform occupants that room logging is now enabled */
	    170 : function(room) {
	      jsxc.gui.window.postMessage({
	        bid : room, direction : jsxc.Message.SYS, msg : jsxc.t('Room_logging_is_enabled')
	      });
	    },
	    /** Inform occupants that room logging is now disabled */
	    171 : function(room) {
	      jsxc.gui.window.postMessage({
	        bid : room, direction : jsxc.Message.SYS, msg : jsxc.t('Room_logging_is_disabled')
	      });
	    },
	    /** Inform occupants that the room is now non-anonymous */
	    172 : function(room) {
	      jsxc.gui.window.postMessage({
	        bid : room, direction : jsxc.Message.SYS, msg : jsxc.t('Room_is_now_non-anoymous')
	      });
	    },
	    /** Inform occupants that the room is now semi-anonymous */
	    173 : function(room) {
	      jsxc.gui.window.postMessage({
	        bid : room, direction : jsxc.Message.SYS, msg : jsxc.t('Room_is_now_semi-anonymous')
	      });
	    },
	    /** Inform user that a new room has been created */
	    201 : function(room) {

	      var self = jsxc.muc;
	      var roomdata = jsxc.storage.getUserItem('buddy', room) || {};

	      if (roomdata.autojoin && roomdata.config === self.CONST.ROOMCONFIG.INSTANT) {
	        self.conn.muc.createInstantRoom(room);
	      } else if (roomdata.autojoin && typeof roomdata.config !== 'undefined' &&
	          roomdata.config !== null) {
	        self.conn.muc.saveConfiguration(room, roomdata.config, function() {
	          jsxc.debug('Cached room configuration saved.');
	        }, function() {
	          jsxc.warn('Could not save cached room configuration.');

	          //TODO display error
	        });
	      } else {

	        // launch configuration of room
	        self.conn.muc.configure(room, function(stanza) {
	              self._configureChatRoom(room, stanza);
	            },

	            // fail loading room configuration
	            function(response) {

	              jsxc.warn("Error while loading room configuration", response);

	              jsxc.gui.feedback("__i18nid_:error_while_openning_conversation", null, 'warn');

	            });

	      }

	    },
	    /** Inform user that he or she has been banned */
	    301 : function(room, nickname, data, xdata) {
	      var own = jsxc.storage.getUserItem('ownNicknames') || {};

	      if (own[room] === nickname) {
	        jsxc.muc.close(room);
	        jsxc.gui.window.postMessage({
	          bid : room, direction : jsxc.Message.SYS, msg : jsxc.t('muc_removed_banned')
	        });

	        jsxc.muc.postReason(room, xdata);
	      } else {
	        jsxc.gui.window.postMessage({
	          bid : room, direction : jsxc.Message.SYS, msg : jsxc.t('muc_removed_info_banned', {
	            nickname : nickname, escapeInterpolation : true
	          })
	        });
	      }
	    },
	    /** Inform user that he or she has been kicked */
	    307 : function(room, nickname, data, xdata) {
	      var own = jsxc.storage.getUserItem('ownNicknames') || {};

	      if (own[room] === nickname) {
	        jsxc.muc.close(room);
	        jsxc.gui.window.postMessage({
	          bid : room, direction : jsxc.Message.SYS, msg : jsxc.t('muc_removed_kicked')
	        });

	        jsxc.muc.postReason(room, xdata);
	      } else {
	        jsxc.gui.window.postMessage({
	          bid : room, direction : jsxc.Message.SYS, msg : jsxc.t('muc_removed_info_kicked', {
	            nickname : nickname, escapeInterpolation : true
	          })
	        });
	      }
	    },
	    /** Inform user that he or she is beeing removed from the room because of an affiliation change */
	    321 : function(room, nickname) {
	      var own = jsxc.storage.getUserItem('ownNicknames') || {};

	      if (own[room] === nickname) {
	        jsxc.muc.close(room);

	        jsxc.gui.window.postMessage({
	          bid : room, direction : jsxc.Message.SYS, msg : jsxc.t('muc_removed_affiliation')
	        });
	      } else {
	        jsxc.gui.window.postMessage({
	          bid : room, direction : jsxc.Message.SYS, msg : jsxc.t('muc_removed_info_affiliation', {
	            nickname : nickname, escapeInterpolation : true
	          })
	        });
	      }
	    },
	    /**
	     * Inform user that he or she is beeing removed from the room because the room has been
	     * changed to members-only and the user is not a member
	     */
	    322 : function(room, nickname) {
	      var own = jsxc.storage.getUserItem('ownNicknames') || {};

	      if (own[room] === nickname) {
	        jsxc.muc.close(room);
	        jsxc.gui.window.postMessage({
	          bid : room, direction : jsxc.Message.SYS, msg : jsxc.t('muc_removed_membersonly')
	        });
	      } else {
	        jsxc.gui.window.postMessage({
	          bid : room, direction : jsxc.Message.SYS, msg : jsxc.t('muc_removed_info_membersonly', {
	            nickname : nickname, escapeInterpolation : true
	          })
	        });
	      }
	    },
	    /**
	     * Inform user that he or she is beeing removed from the room because the MUC service
	     * is being shut down
	     */
	    332 : function(room) {
	      jsxc.muc.close(room);
	      jsxc.gui.window.postMessage({
	        bid : room, direction : jsxc.Message.SYS, msg : jsxc.t('muc_removed_shutdown')
	      });
	    }
	  },

	  /**
	   * Configure a chat room after creation
	   * @param stanza
	   * @param room
	   */
	  _configureChatRoom : function(room, stanza) {

	    var self = jsxc.muc;
	    var roomdata = jsxc.storage.getUserItem('buddy', room) || {};

	    // define fields
	    var fieldValues = {
	      "muc#roomconfig_roomname" : roomdata.name,
	      "muc#roomconfig_roomdesc" : roomdata.subject,
	      "muc#roomconfig_changesubject" : "0",
	      "muc#roomconfig_maxusers" : "0",
	      "muc#roomconfig_presencebroadcast" : "visitor",
	      "muc#roomconfig_publicroom" : "0",
	      "muc#roomconfig_persistentroom" : "1",
	      "muc#roomconfig_moderatedroom" : "0",
	      "muc#roomconfig_membersonly" : "0",
	      "muc#roomconfig_allowinvites" : "1",
	      "muc#roomconfig_passwordprotectedroom" : "0",
	      "muc#roomconfig_whois" : "anyone",
	      "muc#roomconfig_enablelogging" : "1",
	      "x-muc#roomconfig_canchangenick" : "0",
	      "x-muc#roomconfig_registration" : "0", // "muc#roomconfig_roomadmins": "",
	      // "muc#roomconfig_roomowners": "",
	    };

	    // parse form from stanza
	    var form = Strophe.x.Form.fromXML(stanza);

	    // if no form, take default
	    if (!form) {
	      form = fieldValues;
	    } else {

	      $.each(form.fields, function(index, item) {

	        if (typeof fieldValues[item.var] !== "undefined") {
	          item.values = [fieldValues[item.var]];
	        }

	      });

	    }
	    // self.conn.muc.cancelConfigure(room);

	    // send configuration to server
	    self.conn.muc.saveConfiguration(room, form, function() {

	          // save configuration
	          jsxc.storage.updateUserItem('buddy', room, 'config', form);

	        },

	        // configuration fail
	        function(response) {

	          jsxc.warn("Error while configuring room", response);

	          jsxc.gui.feedback("__i18nid_:error_while_openning_conversation", null, 'warn');

	        });
	  },

	  /**
	   * Invite participants to a chat room
	   * @param room
	   */
	  inviteParticipants : function(room, jidArray) {

	    var self = jsxc.muc;

	    jsxc.debug("Invitation sent: ", {room : room, jidArray : jidArray});

	    $.each(jidArray, function(index, jid) {

	      jsxc.stats.addEvent("jsxc.muc.invitation.sent");

	      self.conn.muc.directInvite(room, jid, "You are invited in a conversation");
	    });

	  },

	  /**
	   * Extract reason from xdata and if available post it to room.
	   *
	   * @memberOf jsxc.muc
	   * @param {string} room Room jid
	   * @param {jQuery} xdata Xdata
	   */
	  postReason : function(room, xdata) {
	    var actor = {
	      name : xdata.find('actor').attr('nick'), jid : xdata.find('actor').attr('jid')
	    };
	    var reason = xdata.find('reason').text();

	    if (reason !== '') {
	      reason = jsxc.t('Reason') + ': ' + reason;

	      if (typeof actor.name === 'string' || typeof actor.jid === 'string') {
	        jsxc.gui.window.postMessage({
	          bid : room, direction : jsxc.Message.IN, msg : reason, sender : actor
	        });
	      } else {
	        jsxc.gui.window.postMessage({
	          bid : room, direction : jsxc.Message.SYS, msg : reason
	        });
	      }
	    }
	  },

	  /**
	   * Insert member to room member list.
	   *
	   * @memberOf jsxc.muc
	   * @param {string} room Room jid
	   * @param {string} nickname Nickname
	   * @param {string} memberdata Member data
	   */
	  insertMember : function(room, nickname, memberdata) {
	    var self = jsxc.muc;
	    var win = jsxc.gui.window.get(room);
	    var jid = memberdata.jid;
	    var m = win.find('.jsxc_memberlist li[data-nickname="' + nickname + '"]');

	    if (m.length === 0) {
	      var title = jsxc.escapeHTML(nickname);

	      m = $('<li><div class="jsxc_avatar"></div><div class="jsxc_name"/></li>');
	      m.attr('data-nickname', nickname);

	      win.find('.jsxc_memberlist ul').append(m);

	      if (typeof jid === 'string') {
	        m.find('.jsxc_name').text(jsxc.jidToBid(jid));
	        m.attr('data-bid', jsxc.jidToBid(jid));
	        title = title + '\n' + jsxc.jidToBid(jid);

	        var data = jsxc.storage.getUserItem('buddy', jsxc.jidToBid(jid));

	        if (data !== null && typeof data === 'object') {
	          jsxc.gui.updateAvatar(m, jsxc.jidToBid(jid), data.avatar);
	        } else if (jsxc.jidToBid(jid) === jsxc.jidToBid(self.conn.jid)) {
	          jsxc.gui.updateAvatar(m, jsxc.jidToBid(jid), 'own');
	        }
	      } else {
	        m.find('.jsxc_name').text(nickname);

	        jsxc.gui.avatarPlaceholder(m.find('.jsxc_avatar'), nickname);
	      }

	      m.attr('title', title);
	    }
	  },

	  /**
	   * Remove member from room member list.
	   *
	   * @memberOf jsxc.muc
	   * @param {string} room Room jid
	   * @param {string} nickname Nickname
	   */
	  removeMember : function(room, nickname) {
	    var win = jsxc.gui.window.get(room);
	    var m = win.find('.jsxc_memberlist li[data-nickname="' + nickname + '"]');

	    if (m.length > 0) {
	      m.remove();
	    }
	  },

	  /**
	   * Scroll or update member list position.
	   *
	   * @memberOf jsxc.muc
	   * @param {string} room Room jid
	   * @param {integer} offset =0: update position; >0: Scroll to left; <0: Scroll to right
	   */
	  scrollMemberListBy : function(room, offset) {
	    var win = jsxc.gui.window.get(room);

	    if (win.find('.jsxc_memberlist').hasClass('jsxc_expand')) {
	      return;
	    }

	    var el = win.find('.jsxc_memberlist ul:first');
	    var scrollWidth = el.width();
	    var width = win.find('.jsxc_memberlist').width();
	    var left = parseInt(el.css('left'));

	    left = (isNaN(left)) ? 0 - offset : left - offset;

	    if (scrollWidth < width || left > 0) {
	      left = 0;
	    } else if (left < width - scrollWidth) {
	      left = width - scrollWidth;
	    }

	    el.css('left', left + 'px');
	  },

	  /**
	   * Empty member list.
	   *
	   * @memberOf jsxc.muc
	   * @param {string} room Room jid
	   */
	  emptyMembers : function(room) {
	    var win = jsxc.gui.window.get(room);

	    win.find('.jsxc_memberlist').empty();

	    jsxc.storage.setUserItem('member', room, {});
	  },

	  /**
	   * Handle incoming group chat message.
	   *
	   * @private
	   * @memberOf jsxc.muc
	   * @param {string} message Message stanza
	   * @returns {boolean} True on success
	   */
	  onGroupchatMessage : function(message) {
	    var id = $(message).attr('id');

	    if (id && jsxc.el_exists(jsxc.Message.getDOM(id))) {
	      // ignore own incoming messages
	      return true;
	    }

	    var from = $(message).attr('from');
	    var body = $(message).find('body:first').text();
	    var room = jsxc.jidToBid(from);
	    var nickname = Strophe.unescapeNode(Strophe.getResourceFromJid(from));

	    if (body !== '') {
	      var delay = $(message).find('delay[xmlns="urn:xmpp:delay"]');
	      var stamp = (delay.length > 0) ? new Date(delay.attr('stamp')) : new Date();
	      stamp = stamp.getTime();

	      var member = jsxc.storage.getUserItem('member', room) || {};

	      var sender = {};
	      sender.name = nickname;

	      if (member[nickname] && typeof member[nickname].jid === 'string') {
	        sender.jid = member[nickname].jid;
	      }

	      jsxc.gui.window.init(room);

	      jsxc.gui.window.postMessage({
	        bid : room, direction : jsxc.Message.IN, msg : body, stamp : stamp, sender : sender
	      });
	    }

	    var subject = $(message).find('subject');

	    if (subject.length > 0) {
	      var roomdata = jsxc.storage.getUserItem('buddy', room);

	      roomdata.subject = subject.text();

	      jsxc.storage.setUserItem('buddy', room, roomdata);

	      jsxc.gui.window.postMessage({
	        bid : room, direction : jsxc.Message.SYS, msg : jsxc.t('changed_subject_to', {
	          nickname : nickname, subject : subject.text()
	        })
	      });
	    }

	    return true;
	  },

	  /**
	   * Handle group chat error message.
	   *
	   * @private
	   * @memberOf jsxc.muc
	   * @param {string} message Message stanza
	   */
	  onErrorMessage : function(message) {
	    var room = jsxc.jidToBid($(message).attr('from'));

	    if (jsxc.gui.window.get(room).length === 0) {
	      return true;
	    }

	    if ($(message).find('item-not-found').length > 0) {
	      jsxc.gui.window.postMessage({
	        bid : room, direction : jsxc.Message.SYS, msg : jsxc.t('message_not_send_item-not-found')
	      });
	    } else if ($(message).find('forbidden').length > 0) {
	      jsxc.gui.window.postMessage({
	        bid : room, direction : jsxc.Message.SYS, msg : jsxc.t('message_not_send_forbidden')
	      });
	    } else if ($(message).find('not-acceptable').length > 0) {
	      jsxc.gui.window.postMessage({
	        bid : room, direction : jsxc.Message.SYS, msg : jsxc.t('message_not_send_not-acceptable')
	      });
	    } else {
	      jsxc.gui.window.postMessage({
	        bid : room, direction : jsxc.Message.SYS, msg : jsxc.t('message_not_send')
	      });
	    }

	    jsxc.debug('[muc] error message for ' + room, $(message).find('error')[0]);

	    return true;
	  },

	  /**
	   * Launch creation of a new conversation with jid array.
	   *
	   * All members of array will be invited after room configuration
	   *
	   * @param buddiesId
	   */
	  createNewConversationWith : function(buddies, title, subject) {

	    jsxc.stats.addEvent("jsxc.muc.conversation.new");

	    jsxc.debug("New conversation created", {buddies : buddies, title : title, subject : subject});

	    var d = new Date();

	    // prepare title of room. If no title, using all usernames sorted.
	    if (!title || title.length < 1) {

	      // create username array
	      var userNodeArray = [jsxc.xmpp.getCurrentNode()];
	      $.each(buddies, function(index, item) {
	        userNodeArray.push(Strophe.getNodeFromJid(item));
	      });
	      userNodeArray.sort();

	      title = userNodeArray.join(", ");

	      title += " " + d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getUTCFullYear();

	    }

	    // prepare id of room, all in lower case, otherwise problem will appear with local storage
	    var datestamp = d.toISOString().replace(/[^0-9]+/gi, "");

	    var roomjid = datestamp + "_" + jsxc.xmpp.getCurrentNode() + "@" +
	        jsxc.options.get('muc').server;

	    // all in lower case, otherwise problem will appear with local storage
	    // all in lower case, otherwise problem will appear with local storage
	    // all in lower case, otherwise problem will appear with local storage
	    roomjid = roomjid.toLowerCase();

	    // save initial participants for invite them, without current user
	    var initialParticipants = [];
	    $.each(buddies, function(index, item) {
	      initialParticipants.push(item);
	    });

	    // clean up
	    jsxc.gui.window.clear(roomjid);
	    jsxc.storage.setUserItem('member', roomjid, {});

	    jsxc.muc.join(roomjid, jsxc.xmpp.getCurrentNode(), null, title, subject || '', true, true,
	        {"initialParticipants" : initialParticipants});

	    // open window
	    jsxc.gui.window.open(roomjid);

	    // invite users
	    jsxc.muc.inviteParticipants(roomjid, initialParticipants);

	    return roomjid;
	  },

	  /**
	   * Prepare group chat roster item.
	   *
	   * @private
	   * @memberOf jsxc.muc
	   * @param event
	   * @param {string} room Room jid
	   * @param {object} data Room data
	   * @param {jQuery} bud Roster item
	   */
	  onAddRoster : function(event, room, data, bud) {
	    var self = jsxc.muc;

	    if (data.type !== 'groupchat') {
	      return;
	    }

	    var bo = $('<a>');
	    $('<span>').addClass('jsxc_icon jsxc_bookmarkicon').appendTo(bo);
	    $('<span>').text(jsxc.t('Bookmark')).appendTo(bo);
	    bo.addClass('jsxc_bookmarkOptions');
	    bo.click(function(ev) {
	      ev.preventDefault();

	      jsxc.xmpp.bookmarks.showDialog(room);

	      return false;
	    });

	    bud.find('.jsxc_menu ul').append($('<li>').append(bo));

	    if (data.bookmarked) {
	      bud.addClass('jsxc_bookmarked');
	    }

	    bud.off('click').click(function() {

	      jsxc.gui.window.open(room);

	      // var data = jsxc.storage.getUserItem('buddy', room);

	      // if (data.state === self.CONST.ROOMSTATE.INIT || data.state ===
	      // self.CONST.ROOMSTATE.EXITED) { self.showJoinChat();
	      // $('#jsxc_room').val(Strophe.getNodeFromJid(data.jid));
	      // $('#jsxc_nickname').val(data.nickname); $('#jsxc_bookmark').prop('checked',
	      // data.bookmarked); $('#jsxc_autojoin').prop('checked', data.autojoin);
	      // $('#jsxc_showJoinChat .jsxc_bookmark').hide(); } else { jsxc.gui.window.open(room); }
	    });

	    bud.find('.jsxc_delete').click(function() {
	      if (data.bookmarked) {
	        jsxc.xmpp.bookmarks.delete(room);
	      }

	      self.leave(room);
	      return false;
	    });
	  },

	  /**
	   * Some helper functions.
	   *
	   * @type {Object}
	   */
	  helper : {
	    /**
	     * Convert x:data form to html.
	     *
	     * @param  {Strophe.x.Form} form - x:data form
	     * @return {jQuery} jQuery representation of x:data field
	     */
	    formToHTML : function(form) {
	      if (!(form instanceof Strophe.x.Form)) {
	        return;
	      }

	      var html = $('<form>');

	      html.attr('data-type', form.type);
	      html.addClass('form-horizontal');

	      if (form.title) {
	        html.append("<h3>" + form.title + "</h3>");
	      }

	      if (form.instructions) {
	        html.append("<p>" + form.instructions + "</p>");
	      }

	      if (form.fields.length > 0) {
	        var i;
	        for (i = 0; i < form.fields.length; i++) {
	          html.append(jsxc.muc.helper.fieldToHtml(form.fields[i]));
	        }
	      }

	      return $('<div>').append(html).html();
	    },

	    /**
	     * Convert x:data field to html.
	     *
	     * @param  {Strophe.x.Field} field - x:data field
	     * @return {html} html representation of x:data field
	     */
	    fieldToHtml : function(field) {
	      var self = field || this;
	      field = null;
	      var el, val, opt, i, o, j, k, txt, line, _ref2;

	      var id = "Strophe.x.Field-" + self['type'] + "-" + self['var'];
	      var html = $('<div>');
	      html.addClass('form-group');

	      if (self.label) {
	        var label = $('<label>');
	        label.attr('for', id);
	        label.addClass('col-sm-6 control-label');
	        label.text(self.label);
	        label.appendTo(html);
	      }

	      switch (self.type.toLowerCase()) {
	        case 'list-single':
	        case 'list-multi':

	          el = $('<select>');
	          if (self.type === 'list-multi') {
	            el.attr('multiple', 'multiple');
	          }

	          for (i = 0; i < self.options.length; i++) {
	            opt = self.options[i];
	            if (!opt) {
	              continue;
	            }
	            o = $(opt.toHTML());

	            for (j = 0; j < self.values; j++) {
	              k = self.values[j];
	              if (k.toString() === opt.value.toString()) {
	                o.attr('selected', 'selected');
	              }
	            }
	            o.appendTo(el);
	          }

	          break;
	        case 'text-multi':
	        case 'jid-multi':
	          el = $("<textarea>");
	          txt = ((function() {
	            var i, _results;
	            _results = [];
	            for (i = 0; i < self.values.length; i++) {
	              line = self.values[i];
	              _results.push(line);
	            }
	            return _results;
	          }).call(this)).join('\n');
	          if (txt) {
	            el.text(txt);
	          }
	          break;
	        case 'text-single':
	        case 'boolean':
	        case 'text-private':
	        case 'hidden':
	        case 'fixed':
	        case 'jid-single':
	          el = $("<input>");

	          if (self.values) {
	            el.attr('value', self.values[0]);
	          }
	          switch (self.type.toLowerCase()) {
	            case 'text-single':
	              el.attr('type', 'text');
	              el.attr('placeholder', self.desc);
	              el.addClass('form-control');
	              break;
	            case 'boolean':
	              el.attr('type', 'checkbox');
	              val = (_ref2 = self.values[0]) != null ?
	                  typeof _ref2.toString === "function" ? _ref2.toString() : void 0 : void 0;
	              if (val && (val === "true" || val === "1")) {
	                el.attr('checked', 'checked');
	              }
	              break;
	            case 'text-private':
	              el.attr('type', 'password');
	              el.addClass('form-control');
	              break;
	            case 'hidden':
	              el.attr('type', 'hidden');
	              break;
	            case 'fixed':
	              el.attr('type', 'text').attr('readonly', 'readonly');
	              el.addClass('form-control');
	              break;
	            case 'jid-single':
	              el.attr('type', 'email');
	              el.addClass('form-control');
	          }
	          break;
	        default:
	          el = $("<input type='text'>");
	      }

	      el.attr('id', id);
	      el.attr('name', self["var"]);

	      if (self.required) {
	        el.attr('required', self.required);
	      }

	      var inner = el;
	      el = $('<div>');
	      el.addClass('col-sm-6');
	      el.append(inner);

	      html.append(el);

	      return html.get(0);
	    }
	  }
	};

	$(document).on('init.window.jsxc', jsxc.muc.initWindow);
	$(document).on('add.roster.jsxc', jsxc.muc.onAddRoster);

	$(document).one('attached.jsxc', function() {
	  jsxc.muc.init();
	});

	$(document).one('connected.jsxc', function() {
	  jsxc.storage.removeUserItem('roomNames');
	  jsxc.storage.removeUserItem('ownNicknames');
	});

	/**
	 * This namespace handle the notice system.
	 *
	 * @namspace jsxc.notice
	 * @memberOf jsxc
	 */
	jsxc.notice = {

	  /** Number of notices. */
	  _num : 0,

	  /**
	   * Loads the saved notices.
	   *
	   * @memberOf jsxc.notice
	   */
	  load : function() {

	    var self = this;

	    // reset list
	    $('#jsxc-notifications ul li').remove();

	    $('#jsxc-root .jsxc_menu_notif_number').text('');
	    jsxc.notice._num = 0;

	    var saved = jsxc.storage.getUserItem('notices') || [];
	    var key = null;

	    for (key in saved) {
	      if (saved.hasOwnProperty(key)) {
	        var val = saved[key];

	        // add notice but do not trigger event for each
	        jsxc.notice.add(val.msg, val.description, val.fnName, val.fnParams, key, false);
	      }
	    }

	    self._showNoNoticeContent();

	    $(document).trigger("notice.jsxc");
	  },

	  /**
	   * Display "No notifications" in notifications list if there are no notifications
	   * @private
	   */
	  _showNoNoticeContent : function() {
	    if ($('#jsxc-notifications ul li').length < 1) {
	      $('#jsxc-notifications ul').append(
	          "<li class='jsxc_noNotice'>" + jsxc.t('no_notifications') + "</li>");
	    }

	    else {
	      $('#jsxc-notifications .jsxc_noNotice').remove();
	    }
	  },

	  /**
	   * Add a new notice to the stack
	   *
	   * Trigger an event by default
	   *
	   * Id is specified when we are loading old events stored in browser
	   *
	   * @memberOf jsxc.notice
	   * @param msg Header message
	   * @param description Notice description
	   * @param fnName Function name to be called if you open the notice
	   * @param fnParams Array of params for function
	   * @param id Notice id
	   */
	  add : function(msg, description, fnName, fnParams, id, triggerEvent) {

	    var self = this;

	    // trigger an jquery event by default
	    triggerEvent = typeof triggerEvent === "undefined" ? true : false;

	    // id of notice, now or previous choosen id
	    var nid = id || Date.now();
	    var list = $('#jsxc-notifications ul');

	    // create notice and append it to the notice list
	    var notice = $('<li/>');
	    notice.click(function() {

	      // remove notice
	      jsxc.notice.remove(nid);

	      // exec attached function
	      jsxc.exec(fnName, fnParams);

	      // trigger event, number of notices changed
	      $(document).trigger("notice.jsxc");

	      return false;
	    });

	    notice.html("<b>" + msg + "</b><br/>" + description);
	    notice.attr('title', description || '');
	    notice.attr('data-nid', nid);
	    list.append(notice);

	    // update totla notifications number
	    jsxc.notice._num++;
	    self.updateNotificationNumbers();

	    if (!id) {
	      var saved = jsxc.storage.getUserItem('notices') || {};
	      saved[nid] = {
	        msg : msg, description : description, fnName : fnName, fnParams : fnParams
	      };

	      jsxc.storage.setUserItem('notices', saved);

	      jsxc.notification.notify(msg, description || '', null, true, jsxc.CONST.SOUNDS.NOTICE);
	    }

	    // show no notice content if needed
	    self._showNoNoticeContent();

	    if (triggerEvent) {
	      $(document).trigger("notice.jsxc");
	    }
	  },

	  /**
	   * Update places where are displayed notification numbers
	   */
	  updateNotificationNumbers : function() {
	    $('#jsxc-root .jsxc_menu_notif_number').text(jsxc.notice._num);
	  },

	  /**
	   * Get notification numbers
	   * @returns {number}
	   */
	  getNotificationsNumber : function() {
	    return jsxc.notice._num || 0;
	  },

	  /**
	   * Removes notice from stack
	   *
	   * @memberOf jsxc.notice
	   * @param nid The notice id
	   */
	  remove : function(nid) {

	    var self = this;

	    var el = $('#jsxc-notifications li[data-nid=' + nid + ']');

	    el.remove();
	    $('#jsxc-root .jsxc_menu_notif_number').text(--jsxc.notice._num || '');

	    var s = jsxc.storage.getUserItem('notices');
	    delete s[nid];
	    jsxc.storage.setUserItem('notices', s);

	    self.updateNotificationNumbers();

	    self._showNoNoticeContent();
	  },

	  /**
	   * Check if there is already a notice for the given function name.
	   *
	   * @memberOf jsxc.notice
	   * @param {string} fnName Function name
	   * @returns {boolean} True if there is >0 functions with the given name
	   */
	  has : function(fnName) {
	    var saved = jsxc.storage.getUserItem('notices') || [];
	    var has = false;

	    $.each(saved, function(index, val) {
	      if (val.fnName === fnName) {
	        has = true;

	        return false;
	      }
	    });

	    return has;
	  }
	};

	/**
	 * This namespace handles the Notification API.
	 *
	 * @namespace jsxc.notification
	 */
	jsxc.notification = {

	  /** Current audio file. */
	  audio : null,

	  /**
	   * Register notification on incoming messages.
	   *
	   * @memberOf jsxc.notification
	   */
	  init : function() {

	    $(document).on('postmessagein.jsxc', function(event, bid, msg) {

	      msg = (msg && msg.match(/^\?OTR/)) ? jsxc.t('Encrypted_message') : msg;

	      var data = jsxc.storage.getUserItem('buddy', bid);

	      jsxc.notification.notify({
	        title : jsxc.t('New_message_from', {
	          name : data.name
	        }), msg : msg, soundFile : jsxc.CONST.SOUNDS.MSG, source : bid
	      });

	    });

	  },

	  /**
	   * Shows a pop up notification and optional play sound.
	   *
	   * @param title Title
	   * @param msg Message
	   * @param d Duration
	   * @param force Should message also shown, if tab is visible?
	   * @param soundFile Playing given sound file
	   * @param loop Loop sound file?
	   * @param source Bid which triggered this notification
	   */
	  notify : function(title, msg, d, force, soundFile, loop, source) {

	    if (!jsxc.options.notification || !jsxc.notification.hasPermission()) {
	      jsxc.debug('Notification triggered, but disabled', {arguments : arguments});
	      return;
	    }

	    var o;

	    if (title !== null && typeof title === 'object') {
	      o = title;
	    } else {
	      o = {
	        title : title,
	        msg : msg,
	        duration : d,
	        force : force,
	        soundFile : soundFile,
	        loop : loop,
	        source : source
	      };
	    }

	    if (jsxc.hasFocus() && o.force !== true) {
	      return; // Tab is visible
	    }

	    var icon = o.icon || jsxc.options.root + '/img/newgui/desktop-notification.png';

	    if (typeof o.source === 'string') {
	      var data = jsxc.storage.getUserItem('buddy', o.source);
	      var src = jsxc.storage.getUserItem('avatar', data.avatar);

	      if (typeof src === 'string' && src !== '0') {
	        icon = src;
	      }
	    }

	    jsxc.toNotification = setTimeout(function() {

	      if (typeof o.soundFile === 'string') {
	        jsxc.notification.playSound(o.soundFile, o.loop, o.force);
	      }

	      // notifications are hidden
	      if (jsxc.notification.isNotificationShowed() !== true) {
	        return;
	      }

	      var popup = new Notification(jsxc.t(o.title), {
	        body : jsxc.t(o.msg), icon : icon
	      });

	      var duration = o.duration || jsxc.options.popupDuration;

	      if (duration > 0) {
	        setTimeout(function() {
	          popup.close();
	        }, duration);
	      }
	    }, jsxc.toNotificationDelay);
	  },

	  /**
	   * Checks if browser has support for notifications and add on chrome to the
	   * default api.
	   *
	   * @returns {Boolean} True if the browser has support.
	   */
	  hasSupport : function() {
	    if (window.webkitNotifications) {
	      // prepare chrome

	      window.Notification = function(title, opt) {
	        var popup = window.webkitNotifications.createNotification(null, title, opt.body);
	        popup.show();

	        popup.close = function() {
	          popup.cancel();
	        };

	        return popup;
	      };

	      var permission;
	      switch (window.webkitNotifications.checkPermission()) {
	        case 0:
	          permission = jsxc.CONST.NOTIFICATION_GRANTED;
	          break;
	        case 2:
	          permission = jsxc.CONST.NOTIFICATION_DENIED;
	          break;
	        default: // 1
	          permission = jsxc.CONST.NOTIFICATION_DEFAULT;
	      }
	      window.Notification.permission = permission;

	      window.Notification.requestPermission = function(func) {
	        window.webkitNotifications.requestPermission(func);
	      };

	      return true;
	    } else if (window.Notification) {
	      return true;
	    } else {
	      return false;
	    }
	  },

	  /**
	   * Ask user on first incoming message if we should inform him about new
	   * messages.
	   */
	  prepareRequest : function() {

	    if (jsxc.notice.has('gui.showRequestNotification')) {
	      return;
	    }

	    $(document).one('postmessagein.jsxc', function() {
	      setTimeout(function() {
	        jsxc.notice.add(jsxc.t('Notifications') + '?', jsxc.t('Should_we_notify_you_'),
	            'gui.showRequestNotification');
	      }, 1000);
	    });
	  },

	  /**
	   * Request notification permission.
	   */
	  requestPermission : function() {
	    window.Notification.requestPermission(function(status) {
	      if (window.Notification.permission !== status) {
	        window.Notification.permission = status;
	      }

	      if (jsxc.notification.hasPermission()) {
	        $(document).trigger('notificationready.jsxc');
	      } else {
	        $(document).trigger('notificationfailure.jsxc');
	      }
	    });
	  },

	  /**
	   * Check permission.
	   *
	   * @returns {Boolean} True if we have the permission
	   */
	  hasPermission : function() {
	    return window.Notification.permission === jsxc.CONST.NOTIFICATION_GRANTED;
	  },

	  /**
	   * Plays the given file.
	   *
	   * @memberOf jsxc.notification
	   * @param {string} soundFile File relative to the sound directory
	   * @param {boolean} loop True for loop
	   * @param {boolean} force Play even if a tab is visible. Default: false.
	   */
	  playSound : function(soundFile, loop, force) {
	    if (!jsxc.master) {
	      // only master plays sound
	      return;
	    }

	    if (jsxc.notification.isSoundMuted() === true) {
	      return;
	    }

	    if (jsxc.hasFocus() && !force) {
	      // tab is visible
	      return;
	    }

	    // stop current audio file
	    jsxc.notification.stopSound();

	    var audio = new Audio(jsxc.options.root + '/sound/' + soundFile);
	    audio.loop = loop || false;

	    //TODO: some browsers (Android Chrome, ...) want a user interaction before trigger play()
	    audio.play();

	    jsxc.notification.audio = audio;
	  },

	  /**
	   * Stop/remove current sound.
	   *
	   * @memberOf jsxc.notification
	   */
	  stopSound : function() {
	    var audio = jsxc.notification.audio;

	    if (typeof audio !== 'undefined' && audio !== null) {
	      audio.pause();
	      jsxc.notification.audio = null;
	    }
	  },

	  /**
	   * Mute sound.
	   *
	   * @memberOf jsxc.notification
	   * @param {boolean} external True if triggered from external tab. Default:
	   *        false.
	   */
	  muteSound : function(external) {
	    if (external !== true) {
	      jsxc.options.set('muteNotification', true);
	    }
	  },

	  /**
	   * Unmute sound.
	   *
	   * @memberOf jsxc.notification
	   * @param {boolean} external True if triggered from external tab. Default:
	   *        false.
	   */
	  unmuteSound : function(external) {
	    if (external !== true) {
	      jsxc.options.set('muteNotification', false);
	    }
	  },

	  /**
	   * Return true if sound is muted
	   */
	  isSoundMuted : function() {
	    return jsxc.options && jsxc.options.get('muteNotification');
	  },

	  /**
	   * Return true if notifications are showed
	   */
	  isNotificationShowed : function() {
	    return jsxc.options && jsxc.options.get('hideNotification') !== true &&
	        jsxc.notification.hasPermission();
	  },

	  /**
	   * Hide notifications.
	   *
	   * @memberOf jsxc.notification
	   * @param {boolean} external True if triggered from external tab. Default:
	   *        false.
	   */
	  hideNotifications : function(external) {
	    if (external !== true) {
	      jsxc.options.set('hideNotification', true);
	    }
	  },

	  /**
	   * Show notifications. It just set flag.
	   *
	   * If desktop notifications are disabled in browser nothing will be done.
	   *
	   * @memberOf jsxc.notification
	   * @param {boolean} external True if triggered from external tab. Default:
	   *        false.
	   */
	  showNotifications : function(external) {
	    if (external !== true) {
	      jsxc.options.set('hideNotification', false);
	    }
	  }

	};

	/**
	 * Set some options for the chat.
	 *
	 * @namespace jsxc.options
	 */
	jsxc.options = {

	  /**
	   * REST support
	   */
	  rest : {
	    apiName : "", apiBaseUrl : "", apiKey : ""
	  },

	  /**
	   * URL of the Chromium/Chrome extension
	   */
	  chromeExtensionURL: "screen-capture/chrome-extension.crx",

	  /**
	   * Stats support. Stats is a small module enabling logs and events transmission to a distant
	   * server.
	   *
	   * ** All datas are strictly anonymous
	   */
	  stats : {

	    /**
	     * Enable or disable module
	     */
	    enabled : false,

	    /**
	     * Destination of datas
	     */
	    destinationUrl : "https://domain-without-trailing-slash.net/stats",

	    /**
	     * Send automatically every n ms
	     */
	    autosend : true,

	    /**
	     * Credential if encessary
	     */
	    authorization : "key",

	    /**
	     * Interresting log level, beware of not overload browser
	     */
	    sentLogLevels : ['WARN', 'ERROR']
	  },

	  /** name of container application (e.g. owncloud or SOGo) */
	  app_name : 'web applications',

	  /** Timeout for the keepalive signal */
	  timeout : 3000,

	  /** Timeout for the keepalive signal if the master is busy */
	  busyTimeout : 15000,

	  /** OTR options */
	  otr : {
	    enable : true,
	    ERROR_START_AKE : false,
	    debug : false,
	    SEND_WHITESPACE_TAG : true,
	    WHITESPACE_START_AKE : true
	  },

	  /** Etherpad support **/
	  etherpad : {

	    // true or false
	    enabled : false,

	    // ressource like http://server.tld/etherpad_root/
	    ressource : null
	  },

	  /** xmpp options */
	  xmpp : {
	    /** BOSH url */
	    url : null,

	    /** XMPP JID*/
	    jid : null,

	    /** XMPP domain */
	    domain : null,

	    /** Domain for user search, XEP 0055*/
	    searchDomain : null,

	    /** XMPP password */
	    password : null,

	    /** session id */
	    sid : null,

	    /** request id */
	    rid : null,

	    /** True: Allow user to overwrite xmpp settings */
	    overwrite : false,

	    /** @deprecated since v2.1.0. Use now loginForm.enable. */
	    onlogin : null
	  },

	  /** default xmpp priorities */
	  priority : {
	    online : 0, chat : 0, away : 0, xa : 0, dnd : 0
	  },

	  /**
	   * This function is called if a login form was found, but before any
	   * modification is done to it.
	   *
	   * @memberOf jsxc.options
	   * @function
	   */
	  formFound : null,

	  /** If all 3 properties are set and enable is true, the login form is used */
	  loginForm : {
	    /** False, disables login through login form */
	    enable : true,

	    /** jquery object from form */
	    form : null,

	    /** jquery object from input element which contains the jid */
	    jid : null,

	    /** jquery object from input element which contains the password */
	    pass : null,

	    /** manipulate JID from input element */
	    preJid : function(jid) {
	      return jid;
	    },

	    /**
	     * Action after login was called: dialog [String] Show wait dialog, false [boolean] |
	     * quiet [String] Do nothing
	     */
	    onConnecting : 'dialog',

	    /**
	     * Action after connected: submit [String] Submit form, false [boolean] Do
	     * nothing, continue [String] Start chat
	     */
	    onConnected : 'submit',

	    /**
	     * Action after auth fail: submit [String] Submit form, false [boolean] | quiet [String] Do
	     * nothing, ask [String] Show auth fail dialog
	     */
	    onAuthFail : 'submit',

	    /**
	     * True: Attach connection even is login form was found.
	     *
	     * @type {Boolean}
	     * @deprecated since 3.0.0. Use now loginForm.ifFound (true => attach, false => pause)
	     */
	    attachIfFound : true,

	    /**
	     * Describes what we should do if login form was found:
	     * - Attach connection
	     * - Force new connection with loginForm.jid and loginForm.passed
	     * - Pause connection and do nothing
	     *
	     * @type {(attach|force|pause)}
	     */
	    ifFound : 'attach',

	    /**
	     * True: Display roster minimized after first login. Afterwards the last
	     * roster state will be used.
	     */
	    startMinimized : false
	  },

	  /** jquery object from logout element */
	  logoutElement : null,

	  /** How many messages should be logged? */
	  numberOfMsg : 10,

	  /** Default language */
	  defaultLang : 'en',

	  /** auto language detection */
	  autoLang : true,

	  /** Place for roster */
	  rosterAppend : 'body',

	  /** Should we use the HTML5 notification API? */
	  notification : true,

	  /** duration for notification */
	  popupDuration : 6000,

	  /** Absolute path root of JSXC installation */
	  root : '',

	  /**
	   * This function decides wether the roster will be displayed or not if no
	   * connection is found.
	   */
	  displayRosterMinimized : function() {
	    return false;
	  },

	  /** Set to true if you want to hide offline buddies. */
	  hideOffline : false,

	  /**
	   * If no avatar is found, this function is called.
	   *
	   * @param jid Jid of that user.
	   * @this {jQuery} Elements to update with probable .jsxc_avatar elements
	   */
	  defaultAvatar : function(jid) {
	    jsxc.gui.avatarPlaceholder($(this).find('.jsxc_avatar'), jid);
	  },

	  /**
	   * This callback processes all settings.
	   * @callback loadSettingsCallback
	   * @param settings {object} could be every jsxc option
	   */

	  /**
	   * Returns permanent saved settings and overwrite default jsxc.options.
	   *
	   * @memberOf jsxc.options
	   * @function
	   * @param username {string} username
	   * @param password {string} password
	   * @param cb {loadSettingsCallback} Callback that handles the result
	   */
	  loadSettings : null,

	  /**
	   * Call this function to save user settings permanent.
	   *
	   * @memberOf jsxc.options
	   * @param data Holds all data as key/value
	   * @param cb Called with true on success, false otherwise
	   */
	  saveSettinsPermanent : function(data, cb) {
	    cb(true);
	  },

	  carbons : {
	    /** Enable carbon copies? */
	    enable : false
	  },

	  /**
	   * Processes user list.
	   *
	   * @callback getUsers-cb
	   * @param {object} list List of users, key: username, value: alias
	   */

	  /**
	   * Returns a list of usernames and aliases
	   *
	   * @function getUsers
	   * @memberOf jsxc.options
	   * @param {string} search Search token (start with)
	   * @param {getUsers-cb} cb Called with list of users
	   */
	  getUsers : null,

	  /** Options for info in favicon */
	  favicon : {
	    enable : true,

	    /** Favicon info background color */
	    bgColor : '#E59400',

	    /** Favicon info text color */
	    textColor : '#fff'
	  },

	  /** RTCPeerConfiguration used for audio/video calls. */
	  RTCPeerConfig : {

	    /** [optional] If set, jsxc requests and uses RTCPeerConfig from this url */
	    url : null,

	    /** ICE servers like defined in http://www.w3.org/TR/webrtc/#idl-def-RTCIceServer */
	    iceServers : [

	      // Examples
	      // {
	      //   urls : "stun:turn1.turnserver.net:80"
	      // },
	      //
	      // {
	      //   urls : "turns:turn1.turnserver.net:443",
	      //   credential : "passwordTooLongToBeRead",
	      //   credentialType : "password",
	      //   username : "djoe"
	      // }

	    ]
	  },

	  /** Link to an online user manual */
	  onlineHelp : 'http://www.jsxc.org/manual.html',

	  viewport : {
	    getSize : function() {
	      var w = $(window).width() - $('#jsxc_windowListSB').width();
	      var h = $(window).height();

	      return {
	        width : w, height : h
	      };
	    }
	  },

	  maxStorableSize : 1000000,

	  /**
	   * If true, notification sounds will be muted
	   */
	  muteNotification : false,

	  /**
	   * If true, desktop notifications will be hidden
	   */
	  hideNotification : false

	};

	/**
	 * @namespace jsxc.otr
	 */
	jsxc.otr = {
	   /** list of otr objects */
	   objects: {},

	   dsaFallback: null,
	   /**
	    * Handler for otr receive event
	    * 
	    * @memberOf jsxc.otr
	    * @param {Object} d
	    * @param {string} d.bid
	    * @param {string} d.msg received message
	    * @param {boolean} d.encrypted True, if msg was encrypted.
	    * @param {boolean} d.forwarded
	    * @param {string} d.stamp timestamp
	    */
	   receiveMessage: function(d) {
	      var bid = d.bid;

	      if (jsxc.otr.objects[bid].msgstate !== OTR.CONST.MSGSTATE_PLAINTEXT) {
	         jsxc.otr.backup(bid);
	      }

	      if (jsxc.otr.objects[bid].msgstate !== OTR.CONST.MSGSTATE_PLAINTEXT && !d.encrypted) {
	         jsxc.gui.window.postMessage({
	            bid: bid,
	            direction: jsxc.Message.SYS,
	            msg: jsxc.t('Received_an_unencrypted_message') + '. [' + d.msg + ']',
	            encrypted: d.encrypted,
	            forwarded: d.forwarded,
	            stamp: d.stamp
	         });
	      } else {
	         jsxc.gui.window.postMessage({
	            bid: bid,
	            direction: jsxc.Message.IN,
	            msg: d.msg,
	            encrypted: d.encrypted,
	            forwarded: d.forwarded,
	            stamp: d.stamp
	         });
	      }
	   },

	   /**
	    * Handler for otr send event
	    * 
	    * @param {string} jid
	    * @param {string} msg message to be send
	    */
	   sendMessage: function(jid, msg, uid) {
	      if (jsxc.otr.objects[jsxc.jidToBid(jid)].msgstate !== 0) {
	         jsxc.otr.backup(jsxc.jidToBid(jid));
	      }

	      jsxc.xmpp._sendMessage(jid, msg, uid);
	   },

	   /**
	    * Create new otr instance
	    * 
	    * @param {type} bid
	    * @returns {undefined}
	    */
	   create: function(bid) {

	      if (jsxc.otr.objects.hasOwnProperty(bid)) {
	         return;
	      }

	      if (!jsxc.options.otr.priv) {
	         return;
	      }

	      // save list of otr objects
	      var ol = jsxc.storage.getUserItem('otrlist') || [];
	      if (ol.indexOf(bid) < 0) {
	         ol.push(bid);
	         jsxc.storage.setUserItem('otrlist', ol);
	      }

	      jsxc.otr.objects[bid] = new OTR(jsxc.options.otr);

	      if (jsxc.options.otr.SEND_WHITESPACE_TAG) {
	         jsxc.otr.objects[bid].SEND_WHITESPACE_TAG = true;
	      }

	      if (jsxc.options.otr.WHITESPACE_START_AKE) {
	         jsxc.otr.objects[bid].WHITESPACE_START_AKE = true;
	      }

	      jsxc.otr.objects[bid].on('status', function(status) {
	         var data = jsxc.storage.getUserItem('buddy', bid);

	         if (data === null) {
	            return;
	         }

	         switch (status) {
	            case OTR.CONST.STATUS_SEND_QUERY:
	               jsxc.gui.window.postMessage({
	                  bid: bid,
	                  direction: jsxc.Message.SYS,
	                  msg: jsxc.t('trying_to_start_private_conversation')
	               });
	               break;
	            case OTR.CONST.STATUS_AKE_SUCCESS:
	               data.fingerprint = jsxc.otr.objects[bid].their_priv_pk.fingerprint();
	               data.msgstate = OTR.CONST.MSGSTATE_ENCRYPTED;

	               var msg_state = jsxc.otr.objects[bid].trust ? 'Verified' : 'Unverified';
	               var msg = jsxc.t(msg_state + '_private_conversation_started');

	               jsxc.gui.window.postMessage({
	                  bid: bid,
	                  direction: 'sys',
	                  msg: msg
	               });
	               break;
	            case OTR.CONST.STATUS_END_OTR:
	               data.fingerprint = null;

	               if (jsxc.otr.objects[bid].msgstate === OTR.CONST.MSGSTATE_PLAINTEXT) {
	                  // we abort the private conversation

	                  data.msgstate = OTR.CONST.MSGSTATE_PLAINTEXT;
	                  jsxc.gui.window.postMessage({
	                     bid: bid,
	                     direction: jsxc.Message.SYS,
	                     msg: jsxc.t('private_conversation_aborted')
	                  });

	               } else {
	                  // the buddy abort the private conversation

	                  data.msgstate = OTR.CONST.MSGSTATE_FINISHED;
	                  jsxc.gui.window.postMessage({
	                     bid: bid,
	                     direction: jsxc.Message.SYS,
	                     msg: jsxc.t('your_buddy_closed_the_private_conversation_you_should_do_the_same')
	                  });
	               }
	               break;
	            case OTR.CONST.STATUS_SMP_HANDLE:
	               jsxc.keepBusyAlive();
	               break;
	         }

	         jsxc.storage.setUserItem('buddy', bid, data);

	         // for encryption and verification state
	         jsxc.gui.update(bid);
	      });

	      jsxc.otr.objects[bid].on('smp', function(type, data) {
	         switch (type) {
	            case 'question': // verification request received
	               jsxc.gui.window.postMessage({
	                  bid: bid,
	                  direction: jsxc.Message.SYS,
	                  msg: jsxc.t('Authentication_request_received')
	               });

	               jsxc.gui.window.smpRequest(bid, data);
	               jsxc.storage.setUserItem('smp', bid, {
	                  data: data || null
	               });

	               break;
	            case 'trust': // verification completed
	               jsxc.otr.objects[bid].trust = data;
	               jsxc.storage.updateUserItem('buddy', bid, 'trust', data);
	               jsxc.otr.backup(bid);
	               jsxc.gui.update(bid);

	               if (data) {
	                  jsxc.gui.window.postMessage({
	                     bid: bid,
	                     direction: jsxc.Message.SYS,
	                     msg: jsxc.t('conversation_is_now_verified')
	                  });
	               } else {
	                  jsxc.gui.window.postMessage({
	                     bid: bid,
	                     direction: jsxc.Message.SYS,
	                     msg: jsxc.t('authentication_failed')
	                  });
	               }
	               jsxc.storage.removeUserItem('smp', bid);
	               jsxc.gui.dialog.close('smp');
	               break;
	            case 'abort':
	               jsxc.gui.window.hideOverlay(bid);
	               jsxc.gui.window.postMessage({
	                  bid: bid,
	                  direction: jsxc.Message.SYS,
	                  msg: jsxc.t('Authentication_aborted')
	               });
	               break;
	            default:
	               jsxc.debug('[OTR] sm callback: Unknown type: ' + type);
	         }
	      });

	      // Receive message
	      jsxc.otr.objects[bid].on('ui', function(msg, encrypted, meta) {
	         jsxc.otr.receiveMessage({
	            bid: bid,
	            msg: msg,
	            encrypted: encrypted === true,
	            stamp: meta.stamp,
	            forwarded: meta.forwarded
	         });
	      });

	      // Send message
	      jsxc.otr.objects[bid].on('io', function(msg, uid) {
	         var jid = jsxc.gui.window.get(bid).data('jid') || jsxc.otr.objects[bid].jid;

	         jsxc.otr.objects[bid].jid = jid;

	         jsxc.otr.sendMessage(jid, msg, uid);
	      });

	      jsxc.otr.objects[bid].on('error', function(err) {
	         // Handle this case in jsxc.otr.receiveMessage
	         if (err !== 'Received an unencrypted message.') {
	            jsxc.gui.window.postMessage({
	               bid: bid,
	               direction: jsxc.Message.SYS,
	               msg: '[OTR] ' + jsxc.t(err)
	            });
	         }

	         jsxc.error('[OTR] ' + err);
	      });

	      jsxc.otr.restore(bid);
	   },

	   /**
	    * show verification dialog with related part (secret or question)
	    * 
	    * @param {type} bid
	    * @param {string} [data]
	    * @returns {undefined}
	    */
	   onSmpQuestion: function(bid, data) {
	      jsxc.gui.showVerification(bid);

	      $('#jsxc_dialog select').prop('selectedIndex', (data ? 2 : 3)).change();
	      $('#jsxc_dialog > div:eq(0)').hide();

	      if (data) {
	         $('#jsxc_dialog > div:eq(2)').find('#jsxc_quest').val(data).prop('disabled', true);
	         $('#jsxc_dialog > div:eq(2)').find('.jsxc_submit').text(jsxc.t('Answer'));
	         $('#jsxc_dialog > div:eq(2)').find('.jsxc_explanation').text(jsxc.t('onsmp_explanation_question'));
	         $('#jsxc_dialog > div:eq(2)').show();
	      } else {
	         $('#jsxc_dialog > div:eq(3)').find('.jsxc_explanation').text(jsxc.t('onsmp_explanation_secret'));
	         $('#jsxc_dialog > div:eq(3)').show();
	      }

	      $('#jsxc_dialog .jsxc_close').click(function() {
	         jsxc.storage.removeUserItem('smp', bid);

	         if (jsxc.master) {
	            jsxc.otr.objects[bid].sm.abort();
	         }
	      });
	   },

	   /**
	    * Send verification request to buddy
	    * 
	    * @param {string} bid
	    * @param {string} sec secret
	    * @param {string} [quest] question
	    * @returns {undefined}
	    */
	   sendSmpReq: function(bid, sec, quest) {
	      jsxc.keepBusyAlive();

	      jsxc.otr.objects[bid].smpSecret(sec, quest || '');
	   },

	   /**
	    * Toggle encryption state
	    * 
	    * @param {type} bid
	    * @returns {undefined}
	    */
	   toggleTransfer: function(bid) {
	      if (typeof OTR !== 'function') {
	         return;
	      }

	      if (jsxc.storage.getUserItem('buddy', bid).msgstate === 0) {
	         jsxc.otr.goEncrypt(bid);
	      } else {
	         jsxc.otr.goPlain(bid);
	      }
	   },

	   /**
	    * Send request to encrypt the session
	    * 
	    * @param {type} bid
	    * @returns {undefined}
	    */
	   goEncrypt: function(bid) {
	      if (jsxc.master) {
	         if (jsxc.otr.objects.hasOwnProperty(bid)) {
	            jsxc.otr.objects[bid].sendQueryMsg();
	         }
	      } else {
	         jsxc.storage.updateUserItem('buddy', bid, 'transferReq', 1);
	      }
	   },

	   /**
	    * Abort encryptet session
	    * 
	    * @param {type} bid
	    * @param cb callback
	    * @returns {undefined}
	    */
	   goPlain: function(bid, cb) {
	      if (jsxc.master) {
	         if (jsxc.otr.objects.hasOwnProperty(bid)) {
	            jsxc.otr.objects[bid].endOtr.call(jsxc.otr.objects[bid], cb);
	            jsxc.otr.objects[bid].init.call(jsxc.otr.objects[bid]);

	            jsxc.otr.backup(bid);
	         }
	      } else {
	         jsxc.storage.updateUserItem('buddy', bid, 'transferReq', 0);
	      }
	   },

	   /**
	    * Backups otr session
	    * 
	    * @param {string} bid
	    */
	   backup: function(bid) {
	      var o = jsxc.otr.objects[bid]; // otr object
	      var r = {}; // return value

	      if (o === null) {
	         return;
	      }

	      // all variables which should be saved
	      var savekey = ['jid', 'our_instance_tag', 'msgstate', 'authstate', 'fragment', 'their_y', 'their_old_y', 'their_keyid', 'their_instance_tag', 'our_dh', 'our_old_dh', 'our_keyid', 'sessKeys', 'storedMgs', 'oldMacKeys', 'trust', 'transmittedRS', 'ssid', 'receivedPlaintext', 'authstate', 'send_interval'];

	      var i;
	      for (i = 0; i < savekey.length; i++) {
	         r[savekey[i]] = JSON.stringify(o[savekey[i]]);
	      }

	      if (o.their_priv_pk !== null) {
	         r.their_priv_pk = JSON.stringify(o.their_priv_pk.packPublic());
	      }

	      if (o.ake.otr_version && o.ake.otr_version !== '') {
	         r.otr_version = JSON.stringify(o.ake.otr_version);
	      }

	      jsxc.storage.setUserItem('otr', bid, r);
	   },

	   /**
	    * Restore old otr session
	    * 
	    * @param {string} bid
	    */
	   restore: function(bid) {
	      var o = jsxc.otr.objects[bid];
	      var d = jsxc.storage.getUserItem('otr', bid);

	      if (o !== null || d !== null) {
	         var key;
	         for (key in d) {
	            if (d.hasOwnProperty(key)) {
	               var val = JSON.parse(d[key]);
	               if (key === 'their_priv_pk' && val !== null) {
	                  val = DSA.parsePublic(val);
	               }
	               if (key === 'otr_version' && val !== null) {
	                  o.ake.otr_version = val;
	               } else {
	                  o[key] = val;
	               }
	            }
	         }

	         jsxc.otr.objects[bid] = o;

	         if (o.msgstate === 1 && o.their_priv_pk !== null) {
	            o._smInit.call(jsxc.otr.objects[bid]);
	         }
	      }

	      jsxc.otr.enable(bid);
	   },

	   /**
	    * Create or load DSA key
	    * 
	    * @returns {unresolved}
	    */
	   createDSA: function() {
	      if (jsxc.options.otr.priv) {
	         return;
	      }

	      if (typeof OTR !== 'function') {
	         jsxc.warn('OTR support disabled');

	         OTR = {};
	         OTR.CONST = {
	            MSGSTATE_PLAINTEXT: 0,
	            MSGSTATE_ENCRYPTED: 1,
	            MSGSTATE_FINISHED: 2
	         };

	         return;
	      }

	      if (jsxc.storage.getUserItem('key') === null) {
	         var msg = jsxc.t('Creating_your_private_key_');
	         var worker = null;

	         if (Worker) {
	            // try to create web-worker

	            try {
	               worker = new Worker(jsxc.options.root + '/lib/otr/lib/dsa-webworker.js');
	            } catch (err) {
	               jsxc.warn('Couldn\'t create web-worker.', err);
	            }
	         }

	         jsxc.otr.dsaFallback = (worker === null);

	         if (!jsxc.otr.dsaFallback) {
	            // create DSA key in background

	            worker.onmessage = function(e) {
	               var type = e.data.type;
	               var val = e.data.val;

	               if (type === 'debug') {
	                  jsxc.debug("OTR: ", val);
	               } else if (type === 'data') {
	                  jsxc.otr.DSAready(DSA.parsePrivate(val));
	               }
	            };

	            jsxc.debug('DSA key creation started.');

	            // start worker
	            worker.postMessage({
	               imports: [jsxc.options.root + '/lib/otr/vendor/salsa20.js', jsxc.options.root + '/lib/otr/vendor/bigint.js', jsxc.options.root + '/lib/otr/vendor/crypto.js', jsxc.options.root + '/lib/otr/vendor/eventemitter.js', jsxc.options.root + '/lib/otr/lib/const.js', jsxc.options.root + '/lib/otr/lib/helpers.js', jsxc.options.root + '/lib/otr/lib/dsa.js'],
	               seed: BigInt.getSeed(),
	               debug: true
	            });

	         } else {
	            // fallback
	            jsxc.xmpp.conn.pause();

	            jsxc.gui.dialog.open(jsxc.gui.template.get('waitAlert', null, msg), {
	               noClose: true
	            });

	            jsxc.debug('DSA key creation started in fallback mode.');

	            // wait until the wait alert is opened
	            setTimeout(function() {
	               var dsa = new DSA();
	               jsxc.otr.DSAready(dsa);
	            }, 500);
	         }
	      } else {
	         jsxc.debug('DSA key loaded');
	         jsxc.options.otr.priv = DSA.parsePrivate(jsxc.storage.getUserItem('key'));

	         jsxc.otr._createDSA();
	      }
	   },

	   /**
	    * Ending of createDSA().
	    */
	   _createDSA: function() {

	      jsxc.storage.setUserItem('priv_fingerprint', jsxc.options.otr.priv.fingerprint());

	      $.each(jsxc.storage.getUserItem('windowlist') || [], function(index, val) {
	         jsxc.otr.create(val);
	      });
	   },

	   /**
	    * Ending of DSA key generation.
	    * 
	    * @param {DSA} dsa DSA object
	    */
	   DSAready: function(dsa) {
	      jsxc.storage.setUserItem('key', dsa.packPrivate());
	      jsxc.options.otr.priv = dsa;

	      // close wait alert
	      if (jsxc.otr.dsaFallback) {
	         jsxc.xmpp.conn.resume();
	         jsxc.gui.dialog.close();
	      }

	      jsxc.otr._createDSA();
	   },

	   enable: function(bid) {
	      jsxc.gui.window.get(bid).find('.jsxc_otr').removeClass('jsxc_disabled');
	   }
	};

	/**
	 * Here go all ressources search stuff.
	 *
	 * This analyse allow to enlighten links, videos, ...
	 *
	 * @memberOf jsxc
	 */

	//TODO: Etherpad
	//TODO: Videoconference
	//TODO: ...

	//TODO: Etherpad
	//TODO: Videoconference
	//TODO: ...

	//TODO: Etherpad
	//TODO: Videoconference
	//TODO: ...

	jsxc.ressources = {

	  _log : function(message, data, level) {
	    jsxc.debug('[RESSOURCES] ' + message, data, level);
	  },

	  /**
	   * Analyse text and return HTML code containing links to display ressources in the ressource
	   * panel
	   */
	  processRessourcesInText : function(text) {

	    var self = jsxc.ressources;

	    /**
	     * Manager and ressource stack serves to prevent two filter to process
	     * the same ressource.
	     *
	     * Every filter have to test ressource before process it and
	     * register before processing
	     * @type {Array}
	     * @private
	     */
	    var _resStack = [];
	    var manager = {

	      _resStack : [],

	      /**
	       * Save ressource processed to prevent that
	       * other filter process it after
	       * @param res
	       */
	      saveRessource : function(res) {
	        _resStack.push(res);
	      },

	      /**
	       * Return true if filter can process ressource
	       * @param res
	       * @returns {boolean}
	       */
	      isFree : function(res) {
	        return _resStack.indexOf(res) === -1;
	      }
	    };

	    // iterate filters
	    $.each(self.MEDIA_RESSOURCES, function(index, filter) {

	      // here regex must be an array !
	      if (filter.regex.constructor !== Array) {
	        throw new Error("'regex' must be an array");
	      }

	      var name = filter.name;

	      var replaceFilter = function(match) {

	        // ressource have not been processed
	        if (manager.isFree(match)) {

	          manager.saveRessource(match);

	          // if filter provide link ask it
	          if (filter.getLink) {
	            // ask link with same arguments as filter function for replace
	            // to get access to all capturing groups
	            return filter.getLink.apply(self, arguments);
	          }

	          // otherwise default is show in mediapanel
	          else {
	            return self._getShowRessourceLink(match, name);
	          }

	        }

	        // ressource have already be processed
	        else {
	          return match;
	        }

	      };

	      for (var i = 0; i < filter.regex.length; i++) {

	        var regex = filter.regex[i];

	        // text match filter
	        if (text.match(regex)) {
	          text = text.replace(regex, replaceFilter);
	        }

	      }

	    });

	    //self._log("Output: ", text);

	    return text;
	  },

	  //TODO: Etherpad
	  //TODO: Videoconference
	  //TODO: ...
	  MEDIA_RESSOURCES : [

	    {
	      name : 'youtube',

	      //https://www.youtube.com/watch?v=FbuluDBHpfQ
	      regex : [/https?:\/\/(www\.)?youtube\.[a-z]{1,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/ig],

	      getEmbedded : function(ressourceOnly) {
	        var self = jsxc.ressources;

	        // get video id from ressource
	        // https://www.youtube.com/watch?v=FbuluDBHpfQ.match(/v=([^&]+)/i);
	        var vid = ressourceOnly.match(/v=([^&]+)/i);

	        if (vid === null) {
	          return self._getEmbeddedErrorBlock();
	        }

	        return '<iframe src="https://www.youtube.com/embed/' + vid[1] +
	            '" frameborder="0" width="480" height="270" allowfullscreen></iframe>';
	      }

	    },

	    {
	      name : 'dailymotion',

	//https://www.youtube.com/watch?v=FbuluDBHpfQ
	      regex : [/https?:\/\/(www\.)?dailymotion\.[a-z]{1,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/ig],

	      getEmbedded : function(ressourceOnly) {
	        var self = jsxc.ressources;

	        // get video id from ressource
	        // http://www.dailymotion.com/video/x2i3isg_zap-meta-le-zapping-de-meta-tv-2015-semaine-9_news
	        var vid = ressourceOnly.match(/video\/([^_]+)/i);

	        if (vid === null) {
	          return self._getEmbeddedErrorBlock();
	        }

	        return '<iframe frameborder="0" width="480" height="270" ' +
	            'src="//www.dailymotion.com/embed/video/' + vid[1] + '" ' + 'allowfullscreen></iframe>';

	      }

	    },

	    {
	      name : 'http/https',

	      //https://www.youtube.com/watch?v=FbuluDBHpfQ
	      regex : [jsxc.CONST.REGEX.URL],

	      getLink : function(match) {
	        var self = jsxc.ressources;
	        return self._getTrueLink(match);
	      }

	    },

	    {
	      name : 'etherpad',

	      //++etherpad:etherpadid
	      //++e:etherpadid
	      regex : [/\+\+(e|etherpad):([-_a-z0-9]+)/ig],

	      getLink : function(match, prefix, etherpadId) {
	        var self = jsxc.ressources;
	        return self._getEtherpadLink(etherpadId);
	      }

	    },

	    {
	      name : 'spaceInvasion',

	      //++etherpad:etherpadid
	      //++e:etherpadid
	      regex : [/\+\+(spaceinvasion)/ig],

	      getLink : function() {
	        var self = jsxc.ressources;
	        return self._getSpaceInvasionLink();
	      }

	    },

	    {
	      name : 'user',

	      //++remi
	      regex : [/\+\+([-_a-z0-9]+)/ig],

	      getLink : function(match, user) {
	        var self = jsxc.ressources;
	        return self._getChatLink(user);
	      }

	    }

	  ],

	  /**
	   * Return embedded code for a ressource
	   * @param name
	   * @param ressourceOnly
	   * @returns {*}
	   */
	  getEmbeddedFor : function(name, ressourceOnly) {

	    var self = jsxc.ressources;

	    var media = null;
	    $.each(self.MEDIA_RESSOURCES, function(index, element) {
	      if (element.name === name) {
	        media = element;
	        return false;
	      }
	    });

	    if (!name || !media) {
	      throw new Error("Invalid ressource: " + name + " / " + ressourceOnly);
	    }

	    if (media.getEmbedded) {
	      return media.getEmbedded(ressourceOnly);
	    }

	    else {
	      return null;
	    }

	  },

	  _getEmbeddedErrorBlock : function(ressource) {
	    return "<div class='jsxc-multimedia-error-block'>Erreur de traitement de la ressource: " +
	        "<br/>" + ressource + "</div>";
	  },

	  /**
	   * Return an HTML/Javascript link to open a ressource
	   * @param ressource
	   * @returns {string}
	   * @private
	   */
	  _getShowRessourceLink : function(ressource, prefix) {

	    if (typeof ressource === 'undefined') {
	      throw new Error('Ressource cannot be undefined');
	    }
	    if (typeof prefix === 'undefined') {
	      throw new Error('Prefix cannot be undefined');
	    }

	    // format ressource to show it
	    var ressourceLabel = ressource.length < 50 ? ressource : ressource.substr(0, 17) + "...";

	    // add prefix to ressource
	    ressource = prefix ? prefix + ":" + ressource : ressource;

	    var title = "Ouvrir: " + ressource;

	    // return HTML link
	    return '<a class="jsxc-media-ressource-link" title="' + title +
	        '" onclick="jsxc.newgui.openMediaRessource(\'' + ressource + '\')">' + ressourceLabel +
	        '</a>';
	  },

	  /**
	   * Return a link to chat with someone
	   * @param user
	   * @returns {string}
	   * @private
	   */
	  _getChatLink : function(user) {

	    // format ressource to show it
	    var ressourceLabel = user.length < 50 ? user : user.substr(0, 17) + "...";

	    var jid = user + "@" + jsxc.options.xmpp.domain;

	    var title = "Discuter avec: " + user;

	    return '<a class="jsxc-media-ressource-link" title="' + title +
	        '" onclick="jsxc.api.openChatWindow(\'' + jid + '\')">' + ressourceLabel + '</a>';
	  },

	  /**
	   * Return a link to chat with someone
	   * @param user
	   * @returns {string}
	   * @private
	   */
	  _getEtherpadLink : function(etherpadId) {

	    // format ressource to show it
	    var ressourceLabel = etherpadId.length < 50 ? etherpadId : etherpadId.substr(0, 17) + "...";

	    var title = jsxc.t('open_a_pad') + etherpadId;

	    return '<a class="jsxc-media-ressource-link" title="' + title +
	        '" onclick="jsxc.etherpad.openpad(\'' + etherpadId + '\')">' + ressourceLabel + '</a>';
	  },

	  _getTrueLink : function(href) {

	    // format ressource to show it
	    var ressourceLabel = href.length < 50 ? href : href.substr(0, 17) + "...";

	    var title = jsxc.t('open_in_a_new_window') + href;

	    return '<a class="jsxc-media-ressource-link" title="' + title + '" target="_blank" href="' +
	        href + '">' + ressourceLabel + '</a>';

	  },

	  _getSpaceInvasionLink : function() {
	    return '<a class="jsxc-media-ressource-link" title="Space Invasion !" ' +
	        'onclick="jsxc.api.spaceInvasion()">Space Invasion !</a>';
	  }

	};
	/**
	 * REST operations
	 *
	 *
	 */
	jsxc.rest = {

	    init: function () {

	        var self = jsxc.rest;

	        // initialising openfire
	        self.openfire.apiBaseUrl = jsxc.options.get('rest').apiBaseUrl || "";
	        self.openfire.apiKey = jsxc.options.get('rest').apiKey || "";

	    },

	    openfire: {

	        /**
	         * URL for accessing REST API
	         */
	        apiBaseUrl: "",

	        /**
	         * Auth key
	         */
	        apiKey: "",

	        /**
	         * Check if all parameters needed to use API are presents
	         * @returns {boolean}
	         * @private
	         */
	        _checkAvailability: function () {

	            var self = jsxc.rest.openfire;

	            if (self.apiBaseUrl === "") {
	                jsxc.warn("Rest api not available: no base url found");
	                return false;
	            }
	            if (self.apiKey === "") {
	                jsxc.warn("Rest api not available: no api key found");
	                return false;
	            }

	            return true;
	        },

	        /**
	         * Create an user and return a JQuery promise.
	         *
	         * User login will be in lower case.
	         *
	         * Errors:
	         * 409: user exist
	         * 500: invalid username
	         *
	         * @param userJid
	         * @returns {*}
	         */
	        createUser: function (userNode) {

	            var self = jsxc.rest.openfire;
	            if (self._checkAvailability() !== true) {

	                var falsePromise = $.Deferred().promise();
	                falsePromise.fail("Openfire REST API unavailable");

	                return falsePromise;
	            }

	            return self._asyncRequest(
	                'POST',
	                "/users",
	                {
	                    username: userNode.toLowerCase(),
	                    password: "azerty",
	                }
	            );

	        },

	        /**
	         *
	         * Utils to do async REST requests
	         *
	         *
	         */
	        _asyncRequest: function (type, url, data, headers) {

	            var self = jsxc.rest.openfire;

	            if (typeof type === "undefined") {
	                throw new Error("Parameter cannot be undefined: " + type);
	            }
	            if (typeof url === "undefined") {
	                throw new Error("Parameter cannot be undefined: " + url);
	            }

	            var restUrl = self.apiBaseUrl + url;

	            var req = {
	                url: restUrl,
	                type: type,
	                dataType: "json",
	                headers: {
	                    "Authorization": self.apiKey,
	                    "Content-Type": "application/json"
	                }
	            };

	            // ajouter des données si necessaire
	            if (typeof data !== "undefined") {
	                req.data = JSON.stringify(data);
	            }

	            // ajouter entetes si necessaire
	            if (typeof headers !== "undefined") {
	                $.extend(req.headers, headers);
	            }

	            return $.ajax(req);

	        }

	    }

	};

	/**
	 *
	 * Statistic module. Can log events or more complex datas to a distant server
	 *
	 * ** All datas are strictly anonymous
	 *
	 * @type {{_statsManager: null, _init: jsxc.stats._init, addEvent: jsxc.stats.addEvent,
	 *     addLogEntry: jsxc.stats.addLogEntry}}
	 */

	jsxc.stats = {

	  _statsManager : null,

	  _statsOptions : null,

	  /**
	   * Speial log function because logs can comes eralier than initialisation
	   * @param message
	   * @param data
	   * @param level
	   * @private
	   */
	  _log : function(message, data, level) {

	    level = (level || 'ERROR').toUpperCase().trim();

	    var prefix = level + " [JSXC/Stats] ";

	    if (level === 'ERROR') {
	      console.error(prefix + message, data);
	    }

	    else {
	      console.log(prefix + message, data);
	    }

	  },

	  init : function() {

	    var self = jsxc.stats;

	    /**
	     * Initialize stat module
	     * @type {default}
	     */
	    self._statsOptions = jsxc.options.get("stats");
	    if (self._statsOptions && self._statsOptions.enabled) {

	      self._statsManager = __webpack_require__(3)({

	        debug : false,

	        destinationUrl : self._statsOptions.destinationUrl,

	        authorization : self._statsOptions.authorization,

	        interval : 5000,

	        autosend : true

	      });

	      console.info("Some anonymous data are collected to improve user experience.");
	      console.info("Data availables at: " + self._statsOptions.destinationUrl + "/visualization/");
	      console.info("Anonymous session id: " + self._statsManager.sessionId);

	      // test destination once, after page load
	      setTimeout(function(){
	        $.get(jsxc.options.get("stats").destinationUrl + "/visualization/").fail(function() {
	          jsxc.error('Stats destination URL is unreachable');
	        });
	      }, 1000);

	    }

	  },

	  addEvent : function(event, data) {

	    var self = jsxc.stats;

	    if (self._statsManager === null) {
	      // self._log("Try to add datas while not initailized: ", {_statManager: self._statsManager});
	      return;
	    }

	    if (!self._statsOptions || self._statsOptions.enabled !== true) {
	      return;
	    }

	    self._statsManager.addEvent(event, data);

	  },

	  addLogEntry : function(text, level, data) {

	    var self = jsxc.stats;

	    level = (level || 'INFO').trim().toUpperCase();

	    if (self._statsManager === null) {
	      // self._log("Try to add datas while not initailized: ", {_statManager: self._statsManager});
	      return;
	    }

	    if (!self._statsOptions || self._statsOptions.enabled !== true) {
	      return;
	    }

	    // add only interresting level to Stats
	    if (self._statsOptions.sentLogLevels.indexOf(level) !== -1) {
	      self._statsManager.addLogEntry(text, level, data);
	    }

	  }

	};


	/**
	 * Handle long-live data
	 *
	 * @namespace jsxc.storage
	 */
	jsxc.storage = {
	    /**
	     * Prefix for localstorage
	     *
	     * @privat
	     */
	    PREFIX: 'jsxc',

	    SEP: ':',

	    /**
	     * @param {type} uk Should we generate a user prefix?
	     * @returns {String} prefix
	     * @memberOf jsxc.storage
	     */
	    getPrefix: function (uk) {
	        var self = jsxc.storage;

	        if (uk && !jsxc.bid) {
	            jsxc.error('Unable to create user prefix', new Error());
	        }

	        return self.PREFIX + self.SEP + ((uk && jsxc.bid) ? jsxc.bid + self.SEP : '');
	    },

	    /**
	     * Save item to storage
	     *
	     * @function
	     * @param {String} key variablename
	     * @param {Object} value value
	     * @param {String} uk Userkey? Should we add the bid as prefix?
	     */
	    setItem: function (key, value, uk) {

	        // Workaround for non-conform browser
	        if (jsxc.storageNotConform > 0 && key !== 'rid') {
	            if (jsxc.storageNotConform > 1 && jsxc.toSNC === null) {
	                jsxc.toSNC = window.setTimeout(function () {
	                    jsxc.storageNotConform = 0;
	                    jsxc.storage.setItem('storageNotConform', 0);
	                }, 1000);
	            }

	            jsxc.ls.push(JSON.stringify({
	                key: key,
	                value: value
	            }));
	        }

	        if (typeof(value) === 'object') {
	            // exclude jquery objects, because otherwise safari will fail
	            value = JSON.stringify(value, function (key, val) {
	                if (!(val instanceof jQuery)) {
	                    return val;
	                }
	            });
	        }

	        localStorage.setItem(jsxc.storage.getPrefix(uk) + key, value);

	    },

	    setUserItem: function (type, key, value) {
	        var self = jsxc.storage;

	        if (arguments.length === 2) {
	            value = key;
	            key = type;
	            type = '';
	        } else if (arguments.length === 3) {
	            key = type + self.SEP + key;
	        }

	        return jsxc.storage.setItem(key, value, true);
	    },

	    /**
	     * Load item from storage
	     *
	     * @function
	     * @param {String} key variablename
	     * @param {String} uk Userkey? Should we add the bid as prefix?
	     */
	    getItem: function (key, uk) {

	        key = jsxc.storage.getPrefix(uk) + key;

	        var value = localStorage.getItem(key);
	        try {
	            return JSON.parse(value);
	        } catch (e) {
	            return value;
	        }

	    },

	    /**
	     * Get a user item from storage.
	     *
	     * @param key
	     * @returns user item
	     */
	    getUserItem: function (type, key) {
	        var self = jsxc.storage;

	        if (arguments.length === 1) {
	            key = type;
	        } else if (arguments.length === 2) {
	            key = type + self.SEP + key;
	        }

	        return jsxc.storage.getItem(key, true);
	    },

	    /**
	     * Remove item from storage
	     *
	     * @function
	     * @param {String} key variablename
	     * @param {String} uk Userkey? Should we add the bid as prefix?
	     */
	    removeItem: function (key, uk) {

	        // Workaround for non-conforming browser
	        if (jsxc.storageNotConform && key !== 'rid') {
	            jsxc.ls.push(JSON.stringify({
	                key: jsxc.storage.prefix + key,
	                value: ''
	            }));
	        }

	        localStorage.removeItem(jsxc.storage.getPrefix(uk) + key);
	    },

	    /**
	     * Remove user item from storage.
	     *
	     * @param key
	     */
	    removeUserItem: function (type, key) {
	        var self = jsxc.storage;

	        if (arguments.length === 1) {
	            key = type;
	        } else if (arguments.length === 2) {
	            key = type + self.SEP + key;
	        }

	        jsxc.storage.removeItem(key, true);
	    },

	    /**
	     * Updates value of a variable in a saved object.
	     *
	     * @function
	     * @param {String} key variablename
	     * @param {String|object} variable variablename in object or object with
	     *        variable/key pairs
	     * @param {Object} [value] value
	     * @param {String} uk Userkey? Should we add the bid as prefix?
	     */
	    updateItem: function (key, variable, value, uk) {

	        var data = jsxc.storage.getItem(key, uk) || {};

	        if (typeof(variable) === 'object') {

	            $.each(variable, function (key, val) {
	                if (typeof(data[key]) === 'undefined') {
	                    jsxc.debug('Variable ' + key + ' doesn\'t exist in ' + variable + '. It was created.');
	                }

	                data[key] = val;
	            });
	        } else {
	            if (typeof(data[variable]) === 'undefined') {
	                jsxc.debug('Variable ' + variable + ' doesn\'t exist. It was created.');
	            }

	            data[variable] = value;
	        }

	        jsxc.storage.setItem(key, data, uk);
	    },

	    /**
	     * Updates value of a variable in a saved user object.
	     *
	     * @param {String} type variable type (a prefix)
	     * @param {String} key variable name
	     * @param {String|object} variable variable name in object or object with
	     *        variable/key pairs
	     * @param {Object} [value] value (not used if the variable was an object)
	     */
	    updateUserItem: function (type, key, variable, value) {
	        var self = jsxc.storage;

	        if (arguments.length === 4 || (arguments.length === 3 && typeof variable === 'object')) {
	            key = type + self.SEP + key;
	        } else {
	            value = variable;
	            variable = key;
	            key = type;
	        }

	        return jsxc.storage.updateItem(key, variable, value, true);
	    },

	    /**
	     * Increments value
	     *
	     * @function
	     * @param {String} key variablename
	     * @param {String} uk Userkey? Should we add the bid as prefix?
	     */
	    ink: function (key, uk) {

	        jsxc.storage.setItem(key, Number(jsxc.storage.getItem(key, uk)) + 1, uk);
	    },

	    /**
	     * Remove element from array or object
	     *
	     * @param {string} key name of array or object
	     * @param {string} name name of element in array or object
	     * @param {String} uk Userkey? Should we add the bid as prefix?
	     * @returns {undefined}
	     */
	    removeElement: function (key, name, uk) {
	        var item = jsxc.storage.getItem(key, uk);

	        if ($.isArray(item)) {
	            item = $.grep(item, function (e) {
	                return e !== name;
	            });
	        } else if (typeof(item) === 'object' && item !== null) {
	            delete item[name];
	        }

	        jsxc.storage.setItem(key, item, uk);
	    },

	    removeUserElement: function (type, key, name) {
	        var self = jsxc.storage;

	        if (arguments.length === 2) {
	            name = key;
	            key = type;
	        } else if (arguments.length === 3) {
	            key = type + self.SEP + key;
	        }

	        return jsxc.storage.removeElement(key, name, true);
	    },

	    /**
	     * Triggered if changes are recognized
	     *
	     * @function
	     * @param {event} e Storage event
	     * @param {String} e.key Key name which triggered event
	     * @param {Object} e.oldValue Old Value for key
	     * @param {Object} e.newValue New Value for key
	     * @param {String} e.url
	     */
	    onStorage: function (e) {

	        // skip
	        if (e.key === jsxc.storage.PREFIX + jsxc.storage.SEP + 'rid') {
	            return;
	        }

	        var re = new RegExp('^' + jsxc.storage.PREFIX + jsxc.storage.SEP + '(?:[^' + jsxc.storage.SEP + ']+@[^' + jsxc.storage.SEP + ']+' + jsxc.storage.SEP + ')?(.*)', 'i');
	        var key = e.key.replace(re, '$1');

	        // Workaround for non-conforming browser, which trigger
	        // events on every page (notably IE): Ignore own writes
	        // (own)
	        if (jsxc.storageNotConform > 0 && jsxc.ls.length > 0) {

	            var val = e.newValue;
	            try {
	                val = JSON.parse(val);
	            } catch (err) {
	            }

	            var index = $.inArray(JSON.stringify({
	                key: key,
	                value: val
	            }), jsxc.ls);

	            if (index >= 0) {

	                // confirm that the storage event is not fired regularly
	                if (jsxc.storageNotConform > 1) {
	                    window.clearTimeout(jsxc.toSNC);
	                    jsxc.storageNotConform = 1;
	                    jsxc.storage.setItem('storageNotConform', 1);
	                }

	                jsxc.ls.splice(index, 1);
	                return;
	            }
	        }

	        // Workaround for non-conforming browser
	        if (e.oldValue === e.newValue) {
	            return;
	        }

	        var n, o;
	        var bid = key.replace(new RegExp('[^' + jsxc.storage.SEP + ']+' + jsxc.storage.SEP + '(.*)', 'i'), '$1');

	        // react if someone asks whether there is a master
	        if (jsxc.master && key === 'alive') {
	            jsxc.debug('Master request.');

	            jsxc.storage.ink('alive');
	            return;
	        }

	        // master alive
	        if (!jsxc.master && (key === 'alive' || key === 'alive_busy')) {

	            // reset timeouts
	            jsxc.to = $.grep(jsxc.to, function (timeout) {
	                window.clearTimeout(timeout);

	                return false;
	            });
	            jsxc.to.push(window.setTimeout(jsxc.checkMaster, ((key === 'alive') ? jsxc.options.timeout : jsxc.options.busyTimeout) + jsxc.random(60)));

	            // only call the first time
	            if (!jsxc.role_allocation) {
	                jsxc.onSlave();
	            }

	            return;
	        }

	        if (key.match(/^notices/)) {
	            jsxc.notice.load();
	        }

	        if (key.match(/^presence/)) {
	            jsxc.xmpp.changeOwnPresence(e.newValue, true);
	        }

	        if (key.match(/^options/) && e.newValue) {
	            n = JSON.parse(e.newValue);

	            if (typeof n.muteNotification !== 'undefined' && n.muteNotification) {
	                jsxc.notification.muteSound(true);
	            } else {
	                jsxc.notification.unmuteSound(true);
	            }
	        }

	        if (key.match(/^hidden/)) {
	            if (jsxc.master) {
	                clearTimeout(jsxc.toNotification);
	            } else {
	                jsxc.isHidden();
	            }
	        }

	        if (key.match(/^focus/)) {
	            if (jsxc.master) {
	                clearTimeout(jsxc.toNotification);
	            } else {
	                jsxc.hasFocus();
	            }
	        }

	        if (key.match(new RegExp('^history' + jsxc.storage.SEP))) {

	            var history = JSON.parse(e.newValue);
	            var uid, el, message;

	            while (history.length > 0) {
	                uid = history.pop();

	                message = new jsxc.Message(uid);
	                el = message.getDOM();

	                if (el.length === 0) {
	                    if (jsxc.master && message.direction === jsxc.Message.OUT) {
	                        jsxc.xmpp.sendMessage(message.bid, message.msg, message._uid);
	                    }

	                    jsxc.gui.window._postMessage(message, true);
	                } else if (message.isReceived()) {
	                    el.addClass('jsxc_received');
	                }
	            }
	            return;
	        }

	        if (key.match(new RegExp('^window' + jsxc.storage.SEP))) {

	            if (!e.newValue) {
	                jsxc.gui.window._close(bid);
	                return;
	            }

	            if (!e.oldValue) {
	                jsxc.gui.window.open(bid);
	                return;
	            }

	            n = JSON.parse(e.newValue);
	            o = JSON.parse(e.oldValue);

	            if (n.minimize !== o.minimize) {
	                if (n.minimize) {
	                    jsxc.gui.window._hide(bid);
	                } else {
	                    jsxc.gui.window._show(bid);
	                }
	            }

	            jsxc.gui.window.setText(bid, n.text);

	            if (n.unread !== o.unread) {
	                if (n.unread === 0) {
	                    jsxc.gui.readMsg(bid);
	                } else {
	                    jsxc.gui._unreadMsg(bid, n.unread);
	                }
	            }

	            return;
	        }

	        if (key.match(/^unreadMsg/) && jsxc.gui.favicon) {
	            jsxc.gui.favicon.badge(parseInt(e.newValue) || 0);
	        }

	        if (key.match(new RegExp('^smp' + jsxc.storage.SEP))) {

	            if (!e.newValue) {

	                jsxc.gui.dialog.close('smp');
	                jsxc.gui.window.hideOverlay(bid);

	                if (jsxc.master) {
	                    jsxc.otr.objects[bid].sm.abort();
	                }

	                return;
	            }

	            n = JSON.parse(e.newValue);

	            if (typeof(n.data) !== 'undefined') {

	                jsxc.gui.window.smpRequest(bid, n.data);

	            } else if (jsxc.master && n.sec) {
	                jsxc.gui.dialog.close('smp');
	                jsxc.gui.window.hideOverlay(bid);

	                jsxc.otr.sendSmpReq(bid, n.sec, n.quest);
	            }
	        }

	        if (!jsxc.master && key.match(new RegExp('^buddy' + jsxc.storage.SEP))) {

	            if (!e.newValue) {
	                jsxc.gui.roster.purge(bid);
	                return;
	            }
	            if (!e.oldValue) {
	                jsxc.gui.roster.add(bid);
	                return;
	            }

	            n = JSON.parse(e.newValue);
	            o = JSON.parse(e.oldValue);

	            jsxc.gui.update(bid);

	            if (o.status !== n.status || o.sub !== n.sub) {
	                jsxc.gui.roster.reorder(bid);
	            }
	        }

	        if (jsxc.master && key.match(new RegExp('^deletebuddy' + jsxc.storage.SEP)) && e.newValue) {
	            n = JSON.parse(e.newValue);

	            jsxc.xmpp.removeBuddy(n.jid);
	            jsxc.storage.removeUserItem(key);
	        }

	        if (jsxc.master && key.match(new RegExp('^buddy' + jsxc.storage.SEP))) {

	            n = JSON.parse(e.newValue);
	            o = JSON.parse(e.oldValue);

	            if (o.transferReq !== n.transferReq) {
	                jsxc.storage.updateUserItem('buddy', bid, 'transferReq', -1);

	                if (n.transferReq === 0) {
	                    jsxc.otr.goPlain(bid);
	                }
	                if (n.transferReq === 1) {
	                    jsxc.otr.goEncrypt(bid);
	                }
	            }

	            if (o.name !== n.name) {
	                jsxc.gui.roster._rename(bid, n.name);
	            }
	        }

	        // logout
	        if (key === 'sid') {
	            if (!e.newValue) {
	                jsxc.xmpp.logout();
	            }
	            return;
	        }

	        if (key === 'friendReq') {
	            n = JSON.parse(e.newValue);

	            if (jsxc.master && n.approve >= 0) {
	                jsxc.xmpp.resFriendReq(n.jid, n.approve);
	            }
	        }

	        if (jsxc.master && key.match(new RegExp('^add' + jsxc.storage.SEP))) {
	            n = JSON.parse(e.newValue);

	            jsxc.xmpp.addBuddy(n.username, n.alias);
	        }

	        if (jsxc.master && key.match(new RegExp('^vcard' + jsxc.storage.SEP)) && e.newValue !== null && e.newValue.match(/^request:/)) {

	            jsxc.xmpp.loadVcard(bid, function (stanza) {
	                jsxc.storage.setUserItem('vcard', bid, {
	                    state: 'success',
	                    data: $('<div>').append(stanza).html()
	                });
	            }, function () {
	                jsxc.storage.setUserItem('vcard', bid, {
	                    state: 'error'
	                });
	            });
	        }

	        if (!jsxc.master && key.match(new RegExp('^vcard' + jsxc.storage.SEP)) && e.newValue !== null && !e.newValue.match(/^request:/)) {
	            n = JSON.parse(e.newValue);

	            if (typeof n.state !== 'undefined') {
	                $(document).trigger('loaded.vcard.jsxc', n);
	            }

	            jsxc.storage.removeUserItem('vcard', bid);
	        }
	    },

	    /**
	     * Save or update buddy data.
	     *
	     * @memberOf jsxc.storage
	     * @param bid
	     * @param data
	     * @returns {String} Updated or created
	     */
	    saveBuddy: function (bid, data) {

	        if (jsxc.storage.getUserItem('buddy', bid)) {
	            jsxc.storage.updateUserItem('buddy', bid, data);

	            return 'updated';
	        }

	        jsxc.storage.setUserItem('buddy', bid, $.extend({
	            jid: '',
	            name: '',
	            status: 0,
	            sub: 'none',
	            msgstate: 0,
	            transferReq: -1,
	            trust: false,
	            res: [],
	            type: 'chat'
	        }, data));

	        return 'created';
	    },

	    /**
	     * Return an array of buddies (bare JIDs)
	     * 
	     * <p> /!\ Some JIDs may not be really buddy (no presence suscribing, ...)
	     * 
	     */
	    getLocaleBuddyListBJID: function () {

	        var output = [];

	        $.each(jsxc.storage.getUserItem('buddylist') || [], function (index, item) {
	            output.push(jsxc.jidToBid(item));
	        });

	        return output;
	    }
	};

	/**
	 *
	 * Unit testing module of JSXC
	 *
	 *
	 * @type {{_showTestBox: jsxc.test._showTestBox}}
	 */

	jsxc.tests = {

	  isTestEnabled : function() {
	    return window.location.hostname === "127.0.0.1";
	  },

	  /**
	   * Run tests. Tests run only if we are on localhost to avoid to many long time loading.
	   * @param tests
	   */
	  runTests : function(tests) {

	    var self = jsxc.tests;

	    // run test only if we are on local host
	    if (self.isTestEnabled() !== true) {
	      return false;
	    }

	    $.each(tests, function(index, element) {
	      QUnit.test(element.name, element.testCase);
	    });

	    return true;
	  },

	  _addTestBox : function() {

	    $('body').prepend(
	        '<div class="jsxc_testBox"><div id="qunit"></div><div id="qunit-fixture"></div></div>');

	  },

	  showTestBox : function() {
	    $('.jsxc_testBox').css("display", "block");
	  }

	};

	$(function() {

	  // Disabled
	  // if (jsxc.tests.isTestEnabled() === true) {
	  //
	  //   jsxc.tests._addTestBox();
	  //
	  //   jsxc.tests.showTestBox();
	  //
	  // }

	});
	/**
	 * Load and save bookmarks according to XEP-0048.
	 *
	 * @namespace jsxc.xmpp.bookmarks
	 */
	jsxc.xmpp.bookmarks = {};

	/**
	 * Determines if server is able to store bookmarks.
	 *
	 * @return {boolean} True: Server supports bookmark storage
	 */
	jsxc.xmpp.bookmarks.remote = function () {

	    // here caps doesn't work properly, issue in progress

	    return jsxc.xmpp.conn.caps && jsxc.xmpp.hasFeatureByJid(jsxc.xmpp.conn.domain, Strophe.NS.PUBSUB + "#publish");
	};

	/**
	 * Load bookmarks from pubsub.
	 *
	 * @memberOf jsxc.xmpp.bookmarks
	 */
	jsxc.xmpp.bookmarks.load = function () {

	    // remote() arent't working correctly.
	    // and bookmarks have to be loaded at every startup from server

	    /**

	     var caps = jsxc.xmpp.conn.caps;
	     var ver = caps._jidVerIndex[jsxc.xmpp.conn.domain];

	     if (!ver || !caps._knownCapabilities[ver]) {
	        // wait until we know server capabilities
	        $(document).on('caps.strophe', function(ev, from) {
	            if (from === jsxc.xmpp.conn.domain) {
	                jsxc.xmpp.bookmarks.load();

	                $(document).off(ev);
	            }
	        });
	    }

	     if (jsxc.xmpp.bookmarks.remote()) {
	        jsxc.xmpp.bookmarks.loadFromRemote();
	    } else {
	        jsxc.xmpp.bookmarks.loadFromLocal();
	    }
	     */

	    jsxc.xmpp.bookmarks.loadFromRemote();
	};

	/**
	 * Load bookmarks from local storage.
	 *
	 * @private
	 */
	jsxc.xmpp.bookmarks.loadFromLocal = function () {
	    jsxc.debug('Load bookmarks from local storage');

	    var bookmarks = jsxc.storage.getUserItem('bookmarks') || [];
	    var bl = jsxc.storage.getUserItem('buddylist') || [];

	    $.each(bookmarks, function () {
	        var room = this;
	        var roomdata = jsxc.storage.getUserItem('buddy', room) || {};

	        bl.push(room);
	        jsxc.gui.roster.add(room);

	        if (roomdata.autojoin) {
	            jsxc.debug('auto join ' + room);
	            jsxc.xmpp.conn.muc.join(room, roomdata.nickname);
	        }
	    });

	    jsxc.storage.setUserItem('buddylist', bl);
	};

	/**
	 * Load bookmarks from remote storage.
	 *
	 * @private
	 */
	jsxc.xmpp.bookmarks.loadFromRemote = function () {
	    jsxc.debug('Load bookmarks from pubsub');

	    var bookmarks = jsxc.xmpp.conn.bookmarks;

	    bookmarks.get(function (stanza) {
	        var bl = jsxc.storage.getUserItem('buddylist');

	        $(stanza).find('conference').each(function () {
	            var conference = $(this);
	            var room = conference.attr('jid');
	            var roomName = conference.attr('name') || room;
	            var autojoin = conference.attr('autojoin') || false;
	            var nickname = conference.find('nick').text();
	            nickname = (nickname.length > 0) ? nickname : Strophe.getNodeFromJid(jsxc.xmpp.conn.jid);

	            if (autojoin === 'true') {
	                autojoin = true;
	            } else if (autojoin === 'false') {
	                autojoin = false;
	            }

	            var data = jsxc.storage.getUserItem('buddy', room) || {};

	            data = $.extend(data, {
	                jid: room,
	                name: roomName,
	                sub: 'both',
	                status: 0,
	                type: 'groupchat',
	                state: jsxc.muc.CONST.ROOMSTATE.INIT,
	                subject: null,
	                bookmarked: true,
	                autojoin: autojoin,
	                nickname: nickname
	            });

	            jsxc.storage.setUserItem('buddy', room, data);

	            bl.push(room);
	            jsxc.gui.roster.add(room);

	            if (autojoin) {
	                jsxc.debug('auto join ' + room);
	                jsxc.xmpp.conn.muc.join(room, nickname);
	            }
	        });

	        jsxc.storage.setUserItem('buddylist', bl);
	    }, function (stanza) {
	        var err = jsxc.xmpp.bookmarks.parseErr(stanza);

	        if (err.reasons[0] === 'item-not-found') {
	            jsxc.debug('create bookmark node');

	            bookmarks.createBookmarksNode();
	        } else {
	            jsxc.debug('[XMPP] Could not create bookmark: ' + err.type, err.reasons);
	        }
	    });
	};

	/**
	 * Parse received error.
	 *
	 * @param  {string} stanza
	 * @return {object} err - The parsed error
	 * @return {string} err.type - XMPP error type
	 * @return {array} err.reasons - Array of error reasons
	 */
	jsxc.xmpp.bookmarks.parseErr = function (stanza) {
	    var error = $(stanza).find('error');
	    var type = error.attr('type');
	    var reasons = error.children().map(function () {
	        return $(this).prop('tagName');
	    });

	    return {
	        type: type,
	        reasons: reasons
	    };
	};

	/**
	 * Deletes the bookmark for the given room and removes it from the roster if soft is false.
	 *
	 * @param  {string} room - room jid
	 * @param  {boolean} [soft=false] - True: leave room in roster
	 */
	jsxc.xmpp.bookmarks.delete = function (room, soft) {

	    if (!soft) {
	        jsxc.gui.roster.purge(room);
	    }

	    // remote doesnt work properly

	    jsxc.xmpp.bookmarks.deleteFromRemote(room, soft);

	    // if (jsxc.xmpp.bookmarks.remote()) {
	    //     jsxc.xmpp.bookmarks.deleteFromRemote(room, soft);
	    // } else {
	    //     jsxc.xmpp.bookmarks.deleteFromLocal(room, soft);
	    // }
	};

	/**
	 * Delete bookmark from remote storage.
	 *
	 * @private
	 * @param  {string} room - room jid
	 * @param  {boolean} [soft=false] - True: leave room in roster
	 */
	jsxc.xmpp.bookmarks.deleteFromRemote = function (room, soft) {
	    var bookmarks = jsxc.xmpp.conn.bookmarks;

	    bookmarks.delete(room, function () {
	        jsxc.debug('Bookmark deleted ' + room);

	        if (soft) {
	            jsxc.gui.roster.getItem(room).removeClass('jsxc_bookmarked');
	            jsxc.storage.updateUserItem('buddy', room, 'bookmarked', false);
	            jsxc.storage.updateUserItem('buddy', room, 'autojoin', false);
	        }
	    }, function (stanza) {
	        var err = jsxc.xmpp.bookmarks.parseErr(stanza);

	        jsxc.debug('[XMPP] Could not delete bookmark: ' + err.type, err.reasons);
	    });
	};

	/**
	 * Delete bookmark from local storage.
	 *
	 * @private
	 * @param  {string} room - room jid
	 * @param  {boolean} [soft=false] - True: leave room in roster
	 */
	jsxc.xmpp.bookmarks.deleteFromLocal = function (room, soft) {
	    var bookmarks = jsxc.storage.getUserItem('bookmarks');
	    var index = bookmarks.indexOf(room);

	    if (index > -1) {
	        bookmarks.splice(index, 1);
	    }

	    jsxc.storage.setUserItem('bookmarks', bookmarks);

	    if (soft) {
	        jsxc.gui.roster.getItem(room).removeClass('jsxc_bookmarked');
	        jsxc.storage.updateUserItem('buddy', room, 'bookmarked', false);
	        jsxc.storage.updateUserItem('buddy', room, 'autojoin', false);
	    }
	};

	/**
	 * Adds or overwrites bookmark for given room.
	 *
	 * @param  {string} room - room jid
	 * @param  {string} alias - room alias
	 * @param  {string} nick - preferred user nickname
	 * @param  {boolean} autojoin - should we join this room after login?
	 */
	jsxc.xmpp.bookmarks.add = function (room, alias, nick, autojoin) {

	    // remote doesn't work properly

	    jsxc.xmpp.bookmarks.addToRemote(room, alias, nick, autojoin);

	    // if (jsxc.xmpp.bookmarks.remote()) {
	    //     jsxc.xmpp.bookmarks.addToRemote(room, alias, nick, autojoin);
	    // } else {
	    //     jsxc.xmpp.bookmarks.addToLocal(room, alias, nick, autojoin);
	    // }
	};

	/**
	 * Adds or overwrites bookmark for given room in remote storage.
	 *
	 * @private
	 * @param  {string} room - room jid
	 * @param  {string} alias - room alias
	 * @param  {string} nick - preferred user nickname
	 * @param  {boolean} autojoin - should we join this room after login?
	 */
	jsxc.xmpp.bookmarks.addToRemote = function (room, alias, nick, autojoin) {
	    var bookmarks = jsxc.xmpp.conn.bookmarks;

	    var success = function () {
	        jsxc.debug('New bookmark created', room);

	        jsxc.gui.roster.getItem(room).addClass('jsxc_bookmarked');
	        jsxc.storage.updateUserItem('buddy', room, 'bookmarked', true);
	        jsxc.storage.updateUserItem('buddy', room, 'autojoin', autojoin);
	        jsxc.storage.updateUserItem('buddy', room, 'nickname', nick);
	    };
	    var error = function () {
	        jsxc.warn('Could not create bookmark', room);
	    };

	    bookmarks.add(room, alias, nick, autojoin, success, error);
	};

	/**
	 * Adds or overwrites bookmark for given room in local storage.
	 *
	 * @private
	 * @param  {string} room - room jid
	 * @param  {string} alias - room alias
	 * @param  {string} nick - preferred user nickname
	 * @param  {boolean} autojoin - should we join this room after login?
	 */
	jsxc.xmpp.bookmarks.addToLocal = function (room, alias, nick, autojoin) {
	    jsxc.gui.roster.getItem(room).addClass('jsxc_bookmarked');
	    jsxc.storage.updateUserItem('buddy', room, 'bookmarked', true);
	    jsxc.storage.updateUserItem('buddy', room, 'autojoin', autojoin);
	    jsxc.storage.updateUserItem('buddy', room, 'nickname', nick);

	    var bookmarks = jsxc.storage.getUserItem('bookmarks') || [];

	    if (bookmarks.indexOf(room) < 0) {
	        bookmarks.push(room);

	        jsxc.storage.setUserItem('bookmarks', bookmarks);
	    }
	};

	/**
	 * Show dialog to edit bookmark.
	 *
	 * @param  {string} room - room jid
	 */
	jsxc.xmpp.bookmarks.showDialog = function (room) {
	    var dialog = jsxc.gui.dialog.open(jsxc.gui.template.get('bookmarkDialog'));
	    var data = jsxc.storage.getUserItem('buddy', room);

	    $('#jsxc_room').val(room);
	    $('#jsxc_nickname').val(data.nickname);

	    $('#jsxc_bookmark').change(function () {
	        if ($(this).prop('checked')) {
	            $('#jsxc_nickname').prop('disabled', false);
	            $('#jsxc_autojoin').prop('disabled', false);
	            $('#jsxc_autojoin').parent('.checkbox').removeClass('disabled');
	        } else {
	            $('#jsxc_nickname').prop('disabled', true);
	            $('#jsxc_autojoin').prop('disabled', true).prop('checked', false);
	            $('#jsxc_autojoin').parent('.checkbox').addClass('disabled');
	        }
	    });

	    $('#jsxc_bookmark').prop('checked', data.bookmarked);
	    $('#jsxc_autojoin').prop('checked', data.autojoin);

	    $('#jsxc_bookmark').change();

	    dialog.find('form').submit(function (ev) {
	        ev.preventDefault();

	        var bookmarked = $('#jsxc_bookmark').prop('checked');
	        var autojoin = $('#jsxc_autojoin').prop('checked');
	        var nickname = $('#jsxc_nickname').val();

	        if (bookmarked) {
	            jsxc.xmpp.bookmarks.add(room, data.name, nickname, autojoin);
	        } else if (data.bookmarked) {
	            // bookmarked === false
	            jsxc.xmpp.bookmarks.delete(room, true);
	        }

	        jsxc.gui.dialog.close();

	        return false;
	    });
	};
	/**
	 * Implements user search (XEP 0055)
	 *
	 * @memberOf jsxc.xmpp
	 */
	jsxc.xmpp.search = {

	  /**
	   * Where connection is stored
	   *
	   */
	  conn : null,

	  /**
	   * Domain for search. If not set at init{xmpp:{...}} domain will be used
	   *
	   */
	  searchDomain : null,

	  /**
	   * True if user search is available, but will be set only after connection
	   */
	  userSearchAvailable : false,

	  /**
	   * Initialize search functionnalities
	   */
	  init : function() {

	    var self = jsxc.xmpp.search;

	    // shortcut
	    self.conn = jsxc.xmpp.conn;

	    // retrieve XMPP search domain
	    var xmppOpts = jsxc.options.get("xmpp");
	    self.searchDomain = xmppOpts.searchDomain;

	    if (typeof self.searchDomain === "undefined") {
	      self.searchDomain = xmppOpts.domain;
	      jsxc.warn('Search domain not found, domain will be used', xmppOpts.domain);
	    }

	    // first request to know if search is available
	    self.requestForSearchCapabilities()

	        .then(function() {
	          jsxc.debug("XMPP search available");
	        })
	        .fail(function() {
	          jsxc.warn("XMPP search unavailable");
	        });

	    // set user cache
	    // self.getUserList();

	  },

	  /**
	   * Cache for searchs
	   */
	  _searchDefers : {},

	  /**
	   * Search terms to get all users
	   */
	  _allUserTerms : "*",

	  /**
	   * Check an array of users and add a field "_is_buddy" to each user.
	   *
	   * <p>/!\ Work directly on the array
	   *
	   * @param userArr
	   * @returns {*}
	   */
	  _checkIfBuddies : function(userArr) {

	    // list of buddies to check
	    var buddies = jsxc.storage.getLocaleBuddyListBJID();

	    $.each(userArr, function(i, e) {
	      // check if is a buddy
	      e["_is_buddy"] = buddies.indexOf(jsxc.jidToBid(e.jid)) !== -1;
	    });

	    return userArr;
	  },

	  /**
	   * Return a promise containing all users in an array or an empty array
	   *
	   * <p> Response is stored in cache
	   *
	   * <p> Each entry of the array contains:
	   * mail, jid, name, username, _is_buddy
	   *
	   */
	  getUserList : function() {

	    var self = jsxc.xmpp.search;

	    // search users
	    return self.searchUsers(self._allUserTerms)

	        .then(function(result) {

	          // here buddies are checked by search function
	          return JSON.parse(JSON.stringify(result));

	        });

	  },

	  /**
	   * Get new user list
	   *
	   * @returns {*}
	   */
	  getFreshUserList : function() {

	    var self = jsxc.xmpp.search;

	    delete self._searchDefers[self._allUserTerms];

	    return self.getUserList();
	  },

	  /**
	   * Return a promise containing all users corresponding to "terms" in an array or an empty array
	   *
	   * <p>Wildcards "*" are allowed
	   *
	   * <p>Each entry of the array contains:
	   * mail, jid, name, username, _is_buddy
	   *
	   */
	  searchUsers : function(terms) {

	    var self = jsxc.xmpp.search;

	    jsxc.stats.addEvent('jsxc.search.users');

	    if (!self.conn || self.conn.connected !== true) {
	      jsxc.warn("Search not available: not connected");
	      return $.Deferred().promise().fail("Not connected");
	    }

	    // request have already done
	    if (self._searchDefers[terms]) {
	      jsxc.debug("Search: return cached request");
	      return self._searchDefers[terms].promise();
	    }

	    // send XMPP request to get all users
	    var iq = $iq({
	      type : 'set', to : self.searchDomain
	    })
	        .c('query', {xmlns : 'jabber:iq:search'})
	        .c('x', {xmlns : 'jabber:x:data', type : 'submit'})
	        .c('field', {type : 'hidden', var : 'FORM_TYPE'})
	        .c('value', 'jabber:iq:search').up().up()
	        .c('field', {var : 'search', type : "text-single"})
	        .c('value', terms).up().up()
	        .c('field', {var : 'Username', type : "boolean"})
	        .c('value', '1').up().up()
	        .c('field', {var : 'Name', type : "boolean"})
	        .c('value', '1').up().up();

	    // response in a promise
	    self._searchDefers[terms] = $.Deferred();
	    var defer = self._searchDefers[terms];

	    // send request after regitered handler
	    self.conn.sendIQ(iq,

	        // successful request
	        function(stanza) {

	          jsxc.debug("Search: return fresh request");

	          // error while retieving users
	          if ($(stanza).find("error").length > 0) {

	            defer.reject(stanza);

	            // remove handler when finished
	            return false;
	          }

	          // browse items and create result list
	          var result = [];
	          $(stanza).find("item").each(function() {

	            var r = {};

	            // browse fields and get values
	            $(this).find("field").each(function() {
	              r[$(this).attr("var").toLowerCase()] = $(this).text();
	            });

	            result.push(r);

	          });

	          // add buddy field
	          self._checkIfBuddies(result);

	          // send list of item
	          defer.resolve(result);

	        },

	        // error
	        function() {
	          defer.reject(arguments);
	        });

	    // return a promise
	    return defer.promise();
	  },

	  /**
	   * Send request to know if search is available.
	   *
	   * <p>Designed to be called only one time at init.
	   *
	   * <p>If need more, need to be improved with promises
	   *
	   */
	  requestForSearchCapabilities : function() {

	    var self = jsxc.xmpp.search;

	    // id of the XMPP request for filtering
	    var capabilityRequestId;

	    // request
	    var iq = $iq({
	      type : 'get', to : self.searchDomain
	    }).c('query', {
	      xmlns : 'jabber:iq:search'
	    });

	    // response in a promise
	    var defer = $.Deferred();

	    // send request
	    capabilityRequestId = self.conn.sendIQ(iq,

	        // success
	        function(stanza) {
	          self.userSearchAvailable = $(stanza).find("error").length === 0;

	          defer.resolve(self.userSearchAvailable);
	        },

	        // error
	        function() {
	          self.userSearchAvailable = false;

	          defer.reject(self.userSearchAvailable);
	        });

	    // return a promise
	    return defer.promise();
	  }

	};

	/**
	 * Initialize user search module. Executed at each connexion.
	 */
	$(function() {
	  $(document).on('attached.jsxc', jsxc.xmpp.search.init);
	});


	jsxc.gui.template['aboutDialog'] = '<h3 data-i18n="hey_djoe"></h3>\n' +
	'\n' +
	'<p>\n' +
	'  <b data-i18n="[html]heydjoe_description"></b>\n' +
	'</p>\n' +
	'\n' +
	'<p data-i18n="about_free_description"></p>\n' +
	'\n' +
	'<p>\n' +
	'  <span data-i18n="[html]more_information_on"></span>\n' +
	'<ul>\n' +
	'  <li><a href=\'http://hey-djoe.fr\' target="_blank">http://hey-djoe.fr</a></li>\n' +
	'  <li><a href=\'https://github.com/remipassmoilesel/heydjoe\' target="_blank">https://github.com/remipassmoilesel/heydjoe</a>\n' +
	'  </li>\n' +
	'</ul>\n' +
	'</p>\n' +
	'\n' +
	'<button class="btn btn-default pull-right jsxc_spaceInvasion">Space Invasion !</button>\n' +
	'\n' +
	'\n' +
	'';

	jsxc.gui.template['alert'] = '<h3 data-i18n="Alert"></h3>\n' +
	'<div class="alert alert-info">\n' +
	'   <strong data-i18n="Info"></strong> {{msg}}\n' +
	'</div>\n' +
	'';

	jsxc.gui.template['allowMediaAccess'] = '<p data-i18n="Please_allow_access_to_microphone_and_camera"></p>\n' +
	'';

	jsxc.gui.template['approveDialog'] = '<h3 data-i18n="buddy_approve"></h3>\n' +
	'<p>\n' +
	'   <b class="jsxc_their_jid"></b> <span data-i18n="want_to_be_your_buddy"></span>\n' +
	'</p>\n' +
	'\n' +
	'<button class="btn btn-primary jsxc_approve pull-right" data-i18n="Approve"></button>\n' +
	'<button class="btn btn-default jsxc_deny pull-right" data-i18n="Deny"></button>\n' +
	'';

	jsxc.gui.template['authFailDialog'] = '<h3 data-i18n="Login_failed"></h3>\n' +
	'<p data-i18n="Sorry_we_cant_authentikate_"></p>\n' +
	'\n' +
	'<button class="btn btn-primary jsxc_retry pull-right" data-i18n="Continue_without_chat"></button>\n' +
	'<button class="btn btn-default jsxc_cancel pull-right" data-i18n="Retry"></button>\n' +
	'';

	jsxc.gui.template['authenticationDialog'] = '<h3>Verification</h3>\n' +
	'<p data-i18n="Authenticating_a_buddy_helps_"></p>\n' +
	'<div>\n' +
	'   <p data-i18n="[html]How_do_you_want_to_authenticate_your_buddy"></p>\n' +
	'\n' +
	'   <div class="btn-group" role="group">\n' +
	'      <button class="btn btn-default" data-i18n="Manual"></button>\n' +
	'      <button class="btn btn-default" data-i18n="Question"></button>\n' +
	'      <button class="btn btn-default" data-i18n="Secret"></button>\n' +
	'   </div>\n' +
	'</div>\n' +
	'<hr />\n' +
	'<div style="display: none">\n' +
	'   <p data-i18n="To_verify_the_fingerprint_" class="jsxc_explanation"></p>\n' +
	'   <p>\n' +
	'      <strong data-i18n="Your_fingerprint"></strong>\n' +
	'      <br /> <span style="text-transform: uppercase">{{my_priv_fingerprint}}</span>\n' +
	'   </p>\n' +
	'   <p>\n' +
	'      <strong data-i18n="Buddy_fingerprint"></strong>\n' +
	'      <br /> <span style="text-transform: uppercase">{{bid_priv_fingerprint}}</span>\n' +
	'   </p>\n' +
	'   <div class="jsxc_right">\n' +
	'      <button class="btn btn-default jsxc_close" data-i18n="Close"></button>\n' +
	'      <button class="btn btn-primary jsxc_submit" data-i18n="Compared"></button>\n' +
	'   </div>\n' +
	'</div>\n' +
	'<div style="display: none" class="form-horizontal">\n' +
	'   <p data-i18n="To_authenticate_using_a_question_" class="jsxc_explanation"></p>\n' +
	'   <div class="form-group">\n' +
	'      <label class="col-sm-4 control-label" for="jsxc_quest" data-i18n="Question"></label>\n' +
	'      <div class="col-sm-8">\n' +
	'         <input type="text" name="quest" id="jsxc_quest" class="form-control" />\n' +
	'      </div>\n' +
	'   </div>\n' +
	'   <div class="form-group">\n' +
	'      <label class="col-sm-4 control-label" for="jsxc_secret2" data-i18n="Secret"></label>\n' +
	'      <div class="col-sm-8">\n' +
	'         <input type="text" name="secret2" id="jsxc_secret2" class="form-control" />\n' +
	'      </div>\n' +
	'   </div>\n' +
	'   <div class="form-group">\n' +
	'      <div class="col-sm-offset-4 col-sm-8">\n' +
	'         <button class="btn btn-default jsxc_close" data-i18n="Close"></button>\n' +
	'         <button class="btn btn-primary jsxc_submit" data-i18n="Ask"></button>\n' +
	'      </div>\n' +
	'   </div>\n' +
	'</div>\n' +
	'<div style="display: none" class="form-horizontal">\n' +
	'   <p class="jsxc_explanation" data-i18n="To_authenticate_pick_a_secret_"></p>\n' +
	'   <div class="form-group">\n' +
	'      <label class="col-sm-4 control-label" for="jsxc_secret" data-i18n="Secret"></label>\n' +
	'      <div class="col-sm-8">\n' +
	'         <input type="text" name="secret" id="jsxc_secret" class="form-control" />\n' +
	'      </div>\n' +
	'   </div>\n' +
	'   <div class="form-group">\n' +
	'      <div class="col-sm-offset-4 col-sm-8">\n' +
	'         <button class="btn btn-default jsxc_close" data-i18n="Close"></button>\n' +
	'         <button class="btn btn-primary jsxc_submit" data-i18n="Compare"></button>\n' +
	'      </div>\n' +
	'   </div>\n' +
	'</div>\n' +
	'';

	jsxc.gui.template['bookmarkDialog'] = '<h3 data-i18n="Edit_bookmark"></h3>\n' +
	'<form class="form-horizontal">\n' +
	'   <div class="form-group">\n' +
	'      <label class="col-sm-4 control-label" for="jsxc_room" data-i18n="Room"></label>\n' +
	'      <div class="col-sm-8">\n' +
	'         <input type="text" id="jsxc_room" class="form-control" required="required" readonly="readonly" />\n' +
	'      </div>\n' +
	'   </div>\n' +
	'   <div class="form-group">\n' +
	'      <label class="col-sm-4 control-label" for="jsxc_nickname" data-i18n="Nickname"></label>\n' +
	'      <div class="col-sm-8">\n' +
	'         <input type="text" disabled="disabled" required="required" name="nickname" id="jsxc_nickname" class="form-control" />\n' +
	'      </div>\n' +
	'   </div>\n' +
	'   <div class="form-group">\n' +
	'      <div class="col-sm-offset-4 col-sm-8">\n' +
	'         <div class="checkbox">\n' +
	'            <label>\n' +
	'               <input id="jsxc_bookmark" type="checkbox"><span data-i18n="Bookmark"></span>\n' +
	'            </label>\n' +
	'         </div>\n' +
	'      </div>\n' +
	'   </div>\n' +
	'   <div class="form-group">\n' +
	'      <div class="col-sm-offset-4 col-sm-8">\n' +
	'         <div class="checkbox disabled">\n' +
	'            <label>\n' +
	'               <input disabled="disabled" id="jsxc_autojoin" type="checkbox"><span data-i18n="Auto-join"></span>\n' +
	'            </label>\n' +
	'         </div>\n' +
	'      </div>\n' +
	'   </div>\n' +
	'   <div class="form-group">\n' +
	'      <div class="col-sm-offset-4 col-sm-8">\n' +
	'         <button type="button" class="btn btn-default jsxc_close" data-i18n="Close"></button>\n' +
	'         <button type="submit" class="btn btn-primary jsxc_submit" data-i18n="Save"></button>\n' +
	'      </div>\n' +
	'   </div>\n' +
	'</form>\n' +
	'';

	jsxc.gui.template['chatWindow'] = '<li class="jsxc_windowItem">\n' +
	'  <div class="jsxc_window">\n' +
	'    <div class="jsxc_bar">\n' +
	'      <div class="jsxc_avatar"></div>\n' +
	'      <div class="jsxc_tools">\n' +
	'        <div class="jsxc_settings">\n' +
	'          <div class="jsxc_more"></div>\n' +
	'          <div class="jsxc_inner jsxc_menu">\n' +
	'            <ul>\n' +
	'              <li>\n' +
	'                <a class="jsxc_clear">\n' +
	'                  <span data-i18n="clear_history"></span>\n' +
	'                </a>\n' +
	'              </li>\n' +
	'            </ul>\n' +
	'          </div>\n' +
	'        </div>\n' +
	'        <div class="jsxc_close">×</div>\n' +
	'      </div>\n' +
	'      <div class="jsxc_caption">\n' +
	'        <div class="jsxc_name"/>\n' +
	'        <div class="jsxc_lastmsg">\n' +
	'          <span class="jsxc_unread"/>\n' +
	'          <span class="jsxc_text"/>\n' +
	'        </div>\n' +
	'      </div>\n' +
	'    </div>\n' +
	'    <div class="jsxc_fade">\n' +
	'      <div class="jsxc_overlay">\n' +
	'        <div>\n' +
	'          <div class="jsxc_body"/>\n' +
	'          <div class="jsxc_close"/>\n' +
	'        </div>\n' +
	'      </div>\n' +
	'      <div class="jsxc_textarea"/>\n' +
	'      <div class="jsxc_emoticons">\n' +
	'        <div class="jsxc_inner">\n' +
	'          <ul>\n' +
	'            <li style="clear:both"></li>\n' +
	'          </ul>\n' +
	'        </div>\n' +
	'      </div>\n' +
	'      <input type="text" class="jsxc_textinput" data-i18n="[placeholder]Message"/>\n' +
	'    </div>\n' +
	'  </div>\n' +
	'</li>\n' +
	'';

	jsxc.gui.template['confirmDialog'] = '<p>{{msg}}</p>\n' +
	'\n' +
	'<button class="btn btn-primary jsxc_confirm pull-right" data-i18n="Confirm"></button>\n' +
	'<button class="btn btn-default jsxc_dismiss jsxc_close pull-right" data-i18n="Dismiss"></button>\n' +
	'';

	jsxc.gui.template['contactDialog'] = '<h3 data-i18n="Add_buddy"></h3>\n' +
	'<p class=".jsxc_explanation" data-i18n="Type_in_the_full_username_"></p>\n' +
	'<form class="form-horizontal">\n' +
	'   <div class="form-group">\n' +
	'      <label class="col-sm-4 control-label" for="jsxc_username" data-i18n="Username"></label>\n' +
	'      <div class="col-sm-8">\n' +
	'         <input type="text" name="username" id="jsxc_username" class="form-control" list="jsxc_userlist" pattern="^[^\\x22&\'\\\\/:<>@\\s]+(@[.\\-_\\w]+)?" required="required" />\n' +
	'      </div>\n' +
	'   </div>\n' +
	'   <datalist id="jsxc_userlist"></datalist>\n' +
	'   <div class="form-group">\n' +
	'      <label class="col-sm-4 control-label" for="jsxc_alias" data-i18n="Alias"></label>\n' +
	'      <div class="col-sm-8">\n' +
	'         <input type="text" name="alias" id="jsxc_alias" class="form-control" />\n' +
	'      </div>\n' +
	'   </div>\n' +
	'   <div class="form-group">\n' +
	'      <div class="col-sm-offset-4 col-sm-8">\n' +
	'         <button class="btn btn-default jsxc_close" type="button" data-i18n="Close"></button>\n' +
	'         <button class="btn btn-primary" type="submit" data-i18n="Add"></button>\n' +
	'      </div>\n' +
	'   </div>\n' +
	'</form>\n' +
	'';

	jsxc.gui.template['etherpadCreation'] = '<h3 data-i18n="etherpad_document"></h3>\n' +
	'\n' +
	'<p data-i18n="[html]etherpad_description"></p>\n' +
	'\n' +
	'<p data-i18n="[html]etherpad_wikipedia_link"></p>\n' +
	'\n' +
	'<p>\n' +
	'  <b data-i18n="etherpad_document_name"></b>\n' +
	'  <input type="text" class="jsxc-etherpad-name"/>\n' +
	'</p>\n' +
	'\n' +
	'\n' +
	'<p>\n' +
	'  <b data-i18n="etherpad_invite_users"></b>\n' +
	'  <div id="jsxc-etherpad-dialog-buddylist"></div>\n' +
	'</p>\n' +
	'\n' +
	'<button class="btn btn-primary jsxc_confirm pull-right" data-i18n="Confirm"></button>\n' +
	'<button class="btn btn-default jsxc_cancel jsxc_close pull-right" data-i18n="Cancel"></button>\n' +
	'<button class="btn btn-default jsxc_refresh pull-right" data-i18n="refresh"></button>';

	jsxc.gui.template['fingerprintsDialog'] = '<div>\n' +
	'   <p class="jsxc_maxWidth" data-i18n="A_fingerprint_"></p>\n' +
	'   <p>\n' +
	'      <strong data-i18n="Your_fingerprint"></strong>\n' +
	'      <br /> <span style="text-transform: uppercase">{{my_priv_fingerprint}}</span>\n' +
	'   </p>\n' +
	'   <p>\n' +
	'      <strong data-i18n="Buddy_fingerprint"></strong>\n' +
	'      <br /> <span style="text-transform: uppercase">{{bid_priv_fingerprint}}</span>\n' +
	'   </p>\n' +
	'</div>\n' +
	'';

	jsxc.gui.template['incomingCall'] = '<h3 data-i18n="Incoming_call"></h3>\n' +
	'<p>\n' +
	'   <span data-i18n="Do_you_want_to_accept_the_call_from"></span> <b>{{bid_name}}</b>?\n' +
	'</p>\n' +
	'\n' +
	'<button class="btn btn-primary jsxc_accept pull-right" data-i18n="Accept"></button>\n' +
	'<button class="btn btn-default jsxc_reject pull-right" data-i18n="Reject"></button>\n' +
	'';

	jsxc.gui.template['incomingEtherpad'] = '<h3 data-i18n="etherpad_invitation"></h3>\n' +
	'<p><b>{{bid_name}}</b> <span data-i18n="invite_you_to_share_pad"></span></p>\n' +
	'\n' +
	'<button class="btn btn-primary jsxc_confirm pull-right" data-i18n="Accept"></button>\n' +
	'<button class="btn btn-default jsxc_cancel jsxc_close pull-right" data-i18n="Reject"></button>\n' +
	'';

	jsxc.gui.template['incomingScreensharing'] = '<h3 data-i18n="screen_sharing"></h3>\n' +
	'<p>\n' +
	'  <span data-i18n="[html]do_you_want_to_view_screen_of"></span>\n' +
	'   <b>{{bid_name}}</b>?\n' +
	'</p>\n' +
	'\n' +
	'<button class="btn btn-primary jsxc_accept pull-right" data-i18n="Accept"></button>\n' +
	'<button class="btn btn-default jsxc_reject pull-right" data-i18n="Reject"></button>\n' +
	'';

	jsxc.gui.template['incomingVideoconference'] = '<h3 data-i18n="videconference"></h3>\n' +
	'<p>\n' +
	'  <b>{{bid_name}}</b> <span data-i18n="want_to_invite_you_in_videoconference"></span>\n' +
	'</p>\n' +
	'\n' +
	'<button class="btn btn-primary jsxc_accept pull-right" data-i18n="Accept"></button>\n' +
	'<button class="btn btn-default jsxc_reject pull-right" data-i18n="Reject"></button>\n' +
	'';

	jsxc.gui.template['installChromeExtension'] = '<h3 data-i18n="install_chrome_screen_sharing_extension"></h3>\n' +
	'\n' +
	'<img id="jsxc_installationIllustration"/>\n' +
	'\n' +
	'<p data-i18n="install_chrome_extension_intro"></p>\n' +
	'\n' +
	'<ol>\n' +
	'  <li data-i18n="open_dialog_in_chrome"></li>\n' +
	'  <li>\n' +
	'    <a id="jsxc-chrome-extension-link" data-i18n="click_here_to_download_extension"></a>\n' +
	'     <span data-i18n="then_save_it_in_your_system"></span>\n' +
	'  </li>\n' +
	'  <li>\n' +
	'    <a href="about:blank" target="_blank" data-i18n="open_a_new_tab"></a>\n' +
	'  </li>\n' +
	'  <li data-i18n="[html]then_go_to_settings"></li>\n' +
	'  <li data-i18n="[html]drop_extension_on_page"></li>\n' +
	'  <li data-i18n="[html]confirm_extension_installation"></li>\n' +
	'  <li data-i18n="[html]then_refresh_page"></li>\n' +
	'</ol>\n' +
	'\n' +
	'<button class="btn btn-default pull-right jsxc_closeInstallChromeExtension" data-i18n="Close"></button>\n' +
	'<button class="btn btn-primary pull-right jsxc_reloadInstallChromeExtension" data-i18n="reload_page"></button>\n' +
	'';

	jsxc.gui.template['joinChat'] = '<h3 data-i18n="Join_chat"></h3>\n' +
	'<p class=".jsxc_explanation" data-i18n="muc_explanation"></p>\n' +
	'<div class="form-horizontal">\n' +
	'   <div class="form-group">\n' +
	'      <label class="col-sm-4 control-label" for="jsxc_server" data-i18n="Server"></label>\n' +
	'      <div class="col-sm-8">\n' +
	'         <input type="text" name="server" id="jsxc_server" class="form-control" required="required" readonly="readonly" />\n' +
	'      </div>\n' +
	'   </div>\n' +
	'   <div class="form-group">\n' +
	'      <label class="col-sm-4 control-label" for="jsxc_room" data-i18n="Room"></label>\n' +
	'      <div class="col-sm-8">\n' +
	'         <input type="text" name="room" id="jsxc_room" class="form-control" autocomplete="off" list="jsxc_roomlist" required="required" pattern="^[^\\x22&\'\\/:<>@\\s]+" />\n' +
	'      </div>\n' +
	'   </div>\n' +
	'   <p class="jsxc_inputinfo jsxc_waiting jsxc_room" data-i18n="Rooms_are_loaded"></p>\n' +
	'   <datalist id="jsxc_roomlist">\n' +
	'      <p>\n' +
	'         <label for="jsxc_roomlist_select"></label>\n' +
	'         <select id="jsxc_roomlist_select">\n' +
	'            <option></option>\n' +
	'            <option>workaround</option>\n' +
	'         </select>\n' +
	'      </p>\n' +
	'   </datalist>\n' +
	'   <div class="form-group">\n' +
	'      <label class="col-sm-4 control-label" for="jsxc_nickname" data-i18n="Nickname"></label>\n' +
	'      <div class="col-sm-8">\n' +
	'         <input type="text" name="nickname" id="jsxc_nickname" class="form-control" />\n' +
	'      </div>\n' +
	'   </div>\n' +
	'   <div class="form-group">\n' +
	'      <label class="col-sm-4 control-label" for="jsxc_password" data-i18n="Password"></label>\n' +
	'      <div class="col-sm-8">\n' +
	'         <input type="text" name="password" id="jsxc_password" class="form-control" />\n' +
	'      </div>\n' +
	'   </div>\n' +
	'   <div class="form-group jsxc_bookmark">\n' +
	'      <div class="col-sm-offset-4 col-sm-8">\n' +
	'         <div class="checkbox">\n' +
	'            <label>\n' +
	'               <input id="jsxc_bookmark" type="checkbox"><span data-i18n="Bookmark"></span>\n' +
	'            </label>\n' +
	'         </div>\n' +
	'      </div>\n' +
	'   </div>\n' +
	'   <div class="form-group jsxc_bookmark">\n' +
	'      <div class="col-sm-offset-4 col-sm-8">\n' +
	'         <div class="checkbox disabled">\n' +
	'            <label>\n' +
	'               <input disabled="disabled" id="jsxc_autojoin" type="checkbox"><span data-i18n="Auto-join"></span>\n' +
	'            </label>\n' +
	'         </div>\n' +
	'      </div>\n' +
	'   </div>\n' +
	'   <div class="jsxc_msg"></div>\n' +
	'   <div class="form-group">\n' +
	'      <div class="col-sm-offset-4 col-sm-8">\n' +
	'         <span class="jsxc_warning"></span>\n' +
	'         <button class="btn btn-default jsxc_close" data-i18n="Close"></button>\n' +
	'         <button class="btn btn-primary jsxc_continue" data-i18n="Continue"></button>\n' +
	'         <button class="btn btn-success jsxc_join" data-i18n="Join"></button>\n' +
	'      </div>\n' +
	'   </div>\n' +
	'</div>\n' +
	'';

	jsxc.gui.template['joinConversationDialog'] = '<h3 data-i18n="conversation_invitation"></h3>\n' +
	'<p>\n' +
	'   <b class="jsxc_buddyName"></b> <span data-i18n="invite_you_in_conversation"></span>\n' +
	'</p>\n' +
	'\n' +
	'<button class="btn btn-primary jsxc_approve pull-right" data-i18n="Approve"></button>\n' +
	'<button class="btn btn-default jsxc_deny pull-right" data-i18n="Deny"></button>\n' +
	'';

	jsxc.gui.template['loginBox'] = '<h3 data-i18n="Login"></h3>\n' +
	'<form class="form-horizontal">\n' +
	'   <div class="form-group">\n' +
	'      <label class="col-sm-4 control-label" for="jsxc_username" data-i18n="Username"></label>\n' +
	'      <div class="col-sm-8">\n' +
	'         <input type="text" name="username" id="jsxc_username" class="form-control" required="required" value="{{my_node}}" />\n' +
	'      </div>\n' +
	'   </div>\n' +
	'   <div class="form-group">\n' +
	'      <label class="col-sm-4 control-label" for="jsxc_password" data-i18n="Password"></label>\n' +
	'      <div class="col-sm-8">\n' +
	'         <input type="password" name="password" required="required" class="form-control" id="jsxc_password" />\n' +
	'      </div>\n' +
	'   </div>\n' +
	'   <div class="jsxc_alert jsxc_alert-warning" data-i18n="Sorry_we_cant_authentikate_"></div>\n' +
	'   <div class="form-group">\n' +
	'      <div class="col-sm-offset-4 col-sm-9">\n' +
	'         <button type="reset" class="btn btn-default jsxc_close" name="clear" data-i18n="Cancel" />\n' +
	'         <button type="submit" class="btn btn-primary" name="commit" data-i18n="[data-jsxc-loading-text]Connecting...;Connect" />\n' +
	'      </div>\n' +
	'   </div>\n' +
	'</form>\n' +
	'';

	jsxc.gui.template['newgui_chatsidebar'] = '<div id="jsxc-chat-sidebar">\n' +
	'\n' +
	'  <!--\n' +
	'\n' +
	'  Sidebar header, always visible\n' +
	'\n' +
	'  -->\n' +
	'  <div id="jsxc-chat-sidebar-header">\n' +
	'\n' +
	'    <!-- toggle video -->\n' +
	'    <span class="jsxc-toggle-mediapanel"></span>\n' +
	'\n' +
	'    <span class="jsxc-header-content"></span>\n' +
	'\n' +
	'    <!-- close chatsidebar -->\n' +
	'    <span class="jsxc-close-chatsidebar"></span>\n' +
	'\n' +
	'    <!-- Open help menu -->\n' +
	'    <span class="jsxc-toggle-help"></span>\n' +
	'\n' +
	'    <!-- open settings menu -->\n' +
	'    <span class="jsxc-toggle-settings"></span>\n' +
	'\n' +
	'  </div>\n' +
	'\n' +
	'\n' +
	'  <!-- Chat sidebar content -->\n' +
	'  <div id="jsxc-chat-sidebar-content">\n' +
	'\n' +
	'\n' +
	'    <!--\n' +
	'\n' +
	'    Head of content with filters and menu button, static\n' +
	'\n' +
	'    -->\n' +
	'    <div id="jsxc-action-bar">\n' +
	'\n' +
	'      <a id="jsxc-new-gui-filter-users" data-i18n="users"></a>\n' +
	'      <a id="jsxc-new-gui-filter-conversations" data-i18n="conversations"></a>\n' +
	'\n' +
	'      <a id="jsxc-select-buddies">\n' +
	'        <span data-i18n="select"></span> <span class="jsxc-selected-number"></span></a>\n' +
	'\n' +
	'      <span id="jsxc-toggle-actions"></span>\n' +
	'\n' +
	'    </div>\n' +
	'\n' +
	'\n' +
	'    <!--\n' +
	'\n' +
	'      Bottom of content, that can be changed by user\n' +
	'\n' +
	'    -->\n' +
	'    <div id="jsxc-sidebar-content-viewport">\n' +
	'\n' +
	'\n' +
	'      <!--\n' +
	'\n' +
	'      Parameters menu\n' +
	'\n' +
	'      -->\n' +
	'\n' +
	'      <div id="jsxc-settings-menu" class="jsxc-viewport-content">\n' +
	'\n' +
	'        <div class="jsxc-title" data-i18n="parameters"></div>\n' +
	'\n' +
	'        <a class="jsxc-action jsxc-action_toggleMuteMode" data-i18n="play_sounds"></a>\n' +
	'        <a class="jsxc-action jsxc-action_toggleNotifications" data-i18n="display_notifications"></a>\n' +
	'        <a class="jsxc-action jsxc-action_disableVideoCalls" data-i18n="disable_video_calls"></a>\n' +
	'\n' +
	'        <div class="jsxc-content-separator"></div>\n' +
	'\n' +
	'        <a class="jsxc-action jsxc-action_clearLocalHistory" data-i18n="clear_local_conversations_history"></a>\n' +
	'        <a class="jsxc-action jsxc-action_installScreenSharingExtension" data-i18n="screensharing_extension"></a>\n' +
	'\n' +
	'        <div class="jsxc-content-separator"></div>\n' +
	'\n' +
	'        <a class="jsxc-action jsxc-action_showCollectedDatas" data-i18n="collected_datas"></a>\n' +
	'\n' +
	'        <a class="jsxc-action jsxc-show-about-dialog" data-i18n="About"></a>\n' +
	'\n' +
	'      </div>\n' +
	'\n' +
	'\n' +
	'      <!--\n' +
	'\n' +
	'      Help menu\n' +
	'\n' +
	'      -->\n' +
	'\n' +
	'      <div id="jsxc-help-menu" class="jsxc-viewport-content">\n' +
	'\n' +
	'        <div class="jsxc-title" data-i18n="help"></div>\n' +
	'\n' +
	'        <ul id="jsxc-help-tutorial-list"></ul>\n' +
	'\n' +
	'      </div>\n' +
	'\n' +
	'\n' +
	'      <!--\n' +
	'\n' +
	'      Main menu\n' +
	'\n' +
	'      -->\n' +
	'\n' +
	'      <div id="jsxc-main-menu" class="jsxc-viewport-content">\n' +
	'\n' +
	'        <div class="jsxc-title" data-i18n="menu"></div>\n' +
	'\n' +
	'        <a class="jsxc-action jsxc-action_search-user" data-i18n="search_user"></a>\n' +
	'        <a class="jsxc-action jsxc-action_manage-notifications" data-i18n="notifications">\n' +
	'          &nbsp;<span class="jsxc_menu_notif_number"></span></a>\n' +
	'\n' +
	'        <div class="jsxc-content-separator"></div>\n' +
	'\n' +
	'        <a class="jsxc-action jsxc-action_new-conversation" data-i18n="new_conversation"></a>\n' +
	'        <a class="jsxc-action jsxc-action_invite-in-conversation" data-i18n="invite_in_conversation"></a>\n' +
	'        <a class="jsxc-action jsxc-action_new-etherpad-document" data-i18n="open_etherpad"></a>\n' +
	'\n' +
	'        <div class="jsxc-content-separator"></div>\n' +
	'\n' +
	'        <a class="jsxc-action jsxc-action jsxc-action_video-call" data-i18n="video_call"></a>\n' +
	'        <a class="jsxc-action jsxc-action_videoconference" data-i18n="videoconference"></a>\n' +
	'        <a class="jsxc-action jsxc-action_screensharing" data-i18n="share_screen"></a>\n' +
	'\n' +
	'        <div class="jsxc-content-separator"></div>\n' +
	'\n' +
	'        <a class="jsxc-action jsxc-action_delete-buddies" data-i18n="delete"></a>\n' +
	'\n' +
	'      </div>\n' +
	'\n' +
	'      <!--\n' +
	'\n' +
	'      Search menu\n' +
	'\n' +
	'      -->\n' +
	'\n' +
	'      <div id="jsxc-search-users" class="jsxc-viewport-content">\n' +
	'\n' +
	'        <div class="jsxc-title" data-i18n="search"></div>\n' +
	'\n' +
	'        <input id="jsxc-chat-sidebar-search" placeholder="..." type="text"/>\n' +
	'\n' +
	'        <button id="jsxc-chat-sidebar-search-chat" class="btn btn-default" data-i18n="discuss"/>\n' +
	'        <button id="jsxc-chat-sidebar-search-invite" class="btn btn-primary" data-i18n="invite"/>\n' +
	'\n' +
	'        <div class="jsxc-search-users-results">\n' +
	'\n' +
	'        </div>\n' +
	'\n' +
	'      </div>\n' +
	'\n' +
	'      <!--\n' +
	'\n' +
	'      Notification menu\n' +
	'\n' +
	'      -->\n' +
	'      <div id="jsxc-manage-notifications" class="jsxc-viewport-content">\n' +
	'\n' +
	'        <div class="jsxc-title">\n' +
	'          <span data-i18n="notifications"></span>&nbsp;\n' +
	'          <span class="jsxc_menu_notif_number"></span></div>\n' +
	'\n' +
	'        <a class="jsxc-action jsxc-action_rejectAllNotifications" data-i18n="reject_all"></a>\n' +
	'        <a class="jsxc-action jsxc-action_notificationsParameters" data-i18n="parameters"></a>\n' +
	'\n' +
	'        <div id="jsxc-notifications">\n' +
	'          <ul></ul>\n' +
	'        </div>\n' +
	'\n' +
	'      </div>\n' +
	'\n' +
	'      <!--\n' +
	'\n' +
	'      Connexion form\n' +
	'\n' +
	'      -->\n' +
	'      <div id="jsxc-connexion-menu" class="jsxc-viewport-content">\n' +
	'\n' +
	'        <div class="jsxc-title" data-i18n="connection"></div>\n' +
	'\n' +
	'        <p data-i18n="login"></p>\n' +
	'        <input type="text" id="jsxc-connexion-login"/>\n' +
	'\n' +
	'        <p data-i18n="password"></p>\n' +
	'        <input type="password" id="jsxc-connexion-password"/>\n' +
	'\n' +
	'        <button id="jsxc-connexion-submit" class="btn btn-primary" data-i18n="connect_me">\n' +
	'        </button>\n' +
	'\n' +
	'        <div id="jsxc-login-standby" data-i18n="please_stand_by">\n' +
	'        </div>\n' +
	'\n' +
	'        <div id="jsxc-login-warning" data-i18n="connection_if_problem_persist">\n' +
	'        </div>\n' +
	'\n' +
	'      </div>\n' +
	'\n' +
	'      <!--\n' +
	'\n' +
	'      Buddy list, where stored contacts AND buddies\n' +
	'\n' +
	'      -->\n' +
	'      <div id="jsxc-buddy-list-container" class="jsxc-viewport-content">\n' +
	'\n' +
	'        <!-- We need to have a block before buddy list -->\n' +
	'        <div>&nbsp;</div>\n' +
	'\n' +
	'        <ul id="jsxc_buddylist"></ul>\n' +
	'\n' +
	'      </div>\n' +
	'\n' +
	'    </div>\n' +
	'\n' +
	'\n' +
	'    <!--\n' +
	'\n' +
	'    Status bar, bottom of content, static\n' +
	'\n' +
	'    -->\n' +
	'\n' +
	'    <div id="jsxc-status-bar">\n' +
	'\n' +
	'      <span class="jsxc-user-name"></span>\n' +
	'\n' +
	'      <select class="jsxc-select-status">\n' +
	'        <option value="online" class="jsxc_online" data-i18n="Online"></option>\n' +
	'        <option value="chat" class="jsxc_chat" data-i18n="Chatty"></option>\n' +
	'        <option value="away" class="jsxc_away" data-i18n="Away"></option>\n' +
	'        <option value="xa" class="jsxc_xa" data-i18n="Extended_away"></option>\n' +
	'        <option value="dnd" class="jsxc_dnd" data-i18n="dnd"></option>\n' +
	'      </select>\n' +
	'\n' +
	'      <span class="jsxc-login-button"></span>\n' +
	'      <span class="jsxc-logout-button"></span>\n' +
	'\n' +
	'    </div>\n' +
	'\n' +
	'  </div>\n' +
	'\n' +
	'</div>';

	jsxc.gui.template['newgui_mediapanel'] = '<!-- Panel where are displayed videos -->\n' +
	'<div id="jsxc-mediapanel">\n' +
	'\n' +
	'  <a class="jsxc-close-mediapanel"></a>\n' +
	'\n' +
	'  <div id="jsxc-mediapanel-left">\n' +
	'\n' +
	'    <div class="jsxc-header" data-i18n="multimedia_panel"></div>\n' +
	'\n' +
	'    <div>\n' +
	'      <p data-i18n="local_video"></p>\n' +
	'      <video id="jsxc-local-video"/>\n' +
	'    </div>\n' +
	'\n' +
	'    <div>\n' +
	'      <p data-i18n="participants"></p>\n' +
	'      <ul class="jsxc_videoconferenceUsers"></ul>\n' +
	'    </div>\n' +
	'\n' +
	'    <p>\n' +
	'      <a class="jsxc_mmstreamTerminateAll" data-i18n="terminate_all_and_reset_multimedia"></a>\n' +
	'    </p>\n' +
	'\n' +
	'  </div>\n' +
	'\n' +
	'  <div id="jsxc-mediapanel-right">\n' +
	'\n' +
	'  </div>\n' +
	'\n' +
	'</div>';

	jsxc.gui.template['pleaseAccept'] = '<p data-i18n="Please_accept_"></p>\n' +
	'';

	jsxc.gui.template['reinviteUser_emit'] = '<h3 data-i18n="reinvitation"></h3>\n' +
	'<p>\n' +
	'   <span data-i18n="do_you_want_reinvite"></span> <b>{{bid_name}}</b> ?\n' +
	'</p>\n' +
	'\n' +
	'<button class="btn btn-primary jsxc_accept pull-right" data-i18n="reinvite"></button>\n' +
	'<button class="btn btn-default jsxc_reject pull-right" data-i18n="Cancel"></button>\n' +
	'';

	jsxc.gui.template['reinviteUser_received'] = '<h3 data-i18n="reinvitation"></h3>\n' +
	'<p>\n' +
	'  <b>{{bid_name}}</b> <span data-i18n="want_to_invite_you_again"></span>\n' +
	'</p>\n' +
	'\n' +
	'<button class="btn btn-primary jsxc_accept pull-right" data-i18n="Accept"></button>\n' +
	'<button class="btn btn-default jsxc_reject pull-right" data-i18n="Reject"></button>\n' +
	'';

	jsxc.gui.template['removeDialog'] = '<h3 data-i18n="Remove_buddy"></h3>\n' +
	'<p class="jsxc_maxWidth" data-i18n="[html]You_are_about_to_remove_"></p>\n' +
	'\n' +
	'<button class="btn btn-primary jsxc_remove pull-right" data-i18n="Remove"></button>\n' +
	'<button class="btn btn-default jsxc_cancel jsxc_close pull-right" data-i18n="Cancel"></button>\n' +
	'';

	jsxc.gui.template['removeManyDialog'] = '<h3 data-i18n="delete_many"></h3>\n' +
	'\n' +
	'<p class="jsxc_maxWidth" data-i18n="delete_many_description"></p>\n' +
	'\n' +
	'<ol class="jsxc_elementsToRemove"></ol>\n' +
	'\n' +
	'<button class="btn btn-primary jsxc_remove pull-right" data-i18n="Remove"></button>\n' +
	'<button class="btn btn-default jsxc_cancel jsxc_close pull-right" data-i18n="Cancel"></button>\n' +
	'';

	jsxc.gui.template['rosterBuddy'] = '<li class="jsxc_rosteritem">\n' +
	'\n' +
	'  <div class="jsxc_avatar"></div>\n' +
	'\n' +
	'  <div class="jsxc_caption">\n' +
	'\n' +
	'    <div class="jsxc_name"/>\n' +
	'\n' +
	'    <div class="jsxc_lastmsg">\n' +
	'      <span class="jsxc_unread"/>\n' +
	'      <span class="jsxc_text"/>\n' +
	'    </div>\n' +
	'\n' +
	'  </div>\n' +
	'</li>\n' +
	'';

	jsxc.gui.template['selectContacts'] = '<h3 data-i18n="select_buddies"></h3>\n' +
	'\n' +
	'<div id="jsxc-invite-dialog-buddylist"></div>\n' +
	'<div id="jsxc-invite-dialog-refresh"></div>\n' +
	'\n' +
	'<button class="btn btn-primary jsxc_confirm pull-right" data-i18n="select"></button>\n' +
	'<button class="btn btn-default jsxc_cancel jsxc_close pull-right" data-i18n="Cancel"></button>\n' +
	'<button class="btn btn-default jsxc_refresh pull-right" data-i18n="refresh"></button>';

	jsxc.gui.template['selectConversations'] = '<h3 data-i18n="select_conversations"></h3>\n' +
	'\n' +
	'<div id="jsxc_dialogConversationList"></div>\n' +
	'\n' +
	'<button class="btn btn-primary jsxc_confirm pull-right" data-i18n="select"></button>\n' +
	'<button class="btn btn-default jsxc_cancel jsxc_close pull-right" data-i18n="Cancel"></button>\n' +
	'<button class="btn btn-default jsxc_refresh pull-right" data-i18n="refresh"></button>';

	jsxc.gui.template['settings'] = '<form class="form-horizontal col-sm-6">\n' +
	'   <fieldset class="jsxc_fieldsetXmpp jsxc_fieldset">\n' +
	'      <h3 data-i18n="Login_options"></h3>\n' +
	'      <p data-i18n="setting-explanation-xmpp"></p>\n' +
	'      <div class="form-group">\n' +
	'         <label class="col-sm-6 control-label" for="xmpp-url" data-i18n="BOSH_url"></label>\n' +
	'         <div class="col-sm-6">\n' +
	'            <input type="text" id="xmpp-url" class="form-control" readonly="readonly" />\n' +
	'         </div>\n' +
	'      </div>\n' +
	'      <div class="form-group">\n' +
	'         <label class="col-sm-6 control-label" for="xmpp-username" data-i18n="Username"></label>\n' +
	'         <div class="col-sm-6">\n' +
	'            <input type="text" id="xmpp-username" class="form-control" />\n' +
	'         </div>\n' +
	'      </div>\n' +
	'      <div class="form-group">\n' +
	'         <label class="col-sm-6 control-label" for="xmpp-domain" data-i18n="Domain"></label>\n' +
	'         <div class="col-sm-6">\n' +
	'            <input type="text" id="xmpp-domain" class="form-control" />\n' +
	'         </div>\n' +
	'      </div>\n' +
	'      <div class="form-group">\n' +
	'         <label class="col-sm-6 control-label" for="xmpp-resource" data-i18n="Resource"></label>\n' +
	'         <div class="col-sm-6">\n' +
	'            <input class="form-control" type="text" id="xmpp-resource" class="form-control" />\n' +
	'         </div>\n' +
	'      </div>\n' +
	'      <div class="form-group">\n' +
	'         <div class="col-sm-offset-6 col-sm-6">\n' +
	'            <button class="btn btn-primary jsxc_continue" type="submit" data-i18n="Save"></button>\n' +
	'         </div>\n' +
	'      </div>\n' +
	'   </fieldset>\n' +
	'</form>\n' +
	'\n' +
	'<form class="form-horizontal col-sm-6">\n' +
	'   <fieldset class="jsxc_fieldsetPriority jsxc_fieldset">\n' +
	'      <h3 data-i18n="Priority"></h3>\n' +
	'      <p data-i18n="setting-explanation-priority"></p>\n' +
	'      <div class="form-group">\n' +
	'         <label class="col-sm-6 control-label" for="priority-online" data-i18n="Online"></label>\n' +
	'         <div class="col-sm-6">\n' +
	'            <input type="number" value="0" id="priority-online" class="form-control" min="-128" max="127" step="1" required="required" />\n' +
	'         </div>\n' +
	'      </div>\n' +
	'      <div class="form-group">\n' +
	'         <label class="col-sm-6 control-label" for="priority-chat" data-i18n="Chatty"></label>\n' +
	'         <div class="col-sm-6">\n' +
	'            <input type="number" value="0" id="priority-chat" class="form-control" min="-128" max="127" step="1" required="required" />\n' +
	'         </div>\n' +
	'      </div>\n' +
	'      <div class="form-group">\n' +
	'         <label class="col-sm-6 control-label" for="priority-away" data-i18n="Away"></label>\n' +
	'         <div class="col-sm-6">\n' +
	'            <input type="number" value="0" id="priority-away" class="form-control" min="-128" max="127" step="1" required="required" />\n' +
	'         </div>\n' +
	'      </div>\n' +
	'      <div class="form-group">\n' +
	'         <label class="col-sm-6 control-label" for="priority-xa" data-i18n="Extended_away"></label>\n' +
	'         <div class="col-sm-6">\n' +
	'            <input type="number" value="0" id="priority-xa" class="form-control" min="-128" max="127" step="1" required="required" />\n' +
	'         </div>\n' +
	'      </div>\n' +
	'      <div class="form-group">\n' +
	'         <label class="col-sm-6 control-label" for="priority-dnd" data-i18n="dnd"></label>\n' +
	'         <div class="col-sm-6">\n' +
	'            <input type="number" value="0" id="priority-dnd" class="form-control" min="-128" max="127" step="1" required="required" />\n' +
	'         </div>\n' +
	'      </div>\n' +
	'      <div class="form-group">\n' +
	'         <div class="col-sm-offset-6 col-sm-6">\n' +
	'            <button class="btn btn-primary jsxc_continue" type="submit" data-i18n="Save"></button>\n' +
	'         </div>\n' +
	'      </div>\n' +
	'   </fieldset>\n' +
	'</form>\n' +
	'\n' +
	'<form class="form-horizontal col-sm-6">\n' +
	'   <fieldset class="jsxc_fieldsetLoginForm jsxc_fieldset">\n' +
	'      <h3 data-i18n="On_login"></h3>\n' +
	'      <p data-i18n="setting-explanation-login"></p>\n' +
	'      <div class="form-group">\n' +
	'         <div class="col-sm-12">\n' +
	'            <div class="checkbox">\n' +
	'               <label>\n' +
	'                  <input type="checkbox" id="loginForm-enable"><span data-i18n="On_login"></span>\n' +
	'               </label>\n' +
	'            </div>\n' +
	'         </div>\n' +
	'      </div>\n' +
	'      <div class="form-group">\n' +
	'         <div class="col-sm-12">\n' +
	'            <button class="btn btn-primary jsxc_continue" type="submit" data-i18n="Save"></button>\n' +
	'         </div>\n' +
	'      </div>\n' +
	'   </fieldset>\n' +
	'</form>\n' +
	'\n' +
	'<form class="form-horizontal col-sm-6" data-onsubmit="xmpp.carbons.refresh">\n' +
	'   <fieldset class="jsxc_fieldsetCarbons jsxc_fieldset">\n' +
	'      <h3 data-i18n="Carbon_copy"></h3>\n' +
	'      <p data-i18n="setting-explanation-carbon"></p>\n' +
	'      <div class="form-group">\n' +
	'         <div class="col-sm-12">\n' +
	'            <div class="checkbox">\n' +
	'               <label>\n' +
	'                  <input type="checkbox" id="carbons-enable"><span data-i18n="Enable"></span>\n' +
	'               </label>\n' +
	'            </div>\n' +
	'         </div>\n' +
	'      </div>\n' +
	'      <div class="form-group">\n' +
	'         <div class="col-sm-12">\n' +
	'            <button class="btn btn-primary jsxc_continue" type="submit" data-i18n="Save"></button>\n' +
	'         </div>\n' +
	'      </div>\n' +
	'   </fieldset>\n' +
	'</form>\n' +
	'';

	jsxc.gui.template['vCard'] = '<h3>\n' +
	'	<span data-i18n="Info_about"></span> <span>{{bid_name}}</span>\n' +
	'</h3>\n' +
	'<ul class="jsxc_vCard"></ul>\n' +
	'<p>\n' +
	'   <img src="{{root}}/img/loading.gif" alt="wait" width="32px" height="32px" /> <span data-i18n="Please_wait"></span>...\n' +
	'</p>\n' +
	'';

	jsxc.gui.template['videoStreamDialog'] = '<h3 class="jsxc_from_jid"></h3>\n' +
	'\n' +
	'<div>\n' +
	'  <video class="jsxc_fullscreenVideo"></video>\n' +
	'</div>\n' +
	'\n' +
	'<div>\n' +
	'  <button class="btn btn-default pull-right jsxc_hangUpCall" data-i18n="hang_up_call"></button>\n' +
	'  <button class="btn btn-default pull-right jsxc_closeVideoDialog" data-i18n="close_dialog"></button>\n' +
	'</div>';

	jsxc.gui.template['videoWindow'] = '<div id="jsxc_webrtc">\n' +
	'   <div class="jsxc_chatarea">\n' +
	'      <ul></ul>\n' +
	'   </div>\n' +
	'   <div class="jsxc_videoContainer">\n' +
	'      <video class="jsxc_localvideo" autoplay></video>\n' +
	'      <video class="jsxc_remotevideo" autoplay></video>\n' +
	'      <div class="jsxc_status"></div>\n' +
	'      <div class="bubblingG">\n' +
	'         <span id="bubblingG_1"> </span> <span id="bubblingG_2"> </span> <span id="bubblingG_3"> </span>\n' +
	'      </div>\n' +
	'      <div class="jsxc_noRemoteVideo">\n' +
	'         <div>\n' +
	'            <div></div>\n' +
	'            <p data-i18n="No_video_signal"></p>\n' +
	'            <div></div>\n' +
	'         </div>\n' +
	'      </div>\n' +
	'      <div class="jsxc_controlbar jsxc_visible">\n' +
	'         <div>\n' +
	'            <div class="jsxc_hangUp jsxc_videoControl" />\n' +
	'            <div class="jsxc_fullscreen jsxc_videoControl" />\n' +
	'         </div>\n' +
	'      </div>\n' +
	'   </div>\n' +
	'   <div class="jsxc_multi">\n' +
	'      <div class="jsxc_snapshotbar">\n' +
	'         <p>No pictures yet!</p>\n' +
	'      </div>\n' +
	'      <!--<div class="jsxc_chatarea">\n' +
	'                   <ul></ul>\n' +
	'               </div>-->\n' +
	'      <div class="jsxc_infobar"></div>\n' +
	'   </div>\n' +
	'</div>\n' +
	'';

	jsxc.gui.template['waitAlert'] = '<h3>{{msg}}</h3>\n' +
	'\n' +
	'<div class="progress">\n' +
	'   <div class="progress-bar progress-bar-striped active" style="width: 100%" data-i18n="Please_wait">\n' +
	'   </div>\n' +
	'</div>\n' +
	'';

	jsxc.gui.template['windowList'] = '<div id="jsxc_windowList">\n' +
	'   <ul></ul>\n' +
	'</div>\n' +
	'<div id="jsxc_windowListSB">\n' +
	'   <div class="jsxc_scrollLeft jsxc_disabled">&lt;</div>\n' +
	'   <div class="jsxc_scrollRight jsxc_disabled">&gt;</div>\n' +
	'   <div class="jsxc_closeAllWindows jsxc_disabled">X</div>\n' +
	'</div>\n' +
	'';

	}(jQuery));

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
	/*  SHA-1 implementation in JavaScript                  (c) Chris Veness 2002-2014 / MIT Licence  */
	/*                                                                                                */
	/*  - see http://csrc.nist.gov/groups/ST/toolkit/secure_hashing.html                              */
	/*        http://csrc.nist.gov/groups/ST/toolkit/examples.html                                    */
	/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

	/* jshint node:true *//* global define, escape, unescape */
	'use strict';


	/**
	 * SHA-1 hash function reference implementation.
	 *
	 * @namespace
	 */
	var Sha1 = {};


	/**
	 * Generates SHA-1 hash of string.
	 *
	 * @param   {string} msg - (Unicode) string to be hashed.
	 * @returns {string} Hash of msg as hex character string.
	 */
	Sha1.hash = function(msg) {
	    // convert string to UTF-8, as SHA only deals with byte-streams
	    msg = msg.utf8Encode();

	    // constants [§4.2.1]
	    var K = [ 0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xca62c1d6 ];

	    // PREPROCESSING

	    msg += String.fromCharCode(0x80);  // add trailing '1' bit (+ 0's padding) to string [§5.1.1]

	    // convert string msg into 512-bit/16-integer blocks arrays of ints [§5.2.1]
	    var l = msg.length/4 + 2; // length (in 32-bit integers) of msg + ‘1’ + appended length
	    var N = Math.ceil(l/16);  // number of 16-integer-blocks required to hold 'l' ints
	    var M = new Array(N);

	    for (var i=0; i<N; i++) {
	        M[i] = new Array(16);
	        for (var j=0; j<16; j++) {  // encode 4 chars per integer, big-endian encoding
	            M[i][j] = (msg.charCodeAt(i*64+j*4)<<24) | (msg.charCodeAt(i*64+j*4+1)<<16) |
	                (msg.charCodeAt(i*64+j*4+2)<<8) | (msg.charCodeAt(i*64+j*4+3));
	        } // note running off the end of msg is ok 'cos bitwise ops on NaN return 0
	    }
	    // add length (in bits) into final pair of 32-bit integers (big-endian) [§5.1.1]
	    // note: most significant word would be (len-1)*8 >>> 32, but since JS converts
	    // bitwise-op args to 32 bits, we need to simulate this by arithmetic operators
	    M[N-1][14] = ((msg.length-1)*8) / Math.pow(2, 32); M[N-1][14] = Math.floor(M[N-1][14]);
	    M[N-1][15] = ((msg.length-1)*8) & 0xffffffff;

	    // set initial hash value [§5.3.1]
	    var H0 = 0x67452301;
	    var H1 = 0xefcdab89;
	    var H2 = 0x98badcfe;
	    var H3 = 0x10325476;
	    var H4 = 0xc3d2e1f0;

	    // HASH COMPUTATION [§6.1.2]

	    var W = new Array(80); var a, b, c, d, e;
	    for (var i=0; i<N; i++) {

	        // 1 - prepare message schedule 'W'
	        for (var t=0;  t<16; t++) W[t] = M[i][t];
	        for (var t=16; t<80; t++) W[t] = Sha1.ROTL(W[t-3] ^ W[t-8] ^ W[t-14] ^ W[t-16], 1);

	        // 2 - initialise five working variables a, b, c, d, e with previous hash value
	        a = H0; b = H1; c = H2; d = H3; e = H4;

	        // 3 - main loop
	        for (var t=0; t<80; t++) {
	            var s = Math.floor(t/20); // seq for blocks of 'f' functions and 'K' constants
	            var T = (Sha1.ROTL(a,5) + Sha1.f(s,b,c,d) + e + K[s] + W[t]) & 0xffffffff;
	            e = d;
	            d = c;
	            c = Sha1.ROTL(b, 30);
	            b = a;
	            a = T;
	        }

	        // 4 - compute the new intermediate hash value (note 'addition modulo 2^32')
	        H0 = (H0+a) & 0xffffffff;
	        H1 = (H1+b) & 0xffffffff;
	        H2 = (H2+c) & 0xffffffff;
	        H3 = (H3+d) & 0xffffffff;
	        H4 = (H4+e) & 0xffffffff;
	    }

	    return Sha1.toHexStr(H0) + Sha1.toHexStr(H1) + Sha1.toHexStr(H2) +
	        Sha1.toHexStr(H3) + Sha1.toHexStr(H4);
	};


	/**
	 * Function 'f' [§4.1.1].
	 * @private
	 */
	Sha1.f = function(s, x, y, z)  {
	    switch (s) {
	        case 0: return (x & y) ^ (~x & z);           // Ch()
	        case 1: return  x ^ y  ^  z;                 // Parity()
	        case 2: return (x & y) ^ (x & z) ^ (y & z);  // Maj()
	        case 3: return  x ^ y  ^  z;                 // Parity()
	    }
	};

	/**
	 * Rotates left (circular left shift) value x by n positions [§3.2.5].
	 * @private
	 */
	Sha1.ROTL = function(x, n) {
	    return (x<<n) | (x>>>(32-n));
	};


	/**
	 * Hexadecimal representation of a number.
	 * @private
	 */
	Sha1.toHexStr = function(n) {
	    // note can't use toString(16) as it is implementation-dependant,
	    // and in IE returns signed numbers when used on full words
	    var s="", v;
	    for (var i=7; i>=0; i--) { v = (n>>>(i*4)) & 0xf; s += v.toString(16); }
	    return s;
	};


	/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */


	/** Extend String object with method to encode multi-byte string to utf8
	 *  - monsur.hossa.in/2012/07/20/utf-8-in-javascript.html */
	if (typeof String.prototype.utf8Encode == 'undefined') {
	    String.prototype.utf8Encode = function() {
	        return unescape( encodeURIComponent( this ) );
	    };
	}

	/** Extend String object with method to decode utf8 string to multi-byte */
	if (typeof String.prototype.utf8Decode == 'undefined') {
	    String.prototype.utf8Decode = function() {
	        try {
	            return decodeURIComponent( escape( this ) );
	        } catch (e) {
	            return this; // invalid UTF-8? return as-is
	        }
	    };
	}


	/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
	if (typeof module != 'undefined' && module.exports) module.exports = Sha1; // CommonJs export
	if (true) !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function() { return Sha1; }.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)); // AMD

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	// i18next, v1.7.7
	// Copyright (c)2014 Jan Mühlemann (jamuhl).
	// Distributed under MIT license
	// http://i18next.com
	(function (root, factory) {
	    if (true) {

	        module.exports = factory();

	    } else if (typeof define === 'function' && define.amd) {

	        define([], factory);

	    } 
	}(this, function () {

	    // add indexOf to non ECMA-262 standard compliant browsers
	    if (!Array.prototype.indexOf) {
	        Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
	            "use strict";
	            if (this == null) {
	                throw new TypeError();
	            }
	            var t = Object(this);
	            var len = t.length >>> 0;
	            if (len === 0) {
	                return -1;
	            }
	            var n = 0;
	            if (arguments.length > 0) {
	                n = Number(arguments[1]);
	                if (n != n) { // shortcut for verifying if it's NaN
	                    n = 0;
	                } else if (n != 0 && n != Infinity && n != -Infinity) {
	                    n = (n > 0 || -1) * Math.floor(Math.abs(n));
	                }
	            }
	            if (n >= len) {
	                return -1;
	            }
	            var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
	            for (; k < len; k++) {
	                if (k in t && t[k] === searchElement) {
	                    return k;
	                }
	            }
	            return -1;
	        }
	    }
	    
	    // add lastIndexOf to non ECMA-262 standard compliant browsers
	    if (!Array.prototype.lastIndexOf) {
	        Array.prototype.lastIndexOf = function(searchElement /*, fromIndex*/) {
	            "use strict";
	            if (this == null) {
	                throw new TypeError();
	            }
	            var t = Object(this);
	            var len = t.length >>> 0;
	            if (len === 0) {
	                return -1;
	            }
	            var n = len;
	            if (arguments.length > 1) {
	                n = Number(arguments[1]);
	                if (n != n) {
	                    n = 0;
	                } else if (n != 0 && n != (1 / 0) && n != -(1 / 0)) {
	                    n = (n > 0 || -1) * Math.floor(Math.abs(n));
	                }
	            }
	            var k = n >= 0 ? Math.min(n, len - 1) : len - Math.abs(n);
	            for (; k >= 0; k--) {
	                if (k in t && t[k] === searchElement) {
	                    return k;
	                }
	            }
	            return -1;
	        };
	    }
	    
	    // Add string trim for IE8.
	    if (typeof String.prototype.trim !== 'function') {
	        String.prototype.trim = function() {
	            return this.replace(/^\s+|\s+$/g, ''); 
	        }
	    }

	    var $ = undefined
	        , i18n = {}
	        , resStore = {}
	        , currentLng
	        , replacementCounter = 0
	        , languages = []
	        , initialized = false
	        , sync = {};

	    sync = {
	    
	        load: function(lngs, options, cb) {
	            if (options.useLocalStorage) {
	                sync._loadLocal(lngs, options, function(err, store) {
	                    var missingLngs = [];
	                    for (var i = 0, len = lngs.length; i < len; i++) {
	                        if (!store[lngs[i]]) missingLngs.push(lngs[i]);
	                    }
	    
	                    if (missingLngs.length > 0) {
	                        sync._fetch(missingLngs, options, function(err, fetched) {
	                            f.extend(store, fetched);
	                            sync._storeLocal(fetched);
	    
	                            cb(null, store);
	                        });
	                    } else {
	                        cb(null, store);
	                    }
	                });
	            } else {
	                sync._fetch(lngs, options, function(err, store){
	                    cb(null, store);
	                });
	            }
	        },
	    
	        _loadLocal: function(lngs, options, cb) {
	            var store = {}
	              , nowMS = new Date().getTime();
	    
	            if(window.localStorage) {
	    
	                var todo = lngs.length;
	    
	                f.each(lngs, function(key, lng) {
	                    var local = window.localStorage.getItem('res_' + lng);
	    
	                    if (local) {
	                        local = JSON.parse(local);
	    
	                        if (local.i18nStamp && local.i18nStamp + options.localStorageExpirationTime > nowMS) {
	                            store[lng] = local;
	                        }
	                    }
	    
	                    todo--; // wait for all done befor callback
	                    if (todo === 0) cb(null, store);
	                });
	            }
	        },
	    
	        _storeLocal: function(store) {
	            if(window.localStorage) {
	                for (var m in store) {
	                    store[m].i18nStamp = new Date().getTime();
	                    f.localStorage.setItem('res_' + m, JSON.stringify(store[m]));
	                }
	            }
	            return;
	        },
	    
	        _fetch: function(lngs, options, cb) {
	            var ns = options.ns
	              , store = {};
	            
	            if (!options.dynamicLoad) {
	                var todo = ns.namespaces.length * lngs.length
	                  , errors;
	    
	                // load each file individual
	                f.each(ns.namespaces, function(nsIndex, nsValue) {
	                    f.each(lngs, function(lngIndex, lngValue) {
	                        
	                        // Call this once our translation has returned.
	                        var loadComplete = function(err, data) {
	                            if (err) {
	                                errors = errors || [];
	                                errors.push(err);
	                            }
	                            store[lngValue] = store[lngValue] || {};
	                            store[lngValue][nsValue] = data;
	    
	                            todo--; // wait for all done befor callback
	                            if (todo === 0) cb(errors, store);
	                        };
	                        
	                        if(typeof options.customLoad == 'function'){
	                            // Use the specified custom callback.
	                            options.customLoad(lngValue, nsValue, options, loadComplete);
	                        } else {
	                            //~ // Use our inbuilt sync.
	                            sync._fetchOne(lngValue, nsValue, options, loadComplete);
	                        }
	                    });
	                });
	            } else {
	                // Call this once our translation has returned.
	                var loadComplete = function(err, data) {
	                    cb(null, data);
	                };
	    
	                if(typeof options.customLoad == 'function'){
	                    // Use the specified custom callback.
	                    options.customLoad(lngs, ns.namespaces, options, loadComplete);
	                } else {
	                    var url = applyReplacement(options.resGetPath, { lng: lngs.join('+'), ns: ns.namespaces.join('+') });
	                    // load all needed stuff once
	                    f.ajax({
	                        url: url,
	                        success: function(data, status, xhr) {
	                            f.log('loaded: ' + url);
	                            loadComplete(null, data);
	                        },
	                        error : function(xhr, status, error) {
	                            f.log('failed loading: ' + url);
	                            loadComplete('failed loading resource.json error: ' + error);
	                        },
	                        dataType: "json",
	                        async : options.getAsync
	                    });
	                }    
	            }
	        },
	    
	        _fetchOne: function(lng, ns, options, done) {
	            var url = applyReplacement(options.resGetPath, { lng: lng, ns: ns });
	            f.ajax({
	                url: url,
	                success: function(data, status, xhr) {
	                    f.log('loaded: ' + url);
	                    done(null, data);
	                },
	                error : function(xhr, status, error) {
	                    if ((status && status == 200) || (xhr && xhr.status && xhr.status == 200)) {
	                        // file loaded but invalid json, stop waste time !
	                        f.error('There is a typo in: ' + url);
	                    } else if ((status && status == 404) || (xhr && xhr.status && xhr.status == 404)) {
	                        f.log('Does not exist: ' + url);
	                    } else {
	                        var theStatus = status ? status : ((xhr && xhr.status) ? xhr.status : null);
	                        f.log(theStatus + ' when loading ' + url);
	                    }
	                    
	                    done(error, {});
	                },
	                dataType: "json",
	                async : options.getAsync
	            });
	        },
	    
	        postMissing: function(lng, ns, key, defaultValue, lngs) {
	            var payload = {};
	            payload[key] = defaultValue;
	    
	            var urls = [];
	    
	            if (o.sendMissingTo === 'fallback' && o.fallbackLng[0] !== false) {
	                for (var i = 0; i < o.fallbackLng.length; i++) {
	                    urls.push({lng: o.fallbackLng[i], url: applyReplacement(o.resPostPath, { lng: o.fallbackLng[i], ns: ns })});
	                }
	            } else if (o.sendMissingTo === 'current' || (o.sendMissingTo === 'fallback' && o.fallbackLng[0] === false) ) {
	                urls.push({lng: lng, url: applyReplacement(o.resPostPath, { lng: lng, ns: ns })});
	            } else if (o.sendMissingTo === 'all') {
	                for (var i = 0, l = lngs.length; i < l; i++) {
	                    urls.push({lng: lngs[i], url: applyReplacement(o.resPostPath, { lng: lngs[i], ns: ns })});
	                }
	            }
	    
	            for (var y = 0, len = urls.length; y < len; y++) {
	                var item = urls[y];
	                f.ajax({
	                    url: item.url,
	                    type: o.sendType,
	                    data: payload,
	                    success: function(data, status, xhr) {
	                        f.log('posted missing key \'' + key + '\' to: ' + item.url);
	    
	                        // add key to resStore
	                        var keys = key.split('.');
	                        var x = 0;
	                        var value = resStore[item.lng][ns];
	                        while (keys[x]) {
	                            if (x === keys.length - 1) {
	                                value = value[keys[x]] = defaultValue;
	                            } else {
	                                value = value[keys[x]] = value[keys[x]] || {};
	                            }
	                            x++;
	                        }
	                    },
	                    error : function(xhr, status, error) {
	                        f.log('failed posting missing key \'' + key + '\' to: ' + item.url);
	                    },
	                    dataType: "json",
	                    async : o.postAsync
	                });
	            }
	        },
	    
	        reload: reload
	    };
	    // defaults
	    var o = {
	        lng: undefined,
	        load: 'all',
	        preload: [],
	        lowerCaseLng: false,
	        returnObjectTrees: false,
	        fallbackLng: ['dev'],
	        fallbackNS: [],
	        detectLngQS: 'setLng',
	        detectLngFromLocalStorage: false,
	        ns: 'translation',
	        fallbackOnNull: true,
	        fallbackOnEmpty: false,
	        fallbackToDefaultNS: false,
	        nsseparator: ':',
	        keyseparator: '.',
	        selectorAttr: 'data-i18n',
	        debug: false,
	        
	        resGetPath: 'locales/__lng__/__ns__.json',
	        resPostPath: 'locales/add/__lng__/__ns__',
	    
	        getAsync: true,
	        postAsync: true,
	    
	        resStore: undefined,
	        useLocalStorage: false,
	        localStorageExpirationTime: 7*24*60*60*1000,
	    
	        dynamicLoad: false,
	        sendMissing: false,
	        sendMissingTo: 'fallback', // current | all
	        sendType: 'POST',
	    
	        interpolationPrefix: '__',
	        interpolationSuffix: '__',
	        defaultVariables: false,
	        reusePrefix: '$t(',
	        reuseSuffix: ')',
	        pluralSuffix: '_plural',
	        pluralNotFound: ['plural_not_found', Math.random()].join(''),
	        contextNotFound: ['context_not_found', Math.random()].join(''),
	        escapeInterpolation: false,
	        indefiniteSuffix: '_indefinite',
	        indefiniteNotFound: ['indefinite_not_found', Math.random()].join(''),
	    
	        setJqueryExt: true,
	        defaultValueFromContent: true,
	        useDataAttrOptions: false,
	        cookieExpirationTime: undefined,
	        useCookie: true,
	        cookieName: 'i18next',
	        cookieDomain: undefined,
	    
	        objectTreeKeyHandler: undefined,
	        postProcess: undefined,
	        parseMissingKey: undefined,
	        missingKeyHandler: sync.postMissing,
	    
	        shortcutFunction: 'sprintf' // or: defaultValue
	    };
	    function _extend(target, source) {
	        if (!source || typeof source === 'function') {
	            return target;
	        }
	    
	        for (var attr in source) { target[attr] = source[attr]; }
	        return target;
	    }
	    
	    function _deepExtend(target, source) {
	        for (var prop in source)
	            if (prop in target)
	                _deepExtend(target[prop], source[prop]);
	            else
	                target[prop] = source[prop];
	        return target;
	    }
	    
	    function _each(object, callback, args) {
	        var name, i = 0,
	            length = object.length,
	            isObj = length === undefined || Object.prototype.toString.apply(object) !== '[object Array]' || typeof object === "function";
	    
	        if (args) {
	            if (isObj) {
	                for (name in object) {
	                    if (callback.apply(object[name], args) === false) {
	                        break;
	                    }
	                }
	            } else {
	                for ( ; i < length; ) {
	                    if (callback.apply(object[i++], args) === false) {
	                        break;
	                    }
	                }
	            }
	    
	        // A special, fast, case for the most common use of each
	        } else {
	            if (isObj) {
	                for (name in object) {
	                    if (callback.call(object[name], name, object[name]) === false) {
	                        break;
	                    }
	                }
	            } else {
	                for ( ; i < length; ) {
	                    if (callback.call(object[i], i, object[i++]) === false) {
	                        break;
	                    }
	                }
	            }
	        }
	    
	        return object;
	    }
	    
	    var _entityMap = {
	        "&": "&amp;",
	        "<": "&lt;",
	        ">": "&gt;",
	        '"': '&quot;',
	        "'": '&#39;',
	        "/": '&#x2F;'
	    };
	    
	    function _escape(data) {
	        if (typeof data === 'string') {
	            return data.replace(/[&<>"'\/]/g, function (s) {
	                return _entityMap[s];
	            });
	        }else{
	            return data;
	        }
	    }
	    
	    function _ajax(options) {
	    
	        // v0.5.0 of https://github.com/goloroden/http.js
	        var getXhr = function (callback) {
	            // Use the native XHR object if the browser supports it.
	            if (window.XMLHttpRequest) {
	                return callback(null, new XMLHttpRequest());
	            } else if (window.ActiveXObject) {
	                // In Internet Explorer check for ActiveX versions of the XHR object.
	                try {
	                    return callback(null, new ActiveXObject("Msxml2.XMLHTTP"));
	                } catch (e) {
	                    return callback(null, new ActiveXObject("Microsoft.XMLHTTP"));
	                }
	            }
	    
	            // If no XHR support was found, throw an error.
	            return callback(new Error());
	        };
	    
	        var encodeUsingUrlEncoding = function (data) {
	            if(typeof data === 'string') {
	                return data;
	            }
	    
	            var result = [];
	            for(var dataItem in data) {
	                if(data.hasOwnProperty(dataItem)) {
	                    result.push(encodeURIComponent(dataItem) + '=' + encodeURIComponent(data[dataItem]));
	                }
	            }
	    
	            return result.join('&');
	        };
	    
	        var utf8 = function (text) {
	            text = text.replace(/\r\n/g, '\n');
	            var result = '';
	    
	            for(var i = 0; i < text.length; i++) {
	                var c = text.charCodeAt(i);
	    
	                if(c < 128) {
	                        result += String.fromCharCode(c);
	                } else if((c > 127) && (c < 2048)) {
	                        result += String.fromCharCode((c >> 6) | 192);
	                        result += String.fromCharCode((c & 63) | 128);
	                } else {
	                        result += String.fromCharCode((c >> 12) | 224);
	                        result += String.fromCharCode(((c >> 6) & 63) | 128);
	                        result += String.fromCharCode((c & 63) | 128);
	                }
	            }
	    
	            return result;
	        };
	    
	        var base64 = function (text) {
	            var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
	    
	            text = utf8(text);
	            var result = '',
	                    chr1, chr2, chr3,
	                    enc1, enc2, enc3, enc4,
	                    i = 0;
	    
	            do {
	                chr1 = text.charCodeAt(i++);
	                chr2 = text.charCodeAt(i++);
	                chr3 = text.charCodeAt(i++);
	    
	                enc1 = chr1 >> 2;
	                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
	                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
	                enc4 = chr3 & 63;
	    
	                if(isNaN(chr2)) {
	                    enc3 = enc4 = 64;
	                } else if(isNaN(chr3)) {
	                    enc4 = 64;
	                }
	    
	                result +=
	                    keyStr.charAt(enc1) +
	                    keyStr.charAt(enc2) +
	                    keyStr.charAt(enc3) +
	                    keyStr.charAt(enc4);
	                chr1 = chr2 = chr3 = '';
	                enc1 = enc2 = enc3 = enc4 = '';
	            } while(i < text.length);
	    
	            return result;
	        };
	    
	        var mergeHeaders = function () {
	            // Use the first header object as base.
	            var result = arguments[0];
	    
	            // Iterate through the remaining header objects and add them.
	            for(var i = 1; i < arguments.length; i++) {
	                var currentHeaders = arguments[i];
	                for(var header in currentHeaders) {
	                    if(currentHeaders.hasOwnProperty(header)) {
	                        result[header] = currentHeaders[header];
	                    }
	                }
	            }
	    
	            // Return the merged headers.
	            return result;
	        };
	    
	        var ajax = function (method, url, options, callback) {
	            // Adjust parameters.
	            if(typeof options === 'function') {
	                callback = options;
	                options = {};
	            }
	    
	            // Set default parameter values.
	            options.cache = options.cache || false;
	            options.data = options.data || {};
	            options.headers = options.headers || {};
	            options.jsonp = options.jsonp || false;
	            options.async = options.async === undefined ? true : options.async;
	    
	            // Merge the various header objects.
	            var headers = mergeHeaders({
	                'accept': '*/*',
	                'content-type': 'application/x-www-form-urlencoded;charset=UTF-8'
	            }, ajax.headers, options.headers);
	    
	            // Encode the data according to the content-type.
	            var payload;
	            if (headers['content-type'] === 'application/json') {
	                payload = JSON.stringify(options.data);
	            } else {
	                payload = encodeUsingUrlEncoding(options.data);
	            }
	    
	            // Specially prepare GET requests: Setup the query string, handle caching and make a JSONP call
	            // if neccessary.
	            if(method === 'GET') {
	                // Setup the query string.
	                var queryString = [];
	                if(payload) {
	                    queryString.push(payload);
	                    payload = null;
	                }
	    
	                // Handle caching.
	                if(!options.cache) {
	                    queryString.push('_=' + (new Date()).getTime());
	                }
	    
	                // If neccessary prepare the query string for a JSONP call.
	                if(options.jsonp) {
	                    queryString.push('callback=' + options.jsonp);
	                    queryString.push('jsonp=' + options.jsonp);
	                }
	    
	                // Merge the query string and attach it to the url.
	                queryString = queryString.join('&');
	                if (queryString.length > 1) {
	                    if (url.indexOf('?') > -1) {
	                        url += '&' + queryString;
	                    } else {
	                        url += '?' + queryString;
	                    }
	                }
	    
	                // Make a JSONP call if neccessary.
	                if(options.jsonp) {
	                    var head = document.getElementsByTagName('head')[0];
	                    var script = document.createElement('script');
	                    script.type = 'text/javascript';
	                    script.src = url;
	                    head.appendChild(script);
	                    return;
	                }
	            }
	    
	            // Since we got here, it is no JSONP request, so make a normal XHR request.
	            getXhr(function (err, xhr) {
	                if(err) return callback(err);
	    
	                // Open the request.
	                xhr.open(method, url, options.async);
	    
	                // Set the request headers.
	                for(var header in headers) {
	                    if(headers.hasOwnProperty(header)) {
	                        xhr.setRequestHeader(header, headers[header]);
	                    }
	                }
	    
	                // Handle the request events.
	                xhr.onreadystatechange = function () {
	                    if(xhr.readyState === 4) {
	                        var data = xhr.responseText || '';
	    
	                        // If no callback is given, return.
	                        if(!callback) {
	                            return;
	                        }
	    
	                        // Return an object that provides access to the data as text and JSON.
	                        callback(xhr.status, {
	                            text: function () {
	                                return data;
	                            },
	    
	                            json: function () {
	                                try {
	                                    return JSON.parse(data)
	                                } catch (e) {
	                                    f.error('Can not parse JSON. URL: ' + url);
	                                    return {};
	                                }
	                            }
	                        });
	                    }
	                };
	    
	                // Actually send the XHR request.
	                xhr.send(payload);
	            });
	        };
	    
	        // Define the external interface.
	        var http = {
	            authBasic: function (username, password) {
	                ajax.headers['Authorization'] = 'Basic ' + base64(username + ':' + password);
	            },
	    
	            connect: function (url, options, callback) {
	                return ajax('CONNECT', url, options, callback);
	            },
	    
	            del: function (url, options, callback) {
	                return ajax('DELETE', url, options, callback);
	            },
	    
	            get: function (url, options, callback) {
	                return ajax('GET', url, options, callback);
	            },
	    
	            head: function (url, options, callback) {
	                return ajax('HEAD', url, options, callback);
	            },
	    
	            headers: function (headers) {
	                ajax.headers = headers || {};
	            },
	    
	            isAllowed: function (url, verb, callback) {
	                this.options(url, function (status, data) {
	                    callback(data.text().indexOf(verb) !== -1);
	                });
	            },
	    
	            options: function (url, options, callback) {
	                return ajax('OPTIONS', url, options, callback);
	            },
	    
	            patch: function (url, options, callback) {
	                return ajax('PATCH', url, options, callback);
	            },
	    
	            post: function (url, options, callback) {
	                return ajax('POST', url, options, callback);
	            },
	    
	            put: function (url, options, callback) {
	                return ajax('PUT', url, options, callback);
	            },
	    
	            trace: function (url, options, callback) {
	                return ajax('TRACE', url, options, callback);
	            }
	        };
	    
	    
	        var methode = options.type ? options.type.toLowerCase() : 'get';
	    
	        http[methode](options.url, options, function (status, data) {
	            // file: protocol always gives status code 0, so check for data
	            if (status === 200 || (status === 0 && data.text())) {
	                options.success(data.json(), status, null);
	            } else {
	                options.error(data.text(), status, null);
	            }
	        });
	    }
	    
	    var _cookie = {
	        create: function(name,value,minutes,domain) {
	            var expires;
	            if (minutes) {
	                var date = new Date();
	                date.setTime(date.getTime()+(minutes*60*1000));
	                expires = "; expires="+date.toGMTString();
	            }
	            else expires = "";
	            domain = (domain)? "domain="+domain+";" : "";
	            document.cookie = name+"="+value+expires+";"+domain+"path=/";
	        },
	    
	        read: function(name) {
	            var nameEQ = name + "=";
	            var ca = document.cookie.split(';');
	            for(var i=0;i < ca.length;i++) {
	                var c = ca[i];
	                while (c.charAt(0)==' ') c = c.substring(1,c.length);
	                if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length,c.length);
	            }
	            return null;
	        },
	    
	        remove: function(name) {
	            this.create(name,"",-1);
	        }
	    };
	    
	    var cookie_noop = {
	        create: function(name,value,minutes,domain) {},
	        read: function(name) { return null; },
	        remove: function(name) {}
	    };
	    
	    
	    
	    // move dependent functions to a container so that
	    // they can be overriden easier in no jquery environment (node.js)
	    var f = {
	        extend: $ ? $.extend : _extend,
	        deepExtend: _deepExtend,
	        each: $ ? $.each : _each,
	        ajax: $ ? $.ajax : (typeof document !== 'undefined' ? _ajax : function() {}),
	        cookie: typeof document !== 'undefined' ? _cookie : cookie_noop,
	        detectLanguage: detectLanguage,
	        escape: _escape,
	        log: function(str) {
	            if (o.debug && typeof console !== "undefined") console.log(str);
	        },
	        error: function(str) {
	            if (typeof console !== "undefined") console.error(str);
	        },
	        getCountyIndexOfLng: function(lng) {
	            var lng_index = 0;
	            if (lng === 'nb-NO' || lng === 'nn-NO' || lng === 'nb-no' || lng === 'nn-no') lng_index = 1;
	            return lng_index;
	        },
	        toLanguages: function(lng) {
	            var log = this.log;
	    
	            function applyCase(l) {
	                var ret = l;
	    
	                if (typeof l === 'string' && l.indexOf('-') > -1) {
	                    var parts = l.split('-');
	    
	                    ret = o.lowerCaseLng ?
	                        parts[0].toLowerCase() +  '-' + parts[1].toLowerCase() :
	                        parts[0].toLowerCase() +  '-' + parts[1].toUpperCase();
	                } else {
	                    ret = o.lowerCaseLng ? l.toLowerCase() : l;
	                }
	    
	                return ret;
	            }
	    
	            var languages = [];
	            var whitelist = o.lngWhitelist || false;
	            var addLanguage = function(language){
	              //reject langs not whitelisted
	              if(!whitelist || whitelist.indexOf(language) > -1){
	                languages.push(language);
	              }else{
	                log('rejecting non-whitelisted language: ' + language);
	              }
	            };
	            if (typeof lng === 'string' && lng.indexOf('-') > -1) {
	                var parts = lng.split('-');
	    
	                if (o.load !== 'unspecific') addLanguage(applyCase(lng));
	                if (o.load !== 'current') addLanguage(applyCase(parts[this.getCountyIndexOfLng(lng)]));
	            } else {
	                addLanguage(applyCase(lng));
	            }
	    
	            for (var i = 0; i < o.fallbackLng.length; i++) {
	                if (languages.indexOf(o.fallbackLng[i]) === -1 && o.fallbackLng[i]) languages.push(applyCase(o.fallbackLng[i]));
	            }
	            return languages;
	        },
	        regexEscape: function(str) {
	            return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
	        },
	        regexReplacementEscape: function(strOrFn) {
	            if (typeof strOrFn === 'string') {
	                return strOrFn.replace(/\$/g, "$$$$");
	            } else {
	                return strOrFn;
	            }
	        },
	        localStorage: {
	            setItem: function(key, value) {
	                if (window.localStorage) {
	                    try {
	                        window.localStorage.setItem(key, value);
	                    } catch (e) {
	                        f.log('failed to set value for key "' + key + '" to localStorage.');
	                    }
	                }
	            }
	        }
	    };
	    function init(options, cb) {
	        
	        if (typeof options === 'function') {
	            cb = options;
	            options = {};
	        }
	        options = options || {};
	        
	        // override defaults with passed in options
	        f.extend(o, options);
	        delete o.fixLng; /* passed in each time */
	    
	        // override functions: .log(), .detectLanguage(), etc
	        if (o.functions) {
	            delete o.functions;
	            f.extend(f, options.functions);
	        }
	    
	        // create namespace object if namespace is passed in as string
	        if (typeof o.ns == 'string') {
	            o.ns = { namespaces: [o.ns], defaultNs: o.ns};
	        }
	    
	        // fallback namespaces
	        if (typeof o.fallbackNS == 'string') {
	            o.fallbackNS = [o.fallbackNS];
	        }
	    
	        // fallback languages
	        if (typeof o.fallbackLng == 'string' || typeof o.fallbackLng == 'boolean') {
	            o.fallbackLng = [o.fallbackLng];
	        }
	    
	        // escape prefix/suffix
	        o.interpolationPrefixEscaped = f.regexEscape(o.interpolationPrefix);
	        o.interpolationSuffixEscaped = f.regexEscape(o.interpolationSuffix);
	    
	        if (!o.lng) o.lng = f.detectLanguage();
	    
	        languages = f.toLanguages(o.lng);
	        currentLng = languages[0];
	        f.log('currentLng set to: ' + currentLng);
	    
	        if (o.useCookie && f.cookie.read(o.cookieName) !== currentLng){ //cookie is unset or invalid
	            f.cookie.create(o.cookieName, currentLng, o.cookieExpirationTime, o.cookieDomain);
	        }
	        if (o.detectLngFromLocalStorage && typeof document !== 'undefined' && window.localStorage) {
	            f.localStorage.setItem('i18next_lng', currentLng);
	        }
	    
	        var lngTranslate = translate;
	        if (options.fixLng) {
	            lngTranslate = function(key, options) {
	                options = options || {};
	                options.lng = options.lng || lngTranslate.lng;
	                return translate(key, options);
	            };
	            lngTranslate.lng = currentLng;
	        }
	    
	        pluralExtensions.setCurrentLng(currentLng);
	    
	        // add JQuery extensions
	        if ($ && o.setJqueryExt) addJqueryFunct();
	    
	        // jQuery deferred
	        var deferred;
	        if ($ && $.Deferred) {
	            deferred = $.Deferred();
	        }
	    
	        // return immidiatly if res are passed in
	        if (o.resStore) {
	            resStore = o.resStore;
	            initialized = true;
	            if (cb) cb(lngTranslate);
	            if (deferred) deferred.resolve(lngTranslate);
	            if (deferred) return deferred.promise();
	            return;
	        }
	    
	        // languages to load
	        var lngsToLoad = f.toLanguages(o.lng);
	        if (typeof o.preload === 'string') o.preload = [o.preload];
	        for (var i = 0, l = o.preload.length; i < l; i++) {
	            var pres = f.toLanguages(o.preload[i]);
	            for (var y = 0, len = pres.length; y < len; y++) {
	                if (lngsToLoad.indexOf(pres[y]) < 0) {
	                    lngsToLoad.push(pres[y]);
	                }
	            }
	        }
	    
	        // else load them
	        i18n.sync.load(lngsToLoad, o, function(err, store) {
	            resStore = store;
	            initialized = true;
	    
	            if (cb) cb(lngTranslate);
	            if (deferred) deferred.resolve(lngTranslate);
	        });
	    
	        if (deferred) return deferred.promise();
	    }
	    function preload(lngs, cb) {
	        if (typeof lngs === 'string') lngs = [lngs];
	        for (var i = 0, l = lngs.length; i < l; i++) {
	            if (o.preload.indexOf(lngs[i]) < 0) {
	                o.preload.push(lngs[i]);
	            }
	        }
	        return init(cb);
	    }
	    
	    function addResourceBundle(lng, ns, resources, deep) {
	        if (typeof ns !== 'string') {
	            resources = ns;
	            ns = o.ns.defaultNs;
	        } else if (o.ns.namespaces.indexOf(ns) < 0) {
	            o.ns.namespaces.push(ns);
	        }
	    
	        resStore[lng] = resStore[lng] || {};
	        resStore[lng][ns] = resStore[lng][ns] || {};
	    
	        if (deep) {
	            f.deepExtend(resStore[lng][ns], resources);
	        } else {
	            f.extend(resStore[lng][ns], resources);
	        }
	    }
	    
	    function hasResourceBundle(lng, ns) {
	        if (typeof ns !== 'string') {
	            ns = o.ns.defaultNs;
	        }
	    
	        resStore[lng] = resStore[lng] || {};
	        var res = resStore[lng][ns] || {};
	    
	        var hasValues = false;
	        for(var prop in res) {
	            if (res.hasOwnProperty(prop)) {
	                hasValues = true;
	            }
	        }
	    
	        return hasValues;
	    }
	    
	    function removeResourceBundle(lng, ns) {
	        if (typeof ns !== 'string') {
	            ns = o.ns.defaultNs;
	        }
	    
	        resStore[lng] = resStore[lng] || {};
	        resStore[lng][ns] = {};
	    }
	    
	    function addResource(lng, ns, key, value) {
	        if (typeof ns !== 'string') {
	            resource = ns;
	            ns = o.ns.defaultNs;
	        } else if (o.ns.namespaces.indexOf(ns) < 0) {
	            o.ns.namespaces.push(ns);
	        }
	    
	        resStore[lng] = resStore[lng] || {};
	        resStore[lng][ns] = resStore[lng][ns] || {};
	    
	        var keys = key.split(o.keyseparator);
	        var x = 0;
	        var node = resStore[lng][ns];
	        var origRef = node;
	    
	        while (keys[x]) {
	            if (x == keys.length - 1)
	                node[keys[x]] = value;
	            else {
	                if (node[keys[x]] == null)
	                    node[keys[x]] = {};
	    
	                node = node[keys[x]];
	            }
	            x++;
	        }
	    }
	    
	    function addResources(lng, ns, resources) {
	        if (typeof ns !== 'string') {
	            resource = ns;
	            ns = o.ns.defaultNs;
	        } else if (o.ns.namespaces.indexOf(ns) < 0) {
	            o.ns.namespaces.push(ns);
	        }
	    
	        for (var m in resources) {
	            if (typeof resources[m] === 'string') addResource(lng, ns, m, resources[m]);
	        }
	    }
	    
	    function setDefaultNamespace(ns) {
	        o.ns.defaultNs = ns;
	    }
	    
	    function loadNamespace(namespace, cb) {
	        loadNamespaces([namespace], cb);
	    }
	    
	    function loadNamespaces(namespaces, cb) {
	        var opts = {
	            dynamicLoad: o.dynamicLoad,
	            resGetPath: o.resGetPath,
	            getAsync: o.getAsync,
	            customLoad: o.customLoad,
	            ns: { namespaces: namespaces, defaultNs: ''} /* new namespaces to load */
	        };
	    
	        // languages to load
	        var lngsToLoad = f.toLanguages(o.lng);
	        if (typeof o.preload === 'string') o.preload = [o.preload];
	        for (var i = 0, l = o.preload.length; i < l; i++) {
	            var pres = f.toLanguages(o.preload[i]);
	            for (var y = 0, len = pres.length; y < len; y++) {
	                if (lngsToLoad.indexOf(pres[y]) < 0) {
	                    lngsToLoad.push(pres[y]);
	                }
	            }
	        }
	    
	        // check if we have to load
	        var lngNeedLoad = [];
	        for (var a = 0, lenA = lngsToLoad.length; a < lenA; a++) {
	            var needLoad = false;
	            var resSet = resStore[lngsToLoad[a]];
	            if (resSet) {
	                for (var b = 0, lenB = namespaces.length; b < lenB; b++) {
	                    if (!resSet[namespaces[b]]) needLoad = true;
	                }
	            } else {
	                needLoad = true;
	            }
	    
	            if (needLoad) lngNeedLoad.push(lngsToLoad[a]);
	        }
	    
	        if (lngNeedLoad.length) {
	            i18n.sync._fetch(lngNeedLoad, opts, function(err, store) {
	                var todo = namespaces.length * lngNeedLoad.length;
	    
	                // load each file individual
	                f.each(namespaces, function(nsIndex, nsValue) {
	    
	                    // append namespace to namespace array
	                    if (o.ns.namespaces.indexOf(nsValue) < 0) {
	                        o.ns.namespaces.push(nsValue);
	                    }
	    
	                    f.each(lngNeedLoad, function(lngIndex, lngValue) {
	                        resStore[lngValue] = resStore[lngValue] || {};
	                        resStore[lngValue][nsValue] = store[lngValue][nsValue];
	    
	                        todo--; // wait for all done befor callback
	                        if (todo === 0 && cb) {
	                            if (o.useLocalStorage) i18n.sync._storeLocal(resStore);
	                            cb();
	                        }
	                    });
	                });
	            });
	        } else {
	            if (cb) cb();
	        }
	    }
	    
	    function setLng(lng, options, cb) {
	        if (typeof options === 'function') {
	            cb = options;
	            options = {};
	        } else if (!options) {
	            options = {};
	        }
	    
	        options.lng = lng;
	        return init(options, cb);
	    }
	    
	    function lng() {
	        return currentLng;
	    }
	    
	    function reload(cb) {
	        resStore = {};
	        setLng(currentLng, cb);
	    }
	    function addJqueryFunct() {
	        // $.t shortcut
	        $.t = $.t || translate;
	    
	        function parse(ele, key, options) {
	            if (key.length === 0) return;
	    
	            var attr = 'text';
	    
	            if (key.indexOf('[') === 0) {
	                var parts = key.split(']');
	                key = parts[1];
	                attr = parts[0].substr(1, parts[0].length-1);
	            }
	    
	            if (key.indexOf(';') === key.length-1) {
	                key = key.substr(0, key.length-2);
	            }
	    
	            var optionsToUse;
	            if (attr === 'html') {
	                optionsToUse = o.defaultValueFromContent ? $.extend({ defaultValue: ele.html() }, options) : options;
	                ele.html($.t(key, optionsToUse));
	            } else if (attr === 'text') {
	                optionsToUse = o.defaultValueFromContent ? $.extend({ defaultValue: ele.text() }, options) : options;
	                ele.text($.t(key, optionsToUse));
	            } else if (attr === 'prepend') {
	                optionsToUse = o.defaultValueFromContent ? $.extend({ defaultValue: ele.html() }, options) : options;
	                ele.prepend($.t(key, optionsToUse));
	            } else if (attr === 'append') {
	                optionsToUse = o.defaultValueFromContent ? $.extend({ defaultValue: ele.html() }, options) : options;
	                ele.append($.t(key, optionsToUse));
	            } else if (attr.indexOf("data-") === 0) {
	                var dataAttr = attr.substr(("data-").length);
	                optionsToUse = o.defaultValueFromContent ? $.extend({ defaultValue: ele.data(dataAttr) }, options) : options;
	                var translated = $.t(key, optionsToUse);
	                //we change into the data cache
	                ele.data(dataAttr, translated);
	                //we change into the dom
	                ele.attr(attr, translated);
	            } else {
	                optionsToUse = o.defaultValueFromContent ? $.extend({ defaultValue: ele.attr(attr) }, options) : options;
	                ele.attr(attr, $.t(key, optionsToUse));
	            }
	        }
	    
	        function localize(ele, options) {
	            var key = ele.attr(o.selectorAttr);
	            if (!key && typeof key !== 'undefined' && key !== false) key = ele.text() || ele.val();
	            if (!key) return;
	    
	            var target = ele
	              , targetSelector = ele.data("i18n-target");
	            if (targetSelector) {
	                target = ele.find(targetSelector) || ele;
	            }
	    
	            if (!options && o.useDataAttrOptions === true) {
	                options = ele.data("i18n-options");
	            }
	            options = options || {};
	    
	            if (key.indexOf(';') >= 0) {
	                var keys = key.split(';');
	    
	                $.each(keys, function(m, k) {
	                    if (k !== '') parse(target, k, options);
	                });
	    
	            } else {
	                parse(target, key, options);
	            }
	    
	            if (o.useDataAttrOptions === true) ele.data("i18n-options", options);
	        }
	    
	        // fn
	        $.fn.i18n = function (options) {
	            return this.each(function() {
	                // localize element itself
	                localize($(this), options);
	    
	                // localize childs
	                var elements =  $(this).find('[' + o.selectorAttr + ']');
	                elements.each(function() { 
	                    localize($(this), options);
	                });
	            });
	        };
	    }
	    function applyReplacement(str, replacementHash, nestedKey, options) {
	        if (!str) return str;
	    
	        options = options || replacementHash; // first call uses replacement hash combined with options
	        if (str.indexOf(options.interpolationPrefix || o.interpolationPrefix) < 0) return str;
	    
	        var prefix = options.interpolationPrefix ? f.regexEscape(options.interpolationPrefix) : o.interpolationPrefixEscaped
	          , suffix = options.interpolationSuffix ? f.regexEscape(options.interpolationSuffix) : o.interpolationSuffixEscaped
	          , unEscapingSuffix = 'HTML'+suffix;
	    
	        var hash = replacementHash.replace && typeof replacementHash.replace === 'object' ? replacementHash.replace : replacementHash;
	        f.each(hash, function(key, value) {
	            var nextKey = nestedKey ? nestedKey + o.keyseparator + key : key;
	            if (typeof value === 'object' && value !== null) {
	                str = applyReplacement(str, value, nextKey, options);
	            } else {
	                if (options.escapeInterpolation || o.escapeInterpolation) {
	                    str = str.replace(new RegExp([prefix, nextKey, unEscapingSuffix].join(''), 'g'), f.regexReplacementEscape(value));
	                    str = str.replace(new RegExp([prefix, nextKey, suffix].join(''), 'g'), f.regexReplacementEscape(f.escape(value)));
	                } else {
	                    str = str.replace(new RegExp([prefix, nextKey, suffix].join(''), 'g'), f.regexReplacementEscape(value));
	                }
	                // str = options.escapeInterpolation;
	            }
	        });
	        return str;
	    }
	    
	    // append it to functions
	    f.applyReplacement = applyReplacement;
	    
	    function applyReuse(translated, options) {
	        var comma = ',';
	        var options_open = '{';
	        var options_close = '}';
	    
	        var opts = f.extend({}, options);
	        delete opts.postProcess;
	    
	        while (translated.indexOf(o.reusePrefix) != -1) {
	            replacementCounter++;
	            if (replacementCounter > o.maxRecursion) { break; } // safety net for too much recursion
	            var index_of_opening = translated.lastIndexOf(o.reusePrefix);
	            var index_of_end_of_closing = translated.indexOf(o.reuseSuffix, index_of_opening) + o.reuseSuffix.length;
	            var token = translated.substring(index_of_opening, index_of_end_of_closing);
	            var token_without_symbols = token.replace(o.reusePrefix, '').replace(o.reuseSuffix, '');
	    
	            if (index_of_end_of_closing <= index_of_opening) {
	                f.error('there is an missing closing in following translation value', translated);
	                return '';
	            }
	    
	            if (token_without_symbols.indexOf(comma) != -1) {
	                var index_of_token_end_of_closing = token_without_symbols.indexOf(comma);
	                if (token_without_symbols.indexOf(options_open, index_of_token_end_of_closing) != -1 && token_without_symbols.indexOf(options_close, index_of_token_end_of_closing) != -1) {
	                    var index_of_opts_opening = token_without_symbols.indexOf(options_open, index_of_token_end_of_closing);
	                    var index_of_opts_end_of_closing = token_without_symbols.indexOf(options_close, index_of_opts_opening) + options_close.length;
	                    try {
	                        opts = f.extend(opts, JSON.parse(token_without_symbols.substring(index_of_opts_opening, index_of_opts_end_of_closing)));
	                        token_without_symbols = token_without_symbols.substring(0, index_of_token_end_of_closing);
	                    } catch (e) {
	                    }
	                }
	            }
	    
	            var translated_token = _translate(token_without_symbols, opts);
	            translated = translated.replace(token, f.regexReplacementEscape(translated_token));
	        }
	        return translated;
	    }
	    
	    function hasContext(options) {
	        return (options.context && (typeof options.context == 'string' || typeof options.context == 'number'));
	    }
	    
	    function needsPlural(options, lng) {
	        return (options.count !== undefined && typeof options.count != 'string'/* && pluralExtensions.needsPlural(lng, options.count)*/);
	    }
	    
	    function needsIndefiniteArticle(options) {
	        return (options.indefinite_article !== undefined && typeof options.indefinite_article != 'string' && options.indefinite_article);
	    }
	    
	    function exists(key, options) {
	        options = options || {};
	    
	        var notFound = _getDefaultValue(key, options)
	            , found = _find(key, options);
	    
	        return found !== undefined || found === notFound;
	    }
	    
	    function translate(key, options) {
	        options = options || {};
	    
	        if (!initialized) {
	            f.log('i18next not finished initialization. you might have called t function before loading resources finished.')
	            return options.defaultValue || '';
	        };
	        replacementCounter = 0;
	        return _translate.apply(null, arguments);
	    }
	    
	    function _getDefaultValue(key, options) {
	        return (options.defaultValue !== undefined) ? options.defaultValue : key;
	    }
	    
	    function _injectSprintfProcessor() {
	    
	        var values = [];
	    
	        // mh: build array from second argument onwards
	        for (var i = 1; i < arguments.length; i++) {
	            values.push(arguments[i]);
	        }
	    
	        return {
	            postProcess: 'sprintf',
	            sprintf:     values
	        };
	    }
	    
	    function _translate(potentialKeys, options) {
	        if (options && typeof options !== 'object') {
	            if (o.shortcutFunction === 'sprintf') {
	                // mh: gettext like sprintf syntax found, automatically create sprintf processor
	                options = _injectSprintfProcessor.apply(null, arguments);
	            } else if (o.shortcutFunction === 'defaultValue') {
	                options = {
	                    defaultValue: options
	                }
	            }
	        } else {
	            options = options || {};
	        }
	    
	        if (typeof o.defaultVariables === 'object') {
	            options = f.extend({}, o.defaultVariables, options);
	        }
	    
	        if (potentialKeys === undefined || potentialKeys === null || potentialKeys === '') return '';
	    
	        if (typeof potentialKeys === 'string') {
	            potentialKeys = [potentialKeys];
	        }
	    
	        var key = potentialKeys[0];
	    
	        if (potentialKeys.length > 1) {
	            for (var i = 0; i < potentialKeys.length; i++) {
	                key = potentialKeys[i];
	                if (exists(key, options)) {
	                    break;
	                }
	            }
	        }
	    
	        var notFound = _getDefaultValue(key, options)
	            , found = _find(key, options)
	            , lngs = options.lng ? f.toLanguages(options.lng, options.fallbackLng) : languages
	            , ns = options.ns || o.ns.defaultNs
	            , parts;
	    
	        // split ns and key
	        if (key.indexOf(o.nsseparator) > -1) {
	            parts = key.split(o.nsseparator);
	            ns = parts[0];
	            key = parts[1];
	        }
	    
	        if (found === undefined && o.sendMissing && typeof o.missingKeyHandler === 'function') {
	            if (options.lng) {
	                o.missingKeyHandler(lngs[0], ns, key, notFound, lngs);
	            } else {
	                o.missingKeyHandler(o.lng, ns, key, notFound, lngs);
	            }
	        }
	    
	        var postProcessor = options.postProcess || o.postProcess;
	        if (found !== undefined && postProcessor) {
	            if (postProcessors[postProcessor]) {
	                found = postProcessors[postProcessor](found, key, options);
	            }
	        }
	    
	        // process notFound if function exists
	        var splitNotFound = notFound;
	        if (notFound.indexOf(o.nsseparator) > -1) {
	            parts = notFound.split(o.nsseparator);
	            splitNotFound = parts[1];
	        }
	        if (splitNotFound === key && o.parseMissingKey) {
	            notFound = o.parseMissingKey(notFound);
	        }
	    
	        if (found === undefined) {
	            notFound = applyReplacement(notFound, options);
	            notFound = applyReuse(notFound, options);
	    
	            if (postProcessor && postProcessors[postProcessor]) {
	                var val = _getDefaultValue(key, options);
	                found = postProcessors[postProcessor](val, key, options);
	            }
	        }
	    
	        return (found !== undefined) ? found : notFound;
	    }
	    
	    function _find(key, options) {
	        options = options || {};
	    
	        var optionWithoutCount, translated
	            , notFound = _getDefaultValue(key, options)
	            , lngs = languages;
	    
	        if (!resStore) { return notFound; } // no resStore to translate from
	    
	        // CI mode
	        if (lngs[0].toLowerCase() === 'cimode') return notFound;
	    
	        // passed in lng
	        if (options.lngs) lngs = options.lngs;
	        if (options.lng) {
	            lngs = f.toLanguages(options.lng, options.fallbackLng);
	    
	            if (!resStore[lngs[0]]) {
	                var oldAsync = o.getAsync;
	                o.getAsync = false;
	    
	                i18n.sync.load(lngs, o, function(err, store) {
	                    f.extend(resStore, store);
	                    o.getAsync = oldAsync;
	                });
	            }
	        }
	    
	        var ns = options.ns || o.ns.defaultNs;
	        if (key.indexOf(o.nsseparator) > -1) {
	            var parts = key.split(o.nsseparator);
	            ns = parts[0];
	            key = parts[1];
	        }
	    
	        if (hasContext(options)) {
	            optionWithoutCount = f.extend({}, options);
	            delete optionWithoutCount.context;
	            optionWithoutCount.defaultValue = o.contextNotFound;
	    
	            var contextKey = ns + o.nsseparator + key + '_' + options.context;
	    
	            translated = translate(contextKey, optionWithoutCount);
	            if (translated != o.contextNotFound) {
	                return applyReplacement(translated, { context: options.context }); // apply replacement for context only
	            } // else continue translation with original/nonContext key
	        }
	    
	        if (needsPlural(options, lngs[0])) {
	            optionWithoutCount = f.extend({ lngs: [lngs[0]]}, options);
	            delete optionWithoutCount.count;
	            delete optionWithoutCount.lng;
	            optionWithoutCount.defaultValue = o.pluralNotFound;
	    
	            var pluralKey;
	            if (!pluralExtensions.needsPlural(lngs[0], options.count)) {
	                pluralKey = ns + o.nsseparator + key;
	            } else {
	                pluralKey = ns + o.nsseparator + key + o.pluralSuffix;
	                var pluralExtension = pluralExtensions.get(lngs[0], options.count);
	                if (pluralExtension >= 0) {
	                    pluralKey = pluralKey + '_' + pluralExtension;
	                } else if (pluralExtension === 1) {
	                    pluralKey = ns + o.nsseparator + key; // singular
	                }
	            }
	    
	            translated = translate(pluralKey, optionWithoutCount);
	    
	            if (translated != o.pluralNotFound) {
	                return applyReplacement(translated, {
	                    count: options.count,
	                    interpolationPrefix: options.interpolationPrefix,
	                    interpolationSuffix: options.interpolationSuffix
	                }); // apply replacement for count only
	            } else if (lngs.length > 1) {
	                // remove failed lng
	                var clone = lngs.slice();
	                clone.shift();
	                options = f.extend(options, { lngs: clone });
	                delete options.lng;
	                // retry with fallbacks
	                translated = translate(ns + o.nsseparator + key, options);
	                if (translated != o.pluralNotFound) return translated;
	            } else {
	                return translated;
	            }
	        }
	    
	        if (needsIndefiniteArticle(options)) {
	            var optionsWithoutIndef = f.extend({}, options);
	            delete optionsWithoutIndef.indefinite_article;
	            optionsWithoutIndef.defaultValue = o.indefiniteNotFound;
	            // If we don't have a count, we want the indefinite, if we do have a count, and needsPlural is false
	            var indefiniteKey = ns + o.nsseparator + key + (((options.count && !needsPlural(options, lngs[0])) || !options.count) ? o.indefiniteSuffix : "");
	            translated = translate(indefiniteKey, optionsWithoutIndef);
	            if (translated != o.indefiniteNotFound) {
	                return translated;
	            }
	        }
	    
	        var found;
	        var keys = key.split(o.keyseparator);
	        for (var i = 0, len = lngs.length; i < len; i++ ) {
	            if (found !== undefined) break;
	    
	            var l = lngs[i];
	    
	            var x = 0;
	            var value = resStore[l] && resStore[l][ns];
	            while (keys[x]) {
	                value = value && value[keys[x]];
	                x++;
	            }
	            if (value !== undefined) {
	                var valueType = Object.prototype.toString.apply(value);
	                if (typeof value === 'string') {
	                    value = applyReplacement(value, options);
	                    value = applyReuse(value, options);
	                } else if (valueType === '[object Array]' && !o.returnObjectTrees && !options.returnObjectTrees) {
	                    value = value.join('\n');
	                    value = applyReplacement(value, options);
	                    value = applyReuse(value, options);
	                } else if (value === null && o.fallbackOnNull === true) {
	                    value = undefined;
	                } else if (value !== null) {
	                    if (!o.returnObjectTrees && !options.returnObjectTrees) {
	                        if (o.objectTreeKeyHandler && typeof o.objectTreeKeyHandler == 'function') {
	                            value = o.objectTreeKeyHandler(key, value, l, ns, options);
	                        } else {
	                            value = 'key \'' + ns + ':' + key + ' (' + l + ')\' ' +
	                                'returned an object instead of string.';
	                            f.log(value);
	                        }
	                    } else if (valueType !== '[object Number]' && valueType !== '[object Function]' && valueType !== '[object RegExp]') {
	                        var copy = (valueType === '[object Array]') ? [] : {}; // apply child translation on a copy
	                        f.each(value, function(m) {
	                            copy[m] = _translate(ns + o.nsseparator + key + o.keyseparator + m, options);
	                        });
	                        value = copy;
	                    }
	                }
	    
	                if (typeof value === 'string' && value.trim() === '' && o.fallbackOnEmpty === true)
	                    value = undefined;
	    
	                found = value;
	            }
	        }
	    
	        if (found === undefined && !options.isFallbackLookup && (o.fallbackToDefaultNS === true || (o.fallbackNS && o.fallbackNS.length > 0))) {
	            // set flag for fallback lookup - avoid recursion
	            options.isFallbackLookup = true;
	    
	            if (o.fallbackNS.length) {
	    
	                for (var y = 0, lenY = o.fallbackNS.length; y < lenY; y++) {
	                    found = _find(o.fallbackNS[y] + o.nsseparator + key, options);
	    
	                    if (found || (found==="" && o.fallbackOnEmpty === false)) {
	                        /* compare value without namespace */
	                        var foundValue = found.indexOf(o.nsseparator) > -1 ? found.split(o.nsseparator)[1] : found
	                          , notFoundValue = notFound.indexOf(o.nsseparator) > -1 ? notFound.split(o.nsseparator)[1] : notFound;
	    
	                        if (foundValue !== notFoundValue) break;
	                    }
	                }
	            } else {
	                found = _find(key, options); // fallback to default NS
	            }
	            options.isFallbackLookup = false;
	        }
	    
	        return found;
	    }
	    function detectLanguage() {
	        var detectedLng;
	        var whitelist = o.lngWhitelist || [];
	        var userLngChoices = [];
	    
	        // get from qs
	        var qsParm = [];
	        if (typeof window !== 'undefined') {
	            (function() {
	                var query = window.location.search.substring(1);
	                var params = query.split('&');
	                for (var i=0; i<params.length; i++) {
	                    var pos = params[i].indexOf('=');
	                    if (pos > 0) {
	                        var key = params[i].substring(0,pos);
	                        if (key == o.detectLngQS) {
	                            userLngChoices.push(params[i].substring(pos+1));
	                        }
	                    }
	                }
	            })();
	        }
	    
	        // get from cookie
	        if (o.useCookie && typeof document !== 'undefined') {
	            var c = f.cookie.read(o.cookieName);
	            if (c) userLngChoices.push(c);
	        }
	    
	        // get from localStorage
	        if (o.detectLngFromLocalStorage && typeof window !== 'undefined' && window.localStorage) {
	            userLngChoices.push(window.localStorage.getItem('i18next_lng'));
	        }
	    
	        // get from navigator
	        if (typeof navigator !== 'undefined') {
	            if (navigator.languages) { // chrome only; not an array, so can't use .push.apply instead of iterating
	                for (var i=0;i<navigator.languages.length;i++) {
	                    userLngChoices.push(navigator.languages[i]);
	                }
	            }
	            if (navigator.userLanguage) {
	                userLngChoices.push(navigator.userLanguage);
	            }
	            if (navigator.language) {
	                userLngChoices.push(navigator.language);
	            }
	        }
	    
	        (function() {
	            for (var i=0;i<userLngChoices.length;i++) {
	                var lng = userLngChoices[i];
	    
	                if (lng.indexOf('-') > -1) {
	                    var parts = lng.split('-');
	                    lng = o.lowerCaseLng ?
	                        parts[0].toLowerCase() +  '-' + parts[1].toLowerCase() :
	                        parts[0].toLowerCase() +  '-' + parts[1].toUpperCase();
	                }
	    
	                if (whitelist.length === 0 || whitelist.indexOf(lng) > -1) {
	                    detectedLng = lng;
	                    break;
	                }
	            }
	        })();
	    
	        //fallback
	        if (!detectedLng){
	          detectedLng = o.fallbackLng[0];
	        }
	        
	        return detectedLng;
	    }
	    // definition http://translate.sourceforge.net/wiki/l10n/pluralforms
	    
	    /* [code, name, numbers, pluralsType] */
	    var _rules = [
	        ["ach", "Acholi", [1,2], 1],
	        ["af", "Afrikaans",[1,2], 2],
	        ["ak", "Akan", [1,2], 1],
	        ["am", "Amharic", [1,2], 1],
	        ["an", "Aragonese",[1,2], 2],
	        ["ar", "Arabic", [0,1,2,3,11,100],5],
	        ["arn", "Mapudungun",[1,2], 1],
	        ["ast", "Asturian", [1,2], 2],
	        ["ay", "Aymará", [1], 3],
	        ["az", "Azerbaijani",[1,2],2],
	        ["be", "Belarusian",[1,2,5],4],
	        ["bg", "Bulgarian",[1,2], 2],
	        ["bn", "Bengali", [1,2], 2],
	        ["bo", "Tibetan", [1], 3],
	        ["br", "Breton", [1,2], 1],
	        ["bs", "Bosnian", [1,2,5],4],
	        ["ca", "Catalan", [1,2], 2],
	        ["cgg", "Chiga", [1], 3],
	        ["cs", "Czech", [1,2,5],6],
	        ["csb", "Kashubian",[1,2,5],7],
	        ["cy", "Welsh", [1,2,3,8],8],
	        ["da", "Danish", [1,2], 2],
	        ["de", "German", [1,2], 2],
	        ["dev", "Development Fallback", [1,2], 2],
	        ["dz", "Dzongkha", [1], 3],
	        ["el", "Greek", [1,2], 2],
	        ["en", "English", [1,2], 2],
	        ["eo", "Esperanto",[1,2], 2],
	        ["es", "Spanish", [1,2], 2],
	        ["es_ar","Argentinean Spanish", [1,2], 2],
	        ["et", "Estonian", [1,2], 2],
	        ["eu", "Basque", [1,2], 2],
	        ["fa", "Persian", [1], 3],
	        ["fi", "Finnish", [1,2], 2],
	        ["fil", "Filipino", [1,2], 1],
	        ["fo", "Faroese", [1,2], 2],
	        ["fr", "French", [1,2], 9],
	        ["fur", "Friulian", [1,2], 2],
	        ["fy", "Frisian", [1,2], 2],
	        ["ga", "Irish", [1,2,3,7,11],10],
	        ["gd", "Scottish Gaelic",[1,2,3,20],11],
	        ["gl", "Galician", [1,2], 2],
	        ["gu", "Gujarati", [1,2], 2],
	        ["gun", "Gun", [1,2], 1],
	        ["ha", "Hausa", [1,2], 2],
	        ["he", "Hebrew", [1,2], 2],
	        ["hi", "Hindi", [1,2], 2],
	        ["hr", "Croatian", [1,2,5],4],
	        ["hu", "Hungarian",[1,2], 2],
	        ["hy", "Armenian", [1,2], 2],
	        ["ia", "Interlingua",[1,2],2],
	        ["id", "Indonesian",[1], 3],
	        ["is", "Icelandic",[1,2], 12],
	        ["it", "Italian", [1,2], 2],
	        ["ja", "Japanese", [1], 3],
	        ["jbo", "Lojban", [1], 3],
	        ["jv", "Javanese", [0,1], 13],
	        ["ka", "Georgian", [1], 3],
	        ["kk", "Kazakh", [1], 3],
	        ["km", "Khmer", [1], 3],
	        ["kn", "Kannada", [1,2], 2],
	        ["ko", "Korean", [1], 3],
	        ["ku", "Kurdish", [1,2], 2],
	        ["kw", "Cornish", [1,2,3,4],14],
	        ["ky", "Kyrgyz", [1], 3],
	        ["lb", "Letzeburgesch",[1,2],2],
	        ["ln", "Lingala", [1,2], 1],
	        ["lo", "Lao", [1], 3],
	        ["lt", "Lithuanian",[1,2,10],15],
	        ["lv", "Latvian", [1,2,0],16],
	        ["mai", "Maithili", [1,2], 2],
	        ["mfe", "Mauritian Creole",[1,2],1],
	        ["mg", "Malagasy", [1,2], 1],
	        ["mi", "Maori", [1,2], 1],
	        ["mk", "Macedonian",[1,2],17],
	        ["ml", "Malayalam",[1,2], 2],
	        ["mn", "Mongolian",[1,2], 2],
	        ["mnk", "Mandinka", [0,1,2],18],
	        ["mr", "Marathi", [1,2], 2],
	        ["ms", "Malay", [1], 3],
	        ["mt", "Maltese", [1,2,11,20],19],
	        ["nah", "Nahuatl", [1,2], 2],
	        ["nap", "Neapolitan",[1,2], 2],
	        ["nb", "Norwegian Bokmal",[1,2],2],
	        ["ne", "Nepali", [1,2], 2],
	        ["nl", "Dutch", [1,2], 2],
	        ["nn", "Norwegian Nynorsk",[1,2],2],
	        ["no", "Norwegian",[1,2], 2],
	        ["nso", "Northern Sotho",[1,2],2],
	        ["oc", "Occitan", [1,2], 1],
	        ["or", "Oriya", [2,1], 2],
	        ["pa", "Punjabi", [1,2], 2],
	        ["pap", "Papiamento",[1,2], 2],
	        ["pl", "Polish", [1,2,5],7],
	        ["pms", "Piemontese",[1,2], 2],
	        ["ps", "Pashto", [1,2], 2],
	        ["pt", "Portuguese",[1,2], 2],
	        ["pt_br","Brazilian Portuguese",[1,2], 2],
	        ["rm", "Romansh", [1,2], 2],
	        ["ro", "Romanian", [1,2,20],20],
	        ["ru", "Russian", [1,2,5],4],
	        ["sah", "Yakut", [1], 3],
	        ["sco", "Scots", [1,2], 2],
	        ["se", "Northern Sami",[1,2], 2],
	        ["si", "Sinhala", [1,2], 2],
	        ["sk", "Slovak", [1,2,5],6],
	        ["sl", "Slovenian",[5,1,2,3],21],
	        ["so", "Somali", [1,2], 2],
	        ["son", "Songhay", [1,2], 2],
	        ["sq", "Albanian", [1,2], 2],
	        ["sr", "Serbian", [1,2,5],4],
	        ["su", "Sundanese",[1], 3],
	        ["sv", "Swedish", [1,2], 2],
	        ["sw", "Swahili", [1,2], 2],
	        ["ta", "Tamil", [1,2], 2],
	        ["te", "Telugu", [1,2], 2],
	        ["tg", "Tajik", [1,2], 1],
	        ["th", "Thai", [1], 3],
	        ["ti", "Tigrinya", [1,2], 1],
	        ["tk", "Turkmen", [1,2], 2],
	        ["tr", "Turkish", [1,2], 1],
	        ["tt", "Tatar", [1], 3],
	        ["ug", "Uyghur", [1], 3],
	        ["uk", "Ukrainian",[1,2,5],4],
	        ["ur", "Urdu", [1,2], 2],
	        ["uz", "Uzbek", [1,2], 1],
	        ["vi", "Vietnamese",[1], 3],
	        ["wa", "Walloon", [1,2], 1],
	        ["wo", "Wolof", [1], 3],
	        ["yo", "Yoruba", [1,2], 2],
	        ["zh", "Chinese", [1], 3]
	    ];
	    
	    var _rulesPluralsTypes = {
	        1: function(n) {return Number(n > 1);},
	        2: function(n) {return Number(n != 1);},
	        3: function(n) {return 0;},
	        4: function(n) {return Number(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2);},
	        5: function(n) {return Number(n===0 ? 0 : n==1 ? 1 : n==2 ? 2 : n%100>=3 && n%100<=10 ? 3 : n%100>=11 ? 4 : 5);},
	        6: function(n) {return Number((n==1) ? 0 : (n>=2 && n<=4) ? 1 : 2);},
	        7: function(n) {return Number(n==1 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2);},
	        8: function(n) {return Number((n==1) ? 0 : (n==2) ? 1 : (n != 8 && n != 11) ? 2 : 3);},
	        9: function(n) {return Number(n >= 2);},
	        10: function(n) {return Number(n==1 ? 0 : n==2 ? 1 : n<7 ? 2 : n<11 ? 3 : 4) ;},
	        11: function(n) {return Number((n==1 || n==11) ? 0 : (n==2 || n==12) ? 1 : (n > 2 && n < 20) ? 2 : 3);},
	        12: function(n) {return Number(n%10!=1 || n%100==11);},
	        13: function(n) {return Number(n !== 0);},
	        14: function(n) {return Number((n==1) ? 0 : (n==2) ? 1 : (n == 3) ? 2 : 3);},
	        15: function(n) {return Number(n%10==1 && n%100!=11 ? 0 : n%10>=2 && (n%100<10 || n%100>=20) ? 1 : 2);},
	        16: function(n) {return Number(n%10==1 && n%100!=11 ? 0 : n !== 0 ? 1 : 2);},
	        17: function(n) {return Number(n==1 || n%10==1 ? 0 : 1);},
	        18: function(n) {return Number(0 ? 0 : n==1 ? 1 : 2);},
	        19: function(n) {return Number(n==1 ? 0 : n===0 || ( n%100>1 && n%100<11) ? 1 : (n%100>10 && n%100<20 ) ? 2 : 3);},
	        20: function(n) {return Number(n==1 ? 0 : (n===0 || (n%100 > 0 && n%100 < 20)) ? 1 : 2);},
	        21: function(n) {return Number(n%100==1 ? 1 : n%100==2 ? 2 : n%100==3 || n%100==4 ? 3 : 0); }
	    };
	    
	    var pluralExtensions = {
	    
	        rules: (function () {
	            var l, rules = {};
	            for (l=_rules.length; l-- ;) {
	                rules[_rules[l][0]] = {
	                    name: _rules[l][1],
	                    numbers: _rules[l][2],
	                    plurals: _rulesPluralsTypes[_rules[l][3]]
	                }
	            }
	            return rules;
	        }()),
	    
	        // you can add your own pluralExtensions
	        addRule: function(lng, obj) {
	            pluralExtensions.rules[lng] = obj;
	        },
	    
	        setCurrentLng: function(lng) {
	            if (!pluralExtensions.currentRule || pluralExtensions.currentRule.lng !== lng) {
	                var parts = lng.split('-');
	    
	                pluralExtensions.currentRule = {
	                    lng: lng,
	                    rule: pluralExtensions.rules[parts[0]]
	                };
	            }
	        },
	    
	        needsPlural: function(lng, count) {
	            var parts = lng.split('-');
	    
	            var ext;
	            if (pluralExtensions.currentRule && pluralExtensions.currentRule.lng === lng) {
	                ext = pluralExtensions.currentRule.rule; 
	            } else {
	                ext = pluralExtensions.rules[parts[f.getCountyIndexOfLng(lng)]];
	            }
	    
	            if (ext && ext.numbers.length <= 1) {
	                return false;
	            } else {
	                return this.get(lng, count) !== 1;
	            }
	        },
	    
	        get: function(lng, count) {
	            var parts = lng.split('-');
	    
	            function getResult(l, c) {
	                var ext;
	                if (pluralExtensions.currentRule && pluralExtensions.currentRule.lng === lng) {
	                    ext = pluralExtensions.currentRule.rule; 
	                } else {
	                    ext = pluralExtensions.rules[l];
	                }
	                if (ext) {
	                    var i;
	                    if (ext.noAbs) {
	                        i = ext.plurals(c);
	                    } else {
	                        i = ext.plurals(Math.abs(c));
	                    }
	                    
	                    var number = ext.numbers[i];
	                    if (ext.numbers.length === 2 && ext.numbers[0] === 1) {
	                        if (number === 2) { 
	                            number = -1; // regular plural
	                        } else if (number === 1) {
	                            number = 1; // singular
	                        }
	                    }//console.log(count + '-' + number);
	                    return number;
	                } else {
	                    return c === 1 ? '1' : '-1';
	                }
	            }
	                        
	            return getResult(parts[f.getCountyIndexOfLng(lng)], count);
	        }
	    
	    };
	    var postProcessors = {};
	    var addPostProcessor = function(name, fc) {
	        postProcessors[name] = fc;
	    };
	    // sprintf support
	    var sprintf = (function() {
	        function get_type(variable) {
	            return Object.prototype.toString.call(variable).slice(8, -1).toLowerCase();
	        }
	        function str_repeat(input, multiplier) {
	            for (var output = []; multiplier > 0; output[--multiplier] = input) {/* do nothing */}
	            return output.join('');
	        }
	    
	        var str_format = function() {
	            if (!str_format.cache.hasOwnProperty(arguments[0])) {
	                str_format.cache[arguments[0]] = str_format.parse(arguments[0]);
	            }
	            return str_format.format.call(null, str_format.cache[arguments[0]], arguments);
	        };
	    
	        str_format.format = function(parse_tree, argv) {
	            var cursor = 1, tree_length = parse_tree.length, node_type = '', arg, output = [], i, k, match, pad, pad_character, pad_length;
	            for (i = 0; i < tree_length; i++) {
	                node_type = get_type(parse_tree[i]);
	                if (node_type === 'string') {
	                    output.push(parse_tree[i]);
	                }
	                else if (node_type === 'array') {
	                    match = parse_tree[i]; // convenience purposes only
	                    if (match[2]) { // keyword argument
	                        arg = argv[cursor];
	                        for (k = 0; k < match[2].length; k++) {
	                            if (!arg.hasOwnProperty(match[2][k])) {
	                                throw(sprintf('[sprintf] property "%s" does not exist', match[2][k]));
	                            }
	                            arg = arg[match[2][k]];
	                        }
	                    }
	                    else if (match[1]) { // positional argument (explicit)
	                        arg = argv[match[1]];
	                    }
	                    else { // positional argument (implicit)
	                        arg = argv[cursor++];
	                    }
	    
	                    if (/[^s]/.test(match[8]) && (get_type(arg) != 'number')) {
	                        throw(sprintf('[sprintf] expecting number but found %s', get_type(arg)));
	                    }
	                    switch (match[8]) {
	                        case 'b': arg = arg.toString(2); break;
	                        case 'c': arg = String.fromCharCode(arg); break;
	                        case 'd': arg = parseInt(arg, 10); break;
	                        case 'e': arg = match[7] ? arg.toExponential(match[7]) : arg.toExponential(); break;
	                        case 'f': arg = match[7] ? parseFloat(arg).toFixed(match[7]) : parseFloat(arg); break;
	                        case 'o': arg = arg.toString(8); break;
	                        case 's': arg = ((arg = String(arg)) && match[7] ? arg.substring(0, match[7]) : arg); break;
	                        case 'u': arg = Math.abs(arg); break;
	                        case 'x': arg = arg.toString(16); break;
	                        case 'X': arg = arg.toString(16).toUpperCase(); break;
	                    }
	                    arg = (/[def]/.test(match[8]) && match[3] && arg >= 0 ? '+'+ arg : arg);
	                    pad_character = match[4] ? match[4] == '0' ? '0' : match[4].charAt(1) : ' ';
	                    pad_length = match[6] - String(arg).length;
	                    pad = match[6] ? str_repeat(pad_character, pad_length) : '';
	                    output.push(match[5] ? arg + pad : pad + arg);
	                }
	            }
	            return output.join('');
	        };
	    
	        str_format.cache = {};
	    
	        str_format.parse = function(fmt) {
	            var _fmt = fmt, match = [], parse_tree = [], arg_names = 0;
	            while (_fmt) {
	                if ((match = /^[^\x25]+/.exec(_fmt)) !== null) {
	                    parse_tree.push(match[0]);
	                }
	                else if ((match = /^\x25{2}/.exec(_fmt)) !== null) {
	                    parse_tree.push('%');
	                }
	                else if ((match = /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(_fmt)) !== null) {
	                    if (match[2]) {
	                        arg_names |= 1;
	                        var field_list = [], replacement_field = match[2], field_match = [];
	                        if ((field_match = /^([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
	                            field_list.push(field_match[1]);
	                            while ((replacement_field = replacement_field.substring(field_match[0].length)) !== '') {
	                                if ((field_match = /^\.([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
	                                    field_list.push(field_match[1]);
	                                }
	                                else if ((field_match = /^\[(\d+)\]/.exec(replacement_field)) !== null) {
	                                    field_list.push(field_match[1]);
	                                }
	                                else {
	                                    throw('[sprintf] huh?');
	                                }
	                            }
	                        }
	                        else {
	                            throw('[sprintf] huh?');
	                        }
	                        match[2] = field_list;
	                    }
	                    else {
	                        arg_names |= 2;
	                    }
	                    if (arg_names === 3) {
	                        throw('[sprintf] mixing positional and named placeholders is not (yet) supported');
	                    }
	                    parse_tree.push(match);
	                }
	                else {
	                    throw('[sprintf] huh?');
	                }
	                _fmt = _fmt.substring(match[0].length);
	            }
	            return parse_tree;
	        };
	    
	        return str_format;
	    })();
	    
	    var vsprintf = function(fmt, argv) {
	        argv.unshift(fmt);
	        return sprintf.apply(null, argv);
	    };
	    
	    addPostProcessor("sprintf", function(val, key, opts) {
	        if (!opts.sprintf) return val;
	    
	        if (Object.prototype.toString.apply(opts.sprintf) === '[object Array]') {
	            return vsprintf(val, opts.sprintf);
	        } else if (typeof opts.sprintf === 'object') {
	            return sprintf(val, opts.sprintf);
	        }
	    
	        return val;
	    });
	    // public api interface
	    i18n.init = init;
	    i18n.setLng = setLng;
	    i18n.preload = preload;
	    i18n.addResourceBundle = addResourceBundle;
	    i18n.hasResourceBundle = hasResourceBundle;
	    i18n.addResource = addResource;
	    i18n.addResources = addResources;
	    i18n.removeResourceBundle = removeResourceBundle;
	    i18n.loadNamespace = loadNamespace;
	    i18n.loadNamespaces = loadNamespaces;
	    i18n.setDefaultNamespace = setDefaultNamespace;
	    i18n.t = translate;
	    i18n.translate = translate;
	    i18n.exists = exists;
	    i18n.detectLanguage = f.detectLanguage;
	    i18n.pluralExtensions = pluralExtensions;
	    i18n.sync = sync;
	    i18n.functions = f;
	    i18n.lng = lng;
	    i18n.addPostProcessor = addPostProcessor;
	    i18n.options = o;
	        
	    return i18n; 

	}));

/***/ },
/* 3 */
/***/ function(module, exports) {

	/**
	 * Statistics module. Create a Stats object, add pairs {id, value},
	 * send data to store it or let Stats do it every XX minutes.
	 *
	 * @param options
	 * @constructor
	 */

	var WebStats = function(options) {

	  if (!options || !options.destinationUrl) {
	    throw "You must specify destination";
	  }

	  var defaultOptions = {

	    debug : false,

	    /**
	     * Destination, without trailing slash
	     */
	    destinationUrl : "http://127.0.0.1:3000",

	    /**
	     * Set true for send data in interval
	     */
	    autosend : false,

	    /**
	     * Interval between auto sent
	     *
	     */
	    interval : 5000, //interval: Math.floor((Math.random() * 14 * 60 * 100) + 8 * 60 * 100),

	    /**
	     * Authorization header
	     */
	    authorization : 'secretkey',

	    /**
	     * Watch uncaught errors
	     */
	    watchErrors : false,

	    sendSessionOnStart : true

	  };

	  this._failedAttempt = 0;

	  this.options = $.extend(defaultOptions, options);

	  this._log("Options:", this.options);

	  this.options.persistEventUrl = options.destinationUrl + "/persist/event";
	  this.options.persistLogUrl = options.destinationUrl + "/persist/log";
	  this.options.persistSessionUrl = options.destinationUrl + "/persist/session";

	  this.options.readUrl = options.destinationUrl + "/data";

	  this.sessionId = "";

	  this.eventBuffer = [];
	  this.logBuffer = [];

	  var self = this;

	  // send buffer automatically
	  if (this.options.autosend === true) {

	    this._sendInterval = setInterval(function() {
	      self.sendDataBuffer();
	    }, this.options.interval);

	  }

	  // watch uncaught errors
	  if (this.options.watchErrors === true) {
	    self._watchWindowErrors();
	  }

	  if (this.options.sendSessionOnStart === true) {
	    this.sendSession();
	  }

	};

	WebStats.prototype.stopAutoSendingInterval = function() {
	  clearInterval(this._sendInterval);
	};

	WebStats.prototype._log = function(message, datas, level) {

	  if (this.options.debug !== true) {
	    return;
	  }

	  if (message === "") {
	    console.log();
	    return;
	  }

	  level = (level || 'INFO').toLocaleUpperCase();

	  console.log("[WebStats] [" + level + "] " + message, datas || '');

	};

	/**
	 * Add a key / value pair
	 * @param id
	 * @param value
	 */
	WebStats.prototype.addEvent = function(event, data) {

	  this._log("addEvent:", {arguments : arguments});

	  this.eventBuffer.push({event : event, data : data});
	};

	/**
	 * Java hash string implementation
	 * @param string
	 * @returns {number}
	 * @private
	 */
	WebStats.prototype._hashString = function(string) {
	  var hash = 0, i, chr, len;
	  if (string.length === 0) {
	    return hash;
	  }
	  for (i = 0, len = string.length; i < len; i++) {
	    chr = string.charCodeAt(i);
	    hash = ((hash << 5) - hash) + chr;
	    hash |= 0; // Convert to 32bit integer
	  }
	  return hash;
	};

	/**
	 * Create and store a session id
	 */
	WebStats.prototype._createSessionId = function() {

	  if (this.sessionId !== "") {
	    throw "Session id already exist";
	  }

	  this.sessionId = this._hashString(
	      new Date() + navigator.userAgent + Math.random() + "èèèèè!ù**$::;!;;!.§/;§/**/*e*eurh!yjyj");

	  return this.sessionId;

	};

	WebStats.prototype._resetSession = function() {
	  this.sessionId = "";
	};

	/**
	 * Send session informations
	 */
	WebStats.prototype.sendSession = function() {

	  var self = this;

	  this._log("sendSession:", {arguments : arguments});

	  // create the session id
	  self._createSessionId();

	  // send session informations
	  var datas = {
	    'request_from' : self.sessionId,

	    'navigator_language' : navigator.language || "error",

	    'user_agent' : navigator.userAgent || "error"
	  };

	  return self._makeAjax(self.options.persistSessionUrl, 'POST', datas);

	};

	/**
	 * Watch uncaught errors and log them to distant server
	 * @private
	 */
	WebStats.prototype._watchWindowErrors = function() {

	  this._log("Watching errors");

	  var self = this;

	  // Listen uncaught errors
	  window.onerror = function(errorMsg, url, lineNumber, columnNumber, error) {

	    self.addLogEntry(errorMsg, "ERROR", {
	      url : url, lineNumber : lineNumber, columnNumber : columnNumber, error : error
	    });

	  };

	};

	/**
	 * Send stored events
	 * @returns {*}
	 */
	WebStats.prototype.sendDataBuffer = function() {

	  var self = this;

	  this._log("sendDataBuffer");

	  if (this._failedAttempt > 20) {
	    this._log("Max failed limit reach: " + this._failedAttempt);
	    this.stopAutoSendingInterval();
	    return;
	  }

	  if (self.eventBuffer.length < 1 && self.logBuffer.length < 1) {

	    this._log("Buffer is empty");
	    return;

	  }

	  /**
	   * Check if another sending is in progress
	   */
	  if (self._sendingInProgress === true) {

	    this._log("Already sending buffer, stop");

	    return;
	  }

	  self._sendingInProgress = true;

	  // Reset sending flag
	  var _sendIsDone = function() {
	    self._sendingInProgress = false;
	  };

	  // request are resolved by default
	  var p1 = $.Deferred().resolve();
	  var p2 = $.Deferred().resolve();

	  try {

	    // send events if necesary
	    if (self.eventBuffer.length > 0) {

	      var eventDatas = {
	        'request_from' : self.sessionId,

	        'datas' : self.eventBuffer
	      };

	      p1 = self._makeAjax(self.options.persistEventUrl, 'POST', eventDatas)

	          .done(function() {
	            // clear buffer when finished
	            self.eventBuffer = [];
	          })

	          .fail(function() {
	            self._log("Fail sending events: ", {arguments : arguments});

	            // count fails to stop if necessary
	            self._failedAttempt++;
	          });

	    }

	    // send logs if necessary
	    if (self.logBuffer.length > 0) {
	      var logDatas = {
	        'request_from' : self.sessionId,

	        'datas' : self.logBuffer
	      };

	      p2 = self._makeAjax(self.options.persistLogUrl, 'POST', logDatas)

	          .done(function() {
	            // clear buffer when finished
	            self.logBuffer = [];
	          })

	          .fail(function() {
	            self._log("Fail sending logs: ", {arguments : arguments});

	            // count fails to stop if necessary
	            self._failedAttempt++;
	          });
	    }

	  } catch (e) {
	    _sendIsDone();
	    this._failedAttempt++;
	    self.log("Error while sending buffer: ", {error : e}, 'ERROR');
	  }

	  this._log(" ");

	  return $.when(p1, p2).then(_sendIsDone).fail(_sendIsDone);
	};

	/**
	 * Add a log entry in buffer.
	 * Log entry must have a text resume and can have several data arguments.
	 *
	 * @param text
	 */
	WebStats.prototype.addLogEntry = function(text, level, datas) {

	  level = level || 'INFO';

	  var dataStr;
	  try {
	    dataStr = JSON.stringify(datas);
	  } catch (e) {
	    dataStr = "Error while serializing JSON datas";
	  }

	  this.logBuffer.push({
	    text : text, level : level, datas : dataStr
	  });

	};

	/**
	 * Return the list of events
	 * @returns {*}
	 */
	WebStats.prototype.getEventList = function() {

	  return this._makeAjax(this.options.readUrl + "/event/list", 'POST');

	};

	/**
	 * Return an events resume
	 * @returns {*}
	 */
	WebStats.prototype.getEventResume = function() {

	  return this._makeAjax(this.options.readUrl + "/event/resume", 'POST');

	};

	/**
	 * Return an events resume
	 * @returns {*}
	 */
	WebStats.prototype.getEventTimeline = function() {

	  return this._makeAjax(this.options.readUrl + "/event/timeline/hours", 'POST');

	};

	/**
	 * Return an events resume
	 * @returns {*}
	 */
	WebStats.prototype.getLastEvents = function() {

	  return this._makeAjax(this.options.readUrl + "/event/last", 'POST');

	};

	/**
	 * Return an events resume
	 * @returns {*}
	 */
	WebStats.prototype.getLastLogs = function() {

	  return this._makeAjax(this.options.readUrl + "/log/last", 'POST');

	};

	/**
	 * Make ajax request with requested headers
	 *
	 * @param url
	 * @param method
	 * @param datas
	 * @param headers
	 * @returns {*}
	 * @private
	 */
	WebStats.prototype._makeAjax = function(url, method, datas, headers) {

	  var self = this;

	  var req = {
	    url : url,

	    type : method,

	    dataType : "json",

	    data : JSON.stringify(datas),

	    headers : {
	      "Authorization" : self.options.authorization,

	      "Content-Type" : "application/json"
	    },

	    timeout : 5000
	  };

	  // ajouter entetes si necessaire
	  if (typeof headers !== "undefined") {
	    $.extend(req.headers, headers);
	  }

	  return $.ajax(req);
	};

	/**
	 * Export module if necesary
	 */
	if (typeof module !== "undefined" && module.exports) {
	  module.exports = function(options) {
	    return new WebStats(options);
	  };
	}




/***/ }
/******/ ]);