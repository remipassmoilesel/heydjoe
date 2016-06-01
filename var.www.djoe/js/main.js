
// le domaine de la page
var domain =  document.location.host;

// service XMPP / HTTP
//var boshUrl =  'http://' + domain + ':7070/http-bind/';
var boshUrl = "https://" + domain + ":7443/http-bind/";

// domaine xmpp (différent du domaine de la page)
var xmppDomain = "im.silverpeas.net";

// nom du client
var xmppResource = "heyDjoe";

var webAdminUrl = "http://" + domain + ":9090/";
var consoleAdminUrl = "http://" + domain + ":9091/";
var etherpadUrl = "http://" + domain + ":9001/";
var consoleUrl = "https://" + domain + "/xmpp-console/";

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
    "jean",
    "julescesar",
    "companioncube"
];

$(function() {

    console.log("Initialisation");

    // activer les panneau Jquery UI du fichier index
    $( "#tabs" ).tabs();

    // afficher les comptes dispos etc ...
    constructGui();

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
            { urls: "turn:im.silverpeas.net:3478",
                credential: "orv227EAdGEZ_ldSMadxhmbSxtnmvnMx",
                credentialType: "password",
                username: "djoe"
                },
            { urls: "turn:im.silverpeas.net:5349",
                credential: "orv227EAdGEZ_ldSMadxhmbSxtnmvnMx",
                credentialType: "password",
                username: "djoe"
                },
            ]
        }

    });

    // Bouton de connexion à partir d'un identifiant sélectionné et d'un mot de passe déterminé
    $('#connectButton').click(function(){

        var id = $("#jidTextInput").val() + "@" + xmppDomain;

        console.log(id);

        // activer le mode debuggage
        //jsxc.storage.setItem('debug', true)
        jsxc.storage.setItem('debug', false)

        // connexion et lancement du GUI
        jsxc.start(id, "azerty");

    });

    // déconnexion
    $('#disconnectButton').click(function(){

        jsxc.xmpp.logout(true);

    });

    /**
        Création d'Etherpad
    **/

     // Connexion à partir d'un identifiant saisi et d'un mot de passe déterminé
    $('#newPadButton').click(function(){
        window.open(etherpadUrl + "p/" + $("#newPadName").val(), '_blank');
    });

});


/**

*/
function constructGui(){

    // ajouter les comptes dispo à la liste de sélection
    for(var i = 0; i < availablesLogins.length; i++){
        var lg = availablesLogins[i];

        // les ajouter à la liste de sélection de pseudo
        $("#jidTextInput").append("<option value='" + lg + "'>" + lg + "</option>");
    }

    // afficher des infos utiles
    var appendToUtilsInfo = function(name, elmt){
        $('#infoDisplay').append("<tr><td>" + (name || '') + "</td><td>" + elmt + "</td><tr/>");
    };

    appendToUtilsInfo('Feuille de route',
        '<a target="_blank" href="http://' + domain + ':9001/p/feuille-de-route">http://' + domain + ':9001/p/feuille-de-route</a>');

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


