/**

Main menu. This menu is included in roster.

All templates are stored in templates/menu*.html

Call init() to build the menu. First init call is done in jsxc.roster.init()

*/
jsxc.gui.menu = {

    /*
        Time out before close menu
    */
    timeoutBeforeClose: 5000,

    /**
        Menu elements. Each menu element has a label, a template name and an optionnal init function.
    */
    elements: {

        welcomePanel: {
            label: "Menu",
            template: "menuWelcome",
            init: function(){


            }
        },

        statusPanel: {
            label: "Statut",
            template: "menuStatus",
            init: function(){


            }
        },

        notificationsPanel: {
            label: "Notifications",
            template: "menuNotifications",
            init: function(){


            }
        },

        roomsPanel: {
            label: "Salons et cannaux",
            template: "menuRooms",
            init: function(){


            }
        },

        toolsPanel: {
            label: "Outils",
            template: "menuTools",
            init: function(){


            }
        },

        settingsPanel: {
            label: "Paramètres",
            template: "menuSettings",
            init: function(){


            }
        },

     },

    /**
        Initialise menu and menu elements
    */
    init: function(){

        // disable text selection
        $("#side_menu").disableSelection();

        var menuRoot = $("#side_menu_content");

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

    /*
        Set menu accordion and searchable
    */
    initAccordion: function(){

        // voir: http://www.w3schools.com/howto/howto_js_accordion.asp

        // create accordion
        $( "#side_menu_content" ).accordion({
            collapsible: false,
            heightStyle: "fill",
            header: "h1"
        });

        // adding better srollbars
        $("#side_menu_content > div").each(function(){
            $(this).perfectScrollbar();
        });

        var self = this;

        // add search text fields and buttons
        $("#jsxc_menu_search_text_field").keyup(self.onSearchKeyUp);

        // show next result
        $("#jsxc_menu_next_btn").click(function(){
            self.showNextResult();
        });

        // show previous result
        $("#jsxc_menu_previous_btn").click(function(){
            self.showPreviousResult();
        });

    },

    /**
        Current index of search result
    */
    currentSearchResultIndex: 0,

    /**
       All currents results
    */
    currentResults: [],

    /**
        Title mark displayed when a result occur in a panel
    */
    searchTitleMark: "<span class='jsxc_menu_search_title_mark'> &lt;!&gt;</span>",

    /**
        Settings for text highliting. Using jquery.highlight.js
    */
    highlightSettings:  {
       caseSensitive: false,
       className: 'jsxc_menu_search_results'
    },

    /**
        Called by search text field when user type something
    */
    onSearchKeyUp: function(){

        // terms to search
        var rawTerms = $(this).val().trim();

        //console.log(rawTerms);

        var self = jsxc.gui.menu;

        // reinitialize indicators
        self.currentResults = [];
        self.currentSearchResultIndex = 0;
        $("#side_menu_content span.jsxc_menu_search_title_mark").remove();

        // champs vide, arret
        if(rawTerms.length < 1){

            self.feedback();

            self.resetHighlights();

            $( "#side_menu_content > h1.ui-accordion-header" ).eq(0).trigger("click");

            return;
        }

        // surligner les résultats
        self.highlightTerms(rawTerms);

        // lister les résultats
        self.currentResults = $(".jsxc_menu_search_results");

        // pas de résultats, activer le premier onglet
        if(self.currentResults.length < 1){

            self.feedback("Aucun résultat");

            $("#side_menu_content > h1.ui-accordion-header").eq(0).trigger("click");

        }

        // un ou plusieurs résultats, afficher l'onglet du premier resultat correspondant
        else {

            // ajouter les marques aux titres correspondants
            self.currentResults.each(function(index){

                var title;
                var titleSearch = $(this).parents("h1.ui-accordion-header");
                if(titleSearch.length > 0){
                    title = titleSearch.eq(0);
                } else {
                    title = self.currentResults.eq(index).parents("div.ui-accordion-content").prev("h1.ui-accordion-header");
                }

                var mark = $(self.searchTitleMark);

                if(title.find("span.jsxc_menu_search_title_mark").length < 1){
                    title.append(mark);
                }

            });

            self.selectResult(0);

        }
    },

    /**
        Display a message for user
    */
    feedback: function(text){
        $("#jsxc_menu_feedback").html(text || "&nbsp;");
    },

    /**
        Highlight all term searched
    */
    highlightTerms: function(terms){

        this.resetHighlights();

        // surligner tous les élements
        $("#side_menu_content").highlight(terms, this.highlightSettings);

    },

    /**
        Enlever le surlignage
    */
    resetHighlights: function(){

        $("#side_menu_content").unhighlight(this.highlightSettings);

        // retirer les précédents résultats actifs
        $("#side_menu_content .jsxc_menu_active_result").each(function(){
            $(this).removeClass("jsxc_menu_active_result");
        });
    },

    /**
        Active the next result
    */
    showNextResult: function(){

        this.currentSearchResultIndex ++;

        if(this.currentSearchResultIndex > this.currentResults.length - 1){
            this.feedback("Dernier résultat atteint");
            this.currentSearchResultIndex = this.currentResults.length - 1;
        }

        this.selectResult(this.currentSearchResultIndex);

    },

    /**
        Active the previous result
    */
    showPreviousResult: function(){

        this.currentSearchResultIndex --;

        if(this.currentSearchResultIndex <= 0){
            this.feedback("Premier résultat atteint");
            this.currentSearchResultIndex = 0;
        }

        this.selectResult(this.currentSearchResultIndex);

    },

    /**
        Show result tab and active it
    */
    selectResult: function(index){

        // retirer les précédents résultats actifs
        $("#side_menu_content .jsxc_menu_active_result").each(function(){
            $(this).removeClass("jsxc_menu_active_result");
        });

        // ajouter la classe au résultat actif
        this.currentResults.eq(this.currentSearchResultIndex).addClass("jsxc_menu_active_result");

        // activer l'accordéon correspondant
        var titleSearch = this.currentResults.eq(index).parents("h1");
        if(titleSearch.length > 0){
            titleSearch.eq(0).trigger("click");
        } else {
            this.currentResults.eq(index).parents("div.ui-accordion-content").prev("h1.ui-accordion-header").trigger("click");
        }

    },

    /**
        Associate click with fold / unfold menu action
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

        // when clicking open menu, and launch timer to hide it after inactivity
        $("#jsxc_menu > span").click(function() {

            //  side menu is open, close it
            if(self.data("sideMenuEnabled")){
                closeSideMenu();

                window.clearTimeout(self.data('timerForClosing'));
            }

            // side menu is closed, open it
            else {

               // reresh accordion size
                $("#side_menu_content").accordion("refresh");

                openSideMenu();

                self.data('timerForClosing', window.setTimeout(closeSideMenu,
                    jsxc.gui.menu.timeoutBeforeClose));

                // focus on search text field
                $("#jsxc_menu_search_text_field").focus();
            }

            return false;

        });

        // mouse leaving, timeout to hide
        // timeouts are stored in self element with jquery.data()
        self.mouseleave(function() {
            self.data('timerForClosing', window.setTimeout(closeSideMenu, jsxc.gui.menu.timeoutBeforeClose));
        });

        // mouse entering, clear timeout to hide
        // timeouts are stored in self element with jquery.data()
        self.mouseenter(function() {
            window.clearTimeout(self.data('timerForClosing'));
        });

    },




};