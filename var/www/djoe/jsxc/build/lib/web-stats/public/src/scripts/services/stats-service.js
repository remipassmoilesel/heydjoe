
var conf = require("../../../../configuration.js");

module.exports = function(angularMod){

  var loc = document.location.toString();
  var destinationUrl = loc.substr(0, loc.indexOf('/visualization'));

  var statService = require("../Stats-embed.js")({
    autosend : false,
    destinationUrl : destinationUrl,
    authorization : conf.AUTHORIZATION,
    sendSessionOnStart: false
  });

  angularMod.factory('stats', function() {
    return statService;
  });

};