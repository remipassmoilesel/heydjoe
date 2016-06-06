$(function() {

    // créer l'accordéon
    $( "#menu" ).accordion({
      header: "h1"
    });

    // rechercher dans l'accordéon
    $("#searchTextField").keyup(function(event){


        var rawTerms = $(this).val().trim();

        /*
            Surligner les termes qui correspondent
        */
        var highlightSettings = {className: 'menuHighlighted'};

        // enlever le surlignage de tous les elements
        $("#menu div").unhighlight(highlightSettings);

        // surligner tous les élements
        $("#menu div").highlight(rawTerms, highlightSettings);

        $(".menuHighlighted").css({ backgroundColor: "#FFFF88" });

        /*
            Ouvrir l'onglet correspondant
        */

        // parcourir les élements enfants
        var childs =$("#menu").children();
        childs.each(function(index){

//            console.log("            if(index === childs.length){");
//            console.log(index);
//            console.log(childs.length);

            // rechercher le terme, recherche basique pour exemple
            if($(this).text().toLowerCase().indexOf(rawTerms.toLowerCase()) !== -1){

                // si l'element est un titre, l'activer
                if($(this).prop("tagName") === "H1"){
                    $(this).trigger("click");
                }

                // sinon activer l'element précédent. index n'est pas décrémenter puisqu'avec nth-child le compte commence à 1
                else{
                    $("#menu *:nth-child(" + (index) +")" ).trigger("click");
                }

            }

            // fin de la boucle, afficher le premier panneau, avec une petite note "Pas de résultats ..."
            if(index + 1  === childs.length){
                $("#menu *:nth-child(1)").trigger("click");
            }

         });

    });


});

 $(function() {
  var $context = $(".context");
  var $form = $("form");
  var $button = $form.find("button[name='perform']");
  var $input = $form.find("input[name='keyword']");

  $button.on("click.perform", function() {

    // Determine search term
    var searchTerm = $input.val();

    // Determine options
    var options = {};
    var values = $form.serializeArray();
    /* Because serializeArray() ignores unset checkboxes */
    values = values.concat(
      $form.find("input[type='checkbox']:not(:checked)").map(
        function() {
          return {
            "name": this.name,
            "value": "false"
          }
        }).get()
    );
    $.each(values, function(i, opt){
      var key = opt.name;
      var val = opt.value;
      if(key === "keyword" || !val){
        return;
      }
      if(val === "false"){
        val = false;
      } else if(val === "true"){
        val = true;
      }
      options[key] = val;
    });

    // Remove old highlights and highlight
    // new search term afterwards
    $context.unmark();
    $context.mark(searchTerm, options);

  });
  $button.trigger("click.perform");
});