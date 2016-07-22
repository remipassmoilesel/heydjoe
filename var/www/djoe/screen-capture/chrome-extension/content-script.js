/**
 *
 * Content script for Djoe screen capture extension
 *
 * Executed in page context. Just relay messages to the background script
 *
 *
 *
 * @param message
 */

var config = {
  debug : false, messagePrefix : "djoe.screencapture-extension."
}

/**
 * Different messages can be sent or received
 * @type {string}
 */
var messages = {
  isAvailable : config.messagePrefix + "is-available",
  available : config.messagePrefix + "available",
  getScreenSourceId : config.messagePrefix + "get-screen-source-id",
  getAPTSourceId : config.messagePrefix + "get-audio-plus-tab-source-id"
};

/**
 * Log function
 * @param message
 */
function log(message) {

  if (config.debug !== true) {
    return;
  }
  
  console.log("[CHROME-EXT CTN] " + message);
  for (var i = 1; i < arguments.length; i++) {
    console.log(arguments[i]);
  }
}
log("Initializing Chrome desktop capture extension");

/**
 * Return true if the message concern extension
 */
function filterMessage(message) {

  if (typeof message !== "string") {
    return false;
  }

  for (var key in messages) {
    if (!messages.hasOwnProperty(key)) {
      continue;
    }

    var value = messages[key];

    if (message === value) {
      return true;
    }
  }

  return false;
}

/**
 * Connexion with background script
 */
var port = chrome.runtime.connect();

/**
 * Forward messages from background script to web page
 */
port.onMessage.addListener(function(message) {
  window.postMessage(message, '*');
});

/**
 * Forward messages from webpage to background script
 */
window.addEventListener('message', function(event) {

  log("Event received: ", event);

  // if invalid source
  if (event.source != window) {
    log("Invalid message");
    return;
  }

  var message = event.data;

  // filter messages
  if (filterMessage(message) !== true) {
    log("Invalid message", event.data);
    return;
  }

  // someone ask if extension is available
  if (message === messages.isAvailable) {
    window.postMessage(messages.available, "*");
    return;
  }

  // otherwise transfer message to background script
  port.postMessage(message);

});

// inform browser that extension is available
window.postMessage(messages.available, '*');
