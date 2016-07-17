/**
 * API for manipulating JSXC
 *
 */

jsxc.help = {

  currentTutorial : null,

  tutorials : {},

  init : function() {

    var self = jsxc.help;

    self.tutorials["demotour"] = function() {
      return [

        {
          title : "Démonstration",
          text : "<p>Vous allez découvrir les fonctionnalités offerte par la" +
          " plateforme en 5 étapes.</p>",
          attachTo : {element: 'body', on: 'top'},
          when : {
            'before-show' : function() {
              jsxc.gui.roster.toggle("hidden");
              jsxc.mmstream.gui.toggleVideoPanel(false);
            }
          }
        },

        {
          title : "Interface",
          text : "<p>L'interface principale est disponible à droite. Cliquez sur la barre " +
          "transparente pour l'afficher.</p>",
          attachTo : {element: '#jsxc_toggleRoster', on: 'left'},
          when : {
            'before-hide' : function() {
              jsxc.gui.roster.toggle("shown");
            }
          }
        },

        {
          title : "Interface",
          text : "<p>Les appels vidéos sont affichés à gauche.</p>",
          attachTo : {element: '#jsxc_toggleVideoPanel', on: 'left'},
          when : {
            'before-hide' : function() {
              jsxc.mmstream.gui.toggleVideoPanel(true);
            }
          }
        },

        {
          title : "Travail en cours",
          text : "<p>Travail en cours, cet assistant sera bientôt terminé.</p>",
          attachTo : {element: '#jsxc_toggleRoster', on: 'right'},
          when : {
            'before-show' : function() {

            }
          }
        }

      ];

    };

    // $("#jsxc_toggleRoster")[0]

    // jsxc.gui.roster.toggle("shown");

  },

  /**
   * Launch a visual tutorial
   * @param name
   */
  launchTutorial : function(name) {

    var self = jsxc.help;

    jsxc.stats.addEvent("jsxc.help.tutorial." + name);

    console.log("Launching tutorial");
    console.log(name);

    // TODO: Check if a tutorial is already running

    if (typeof self.tutorials[name] === "undefined") {
      throw "Invalid tutorial name: " + name;
    }

    var steps = self.tutorials[name]();


    var tour = new Shepherd.Tour({

      defaults : {

        classes : 'shepherd-theme-arrows jsxc_demotour_item',

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

    $.each(steps, function(index, element) {
      tour.addStep(element);
    });

    tour.start();

  }
};