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
        throw "Unknown event: " + event + " / Availables: " + self._availableEvents;
      }

      if (typeof element !== "function") {
        throw "Invalid callback, must be a function: " + (typeof element);
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
      throw "Module already exist: " + module.name;
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
      throw "Unknown event: " + targetEvent + " / Availables: " + self._availableEvents;
    }

    targetArguments = targetArguments || [];

    if (targetArguments.constructor !== Array) {
      throw "Invalid arguments specified (must provide an array): " + targetArguments;
    }

    // call registered callbacks
    $.each(self._callbacks, function(event, callback) {

      if (event === targetEvent) {

        try {

          callback.apply(callback, targetArguments);

          called++;

        } catch (e) {
          console.error("Error in jsxc.api.callback");
          console.error(e);
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
   * Open chat window bound to the specified login
   *
   * login can be a jid node or a bare jid
   *
   * @param login
   */
  openChatWindow : function(jid) {

    var self = jsxc.api;

    self.checkConnectedOrThrow();

    jid = Strophe.getBareJidFromJid(jid);

    // check if jid is a buddy
    if (self.getBuddyList().indexOf(jid) > -1) {
      jsxc.gui.window.open(jid);
    }

    else {
      self.feedback(Strophe.getNodeFromJid(jid) + " n'est pas dans vos contacts");
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
  checkConnectedOrThrow: function(){

    var self = jsxc.api;

    if(self.isConnected() !== true){
      
      self.feedback("Vous n'êtes pas connecté au client de messagerie");
      jsxc.gui.roster.toggle("shown");

      throw "Not connected to JSXC client";
    }
  }

};