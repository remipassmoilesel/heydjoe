
$(function(){
    jsxcMenu.init();
});

var jsxcMenu = {

    /**
        Index du résultat courant
    */
    currentSearchResultIndex: 0,
    
    /**
        Liste des élements de résultat
    */
    currentResults: [],

    searchTitleMark: "<span class='jsxcMenuSearchTitleMark'> &lt;!&gt;</span>",

    highlightSettings:  {
                   caseSensitive: false,
                   className: 'jsxcMenuSearchResults'
               },

    /**
        Initialisation du menu
    */
    init: function (){

        // créer le menu accordéon
        $( "#jsxcMenuCtn" ).accordion({
          header: "h1"
        });

        // rechercher dans l'accordéon
        $("#jsxcMenuSearchTextField").keyup(jsxcMenu.onSearchKeyUp);

        // afficher le résultat suivant
        $("#jsxcMenuNextButton").click(function(){
            jsxcMenu.showNextResult();
        });

        // afficher le résultat suivant
        $("#jsxcMenuPreviousButton").click(function(){
            jsxcMenu.showPreviousResult();
        });
    },

    /**
        Fonction appelée lorsque l'utilisateur saisi dans le champs de recherche
    */
    onSearchKeyUp: function (event){

            // termes à rechercher
            var rawTerms = $(this).val().trim();

            // reinitialiser les indicateurs
            jsxcMenu.currentResults = [];
            jsxcMenu.currentSearchResultIndex = 0;
            $("#jsxcMenuCtn span.jsxcMenuSearchTitleMark").remove();

            // champs vide, arret
            if(rawTerms.length < 1){

                jsxcMenu.feedback();

                jsxcMenu.resetHighlights();

                $( "#jsxcMenuCtn > h1.ui-accordion-header" ).eq(0).trigger("click");

                return;
            }

            // console.log("rawTerms");
            // console.log(rawTerms);

            // surligner les résultats
            jsxcMenu.highlightTerms(rawTerms);

            //console.log($(".jsxcMenuSearchResults"));

            // lister les résultats
            jsxcMenu.currentResults = $(".jsxcMenuSearchResults");

            //console.log("jsxcMenu.currentResults");
            //console.log(jsxcMenu.currentResults.length);

            // pas de résultats, activer le premier onglet
            if(jsxcMenu.currentResults.length < 1){

                jsxcMenu.feedback("Aucun résultat");

                $("#jsxcMenuCtn > h1.ui-accordion-header").eq(0).trigger("click");

            }

            // un ou plusieurs résultats, afficher l'onglet du premier resultat correspondant
            else {

                //jsxcMenu.feedback(jsxcMenu.currentResults.length + " résultats");

                // ajouter les marques aux titres correspondants
                jsxcMenu.currentResults.each(function(index, element){

                    var title;
                    var titleSearch = $(this).parents("h1.ui-accordion-header");
                    if(titleSearch.length > 0){
                        title = titleSearch.eq(0);
                    } else {
                        title = jsxcMenu.currentResults.eq(index).parents("div.ui-accordion-content").prev("h1.ui-accordion-header");
                    }

                    var mark = $(jsxcMenu.searchTitleMark);

                    if(title.find("span.jsxcMenuSearchTitleMark").length < 1){
                        title.append(mark);
                    }

                });

                jsxcMenu.selectResult(0);

            }
    },

    /**
        Afficher un retour
    */
    feedback: function(text){
        $("#jsxcMenuFeedback").html(text || "&nbsp;");
    },

    /**
        Surligner tous les mots du menu correspondant aux termes spécifiés
    */
    highlightTerms: function(terms){

        jsxcMenu.resetHighlights();

        // surligner tous les élements
        $("#jsxcMenuCtn").highlight(terms, jsxcMenu.highlightSettings);

    },

    /**
        Enlever le surlignage
    */
    resetHighlights: function(){

        $("#jsxcMenuCtn").unhighlight(jsxcMenu.highlightSettings);

        // retirer les précédents résultats actifs
        $("#jsxcMenuCtn.jsxcMenuActiveResult").each(function(){
            $(this).removeClass("jsxcMenuActiveResult");
        });
    },

    /**
        Surligner d'une couleur différente le prochain résultat
    */
    showNextResult: function(){

        jsxcMenu.currentSearchResultIndex ++;

        if(jsxcMenu.currentSearchResultIndex > jsxcMenu.currentResults.length - 1){
            jsxcMenu.feedback("Dernier résultat atteint");
            jsxcMenu.currentSearchResultIndex = jsxcMenu.currentResults.length - 1;
        }

        jsxcMenu.selectResult(jsxcMenu.currentSearchResultIndex);

    },

    /**
        Surligner d'une couleur différente le précédent résultat
    */
    showPreviousResult: function(){

        jsxcMenu.currentSearchResultIndex --;

        if(jsxcMenu.currentSearchResultIndex <= 0){
            jsxcMenu.feedback("Premier résultat atteint");
            jsxcMenu.currentSearchResultIndex = 0;
        }

        jsxcMenu.selectResult(jsxcMenu.currentSearchResultIndex);

    },

    /**
        Affiche l'onglet d'un resultat et le surligne d'une autre couleur
    */
    selectResult: function(index){

        // ajouter la classe au résultat actif
        jsxcMenu.currentResults.eq(jsxcMenu.currentSearchResultIndex).addClass("jsxcMenuActiveResult");

        // activer l'accordéon correspondant
        var titleSearch = jsxcMenu.currentResults.eq(index).parents("h1");
        if(titleSearch.length > 0){
            titleSearch.eq(0).trigger("click");
        } else {
            jsxcMenu.currentResults.eq(index).parents("div.ui-accordion-content").prev("h1.ui-accordion-header").trigger("click");
        }

    }

};
