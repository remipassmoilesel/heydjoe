$(function () {

    "use strict";

    console.log("Initialisation de la page index");

    // le domaine de la page
    // var domain =  document.location.host;
    var domain = "im.silverpeas.net";

    // service XMPP / HTTP
    //var boshUrl =  'http://' + domain + ':7070/http-bind/';
    var boshUrl = "https://" + domain + ":7443/http-bind/";

    // xmpp domains
    var xmppDomain = "im.silverpeas.net";
    var searchDomain = "search.im.silverpeas.net";
    var bookmarkDomain = "pubsub.im.silverpeas.net";

    // nom du client
    var xmppResource = "heyDjoe";

    var webAdminUrl = "http://" + domain + ":9090/";
    var consoleAdminUrl = "http://" + domain + ":9091/";
    var etherpadUrl = "http://" + domain + ":9001/";
    var consoleUrl = "https://" + domain + "/xmpp-console/";
    var discoUrl = "https://" + domain + "/xmpp-disco/";

    /**
     Logins disponibles
     */
    var availablesLogins = [
        "admin",
        "remi",
        "david",
        "yohann",
        "miguel",
        "aurore",
        "nicolas",
        "sebastien",
        "jean",
        "julescesar",
        "companioncube"
    ];

    // initialize GUI
    initializeGui();

    // console.log("Effacement du stockage local");
    //
    // localStorage.clear();

    // jsxc debug mode
    //jsxc.storage.setItem('debug', true)
    jsxc.storage.setItem('debug', false)

    // afficher les erreurs de Strophe, indispensable
    var stLogLevel = Strophe.LogLevel.WARN;

    Strophe.log = function (level, msg) {
        if (level >= stLogLevel) {
            console.error("Strophe [" + level + "] " + msg);
            console.error((new Error()).stack);
        }
    };

    $(document).on("attached.jsxc", function(){

        jsxc.xmpp.bookmarks.load();
    });

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
            
            bookmarkDomain: bookmarkDomain
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
                },
            ]
        }

    });

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

    function initializeGui() {

        // Initialize consoles
        $("#eventsConsole").eventConsole();
        new StorageConsole("storageConsole");

        $(document).on("attached.jsxc ", function () {
            $("#xmppInspector").xmppInspector(jsxc.xmpp.conn);
        });
        
        
        // index tabs
        $("#tabs").tabs();

        // Listen connexion fail
        $(document).on("authfail.jsxc ", function () {
            jsxc.xmpp.logout(true);
            $("#feedbackArea").html("<b>Echec de la connexion. Rechargez la page puis rééssayez !</b>");
        });

        // listen connexion success
        $(document).on("attached.jsxc ", function () {
            $("#feedbackArea").html("<i>Connexion établie</i>");
        });


        // connexion button
        $('#connectButton').click(function () {

            var id = $("#jidTextInput").val() + "@" + xmppDomain;

            // connexion et lancement du GUI
            jsxc.start(id, "azerty");

        });

        // disconnect button
        $('#disconnectButton').click(function () {
            jsxc.xmpp.logout(true);
        });

        // create pad
        $('#newPadButton').click(function () {
            window.open(etherpadUrl + "p/" + $("#newPadName").val(), '_blank');
        });
        
        // show availables accounts
        for (var i = 0; i < availablesLogins.length; i++) {
            var lg = availablesLogins[i];

            // les ajouter à la liste de sélection de pseudo
            $("#jidTextInput").append("<option value='" + lg + "'>" + lg + "</option>");
        }

        // utils and informations
        var appendToUtilsInfo = function (name, elmt) {
            $('#infoDisplay').append("<tr><td>" + (name || '') + "</td><td>" + elmt + "</td><tr/>");
        };

        appendToUtilsInfo('Feuille de route',
            '<a target="_blank" href="http://' + domain + ':9001/p/feuille-de-route">http://' + domain + ':9001/p/feuille-de-route</a>');

        appendToUtilsInfo('Activité du serveur',
            '<a target="_blank" href="http://im.silverpeas.net:8080/monitorix-cgi/monitorix.cgi?mode=localhost&graph=all&when=1day&color=black">http://im.silverpeas.net:8080/monitorix-cgi/...</a>');

        appendToUtilsInfo('Console XMPP',
            '<a target="_blank" href="' + consoleUrl + '">' + consoleUrl + '</a>');

        appendToUtilsInfo('Découverte de services XMPP',
            '<a target="_blank" href="' + discoUrl + '">' + discoUrl + '</a>');

        appendToUtilsInfo('API REST Openfire',
            '<a target="_blank" href="openfire-rest/">openfire-rest/</a>');

        appendToUtilsInfo('Domaine utilisé', domain);

        appendToUtilsInfo('Domaine XMPP utilisé', xmppDomain);

        appendToUtilsInfo('Nom XMPP du client', xmppResource);

        appendToUtilsInfo('Administration web Openfire',
            '<a target="_blank" href="' + webAdminUrl + '">' + webAdminUrl + '</a>');

        appendToUtilsInfo('Administration console Openfire',
            '<a target="_blank" href="' + consoleAdminUrl + '">' + consoleAdminUrl + '</a>');

        appendToUtilsInfo('Etherpad',
            '<a target="_blank" href="' + etherpadUrl + '">' + etherpadUrl + '</a>');

        appendToUtilsInfo('Wiki JSXC',
            '<a target="_blank" href="https://github.com/jsxc/jsxc/wiki">https://github.com/jsxc/jsxc/wiki</a>');

        appendToUtilsInfo('Liste de ressources',
            '<a target="_blank" href="https://docs.google.com/spreadsheets/d/1qDF4yB3Tpd9Red2sYfCgnISfMBvddke5pYTrwUThyN8/edit#gid=365481387">https://docs.google.com/spreadsheets/...</a>');


    }


});

