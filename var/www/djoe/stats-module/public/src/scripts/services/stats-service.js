
var conf = require("../../../../configuration.js");

module.exports = function(angularMod){
  
  var statService = require("../Stats-embed.js")({
    autosend : false,
    destinationUrl : conf.DESTINATION_URL,
    authorization : conf.AUTHORIZATION
  });

  angularMod.factory('stats', function() {
    return statService;
  });
  
};