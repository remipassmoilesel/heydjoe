/**

Console d'évenements Jquery pour debuggage

*/
(function( $ ) {

    $.fn.eventConsole = function(logInBrowserConsole) {

        this.logInBrowserConsole = logInBrowserConsole;
        this.jqueryEventNumber = 0;

        this.append("<div style='font-weight: bolder'>Evènements JQuery</div>");
        this.append("<div id='eventConsole_logspace'></div>");

        // mise en forme de la console
        $("#eventConsole_logspace").css({
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

            self.jqueryEventNumber ++;

            var logSpace = $("#eventConsole_logspace");

            var name = typeof arguments[0] === "string" ? arguments[0] : arguments[0].type;

            if(this.logInBrowserConsole){
                console.log("#" + self.jqueryEventNumber + " Event name: ");
                console.log(arguments);
            }

            var log = $("<div>"
                     + "#" + self.jqueryEventNumber + " Event name: <b>" + name + "</b> <br/>"
                     + "Data: " + arguments[0].data + "</br>"
                     + "</div>")
                     .css({
                         border: "solid 1px gray",
                         padding: "5px",
                         margin: "10px"
                     });

            logSpace.append(log);

            // scroll vers le bas
            if(logSpace[0]){
             var height = logSpace[0].scrollHeight;
             logSpace.scrollTop(height);
            }

            // appel de la super méthode
            superJQueryEventTrigger( event, data, elem, onlyHandlers );
        }

        return this;

    };

}( jQuery ));