/**
 * API for manipulating JSXC
 *
 */

jsxc.api = {

  /**
   * Availables events can be used for register callbacks
   */
  _availableEvents : ['onReconnectDemand', 'onBuddyAdded', 'onBuddyAccepted'],

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

    // call registered callbacks
    $.each(self._callbacks, function(event, callback) {

      if (event === targetEvent) {

        try {

          callback.apply(callback, targetArguments || []);
          
          called ++;

        } catch (e) {
          console.error("Error in jsxc.api.callback");
          console.error(e);
        }

      }

    });
    
    return called;

  },

  /**
   * Open chat window bound to the specified login
   * @param login
   */
  openChatWindow : function(login) {
    console.log(login);
  },

};