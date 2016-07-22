$(function() {

  "use strict";

  console.log("Initializing instant messaging");

  // etherpad resource
  var etherpadRes = "https://im.silverpeas.net/etherpad/";

  // clientName
  var xmppResource = "heyDjoe";

  // jsxc debug mode
  jsxc.storage.setItem('debug', false)

  // afficher les erreurs de Strophe, indispensable
  var stLogLevel = Strophe.LogLevel.WARN;

  Strophe.log = function(level, msg) {
    if (level >= stLogLevel) {
      console.error("Strophe [" + level + "] " + msg);
      console.error((new Error()).stack);
    }
  };

  /**
   *   Initialization options for JSXC
   */

  var options = {

    // in french
    defaultLang : 'fr',

    autoLang : false,

    // REST support
    rest : {
      apiName : "openfire",
      apiBaseUrl : "https://im.silverpeas.net/openfire-rest",
      apiKey : "ztR2yJWNRu9ffPIw"
    },

    // enable Etherpad support
    etherpad : {
      enabled : true,

      ressource : etherpadRes
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
      url : "https://im.silverpeas.net/http-bind/",
      domain : "im.silverpeas.net",
      resource : xmppResource,
      overwrite : true,
      searchDomain : "search.im.silverpeas.net",
    },

    // disable otr because of display disturbing
    otr : {
      enable : false
    },

    // if lot of 404 errors precise jsxc root
    root : 'jsxc/',

    // stat module. save and monitor events
    stats : {
      enabled : true,
      destinationUrl : "https://im.silverpeas.net/stats",
      autosend : true,
      authorization : "DK5I4-0yl9N2KN64Pg5YcEAsdnCXeamr"
    },

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
    },

  };

  /**
   * Silverpeas connexion
   */
  if (window.jsxcConnexionCredentials) {

    var SilverpeasCustomModule = {

      /**
       * Open a chat window by user id
       * @param userId
       */
      openChatWindowById : function(userId) {

        // credential should be stored on page
        var cred = window.jsxcConnexionCredentials;
        var context = cred.silverpeasContext;

        User.get(userId).then(function(data) {
          jsxc.api.openChatWindow(data.login + "@" + cred.xmppDomain);
        })

            .fail(function(error) {
              console.error("Error while retrieving user login");
              console.error(data);

              jsxc.api.feedback("Erreur lors de l'ouverture de la fenêtre de discussion");
            });

      },

      /**
       * Connect user to chat client
       */
      connect : function() {
        // credential should be stored on page
        var cred = window.jsxcConnexionCredentials;

        // get bare jid
        var jid = cred.userLogin.toLowerCase() + "@" + cred.xmppDomain;

        // launch and show
        jsxc.start(jid, cred.userPassword);
        jsxc.gui.roster.toggle('shown');
      },

      /**
       * Send Silverpeas invitation to user
       * @param login
       */
      inviteUser : function(login) {

        // credential should be stored on page
        var cred = window.jsxcConnexionCredentials;
        var context = cred.silverpeasContext;

        $.getJSON(context + "/InvitationJSON", {
          IEFix : new Date().getTime(),
          Action : 'SendInvitation',
          Message : "",
          TargetUserLogin : login,
          TargetUserDomainId : cred.userDomainId
        }, function(data) {

          if (!data.success) {
            jsxc.api.feedback("Erreur lors de l'invitation de l'utilisateur");
          }

        });

      }

    };

    jsxc.api.registerCustomModule({
      name : "Silverpeas", module : SilverpeasCustomModule,
    });

    var SilverpeasCallbackSet = {

      /**
       * Reconnect client on demand from user
       */
      "onReconnectDemand" : function() {
        jsxc.api.Silverpeas.connect();
      },

      /**
       * Send Silverpeas invitation on XMPP buddy added
       *
       * @param buddyBJid
       */
      "onBuddyAdded" : function(buddyBJid) {
        var login = Strophe.getNodeFromJid(buddyBJid);
        jsxc.api.Silverpeas.inviteUser(login);
      },

      "onBuddyAccepted" : function(buddyBJid) {
        console.log("onBuddyAccepted");
        console.log(buddyBJid);
      },
      
    };

    jsxc.api.registerCallbacks(SilverpeasCallbackSet);

    // credential must be stored on page
    var cred = window.jsxcConnexionCredentials;

    /** Correction JSXC Options */
    options.xmpp.url = cred.httpBindUrl;
    options.xmpp.domain = cred.xmppDomain;
    options.root = cred.silverpeasContext + "/chatclient";

    // initialisation
    jsxc.init(options);

    jsxc.api.Silverpeas.connect();
  }

  else {
    // initialisation
    jsxc.init(options);
  }

});

