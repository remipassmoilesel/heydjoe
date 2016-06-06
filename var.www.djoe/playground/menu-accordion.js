
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

            // champs vide, arret
            if(rawTerms.length < 1){
                djoeMenu.feedback(" ");
                return;
            }

            // console.log("rawTerms");
            // console.log(rawTerms);

            // surligner les résultats
            djoeMenu.highlightTerms(rawTerms);

            // lister les résultats
            djoeMenu.currentResults = $(".djoeMenuSearchResults");

            // reinitialiser la valeur courante
            djoeMenu.currentSearchResultIndex = 0;

            //console.log("djoeMenu.currentResults");
            //console.log(djoeMenu.currentResults.length);

            // pas de résultats, activer le premier onglet
            if(djoeMenu.currentResults.length < 1){

                djoeMenu.feedback("Aucun résultat");

                djoeMenu.currentResults = [];

                $("#djoeMenuCtn h1:first-child").trigger("click");

            }

            // un ou plusieurs résultats, afficher l'onglet du premier resultat correspondant
            else {

                djoeMenu.feedback( djoeMenu.currentResults.length + " résultats");

                djoeMenu.selectResult(0);

            }
    },

    /**
        Afficher un retour
    */
    feedback: function(text){
        $("#djoeMenuFeedback").text(text);
    },

    /**
        Surligner tous les mots du menu correspondant aux termes spécifiés
    */
    highlightTerms: function(terms){

        var highlightSettings = {
            caseSensitive: false,
            className: 'djoeMenuSearchResults'
        };

        // enlever le surlignage de tous les elements
        $("#djoeMenuCtn").unhighlight(highlightSettings);

        // surligner tous les élements
        $("#djoeMenuCtn").highlight(terms, highlightSettings);

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

        // retirer le précédent résultat actif
        $("#djoeMenuCtn .djoeMenuActiveResult").each(function(){
            $(this).removeClass("djoeMenuActiveResult");
        });

        // ajouter la classe au résultat actif
        $(djoeMenu.currentResults[djoeMenu.currentSearchResultIndex]).addClass("djoeMenuActiveResult");

        // activer l'accordéon correspondant
        $(djoeMenu.currentResults[0]).parents("div .ui-accordion-content").prev("h1").trigger("click");

    }

};

$(function() {

});
