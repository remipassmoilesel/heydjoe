$(function () {

    "use strict";

    console.log("Initializing instant messaging");

    // le domaine de la page
    // var domain =  document.location.host;
    var domain = "im.silverpeas.net";

    // service XMPP / HTTP
    //var boshUrl =  'http://' + domain + ':7070/http-bind/';
    var boshUrl = "https://" + domain + ":7443/http-bind/";

    // xmpp domains
    var xmppDomain = "im.silverpeas.net";
    var searchDomain = "search.im.silverpeas.net";

    // nom du client
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

    // initialisation de JSXC
    // l'option off the record est désactivée
    jsxc.init({

        // spécifier obligatoirement le serveur MUC pour éviter des erreurs d'initialisation
        muc: {
            server: "conference.im.silverpeas.net"
        },

        xmpp: {
            url: boshUrl,
            domain: xmppDomain,
            resource: xmppResource,
            overwrite: true,
            searchDomain: searchDomain,
        },

        //muc

        /** Off the record désactivé car inutile et source d'erreurs */
        otr: {
            enable: false
        },

        /** Si des erreurs 404 apparaissent dans la console, il faut adapter cette variable */
        root: 'jsxc/',

        /** RTCPeerConfiguration used for audio/video calls. */
        RTCPeerConfig: {

            /** Time-to-live for config from url */
            ttl: 3600,

            /** [optional] If set, jsxc requests and uses RTCPeerConfig from this url */
            url: null,

            /** If true, jsxc send cookies when requesting RTCPeerConfig from the url above */
            withCredentials: false,

            /** ICE servers like defined in http://www.w3.org/TR/webrtc/#idl-def-RTCIceServer */
            /**
             Le serveur STUN est accessible en HTTP et en HTTPS, mais seul le HTTPS et laissé.
             Le serveur TURN n'est accessible qu'en HTTPS

             Mettre des crédential variable, une fois toutes les heures ?
             */
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

    // var id = "remi@" + xmppDomain;
    //
    // // connexion et lancement du GUI
    // jsxc.start(id, "azerty");

    /*
     // Serveurs STUN publics

     {urls: 'stun:stun.l.google.com:19302'},
     {urls: 'stun:stun1.l.google.com:19302'},
     {urls: 'stun:stun2.l.google.com:19302'},
     {urls: 'stun:stun3.l.google.com:19302'},
     {urls: 'stun:stun.voiparound.com'},
     {urls: 'stun:stun.voipbuster.com'},
     {urls: 'stun:stun.voipstunt.com'},
     {urls: 'stun:stun.voxgratia.org'}


     */
});

