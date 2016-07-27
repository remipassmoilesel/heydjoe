/**
 * Statsistic module. Create a Stats object, add pairs {id, value},
 * send data to store it or let Stats do it every XX minutes.
 *
 * @param options
 * @constructor
 */

var Stats = function(options) {

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

  };

  this.options = $.extend(defaultOptions, options);

  this.options.persistenceUrl = options.destinationUrl + "/persist";
  this.options.readUrl = options.destinationUrl + "/data";
  this.options.sessionUrl = options.destinationUrl + "/session";

  this.sessionId = "";

  this.buffer = [];

  // send buffer automatically
  if (options.autosend === true) {

    var self = this;

    setInterval(function() {
      self.sendDataBuffer();
    }, this.options.interval);

  }

};

/**
 * Add a key / value pair
 * @param id
 * @param value
 */
Stats.prototype.addEvent = function(event, data) {

  if (this.options.debug === true) {
    console.log("addEvent");
    console.log(arguments);
    console.log("");
  }

  this.buffer.push({event : event, data : data});
};

/**
 * Java hash string implementation
 * @param string
 * @returns {number}
 * @private
 */
Stats.prototype._hashString = function(string) {
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
Stats.prototype._createSessionId = function() {

  if (this.sessionId !== "") {
    throw "Session id already exist";
  }

  this.sessionId = this._hashString(
      new Date() + navigator.userAgent + Math.random() + "èèèèè!ù**$::;!;;!.§/;§/**/*e*eurh!yjyj");

  return this.sessionId;

};

Stats.prototype._resetSession = function() {
  this.sessionId = "";
};

/**
 * Send sessioninformations
 */
Stats.prototype.sendSession = function() {

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

  return self._makeAjax(self.options.sessionUrl, 'POST', datas);

};

/**
 * Send stored events
 * @returns {*}
 */
Stats.prototype.sendDataBuffer = function() {

  var self = this;

  if (this.options.debug === true) {
    console.log("sendDataBuffer");
    console.trace();
  }

  if (Object.keys(self.buffer).length < 1) {

    if (this.options.debug === true) {
      console.log("__ Empty buffer");
    }

    return;
  }

  if (self.sessionId === "") {

    if (this.options.debug === true) {
      console.log("__ Send session");
    }

    // send session
    this.sendSession()
        .then(function() {
          self._sendDataBuffer();

          if (self.options.debug === true) {
            console.log("__ Session sent");
            console.log(arguments);
          }

        })
        .fail(function() {
          console.error("Fail while sending session");
          self._resetSession();
        });
  }

  else {
    this._sendDataBuffer();
  }

  if (this.options.debug === true) {
    console.log("");
  }

};

Stats.prototype._sendDataBuffer = function() {

  var self = this;

  var datas = {
    'request_from' : self.sessionId,

    'datas' : self.buffer
  };

  return self._makeAjax(self.options.persistenceUrl, 'POST', datas)

      .done(function() {
        // clear buffer when finished
        self.buffer = [];
      })

      .fail(function() {
        console.log("Stats: fail sending buffer");
        console.log(arguments);
      });

};

/**
 * Return the list of events
 * @returns {*}
 */
Stats.prototype.getEventList = function() {

  var self = this;

  return self._makeAjax(self.options.readUrl + "/event/list", 'POST');

};

/**
 * Return an events resume
 * @returns {*}
 */
Stats.prototype.getEventResume = function() {

  var self = this;

  return self._makeAjax(self.options.readUrl + "/event/resume", 'POST');

};

/**
 * Return an events resume
 * @returns {*}
 */
Stats.prototype.getEventTimeline = function() {

  var self = this;

  return self._makeAjax(self.options.readUrl + "/event/timeline/hours", 'POST');

};

/**
 * Return an events resume
 * @returns {*}
 */
Stats.prototype.getLastEvents = function() {

  var self = this;

  return self._makeAjax(self.options.readUrl + "/event/last", 'POST');

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
Stats.prototype._makeAjax = function(url, method, datas, headers) {

  var self = this;

  var req = {
    url : url,

    type : method,

    dataType : "json",

    data : JSON.stringify(datas),

    headers : {
      "Authorization" : self.options.authorization,

      "Content-Type" : "application/json"
    }
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
    return new Stats(options);
  };
}


