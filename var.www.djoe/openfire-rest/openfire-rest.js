
// URL de base du service REST, sans le '/' final
var apiBaseUrl = "https://test-messagerie.ddns.net:9091/plugins/restapi/v1";

// Clef d'accès à l'API
var apiKey = "h5711OI5JckLdAO3";

$(document).ready(function(){

    // afficher la liste des utilisateurs
    orest.showUserList();

    // créer les utilisateurs par défaut
//    var defaultPassword = "azerty";
//    orest.createUsers([
//        {username: "miguel", password: defaultPassword},
//        {username: "remi", password: defaultPassword},
//        {username: "nicolas", password: defaultPassword},
//        {username: "chewbacca", password: defaultPassword},
//        {username: "companioncube", password: defaultPassword}
//    ]);

    // Supprimer une liste d'utilisateurs fictifs
    //orest.deleteDummies("dummy", 20);

});

var orest = {

    /**
        Créer une liste d'utilisateurs
    */
    createUsers: function(users){
        $.each(users, function(index, user){
            console.log(user);
            orest.createUser(user);
        });
    },
    /**
        Créer un d'utilisateur
    */
    createUser: function(user){
        orest.asyncRequest(
            'POST',
            "/users",
            user,
            {"Content-Type": "application/json"}
            );
    },

    /**
        Effacer une liste d'utilisateurs créés pour développement
    */
    deleteDummies: function(prefix, max){

        if(typeof prefix === "undefined"){
            throw "Parameter cannot be undefined: " + prefix;
        }
        if(typeof prefix === "undefined"){
            throw "Parameter cannot be undefined: " + max;
        }

        for(var i = 0; i < max; i++){
            orest.deleteUser(prefix + i);
        }

    },

    /**
        Effacer un utilisateur
    */
    deleteUser: function(name){

        if(typeof name === "undefined"){
            throw "Parameter cannot be undefined: " + name;
        }

        orest.asyncRequest('DELETE', "/users/" + name)
    },

    /**
        Afficher la liste des utilisateurs
    */
    showUserList: function(){
        orest.asyncRequest('GET', "/users", undefined, {"Accept": "application/json"});
    },

    /**
        Raccourci pour effectuer une requete sur l'API REST
    */
    asyncRequest: function(type, url, data, headers){

         if(typeof type === "undefined"){
                throw "Parameter cannot be undefined: " + type;
         }
         if(typeof url === "undefined"){
                throw "Parameter cannot be undefined: " + url;
         }

        var restUrl = apiBaseUrl + url;

        var req = {
                  url: restUrl,
                  type: type,
                  headers: {
                      "Authorization": apiKey
                  },
                  success: function(result) {
                      console.log(type + ": " + url);
                      console.log("SUCCESS");
                      console.log(result);

                      orest.log(type + ": " + url + "\nSUCCESS: "
                        + "\nRequête: " + JSON.stringify(req, null, '\t')
                        + "\nRéponse: " + JSON.stringify(result, null, '\t')
                        );

                  },
                  error: function(result){
                      console.log(type + ": " + url);
                      console.log("ERROR");
                      console.log(result);

                      orest.log(type + ": " + url + "\nERROR: "
                        + "\nRequête: " + JSON.stringify(req, null, '\t')
                        + "\nRéponse: " + JSON.stringify(result, null, '\t')
                        + "\nData: " + $.param(req.data)
                        );
                  }
              };

        // ajouter des données si necessaire
        if(typeof data !== "undefined"){
            req.data = data;
            console.log(data);
        }

        // ajouter entetes si necessaire
        if(typeof headers !== "undefined"){
            $.extend(req.headers, headers);
        }

        $.ajax(req);

    },

    /**
        Afficher du contenu dans une zone
    */
    log: function(content){
        $("#logArea").append("<div class='logElement'><pre>" + content + "</pre></div>");
    }


};

