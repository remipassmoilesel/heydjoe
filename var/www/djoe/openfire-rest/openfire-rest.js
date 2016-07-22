/**
 *
 * Misc works on Openfire REST API
 *
 *
 *
 * @type {string}
 */

$(document).ready(function() {

  // show all users
  orest.showUserList();

  // show all chatrooms
  orest.showChatroomList();

  // create default users
  // var defaultPassword = "azerty";
  // orest.createUsers([
  //     {username: "miguel", password: defaultPassword},
  //     {username: "remi", password: defaultPassword},
  //     {username: "nicolas", password: defaultPassword},
  //     {username: "chewbacca", password: defaultPassword},
  //     {username: "companioncube", password: defaultPassword}
  // ]);

  // delete all chatrooms
  orest.deleteAllChatrooms();

  // delete all users
  orest.deleteAllUsers();

  // Delete dummy users
  //orest.deleteDummies("dummy", 20);

});

var orest = {

  /**
   * URL for accessing REST API
   */
  apiBaseUrl : "https://im.silverpeas.net:9091/plugins/restapi/v1",

  /**
   * Auth key
   */
  apiKey : "ztR2yJWNRu9ffPIw",

  deleteAllUsers : function() {

    orest.asyncRequest('GET', "/users", undefined, {"Accept" : "application/json"}, false)
        .done(function(response) {

          // iterate rooms
          $.each(response.user, function(index, item) {

            if(item.username !== "admin"){
              // delete room
              orest.asyncRequest('DELETE', "/users/" + item.username);
            }

          });

        });

  },

  /**
   * Delete all chatrooms, no confirmation
   */
  deleteAllChatrooms : function() {
    orest.asyncRequest('GET', "/chatrooms", undefined, {"Accept" : "application/json"}, false)
        .done(function(response) {

          // iterate rooms
          $.each(response.chatRoom, function(index, item) {

            // delete room
            orest.asyncRequest('DELETE', "/chatrooms/" + item.roomName);
          });

        });
  },

  /**
   * Display room list
   */
  showChatroomList : function() {
    orest.asyncRequest('GET', "/chatrooms", undefined, {"Accept" : "application/json"});
  },

  /**
   *
   * Create multiple users from a list
   */
  createUsers : function(users) {
    $.each(users, function(index, user) {
      console.log(user);
      orest.createUser(user);
    });
  },

  /**
   *
   * Create a single user
   */
  createUser : function(user) {
    orest.asyncRequest('POST', "/users", user, {"Content-Type" : "application/json"});
  },

  /**
   *
   * Get user list
   */
  showUserList : function() {
    orest.asyncRequest('GET', "/users", undefined, {"Accept" : "application/json"});
  },

  /**
   *
   * Utils to do async REST requests
   *
   *
   */
  asyncRequest : function(type, url, data, headers, log) {

    if (typeof type === "undefined") {
      throw "Parameter cannot be undefined: " + type;
    }
    if (typeof url === "undefined") {
      throw "Parameter cannot be undefined: " + url;
    }
    if (typeof log === "undefined") {
      log = true;
    }

    var restUrl = orest.apiBaseUrl + url;

    var req = {
      url : restUrl, type : type, dataType : "json", headers : {
        "Authorization" : orest.apiKey
      }
    };

    if (log) {
      req.success = function(result) {
        console.log(type + ": " + url);
        console.log("SUCCESS");
        console.log(result);

        orest.log(
            type + ": " + url + "\nSUCCESS: " + "\nRequête: " + JSON.stringify(req, null, '\t') +
            "\nRéponse: " + JSON.stringify(result, null, '\t'));

      };
      req.error = function(result) {
        console.log(type + ": " + url);
        console.log("ERROR");
        console.log(result);

        orest.log(
            type + ": " + url + "\nERROR: " + "\nRequête: " + JSON.stringify(req, null, '\t') +
            "\nRéponse: " + JSON.stringify(result, null, '\t') + "\nData: " + $.param(req.data));
      };
    }

    // ajouter des données si necessaire
    if (typeof data !== "undefined") {
      req.data = JSON.stringify(data);
    }

    // ajouter entetes si necessaire
    if (typeof headers !== "undefined") {
      $.extend(req.headers, headers);
    }

    return $.ajax(req);

  },

  /**
   * Display content
   * @param content
   */
  log : function(content) {

    var elmt = $("<div class='logElement'><pre>" + content + "</pre></div>");
    elmt.resizable();

    $("#logArea").append(elmt);

  }

};

