$(function() {

  "use strict";

  console.log("Initializing instant messaging");

  var defaultPassword = "azerty";

  // page domain
  var pageDomain = document.domain;

  // xmpp over http url
  var boshUrl;
  // xmpp server domain
  var xmppDomain;
  // domain for search (XEP 0055)
  var searchDomain;

  // dev mode
  if (pageDomain === "localhost" || pageDomain === "127.0.0.1") {
    boshUrl = "https://im.silverpeas.net/http-bind/";
    xmppDomain = "im.silverpeas.net";
    searchDomain = "search." + "im.silverpeas.net";
  }

  // normal mode
  else {
    boshUrl = "https://" + pageDomain + "/http-bind/";
    xmppDomain = pageDomain;
    searchDomain = "search." + pageDomain;
  }

  // etherpad resource
  var etherpadRes = "https://im.silverpeas.net/etherpad/";

  // clientName
  var xmppResource = "heyDjoe";

  // jsxc debug mode
  //jsxc.storage.setItem('debug', true)
  jsxc.storage.setItem('debug', false)

  // afficher les erreurs de Strophe, indispensable
  // var stLogLevel = Strophe.LogLevel.INFO;
  var stLogLevel = Strophe.LogLevel.WARN;

  Strophe.log = function(level, msg) {
    if (level >= stLogLevel) {
      console.error("Strophe [" + level + "] " + msg);
      console.error((new Error()).stack);
    }
  };

  function silverpeasConnexion() {

    var userNode = $.cookie("svpLogin").toLowerCase().trim();
    var userJid = userNode + "@" + xmppDomain;

    /**
     * Create eventually an user if not existing and connect him.
     */
    var createUserAndConnect = function() {

      jsxc.rest.openfire.createUser(userNode)

          .then(function() {

            // connexion et lancement du GUI
            jsxc.start(userJid, defaultPassword);

            jsxc.gui.roster.toggle('shown');

          }, function(response) {

            // acceptable codes: created, exist,
            var codes = [201, 409];

            // not a fatal error, connexion
            if (codes.indexOf(response.status) !== -1) {
              jsxc.start(userJid, defaultPassword);

              jsxc.gui.roster.toggle('shown');
            }

            // other fail
            else {
              console.error("Fail creating chat user");
              console.error(response);
            }

          });

    };

    // check if not connected with another account
    if (localStorage && jsxc && jsxc.storage && jsxc.storage.getItem &&
        jsxc.storage.getItem('jid')) {

      var pNode = Strophe.getNodeFromJid(jsxc.storage.getItem('jid'));

      // need to be improved
      if (pNode.toLowerCase() !== userNode) {

        console.log("Connecting with another profile, clearing data storage.");
        console.log(pNode, userNode);

        jsxc.xmpp.logout(true);

        localStorage.clear();

        setTimeout(createUserAndConnect, 700);
      }

      else {

        console.log("Connexion");

        createUserAndConnect();
      }

    }

    else {

      console.log("Connexion");

      createUserAndConnect();

    }

  }

  // Initialize JSXC
  var options = {

    // REST support
    rest : {
      apiName : "openfire",
      apiBaseUrl : "https://im.silverpeas.net/openfire-rest",
      apiKey : "ztR2yJWNRu9ffPIw"
    },

    // enable Etherpad support
    etherpad : {
      enabled : true, ressource : etherpadRes
    },

    // MUST specify muc server to avoid errors
    muc : {
      server : "conference.im.silverpeas.net"
    },

    favicon : {
      enable : false,
    },

    // xmpp options
    xmpp : {
      url : boshUrl,
      domain : xmppDomain,
      resource : xmppResource,
      overwrite : true,
      searchDomain : searchDomain,
    },

    // disable otr because of display disturbing
    otr : {
      enable : false
    },

    // if 404 errors precise jsxc root
    root : 'jsxc/',

    // RTCPeerConfiguration used for audio/video calls.
    RTCPeerConfig : {

      /** Time-to-live for config from url */
      ttl : 3600,

      /** [optional] If set, jsxc requests and uses RTCPeerConfig from this url */
      url : null,

      /** If true, jsxc send cookies when requesting RTCPeerConfig from the url above */
      withCredentials : false,

      /** ICE servers like defined in http://www.w3.org/TR/webrtc/#idl-def-RTCIceServer */
      iceServers : [

        {urls : "stun:turn1.silverpeas.net:80"},

        {
          urls : "turns:turn1.silverpeas.net:443",
          credential : "orv227EAdGEZ_ldSMadxhmbSxtnmvnMx",
          credentialType : "password",
          username : "djoe"
        }]
    }

  };

  if ($.cookie && $.cookie("svpLogin")) {
    options.callbacks = {
      reconnectCb : silverpeasConnexion
    };
  }

  jsxc.init(options);

  // auto startup on silverpeas
  if ($.cookie && $.cookie("svpLogin")) {
    silverpeasConnexion();
  }

});

