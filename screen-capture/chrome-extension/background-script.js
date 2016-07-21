/**
 *
 * Background script for Djoe screen capture extension
 *
 * Executed in background. Ask for media and return it.
 *
 *
 * @param message
 */

var config = {
  debug : true, messagePrefix : "djoe.screencapture-extension."
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
log("Background script desktop capture extension");

// default screen options
var screenOptions = ['screen', 'window'];

/**
 * Listen messages from content script
 */
chrome.runtime.onConnect.addListener(function(port) {

  port.onMessage.addListener(function(message) {

    // someone request screen
    if (message === messages.getScreenSourceId) {
      chrome.desktopCapture.chooseDesktopMedia(screenOptions, port.sender.tab, onAccessApproved);
    }

    // someone tab and audio
    else if (message === messages.getAPTSourceId) {
      screenOptions = ['audio', 'tab'];
      chrome.desktopCapture.chooseDesktopMedia(screenOptions, port.sender.tab, onAccessApproved);
    }

    else {
      log("Unknown message: ", message);
    }

  });

  // on getting sourceId
  // "sourceId" will be empty if permission is denied.
  function onAccessApproved(sourceId) {
    // if "cancel" button is clicked
    if (!sourceId || !sourceId.length) {
      return port.postMessage('PermissionDeniedError');
    }

    // "ok" button is clicked; share "sourceId" with the
    // content-script which will forward it to the webpage
    port.postMessage({
      sourceId : sourceId
    });
  }
});
