/**
 * API for manipulating JSXC
 *
 */

jsxc.api = {

  /**
   * Availables events can be used for register callbacks
   */
  _availableEvents : ['onReconnectDemand', 'onBuddyAdded', 'onBuddyAccepted', "onInit"],

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
  feedback : function(message, type, timeout) {
    jsxc.gui.feedback(message, type, timeout);
  },

  /**
   * Open chat window bound to the specified jid
   *
   * Jid can be a full jid or a bare jid
   *
   * @param login
   */
  openChatWindow : function(jid) {

    var self = jsxc.api;
    var bid = jsxc.jidToBid(jid);

    self.checkIfConnectedOrThrow();

    // if user isn't in buddylist, create a buddy list entry
    // with no suscription
    if (self.getBuddyList().indexOf(jid) < 0) {

      jsxc.storage.setUserItem('buddy', bid, {
        jid: jid,
        name: '',
        status: 0,
        sub: 'none',
        msgstate: 0,
        transferReq: -1,
        trust: false,
        res: [],
        type: 'chat'
      });
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
  createNewConversationWith: function(jidArray){
    
    var invite = true;

    if(!jidArray || typeof jidArray.length === "undefined"){
      throw new Error("Invalid argument: " + jidArray);
    }

    if(jidArray.length < 1){
      jsxc.gui.feedback("Vous devez sélectionner au moins un interlocuteur");
      return;
    }
    
    $.each(jidArray, function(index, element) {
      if(element.match(/.+@.+\..+/i) === null){
        jsxc.gui.feedback("Impossible de joindre: " + element);
        invite = false;
      }
    });
    
    if(invite === true){
      jsxc.muc.createNewConversationWith(jidArray);  
    }
    
  },

  /**
   * Return the buddy list
   */
  getBuddyList : function() {
    return jsxc.storage.getUserItem('buddylist') || [];
  },

  isConnected: function(){
    return jsxc.xmpp.conn !== null;
  },

  /**
   * Check if we are connected, if not show feedback, open roster and throw exception
   */
  checkIfConnectedOrThrow: function(){

    var self = jsxc.api;

    if(self.isConnected() !== true){
      
      self.feedback("Vous n'êtes pas connecté au client de messagerie");
      jsxc.gui.roster.toggle("shown");

      throw new Error("Not connected to JSXC client");
    }
  },

  /**
   *
   * @private
   */
  spaceInvasion : function() {

    var self = jsxc.help;

    var root = jsxc.options.root + "lib/AlienInvasion/";

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
      template.append("<div><a href='https://github.com/cykod/AlienInvasion/' target='_blank'>" +
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

      height : 550,

      resizable : false
    });

  }

};