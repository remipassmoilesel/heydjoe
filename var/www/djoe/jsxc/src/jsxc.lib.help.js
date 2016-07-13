/**
 * API for manipulating JSXC
 *
 */

jsxc.help = {

  currentTutorial : null,

  tutorials : {},

  init : function() {

    var self = jsxc.help;

    /*


     INTRO JS Version



     */

    if (typeof introJs === "undefined") {
      throw "Unable to find intro.js";
    }

    self.tutorials["demotour"] = function() {

      return [

        {
          intro : "Vous allez découvrir les fonctionnalités de cette version de JSXC en 5 étapes",
          position : "center",
          __beforeChange : function() {
            jsxc.gui.roster.toggle('hidden');
            jsxc.mmstream.gui.toggleVideoPanel(false);
          }
        },

        {
          element : $("#jsxc_toggleRoster")[0],
          intro : "Vous pouvez ouvrir l'interface en cliquant ici",
          position : 'left',

        },

        {
          element : $("#jsxc_toggleVideoPanel")[0],
          intro : "Les appels vidéo seront affiché ici",
          position : "right",
          __beforeChange : function() {
            jsxc.gui.roster.toggle("shown");
          }
        },

        {
          intro : "Avant de pouvoir échanger avec un autre utilisateur vous devez l'inviter",
          position : 'center',
          __beforeChange : function() {
            jsxc.mmstream.gui.toggleVideoPanel(true);
          }
        }, {
          intro : "Cette démonstration n'est pas encore terminée, désolé :)",
          position : 'center',
          __beforeChange : function() {

          }
        }

      ];
    };

  },

  /**
   * Launch a visual tutorial
   * @param name
   */
  launchTutorial : function(name) {

    /*


     INTRO JS Version


     */

    var self = jsxc.help;

    console.log(name);

    // TODO: Check if a tutorial is already running

    if (typeof self.tutorials[name] === "undefined") {
      throw "Invalid tutorial name: " + name;
    }

    var steps = self.tutorials[name]();

    console.log(steps);

    var intro = introJs();
    intro.onbeforechange(function() {

      if (typeof steps[this._currentStep].__beforeChange !== "undefined") {
        steps[this._currentStep].__beforeChange();
      }

    });

    intro.setOptions({

      overlayOpacity : 0.6,

      showProgress : true,

      showStepNumbers : false,

      steps : steps
    });

    intro.start();

  }
};