/**
 *
 * Statistic module. Can log events or more complex datas to a distant server
 *
 * ** All datas are strictly anonymous
 *
 * @type {{_statsManager: null, _init: jsxc.stats._init, addEvent: jsxc.stats.addEvent,
 *     addLogEntry: jsxc.stats.addLogEntry}}
 */

jsxc.stats = {

  _statsManager : null,

  _statsOptions : null,

  /**
   * Speial log function because logs can comes eralier than initialisation
   * @param message
   * @param data
   * @param level
   * @private
   */
  _log : function(message, data, level) {

    level = (level || 'ERROR').toUpperCase().trim();

    var prefix = level + " [JSXC/Stats] ";

    if (level === 'ERROR') {
      console.error(prefix + message, data);
    }

    else {
      console.log(prefix + message, data);
    }

  },

  init : function() {

    var self = jsxc.stats;

    /**
     * Initialize stat module
     * @type {default}
     */
    self._statsOptions = jsxc.options.get("stats");
    if (self._statsOptions && self._statsOptions.enabled) {

      self._statsManager = require("../lib/stats-module/scripts/Stats-embed.js")({

        debug : false,

        destinationUrl : self._statsOptions.destinationUrl,

        authorization : self._statsOptions.authorization,

        interval : 5000,

        autosend : true

      });

      console.info("Some anonymous data are collected to improve user experience.");
      console.info("Data availables at: " + self._statsOptions.destinationUrl + "/visualization/");
      console.info("Anonymous session id: " + self._statsManager.sessionId);

      // test destination once
      $.get(jsxc.options.get("stats").destinationUrl).fail(function() {
        jsxc.error('Stats destination URL is unreachable');
      });

    }

  },

  addEvent : function(event, data) {

    var self = jsxc.stats;

    if (self._statsManager === null) {
      // self._log("Try to add datas while not initailized: ", {_statManager: self._statsManager});
      return;
    }

    if (!self._statsOptions || self._statsOptions.enabled !== true) {
      return;
    }

    self._statsManager.addEvent(event, data);

  },

  addLogEntry : function(text, level, data) {

    var self = jsxc.stats;

    level = (level || 'INFO').trim().toUpperCase();

    if (self._statsManager === null) {
      // self._log("Try to add datas while not initailized: ", {_statManager: self._statsManager});
      return;
    }

    if (!self._statsOptions || self._statsOptions.enabled !== true) {
      return;
    }

    // add only interresting level to Stats
    if (self._statsOptions.sentLogLevels.indexOf(level) !== -1) {
      self._statsManager.addLogEntry(text, level, data);
    }

  }

};

