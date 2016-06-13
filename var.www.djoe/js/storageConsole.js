/**
 * Afficher les données stocker dans l'espace de stockage local de navigateur
 *
 */
var StorageConsole = function (ctrId) {

    if (typeof ctrId === "undefined") {
        throw "Container cannot be undefined: " + ctrId;
    }

    this.storageNumber = 0;
    this.containerId = ctrId;
    this.logSpaceId = ctrId + "_logspace";
    this.refreshBtn = ctrId + "_refreshButton";
    this.clearLocalBtn = ctrId + "_clearLocalButton";
    this.clearSessionBtn = ctrId + "_clearSessionButton";

    var ctr = $("#" + this.containerId);

    var title = $("<div>Données locales:</div>")
        .css({
            'font-weight': 'bolder',
            'margin': "10px"
        });
    ctr.append(title);

    var controls = $("<div></div>")
        .css({
            'margin': '15px'
        })
        .append("<button id='" + this.refreshBtn + "'>Rafraichir</button>")
        .append("<button id='" + this.clearLocalBtn + "'>Nettoyer le stockage local</button>")
        .append("<button id='" + this.clearSessionBtn + "'>Nettoyer le stockage session</button>");

    ctr.append(controls);

    // espace d'affichage
    ctr.append("<div id='" + this.logSpaceId + "'></div>");
    $("#" + this.logSpaceId).css({
        'padding': '10px',
        'fontSize': '12px',
        'background': 'black',
        'color': 'white',
        'width': "100%",
        'maxHeight': '500px',
        'height': '500px',
        'overflow': 'auto'
    });

    var self = this;

    // mise à jour lors d'un clic
    $("#" + this.refreshBtn).click(function () {
        self.update();
    });

    // effacement du stockage lors d'un clic
    $("#" + this.clearLocalBtn).click(function () {
        localStorage.clear();
        self.update();
    });

    // effacement du stockage lors d'un clic
    $("#" + this.clearSessionBtn).click(function () {
        sessionStorage.clear();
        self.update();
    });

    // + première mise à jour
    self.update();

}

/**
 Mettre à jour
 */
StorageConsole.prototype.update = function () {

    var consoleDiv = $("#" + this.logSpaceId);

    var appendElement = function (key, val) {
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
    if (sessionStorage.length < 1) {
        consoleDiv.append("Espace vide");
    }
    else {
        for (var i = 0; i < sessionStorage.length; i++) {
            var key = sessionStorage.key(i);
            var val = sessionStorage.getItem(key)
            appendElement(key, val);
        }
    }

    consoleDiv.append("<h3>Espace local</h3>")
    if (localStorage.length < 1) {
        consoleDiv.append("Espace vide");
    }
    else {

        for (var i = 0; i < localStorage.length; i++) {
            var key = localStorage.key(i);
            var val = localStorage.getItem(key);
            appendElement(key, val);
        }

    }


}

