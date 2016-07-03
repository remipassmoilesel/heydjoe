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

    /**
     * Destination, without trailing slash
     */
    // destinationUrl : "http://127.0.0.1:3000",

    /**
     * Interval between auto send,
     * can be disabled by use -1
     */
    interval : 1500, //interval: Math.floor((Math.random() * 14 * 60 * 100) + 8 * 60 * 100),

    /**
     * Authorization header
     */
    //authorization: 'doenfoenigfozinfeonfoin',

  };

  this.options = $.extend(options, defaultOptions);


  this.options.persistenceUrl = options.destinationUrl + "/persist";
  this.options.readUrl = options.destinationUrl + "/data";

  this.buffer = [];

  // send buffer automatically
  if (options.interval !== -1) {
    var self = this;
    setInterval(function() {
      self.sendDataBuffer();
    }, options.interval);
  }

}

/**
 * Add a key / value pair
 * @param id
 * @param value
 */
Stats.prototype.addEvent = function(event, data) {
  this.buffer.push({event : event, data : data});
}

/**
 *
 * @returns {*}
 */
Stats.prototype.sendDataBuffer = function() {

  var self = this;

  if (Object.keys(self.buffer).length < 1) {
    // console.log("Empty buffer");
    return;
  }

  var req = {
    url : self.options.persistenceUrl,
    type : 'POST',
    dataType : "json",
    data : JSON.stringify(self.buffer),
    headers : {
      "Authorization" : self.options.authorization,
      "Content-Type" : "application/json"
    }
  };

  // ajouter entetes si necessaire
  if (typeof headers !== "undefined") {
    $.extend(req.headers, headers);
  }

  return $.ajax(req)
      .done(function() {
        // clear buffer when finished
        self.buffer = [];
      })

      .fail(function(){
        console.log("fail sending buffer");
        console.log(arguments);
      });
}

/**
 * Return the list of events
 * @returns {*}
 */
Stats.prototype.getEventList = function(){

  var self = this;
  
  var req = {
    url : self.options.readUrl + "/event/list",
    type : 'POST',
    headers : {
      "Authorization" : self.options.authorization,
      "Content-Type" : "application/json"
    }
  };

  return $.ajax(req);
  
}

/**
 * Return an events resume
 * @returns {*}
 */
Stats.prototype.getEventResume = function(){

  var self = this;

  var req = {
    url : self.options.readUrl + "/event/resume",
    type : 'POST',
    headers : {
      "Authorization" : self.options.authorization,
      "Content-Type" : "application/json"
    }
  };

  return $.ajax(req);

}

/**
 * Export module if necesary
 */
if(typeof module !== "undefined" && module.exports){
  module.exports = function(options){
    return new Stats(options);
  }
}


