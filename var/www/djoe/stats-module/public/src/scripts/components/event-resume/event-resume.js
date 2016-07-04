/**
 * Show a list of availables keywords
 */
var template = require('html!./event-resume.html');

var stats = require("../../Stats-embed.js")({
  autosend : false,
  destinationUrl : "http://127.0.0.1:3000",
  authorization : "DK5I4-0yl9N2KN64Pg5YcEAsdnCXeamr"
});

var EventResumeController = function($http, $scope) {

  var self = this;

  stats.getEventResume().then(function(result) {
    
    self.eventResume = result;

    $scope.$apply();
    
  });

};

EventResumeController.$inject = ["$http", "$scope"];

module.exports = function(angularMod) {

  angularMod.component("eventResume", {
    template : template,

    controller : EventResumeController,

    bindings : {}
  });
};