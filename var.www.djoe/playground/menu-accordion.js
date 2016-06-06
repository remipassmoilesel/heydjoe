
$(function(){
    djoeMenu.init();
});

var djoeMenu = {

    /**
        Index du résultat courant
    */
    currentSearchResultIndex: 0,
    
    /**
        Liste des élements de résultat
    */
    currentResults: [],

    searchTitleMark: "<span class='djoeMenuSearchTitleMark'> &lt;!&gt;</span>",

    highlightSettings:  {
                   caseSensitive: false,
                   className: 'djoeMenuSearchResults'
               },

    /**
        Initialisation du menu
    */
    init: function (){

        // créer le menu accordéon
        $( "#djoeMenuCtn" ).accordion({
          header: "h1"
        });

        // rechercher dans l'accordéon
        $("#djoeMenuSearchTextField").keyup(djoeMenu.onSearchKeyUp);

        // afficher le résultat suivant
        $("#djoeMenuNextButton").click(function(){
            djoeMenu.showNextResult();
        });

        // afficher le résultat suivant
        $("#djoeMenuPreviousButton").click(function(){
            djoeMenu.showPreviousResult();
        });
    },

    /**
        Fonction appelée lorsque l'utilisateur saisi dans le champs de recherche
    */
    onSearchKeyUp: function (event){

            // termes à rechercher
            var rawTerms = $(this).val().trim();

            // reinitialiser les indicateurs
            djoeMenu.currentResults = [];
            djoeMenu.currentSearchResultIndex = 0;
            $("#djoeMenuCtn span.djoeMenuSearchTitleMark").remove();

            // champs vide, arret
            if(rawTerms.length < 1){

                djoeMenu.feedback();

                djoeMenu.resetHighlights();

                $( "#djoeMenuCtn > h1.ui-accordion-header" ).eq(0).trigger("click");

                return;
            }

            // console.log("rawTerms");
            // console.log(rawTerms);

            // surligner les résultats
            djoeMenu.highlightTerms(rawTerms);

            //console.log($(".djoeMenuSearchResults"));

            // lister les résultats
            djoeMenu.currentResults = $(".djoeMenuSearchResults");

            //console.log("djoeMenu.currentResults");
            //console.log(djoeMenu.currentResults.length);

            // pas de résultats, activer le premier onglet
            if(djoeMenu.currentResults.length < 1){

                djoeMenu.feedback("Aucun résultat");

                $("#djoeMenuCtn > h1.ui-accordion-header").eq(0).trigger("click");

            }

            // un ou plusieurs résultats, afficher l'onglet du premier resultat correspondant
            else {

                //djoeMenu.feedback(djoeMenu.currentResults.length + " résultats");

                // ajouter les marques aux titres correspondants
                djoeMenu.currentResults.each(function(index, element){

                    var title;
                    var titleSearch = $(this).parents("h1.ui-accordion-header");
                    if(titleSearch.length > 0){
                        title = titleSearch.eq(0);
                    } else {
                        title = djoeMenu.currentResults.eq(index).parents("div.ui-accordion-content").prev("h1.ui-accordion-header");
                    }

                    var mark = $(djoeMenu.searchTitleMark);

                    if(title.find("span.djoeMenuSearchTitleMark").length < 1){
                        title.append(mark);
                    }

                });

                djoeMenu.selectResult(0);

            }
    },

    /**
        Afficher un retour
    */
    feedback: function(text){
        $("#djoeMenuFeedback").html(text || "&nbsp;");
    },

    /**
        Surligner tous les mots du menu correspondant aux termes spécifiés
    */
    highlightTerms: function(terms){

        djoeMenu.resetHighlights();

        // surligner tous les élements
        $("#djoeMenuCtn").highlight(terms, djoeMenu.highlightSettings);

    },

    /**
        Enlever le surlignage
    */
    resetHighlights: function(){

        $("#djoeMenuCtn").unhighlight(djoeMenu.highlightSettings);

        // retirer les précédents résultats actifs
        $("#djoeMenuCtn.djoeMenuActiveResult").each(function(){
            $(this).removeClass("djoeMenuActiveResult");
        });
    },

    /**
        Surligner d'une couleur différente le prochain résultat
    */
    showNextResult: function(){

        djoeMenu.currentSearchResultIndex ++;

        if(djoeMenu.currentSearchResultIndex > djoeMenu.currentResults.length - 1){
            djoeMenu.feedback("Dernier résultat atteint");
            djoeMenu.currentSearchResultIndex = djoeMenu.currentResults.length - 1;
        }

        djoeMenu.selectResult(djoeMenu.currentSearchResultIndex);

    },

    /**
        Surligner d'une couleur différente le précédent résultat
    */
    showPreviousResult: function(){

        djoeMenu.currentSearchResultIndex --;

        if(djoeMenu.currentSearchResultIndex <= 0){
            djoeMenu.feedback("Premier résultat atteint");
            djoeMenu.currentSearchResultIndex = 0;
        }

        djoeMenu.selectResult(djoeMenu.currentSearchResultIndex);

    },

    /**
        Affiche l'onglet d'un resultat et le surligne d'une autre couleur
    */
    selectResult: function(index){

        // ajouter la classe au résultat actif
        djoeMenu.currentResults.eq(djoeMenu.currentSearchResultIndex).addClass("djoeMenuActiveResult");

        // activer l'accordéon correspondant
        var titleSearch = djoeMenu.currentResults.eq(index).parents("h1");
        if(titleSearch.length > 0){
            titleSearch.eq(0).trigger("click");
        } else {
            djoeMenu.currentResults.eq(index).parents("div.ui-accordion-content").prev("h1.ui-accordion-header").trigger("click");
        }

    }

};
