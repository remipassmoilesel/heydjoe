/**

Main menu. This menu is included in roster.

All templates are stored in templates/menu*.html

Call init() to build the menu. First init call is done in jsxc.roster.init()

*/
jsxc.gui.menu = {

    /**
        Menu elements. Each menu element has a label, a template name and an optionnal init function.
    */
    elements: {

        welcomePanel: {
            label: "Menu",
            template: "menuWelcome",
            init: function(){
                console.log("welcomePanel");
                console.log(this);


            }
        },

        roomsPanel: {
            label: "Salons et cannaux",
            template: "menuRooms",
            init: function(){
                console.log("roomsPanel");
                console.log(this);

            }
        },

        settingsPanel: {
            label: "Paramètres",
            template: "menuSettings",
            init: function(){
                console.log("settingsPanel");
                console.log(this);
            }
        }
     },

    /**
        Initialise menu and menu elements
    */
    init: function(){

        var self = jsxc.gui.menu;

        // initializing elements
        for(var prop in this.elements){
            var elmt = this.elements[prop];

            // load template
            if(typeof elmt.template !== "undefined"){
                elmt.template = jsxc.gui.template.get(elmt.template);
            }

            // launch init
            if(typeof elmt.init !== "undefined"){
                elmt.init.call(elmt);
            }
        }

    }

};