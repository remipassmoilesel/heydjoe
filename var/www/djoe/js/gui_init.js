$(function () {

    // le domaine de la page
    // var domain =  document.location.host;
    var domain = "im.silverpeas.net";

    /**
     Logins disponibles
     */
    var availablesLogins = [
        "remi",
        "david",
        "yohann",
        "miguel",
        "aurore",
        "nicolas",
        "sebastien"
    ];

    var xmppDomain = "im.silverpeas.net";
    var webAdminUrl = "http://" + domain + ":9090/";
    var consoleAdminUrl = "http://" + domain + ":9091/";
    var etherpadUrl = "http://" + domain + ":9001/";
    var consoleUrl = "https://" + domain + "/xmpp-console/";
    var discoUrl = "https://" + domain + "/xmpp-disco/";

    var xmppResource = "heyDjoe";

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

    // random login
    function showRandomName() {
        $("#randomLogin").val(chance.first() + "_" + chance.last());
    }

    $("#refreshRandomLogin").click(function () {
        showRandomName();
        $(".connexionForm input[value='random']").trigger("click");
    });
    showRandomName();

    $("#predefinedJidList").click(function () {
        $(".connexionForm input[value='predefined']").trigger("click");
    });

    $("#randomLogin").keyup(function () {
        $(".connexionForm input[value='random']").trigger("click");
    });

    // connexion button
    $('#connectButton').click(function () {

        var id;
        if ($(".connexionForm input[value='random']:checked").length === 1) {
            var id = $("#randomLogin").val() + "@" + xmppDomain;
        }

        else {
            id = $("#predefinedJidList").val() + "@" + xmppDomain;
        }

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
        $("#predefinedJidList").append("<option value='" + lg + "'>" + lg + "</option>");
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

});