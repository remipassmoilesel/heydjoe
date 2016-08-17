$(function() {

  // page domain
  var pageDomain = "im.silverpeas.net";

  // xmpp domain
  var xmppDomain = "im.silverpeas.net";

  var defaultPassword = "azerty";

  /**
   Logins disponibles
   */
  var availablesLogins = ["remi", "david", "yohann", "miguel", "aurore", "nicolas", "sebastien"];

  var webAdminUrl = "http://" + pageDomain + ":9090/";
  var consoleAdminUrl = "http://" + pageDomain + ":9091/";
  var etherpadUrl = "https://im.silverpeas.net/etherpad/p/%%name%%?showControls=true&showChat=false&showLineNumbers=true&useMonospaceFont=true";
  var consoleUrl = "https://" + pageDomain + "/xmpp-console/";
  var discoUrl = "https://" + pageDomain + "/xmpp-disco/";

  var xmppResource = "heyDjoe";

  /**
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   */

  // Initialize consoles
  $("#eventsConsole").eventConsole();
  new StorageConsole("storageConsole");

  $(document).on("attached.jsxc", function() {
    $("#xmppInspector").xmppInspector(jsxc.xmpp.conn);
  });

  // index tabs
  $("#tabs").tabs();

  // Listen connexion fail
  $(document).on("authfail.jsxc", function() {
    jsxc.xmpp.logout(true);
    $("#feedbackArea").html("<b>Echec de la connexion. Rechargez la page puis rééssayez !</b>");
  });

  // listen connexion success
  $(document).on("attached.jsxc", function() {
    $("#feedbackArea").html("<i>Connexion établie</i>");
  });

  /**
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   */

  // create and show random login
  function showRandomName() {
    $("#randomLogin").val((chance.first() + "_" + chance.last()).toLowerCase());
  }

  $("#refreshRandomLogin").click(function() {
    showRandomName();
    $(".connexionForm input[value='random']").trigger("click");
  });
  showRandomName();

  $("#refreshRandomLogin").click(function() {
    showRandomName();
    $(".connexionForm input[value='random']").trigger("click");
  });

  $("#predefinedJidList").click(function() {
    $(".connexionForm input[value='predefined']").trigger("click");
  });

  $("#randomLogin").keyup(function() {
    $(".connexionForm input[value='random']").trigger("click");
  });

  // connexion button
  $('#connectButton').click(function() {

    var userNode;

    if ($(".connexionForm input[value='random']:checked").length === 1) {
      userNode = $("#randomLogin").val();
    }

    else {
      userNode = $("#predefinedJidList").val();
    }

    userNode = userNode.trim().toLowerCase();
    var userJid = userNode + "@" + xmppDomain;

    jsxc.rest.openfire.createUser(userNode)

        .then(function() {

          // connexion et lancement du GUI
          jsxc.start(userJid, defaultPassword);

          jsxc.gui.roster.toggle('shown');

        }, function(response) {

          // acceptable codes: created, exist,
          var codes = [201, 409];

          // user already exist, connexion
          if (codes.indexOf(response.status) !== -1) {
            jsxc.start(userJid, defaultPassword);

            
          }

          // other fail
          else {
            console.error("Fail creating chat user");
            console.error(response);
            $("#feedbackArea").html(
                "<i>Erreur lors de la creation de l'utilisateur. Veuillez rafraichir la page et réessayer ! (code: " +
                (response.status || "indéfini") + "</i>");
          }

        });

  });

  // disconnect button
  $('#disconnectButton').click(function() {
    jsxc.xmpp.logout(true);
  });

  /**
   *
   *
   *
   *
   *
   *
   *
   *
   *
   */

  // create pad
  $('#newPadButton').click(function() {
    window.open(etherpadUrl.replace("%%name%%", $("#newPadName").val()), '_blank');
  });

  /**
   *
   *
   *
   *
   *
   *
   */

  // show availables accounts
  for (var i = 0; i < availablesLogins.length; i++) {
    var lg = availablesLogins[i];

    // les ajouter à la liste de sélection de pseudo
    $("#predefinedJidList").append("<option value='" + lg + "'>" + lg + "</option>");
  }

  /**
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   */

  // show tutorials
  $(document).on("attached.jsxc ", function() {

    var list = $("#tutorials");
    list.empty();

    var tutorials = jsxc.help.getAllTutorials();
    $.each(tutorials, function(index, element) {
      var opt = $("<option>").text(element.description).val(index);
      list.append(opt);
    });

    list.prop("disabled", false);
    $("#startDemoTour").prop("disabled", false);

  });

  $("#startDemoTour").click(function() {
    jsxc.help.launchTutorial($("#tutorials").val());
  });

  /**
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   *
   */

  // utils and informations
  var appendToUtilsInfo = function(name, elmt) {
    $('#infoDisplay').append("<tr><td>" + (name || '') + "</td><td>" + elmt + "</td><tr/>");
  };

  appendToUtilsInfo('Feuille de route',
      '<a target="_blank" href="http://' + pageDomain + ':9001/p/feuille-de-route">http://' +
      pageDomain + ':9001/p/feuille-de-route</a>');

  appendToUtilsInfo('Activité du serveur',
      '<a target="_blank" href="http://im.silverpeas.net:8080/monitorix-cgi/monitorix.cgi?mode=localhost&graph=all&when=1day&color=black">http://im.silverpeas.net:8080/monitorix-cgi/...</a>');

  appendToUtilsInfo('Console XMPP',
      '<a target="_blank" href="' + consoleUrl + '">' + consoleUrl + '</a>');

  appendToUtilsInfo('Découverte de services XMPP',
      '<a target="_blank" href="' + discoUrl + '">' + discoUrl + '</a>');

  appendToUtilsInfo('API REST Openfire',
      '<a target="_blank" href="openfire-rest/">openfire-rest/</a>');

  appendToUtilsInfo('Domaine utilisé', pageDomain);

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