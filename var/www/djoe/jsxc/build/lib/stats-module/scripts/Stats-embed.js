/**
 * Statsistic module. Create a Stats object, add pairs {id, value},
 * send data to store it or let Stats do it every XX minutes.
 *
 * @param options
 * @constructor
 */

var WebStats = function(options) {

  if (!options || !options.destinationUrl) {
    throw "You must specify destination";
  }

  var defaultOptions = {

    debug : false,

    /**
     * Destination, without trailing slash
     */
    destinationUrl : "http://127.0.0.1:3000",

    /**
     * Set true for send data in interval
     */
    autosend : false,

    /**
     * Interval between auto sent
     *
     */
    interval : 3000, //interval: Math.floor((Math.random() * 14 * 60 * 100) + 8 * 60 * 100),

    /**
     * Authorization header
     */
    authorization : 'secretkey',

    /**
     * Watch uncaught errors
     */
    watchErrors: false, 
    
    
    sendSessionOnStart: true
    
  };

  this.options = $.extend(defaultOptions, options);

  if (this.options.debug === true) {
    console.log("options");
    console.log(this.options);
    console.log("");
  }

  this.options.persistEventUrl = options.destinationUrl + "/persist/event";
  this.options.persistLogUrl = options.destinationUrl + "/persist/log";
  this.options.persistSessionUrl = options.destinationUrl + "/persist/session";

  this.options.readUrl = options.destinationUrl + "/data";

  this.sessionId = "";

  this.eventBuffer = [];
  this.logBuffer = [];

  var self = this;

  // send buffer automatically
  if (this.options.autosend === true) {

    setInterval(function() {
      self.sendDataBuffer();
    }, this.options.interval);

  }

  // watch uncaught errors
  if(this.options.watchErrors === true){
    self._watchWindowErrors();
  }

  if(this.options.sendSessionOnStart === true){
    this.sendSession();  
  }
  

};

/**
 * Add a key / value pair
 * @param id
 * @param value
 */
WebStats.prototype.addEvent = function(event, data) {

  if (this.options.debug === true) {
    console.log("addEvent");
    console.log(arguments);
    console.log("");
  }

  this.eventBuffer.push({event : event, data : data});
};

/**
 * Java hash string implementation
 * @param string
 * @returns {number}
 * @private
 */
