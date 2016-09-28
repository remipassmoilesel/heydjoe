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