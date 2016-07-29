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

    console.log("Launching tutorial");
    console.log(name);

    // TODO: Check if a tutorial is already running

    if (typeof self.tutorials[name] === "undefined") {
      throw "Invalid tutorial name: " + name;
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
                jsxc.gui.roster.toggle("hidden");
                jsxc.mmstream.gui.toggleVideoPanel(false);
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
                jsxc.gui.roster.toggle("shown");
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

  },

  /**
   *
   * @private
   */
  spaceInvasion : function() {

    var self = jsxc.help;

    var root = jsxc.options.root + "lib/AlienInvasion/";

    // initialize gui only if necessary
    if (!self._alreadyInitalized || self._alreadyInitalized !== true) {

      self._alreadyInitalized = true;

      // $('head').append('<link rel="stylesheet" href="' + root + 'base.css" type="text/css" />');

      var template = $("<div id='alienInvasionContainer'></div>");

      // hide template for now
      template.css({display : 'none'});

      // append canvas and script tags
      template.append("<canvas id='alienInvasionCanvas' width='320' height='480'></canvas>");
      template.append("<div><a href='https://github.com/cykod/AlienInvasion/' target='_blank'>" +
          "Thanks to https://github.com/cykod/AlienInvasion/</a></div>");
      template.append("<script src='" + root + "engine.js'></script><script src='" + root +
          "game.js'></script>");

      // show dialog
      $("body").append(template);

      // initialize game
      setTimeout(function() {
        Game.initialize("alienInvasionCanvas", sprites, startGame, root);
      }, 1000);

      // listen opening and closing
      template.on('dialogopen', function() {
        template.css({display : 'block'});
      });

      // listen opening and closing
      template.on('dialogclose', function() {
        template.css({display : 'none'});
      });

    }

    // show dialog
    $("#alienInvasionContainer").dialog({

      title : "Alien invasion !",

      width : 353,

      height : 550,

      resizable : false
    });

  }

};