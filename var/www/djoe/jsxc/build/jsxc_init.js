/*!
 * djoe v1.0.0 - 2016-10-10
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

$(function() {

  "use strict";

  jsxc.debug("Initializing instant messaging");

  var httpDomain = "hey-djoe.fr";
  var xmppDomain = "heydjoe.xmpp";

  // etherpad resource
  var etherpadRes = "https://" + httpDomain + "/etherpad/";

  // clientName
  var xmppResource = "heyDjoe";

  // jsxc debug mode
  // be careful, before init local storage use may throw exceptions
  if (jsxc.isLocalStorageAvailable() === true) {
    jsxc.storage.setItem('debug', false);
  }

  /**
   *   Initialization options for JSXC
   */
  var options = {

    defaultLang : 'en',

    autoLang : true,

    // REST support
    rest : {
      apiName : "openfire",
      apiBaseUrl : "https://" + httpDomain + "/openfire-rest",
      apiKey : "ztR2yJWNRu9ffPIw"
    },

    // enable Etherpad support
    etherpad : {
      enabled : true,

      ressource : etherpadRes
    },

    // MUST specify muc server to avoid errors
    muc : {
      server : "conference." + xmppDomain
    },

    favicon : {
      enable : false,
    },

    // xmpp options
    xmpp : {
      url : "https://" + httpDomain + "/http-bind/",
      domain : xmppDomain,
      resource : xmppResource,
      overwrite : true,
      searchDomain : "search." + xmppDomain
    },

    // disable otr because of display disturbing
    otr : {
      enable : false
    },

    // if lot of 404 errors precise jsxc root
    root : 'jsxc/build',

    // stat module. save and monitor events
    stats : {
      enabled : true,
      destinationUrl : "https://" + httpDomain + "/stats",
      autosend : true,
      authorization : "DK5I4-0yl9N2KN64Pg5YcEAsdnCXeamr"
    },

    // RTCPeerConfiguration used for audio/video calls.
    RTCPeerConfig : {

      url : 'https://' + httpDomain + '/turnCredentials.json'

    }

  };

  // initialisation
  jsxc.init(options);

});