WebStats.prototype._hashString = function(string) {
  var hash = 0, i, chr, len;
  if (string.length === 0) {
    return hash;
  }
  for (i = 0, len = string.length; i < len; i++) {
    chr = string.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

/**
 * Create and store a session id
 */
WebStats.prototype._createSessionId = function() {

  if (this.sessionId !== "") {
    throw "Session id already exist";
  }

  this.sessionId = this._hashString(
      new Date() + navigator.userAgent + Math.random() + "èèèèè!ù**$::;!;;!.§/;§/**/*e*eurh!yjyj");

  return this.sessionId;

};

WebStats.prototype._resetSession = function() {
  this.sessionId = "";
};

/**
 * Send session informations
 */
WebStats.prototype.sendSession = function() {

  var self = this;

  if (this.options.debug === true) {
    console.log("sendSession");
    console.log(arguments);
    console.log("");
  }

  // create the session id
  self._createSessionId();

  // send session informations
  var datas = {
    'request_from' : self.sessionId,

    'navigator_language' : navigator.language || "error",

    'user_agent' : navigator.userAgent || "error"
  };

  return self._makeAjax(self.options.persistSessionUrl, 'POST', datas);

};

/**
 * Watch uncaught errors and log them to distant server
 * @private
 */
WebStats.prototype._watchWindowErrors = function(){

  if (this.options.debug === true) {
    console.log("Watching errors");
    console.log("");
  }

  var self = this;

  // Listen uncaught errors
  window.onerror = function (errorMsg, url, lineNumber, columnNumber, error) {

    self.addLogEntry(errorMsg, "ERROR", {
      url: url,
      lineNumber: lineNumber,
      columnNumber: columnNumber,
      error: error
    });

  };

};

/**
 * Send stored events
 * @returns {*}
 */
WebStats.prototype.sendDataBuffer = function() {

  var self = this;

  if (self.options.debug === true) {
    console.log("sendDataBuffer");
    console.trace();
  }

  if (self.eventBuffer.length < 1 && self.logBuffer.length < 1) {

    if (self.options.debug === true) {
      console.log("__ Empty buffer");
    }

    return;
  }

  /**
   * Check if another sending is in progress
   */
  if (self._sendingInProgress === true) {

    if (self.options.debug === true) {
      console.log("__ already sending, stop");
    }

    return;
  }

  self._sendingInProgress = true;

  // Reset sending flag
  var _sendIsDone = function() {
    self._sendingInProgress = false;
  };

  // request are resolved by default
  var p1 = $.Deferred().resolve();
  var p2 = $.Deferred().resolve();

  try {

    // send events if necesary
    if (self.eventBuffer.length > 0) {

      var eventDatas = {
        'request_from' : self.sessionId,

        'datas' : self.eventBuffer
      };

      p1 = self._makeAjax(self.options.persistEventUrl, 'POST', eventDatas)

          .done(function() {
            // clear buffer when finished
            self.eventBuffer = [];
          })

          .fail(function() {
            console.log("Stats: fail sending event buffer");
            console.log(arguments);
          });

    }

    // send logs if necessary
    if (self.logBuffer.length > 0) {
      var logDatas = {
        'request_from' : self.sessionId,

        'datas' : self.logBuffer
      };

      p2 = self._makeAjax(self.options.persistLogUrl, 'POST', logDatas)

          .done(function() {
            // clear buffer when finished
            self.logBuffer = [];
          })

          .fail(function() {
            console.log("WebStats: fail sending log buffer");
            console.log(arguments);
          });
    }

  } catch (e) {
    _sendIsDone();
    console.error(e);
  }

  if (this.options.debug === true) {
    console.log("");
  }

  return $.when(p1, p2).then(_sendIsDone).fail(_sendIsDone);
};

/**
 * Add a log entry in buffer.
 * Log entry must have a text resume and can have several data arguments.
 *
 * @param text
 */
WebStats.prototype.addLogEntry = function(text, level, datas) {

  level = level || 'INFO';

  var dataStr;
  try {
    dataStr = JSON.stringify(datas);
  } catch (e) {
    dataStr = "Error while serializing JSON datas";
  }

  this.logBuffer.push({
    text : text, level: level, datas : dataStr
  });

};

/**
 * Return the list of events
 * @returns {*}
 */
WebStats.prototype.getEventList = function() {

  return this._makeAjax(this.options.readUrl + "/event/list", 'POST');

};

/**
 * Return an events resume
 * @returns {*}
 */
WebStats.prototype.getEventResume = function() {

  return this._makeAjax(this.options.readUrl + "/event/resume", 'POST');

};

/**
 * Return an events resume
 * @returns {*}
 */
WebStats.prototype.getEventTimeline = function() {

  return this._makeAjax(this.options.readUrl + "/event/timeline/hours", 'POST');

};

/**
 * Return an events resume
 * @returns {*}
 */
WebStats.prototype.getLastEvents = function() {

  return this._makeAjax(this.options.readUrl + "/event/last", 'POST');

};

/**
 * Return an events resume
 * @returns {*}
 */
WebStats.prototype.getLastLogs = function() {

  return this._makeAjax(this.options.readUrl + "/log/last", 'POST');

};

/**
 * Make ajax request with requested headers
 *
 * @param url
 * @param method
 * @param datas
 * @param headers
 * @returns {*}
 * @private
 */
WebStats.prototype._makeAjax = function(url, method, datas, headers) {

  var self = this;

  var req = {
    url : url,

    type : method,

    dataType : "json",

    data : JSON.stringify(datas),

    headers : {
      "Authorization" : self.options.authorization,

      "Content-Type" : "application/json"
    },

    timeout : 5000
  };

  // ajouter entetes si necessaire
  if (typeof headers !== "undefined") {
    $.extend(req.headers, headers);
  }

  return $.ajax(req);
};

/**
 * Export module if necesary
 */
if (typeof module !== "undefined" && module.exports) {
  module.exports = function(options) {
    return new WebStats(options);
  };
}

