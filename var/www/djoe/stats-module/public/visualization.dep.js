

/**
 * Here goes heavy dependencies to light Gulp process
 */

$ = require("jquery");
require("jquery-ui");

var angular = require("angular");
var angularMaterial = require("angular-material");
var angularMessage = require("angular-messages");
var angularAnimate = require("angular-animate");

var Charts = require("./bower_components/Chart.js/dist/Chart.js");

var stats = require("./src/scripts/Stats-embed.js")({

  destinationUrl : "http://127.0.0.1:3000",

  authorization : "DK5I4-0yl9N2KN64Pg5YcEAsdnCXeamr"

});