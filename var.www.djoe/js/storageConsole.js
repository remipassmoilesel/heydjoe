
/**
 * Afficher les données stocker dans l'espace de stockage local de navigateur
 *
 */
 var StorageConsole = function(ctrId){

    if(typeof ctrId === "undefined"){
        throw "Container cannot be undefined: " + ctrId;
    }

    this.storageNumber = 0;
    this.containerId = ctrId;
    this.logSpaceId = ctrId + "_" + "logspace";
    this.refreshBtn = ctrId + "_" + "refreshButton";

    var ctr = $("#" + this.containerId);

    ctr.append("<div style='font-weight: bolder'>Données locales:</div>");
    ctr.append("<button id='" + this.refreshBtn + "'>Rafraichir</button>");
    ctr.append("<div id='" + this.logSpaceId + "'></div>");

    // mise en forme de la console
    $("#" + this.logSpaceId).css({
                        'fontSize': '12px',
                        'background': 'black',
                        'color': 'white',
                        'width': "100%",
                        'maxHeight': '500px',
                        'height': '500px',
                        'overflow': 'auto'
                    });

    // associer la mise à jour des données avec le bouton
    // + première mise à jour
    var self = this;
    $("#" + this.refreshBtn).click(function(){
        self.update();
    });
    self.update();

 }

/**
    Mettre à jour
*/
 StorageConsole.prototype.update = function(){

    console.log("localStorage");
    console.log(localStorage);
    console.log("sessionStorage");
    console.log(sessionStorage);

    var consoleDiv = $("#" + this.logSpaceId);

     var appendElement = function(key, val){
        var elmt = $("<div>"
                + "ID: <b>" + key + "</b> <br/>"
                + "Data: " + val + "</br>"
                + "</div>")
                .css({
                    border: "solid 1px gray",
                    padding: "5px",
                    margin: "10px"
                });

        consoleDiv.append(elmt);
     }

    // vider l'espace
    consoleDiv.empty();

    consoleDiv.append("<h3>Espace de session</h3>")
    if(sessionStorage.length < 1){
        consoleDiv.append("Espace vide");
    }
    else {
        for (var i = 0; i < sessionStorage.length; i++){
            var key = sessionStorage.key(i);
            var val = sessionStorage.getItem(key)
            appendElement(key, val);
        }
    }

    consoleDiv.append("<h3>Espace local</h3>")
    if(localStorage.length < 1){
        consoleDiv.append("Espace vide");
    }
    else {

        for (var i = 0; i < localStorage.length; i++){
            var key = localStorage.key(i);
            var val = localStorage.getItem(key);
            appendElement(key, val);
        }

    }




 }

