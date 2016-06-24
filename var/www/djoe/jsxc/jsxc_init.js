$(function () {

    "use strict";

    console.log("Initializing instant messaging");

    // page domain
    var domain = document.domain;

    // service XMPP / HTTP
    // var boshUrl = "https://" + domain + "/http-bind/";
    var boshUrl = "https://" + domain + "/http-bind/";

    // xmpp domains
    var xmppDomain = domain;
    var searchDomain = "search." + domain;

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

    Strophe.log = function (level, msg) {
        if (level >= stLogLevel) {
            console.error("Strophe [" + level + "] " + msg);
            console.error((new Error()).stack);
        }
    };

    // Initialize JSXC
    jsxc.init({

        // enable Etherpad support
        etherpad: {
            enabled: true,
            ressource: etherpadRes
        },

        // MUST specify muc server to avoid errors
        muc: {
            server: "conference.im.silverpeas.net"
        },

        // xmpp options
        xmpp: {
            url: boshUrl,
            domain: xmppDomain,
            resource: xmppResource,
            overwrite: true,
            searchDomain: searchDomain,
        },

        // disable otr because of display disturbing
        otr: {
            enable: false
        },

        // if 404 errors precise jsxc root
        root: 'jsxc/',

        // RTCPeerConfiguration used for audio/video calls.
        RTCPeerConfig: {

            /** Time-to-live for config from url */
            ttl: 3600,

            /** [optional] If set, jsxc requests and uses RTCPeerConfig from this url */
            url: null,

            /** If true, jsxc send cookies when requesting RTCPeerConfig from the url above */
            withCredentials: false,

            /** ICE servers like defined in http://www.w3.org/TR/webrtc/#idl-def-RTCIceServer */
            iceServers: [

                {urls: "stun:turn1.silverpeas.net:80"},

                {
                    urls: "turns:turn1.silverpeas.net:443",
                    credential: "orv227EAdGEZ_ldSMadxhmbSxtnmvnMx",
                    credentialType: "password",
                    username: "djoe"
                }
            ]
        }

    });


    // connexion
    var id = "remi@" + xmppDomain;

    // connexion et lancement du GUI
    jsxc.start(id, "azerty");


});

