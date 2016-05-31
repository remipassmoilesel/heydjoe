
// le domaine de la page
var domain =  document.location.host;

// service XMPP / HTTP
//var boshUrl =  'http://' + domain + ':7070/http-bind/';
var boshUrl = "https://test-messagerie.ddns.net:7443/http-bind/";

// domaine xmpp (différent du domaine de la page)
var xmppDomain = "test-messagerie.ddns.net";

// nom du client
var xmppResource = "heyDjoe";

var webAdminUrl = "http://" + domain + ":9090/";
var consoleAdminUrl = "http://" + domain + ":9091/";
var etherpadUrl = "http://" + domain + ":9001/";
var consoleUrl = "http://" + domain + "/console/";

$(function() {

    console.log("Initialisation");

    // activer les panneau Jquery UI du fichier index
    $( "#tabs" ).tabs();

    // initialisation de JSXC
    // l'option off the record est désactivée
    jsxc.init({
      xmpp: {
        url: boshUrl,
        domain: xmppDomain,
        resource: xmppResource,
        overwrite: true,
        onlogin: true
      },
      otr: {
          enable: false
      },
      root: '/jsxc.git/build/',

      /** RTCPeerConfiguration used for audio/video calls. */
        RTCPeerConfig: {
        /** Time-to-live for config from url */
        ttl: 3600,

        /** [optional] If set, jsxc requests and uses RTCPeerConfig from this url */
        url: null,

        /** If true, jsxc send cookies when requesting RTCPeerConfig from the url above */
        withCredentials: false,

        /** ICE servers like defined in http://www.w3.org/TR/webrtc/#idl-def-RTCIceServer */
        iceServers: [
            { urls: "turn:test-messagerie.ddns.net:3478",
                credential: "orv227EAdGEZ_ldSMadxhmbSxtnmvnMx",
                credentialType: "password",
                username: "djoe"
                },
            { urls: "turns:test-messagerie.ddns.net:5349",
                credential: "orv227EAdGEZ_ldSMadxhmbSxtnmvnMx",
                credentialType: "password",
                username: "djoe"
                },
            {urls: 'stun:stun.l.google.com:19302'},
            {urls: 'stun:stun1.l.google.com:19302'},
            {urls: 'stun:stun2.l.google.com:19302'},
            {urls: 'stun:stun3.l.google.com:19302'},
            {urls: 'stun:stun.voiparound.com'},
            {urls: 'stun:stun.voipbuster.com'},
            {urls: 'stun:stun.voipstunt.com'},
            {urls: 'stun:stun.voxgratia.org'}
            ]
        }

/** ICE servers like defined in http://www.w3.org/TR/webrtc/#idl-def-RTCIceServer */
//             iceServers: [
//            {urls: 'stun:stun.l.google.com:19302'},
//            {urls: 'stun:stun1.l.google.com:19302'},
//            {urls: 'stun:stun2.l.google.com:19302'},
//            {urls: 'stun:stun3.l.google.com:19302'},
//            {urls: 'stun:stun4.l.google.com:19302'},
//            {urls: 'stun:stun01.sipphone.com'},
//            {urls: 'stun:stun.ekiga.net'},
//            {urls: 'stun:stun.fwdnet.net'},
//            {urls: 'stun:stun.ideasip.com'},
//            {urls: 'stun:stun.iptel.org'},
//            {urls: 'stun:stun.rixtelecom.se'},
//            {urls: 'stun:stun.schlund.de'},
//            {urls: 'stun:stunserver.org'},
//            {urls: 'stun:stun.xten.com'},
//            {urls: 'stun:stun.softjoys.com'},
//            {urls: 'stun:stun.voiparound.com'},
//            {urls: 'stun:stun.voipbuster.com'},
//            {urls: 'stun:stun.voipstunt.com'},
//            {urls: 'stun:stun.voxgratia.org'}
//
//            ]


    });

    // Connexion à partir d'un identifiant saisi et d'un mot de passe déterminé
    $('#connexionButton').click(function(){

//        console.log($("#jidTextInput").val());

        // verifier si l'identifiant est complet
        var id = $("#jidTextInput").val().trim();

        if(id.indexOf("@") === -1){
            id += "@" + xmppDomain;
        }

        // activer le mode debuggage
        //jsxc.storage.setItem('debug', true)
        jsxc.storage.setItem('debug', false)

//        console.log(id);

        // connexion et lancement du GUI
        jsxc.start(id, "azerty");

        // afficher les serveurs RTS
//        setTimeout(function(){
//            console.log("Serveurs RTC disponibles: ");
//            console.log(jsxc.options.get('RTCPeerConfig').iceServers);
//        }, 2000);

    });

    /**
        Création d'Etherpad
    **/

     // Connexion à partir d'un identifiant saisi et d'un mot de passe déterminé
    $('#newPadButton').click(function(){
        window.open(etherpadUrl + "p/" + $("#newPadName").val(), '_blank');
    });

    // afficher les comptes dispos etc ...
    showInformations();
});

function showInformations(){

  // afficher les comptes disponibles
    var appendToAccounts = function(name, elmt){
        $('#availablesAccounts').append("<tr><td>" + (name || '') + "</td><td>" + elmt + "</td><tr/>");
    };

    appendToAccounts('admin', '*');
    appendToAccounts('yohann', '*');
    appendToAccounts('miguel', '*');
    appendToAccounts('aurore', '*');
    appendToAccounts('nicolas', '*');
    appendToAccounts('david', '*');
    appendToAccounts('jean', '*');
    appendToAccounts('julescesar', '*');
    appendToAccounts('kazoi', '*');
    appendToAccounts('paul', '*');
    appendToAccounts('zezette', '*');
    appendToAccounts('companioncube', '*');

    // afficher des infos utiles
    var appendToUtilsInfo = function(name, elmt){
        $('#infoDisplay').append("<tr><td>" + (name || '') + "</td><td>" + elmt + "</td><tr/>");
    };

    appendToUtilsInfo('Feuille de route',
        '<a target="_blank" href="http://test-messagerie.ddns.net:9001/p/feuille-de-route">http://test-messagerie.ddns.net:9001/p/feuille-de-route</a>');

    appendToUtilsInfo('Console XMPP',
        '<a target="_blank" href="' + consoleUrl + '">' + consoleUrl + '</a>');

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


