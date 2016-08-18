/**
 * API for manipulating JSXC
 *
 */

jsxc.help = {

  currentTutorial : null,

  tutorials : {},

  /**
   * Get an array containing all tutorials
   */
  getAllTutorials : function() {

    var self = jsxc.help;

    var res = {};

    $.each(self.tutorials, function(index, element) {
      res[index] = element();
    });

    return res;
  },

  /**
   * Launch a visual tutorial
   * @param name
   */
  launchTutorial : function(name) {

    var self = jsxc.help;

    jsxc.stats.addEvent("jsxc.help.tutorial." + name);

    jsxc.debug("Launching tutorial", name);

    // TODO: Check if a tutorial is already running

    if (typeof self.tutorials[name] === "undefined") {
      throw new Error("Invalid tutorial name: " + name);
    }

    var tutorial = self.tutorials[name]();

    var tour = new Shepherd.Tour({

      defaults : {
        classes : 'shepherd-theme-default jsxc_demotour_item',
        scrollTo : true,
        showCancelLink : true,
        buttons : [

          {
            text : '<',

            action : function() {
              Shepherd.activeTour.back();
            }

          },

          {
            text : '>',

            action : function() {
              Shepherd.activeTour.next();
            }

          },

        ]

      }
    });

    $.each(tutorial.steps, function(index, element) {
      tour.addStep(element);
    });

    tour.start();

  },

  /**
   * Initialization of all tutorials
   */
  init : function() {

    var self = jsxc.help;

    self.tutorials["interface"] = function() {

      return {

        description : "Visite de l'interface",

        steps : [

          {
            title : "Interface",
            text : "<p>Vous allez découvrir les fonctionnalités offerte par la" +
            " plateforme en 5 étapes.</p>",
            attachTo : {element : 'body', on : 'top'},
            when : {
              'before-show' : function() {
                // jsxc.gui.roster.toggle("hidden");
                // jsxc.mmstream.gui.toggleVideoPanel(false);
              }
            }
          },

          {
            title : "Interface",
            text : "<p>L'interface principale est disponible à droite. Cliquez sur la barre " +
            "transparente pour l'afficher.</p>",
            attachTo : {element : '#jsxc_toggleRoster', on : 'left'},
            advanceOn : "#jsxc_toggleRoster click",
            when : {
              'before-hide' : function() {
                // jsxc.gui.roster.toggle("shown");
              }
            }
          },

          {
            title : "Interface",
            text : "<p>Les appels vidéos sont affichés à gauche.</p>",
            attachTo : {element : '#jsxc_toggleVideoPanel', on : 'left'},
            advanceOn : "#jsxc_toggleVideoPanel click",
            when : {
              'before-hide' : function() {
                jsxc.mmstream.gui.toggleVideoPanel(true);
              }
            }
          },

          {
            title : "Interface",
            text : "<p>Le menu permet d'accéder à toutes les fonctionnalités.</p>",
            attachTo : {element : '#jsxc_menu', on : 'left'},
            advanceOn : "#jsxc_menu click",
            when : {
              'before-hide' : function() {
                $("#jsxc_menu").trigger("click");
              }
            }
          },

          {
            title : "Travail en cours",
            text : "<p>Travail en cours, cet assistant sera bientôt terminé.</p>",
            attachTo : {element : '#jsxc_toggleRoster', on : 'right'},
            when : {
              'before-show' : function() {

              }
            }
          }

        ]
      };

    };

    self.tutorials["demotour"] = function() {

      return {

        description : "Démonstration",

        steps : [{
          title : "Travail en cours",
          text : "<p>Travail en cours, cet assistant sera bientôt terminé.</p>",
          attachTo : {element : '#jsxc_toggleRoster', on : 'right'},
          when : {
            'before-show' : function() {

            }
          }
        }]

      };
    };

  }

};