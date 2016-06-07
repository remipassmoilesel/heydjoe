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
//                console.log(this);

            }
        },

        roomsPanel: {
            label: "Salons et cannaux",
            template: "menuRooms",
            init: function(){
                console.log("roomsPanel");
//                console.log(this);

            }
        },

        settingsPanel: {
            label: "Paramètres",
            template: "menuSettings",
            init: function(){
                console.log("settingsPanel");
//                console.log(this);
            }
        }
     },

    /**
        Initialise menu and menu elements
    */
    init: function(){

        var menuRoot = $("#side_menu");

        // initializing elements
        for(var prop in this.elements){
            var elmt = this.elements[prop];

            // add Title
            menuRoot.append("<h1>" + elmt.label + "</h1>");

            // load and add template
            if(typeof elmt.template === "undefined"){
                throw "Parameter cannot be undefined: " + elmt.template;
            }
            elmt.template = jsxc.gui.template.get(elmt.template);

            menuRoot.append(elmt.template);

            // launch init function
            if(typeof elmt.init !== "undefined"){
                elmt.init.call(elmt);
            }
        }

        // set accordion menu
        this.initAccordion();

        // set foldable
        this.initFoldableActions();
    },

    /**
        Associate click with fold / unfold action
    */
    initFoldableActions: function(){

        var self = $("#side_menu");

        // open / close side menu
        var openSideMenu = function(){
            self.data("sideMenuEnabled", true);
            self.animate({ right: "0px" });
         };

        var closeSideMenu = function(){
           self.data("sideMenuEnabled", false);
           self.animate({ right: "-200px" });
         };

        // disable text selection
        self.disableSelection();

        // when clicking open menu, and launch timer to hide it after inactivity
        $("#jsxc_menu > span").click(function() {

            //  side menu is open, close it
            if(self.data("sideMenuEnabled")){
                closeSideMenu();
            }

            // side menu is closed, open it
            else {
                openSideMenu();
                self.data('timerForClosing', window.setTimeout(closeSideMenu, 3000));
            }

            // update scrollbars
             $("#side_menu > div").each(function(){
                $(this).perfectScrollbar('update');
                //$(this).addClass("side_menu_accordion_content_nested");
            });

            return false;

        });

        // mouse leaving, timeout to hide
        // timeouts are stored in self element with jquery.data()
        self.mouseleave(function() {
            self.data('timerForClosing', window.setTimeout(closeSideMenu, 3000));
        });

        // mouse entering, clear timeout to hide
        // timeouts are stored in self element with jquery.data()
        self.mouseenter(function() {
            window.clearTimeout(self.data('timerForClosing'));
        });

    },

    /*
        Set menu accordion and searchable
    */
    initAccordion: function(){

        console.log("initAccordion");

        // voir: http://www.w3schools.com/howto/howto_js_accordion.asp

        // create accordion
        $( "#side_menu" ).accordion({
            collapsible: false,
            heightStyle: "fill",
            header: "h1"
        });

//        // prepare titles
//        $("#side_menu > h1").each(function(){
//            $(this).disableSelection();
//            //$(this).addClass("side_menu_accordion_header");
//        });

        // prepare divisions
        $("#side_menu > div").each(function(){
            $(this).perfectScrollbar();
            //$(this).addClass("side_menu_accordion_content_nested");
        });
//
//        // add search text fields and buttons
//        $("#jsxcMenuSearchTextField").keyup(jsxcMenu.onSearchKeyUp);
//
//        // afficher le résultat suivant
//        $("#jsxcMenuNextButton").click(function(){
//            jsxcMenu.showNextResult();
//        });
//
//        // afficher le résultat suivant
//        $("#jsxcMenuPreviousButton").click(function(){
//            jsxcMenu.showPreviousResult();
//        });

    }



};