
$(function() {

  // xmpp domain
  var xmppDomain = "heydjoe.xmpp";

  var defaultPassword = "azerty";

  /**
   * Developpers informations
   */

  var devBlock = $("#developperInformations");
  $("#deployDevInf").click(function() {
    if (devBlock.is(':visible') === false) {
      devBlock.css({'display' : 'block', 'opacity' : '0'}).animate({opacity : '1'}, 1000);
    }
  });

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
    $("#feedbackArea").html("Error while connecting. Please refresh page and try again.");
  });

  // listen connexion success
  $(document).on("attached.jsxc", function() {
    $("#feedbackArea").html("Connection established");
  });

  /**
   * Connection form
   */

  // create and show random login
  var randomLoginTxt = $("#randomLogin");

  function showRandomName() {
    randomLoginTxt.val((chance.first() + "-" + chance.last()).toLowerCase());
  }

  var randomLoginsInt = setInterval(function() {
    showRandomName();
  }, 2000);

  var clearRandomLoginsInt = function() {
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

    var userNode = $("#randomLogin").val();

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
                "Error while connecting. Please refresh page and try again. (code: " +
                (response.status || "undefined") + ")");
          }

        });

    setTimeout(function() {
      jsxc.newgui.toggleChatSidebar(true);
    }, 3000);

  });

  // disconnect button
  $('#disconnectButton').click(function() {

    jsxc.xmpp.logout(true);

  });

});