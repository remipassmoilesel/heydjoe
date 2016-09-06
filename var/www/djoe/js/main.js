$(function() {

  /**
   *
   * Various informations
   *
   *
   */

  // page domain
  var pageDomain = "im.silverpeas.net";

  // xmpp domain
  var xmppDomain = "im.silverpeas.net";

  // default credentials
  var availablesLogins = ["remi", "david", "yohann", "miguel", "aurore", "nicolas", "sebastien",
    "jules", "jacques", "paul"];
  var defaultPassword = "azerty";

  var boshTest = "https://" + pageDomain + "/bosh-test/";
  var iceTest = "https://" + pageDomain + "/ice-test/";
  var webAdminUrl = "http://" + pageDomain + ":9090/";
  var etherpadUrl = "https://" + pageDomain + "/etherpad/";
  var consoleUrl = "https://" + pageDomain + "/xmpp-console/";
  var discoUrl = "https://" + pageDomain + "/xmpp-disco/";

  /**
   * Dev tools
   *
   */

  // Initialize consoles
  $("#eventsConsole").eventConsole();
  $("#storageConsole").storageConsole();

  $(document).on("attached.jsxc", function() {
    $("#xmppInspector").xmppInspector(jsxc.xmpp.conn);
  });

  /**
   * Connection feedbacks
   *
   */

  // Listen connexion fail
  $(document).on("authfail.jsxc", function() {
    jsxc.xmpp.logout(true);
    $("#feedbackArea").html("Echec de la connexion. Rechargez la page puis rééssayez !");
  });

  // listen connexion success
  $(document).on("attached.jsxc", function() {
    $("#feedbackArea").html("Connexion établie");
  });

  /**
   * Connection form
   */

  // create and show random login
  var randomLoginTxt = $("#randomLogin");
  function showRandomName() {
    randomLoginTxt.val((chance.first() + "-" + chance.last()).toLowerCase());
  }

  var randomLoginsInt = setInterval(function(){
    showRandomName();
  }, 2000);

  var clearRandomLoginsInt = function(){
    clearInterval(randomLoginsInt);
  };

  randomLoginTxt.keyup(function() {
    $("#connexionForm input[value='random']").trigger("click");
    clearRandomLoginsInt();
  });

  randomLoginTxt.click(function() {
    $("#connexionForm input[value='random']").trigger("click");
    clearRandomLoginsInt();
  });

  $("#refreshRandomLogin").click(function() {
    showRandomName();
    $("#connexionForm input[value='random']").trigger("click");
    clearRandomLoginsInt();
  });
  showRandomName();

  $("#predefinedJidList").click(function() {
    $("#connexionForm input[value='predefined']").trigger("click");
  });



  $('#connectButton').click(function() {

    clearRandomLoginsInt();

    var userNode;

    if ($("#connexionForm input[value='random']:checked").length === 1) {
      userNode = $("#randomLogin").val();
    }

    else {
      userNode = $("#predefinedJidList").val();
    }

    userNode = userNode.trim().toLowerCase();
    var userJid = userNode + "@" + xmppDomain;

    // create user if needed
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
                (response.status || "indéfini") + ")</i>");
          }

        });

  });

  // disconnect button
  $('#disconnectButton').click(function() {
    jsxc.xmpp.logout(true);
  });

  // show availables accounts
  for (var i = 0; i < availablesLogins.length; i++) {
    var lg = availablesLogins[i];

    // les ajouter à la liste de sélection de pseudo
    $("#predefinedJidList").append("<option value='" + lg + "'>" + lg + "</option>");
  }

  /**
   * Demo tours
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

  // utils and informations
  var appendToLinks = function(name, target, nolink) {

    var element = $('<div>');
    element.append($('<span class="name">').text(name + ": "));

    var targetTxt = target.length < 50 ? target : target.substr(0, 47) + "...";

    if(nolink){
      element.append(
          $('<span class="target">').text(targetTxt));
    }

    else {
      element.append(
          $('<a class="target">').text(targetTxt).attr('href', target).attr('target', '_blank'));
    }

    $("#links").append(element);
  };

  var devBlock = $("#developperInformations");
  $("#deployDevInf").click(function() {
    if (devBlock.is(':visible') === false) {
      devBlock.css({'display' : 'block', 'opacity' : '0'}).animate({opacity : '1'}, 1000);
    }
  });

  appendToLinks('Domaine', pageDomain, true);
  appendToLinks('Domaine XMPP', xmppDomain, true);
  appendToLinks('Feuille de route', 'https://' + pageDomain + '/etherpad/p/feuille-de-route');
  appendToLinks('Dépôt Github', 'https://github.com/remipassmoilesel/djoe');
  appendToLinks('Statistiques recueillies', 'https://' + pageDomain + '/stats/visualization/');
  appendToLinks('Activité du serveur', 'http://' + pageDomain +
      ':8080/monitorix-cgi/monitorix.cgi?mode=localhost&graph=all&when=1day&color=black');
  appendToLinks('Console XMPP', consoleUrl);
  appendToLinks('Découverte de services XMPP', discoUrl);
  appendToLinks('Test de connexion BOSH', boshTest);
  appendToLinks('Test de connexion ICE', iceTest);
  appendToLinks('API REST Openfire', 'https://' + pageDomain + '/openfire-rest-example');
  appendToLinks('Administration web Openfire', webAdminUrl);
  appendToLinks('Etherpad', etherpadUrl);
  appendToLinks('Wiki JSXC', 'https://github.com/jsxc/jsxc/wiki');

});