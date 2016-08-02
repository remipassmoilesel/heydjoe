/**
 *
 * Statistic module. Can log event or events or more complex datas to a distant server
 *
 * @type {{_statsManager: null, _init: jsxc.stats._init, addEvent: jsxc.stats.addEvent,
 *     addLogEntry: jsxc.stats.addLogEntry}}
 */

jsxc.stats = {

  _statsManager : null,

  init : function() {

    var self = jsxc.stats;

    /**
     * Initialize stat module
     * @type {default}
     */
    var statsOptions = jsxc.options.get("stats");
    if (statsOptions && statsOptions.enabled) {

      self._statsManager = require("../lib/stats-module/scripts/Stats-embed.js")({

        debug : false,

        destinationUrl : statsOptions.destinationUrl,

        authorization : statsOptions.authorization,

        interval : 3000,

        autosend : true

      });
    }

  },

  addEvent : function(event, data) {

    var self = jsxc.stats;

    if (self._statsManager === null) {
      return;
    }

    self._statsManager.addEvent(event, data);

  },

  addLogEntry : function(text, level, data) {

    var self = jsxc.stats;

    if (self._statsManager === null) {
      return;
    }

    self._statsManager.addLogEntry(text, level, data);

  }

};

