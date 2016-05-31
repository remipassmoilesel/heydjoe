
/**
    Console affichant tous les evenements JQuery déclenchés

    /!\ Redéfini la méthode de déclenchement d'évenement JQuery,
    /!\ Non testé, peut perturber le fonctionnement d'un script

    Usage:
        <div id="eventsConsole"></div>
        <script>new JQueryEventsConsole("eventsConsole");</script>

*/

var JQueryEventsConsole = function(containerId){

    if(typeof containerId === "undefined"){
        throw "Container cannot be undefined: " + containerId;
    }

    this.eventNumber = 0;
    this.containerId = containerId;
    this.logSpaceId = containerId + "_" + "logspace";

    var ctr = $("#" + this.containerId);

    ctr.append("<div style='font-weight: bolder'>Evènements JQuery</div>");
    ctr.append("<div id='" + this.logSpaceId + "'></div>");

    // mise en forme de la console
    $("#" + this.logSpaceId).css({
                            'fontSize': '12px',
                            'background': 'black',
                            'color': 'white',
                            'width': "100%",
                            'maxHeight': '200px',
                            'height': '200px',
                            'overflow': 'auto'
                        });



    // surcharge de la méthode trigger
    var self = this;
    var superJQueryEventTrigger = $.event.trigger;
    $.event.trigger = function( event, data, elem, onlyHandlers ) {

        self.logEvent(arguments);

        superJQueryEventTrigger( event, data, elem, onlyHandlers );
    }

}

/**
    Afficher un evenement
*/
JQueryEventsConsole.prototype.logEvent = function(){

//    console.log(arguments[0][0]);
//    console.log(arguments);
//    console.log(jQuery._data( arguments[0][2], "events" ));

    this.eventNumber ++;

    var name = typeof arguments[0][0] === "string" ? arguments[0][0] : arguments[0][0].type;

    var consoleDiv = $("#" + this.logSpaceId);

    var log = $("<div>"
                + "#" + this.eventNumber + " Name: <b>" + name + "</b> <br/>"
                + "Data: " + arguments[0][0].data + "</br>"
                + "</div>"
                )
                .css({
                    border: "solid 1px gray",
                    padding: "5px",
                    margin: "10px"
                });

    consoleDiv.append(log);

    // scroll vers le bas
    if(consoleDiv[0]){
        var height = consoleDiv[0].scrollHeight;
        consoleDiv.scrollTop(height);
    }

}