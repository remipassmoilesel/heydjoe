/**
 * API for manipulating JSXC
 *
 */

jsxc.help = {

  currentTutorial : null,

  tutorials : {},

  init : function() {

    var self = jsxc.help;

    self.tutorials["demotour"] = {

      /**
       * Here you can return an object which will be accessible in setup and teardown
       */
      options : function() {
        return {};
      },

      steps : function() {
        return [{
          content : '<p>First look at this thing</p>',
          highlightTarget : true,
          nextButton : true,
          target : $('#predefinedJidList'),
          my : 'bottom center',
          at : 'top center'
        }];

      }
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

    var tour = new Shepherd.Tour({
      defaults : {
        classes : 'shepherd-theme-arrows', scrollTo : true
      }
    });

    tour.addStep('example', {
      title : 'Work in progress',
      text : 'Work in progress ...',
      attachTo : '#jsxc_toggleRoster'
    });

    tour.start();

  }
};