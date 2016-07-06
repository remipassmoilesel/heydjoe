/**
 * Show a list of availables keywords
 */
var template = require('html!./event-resume.html');

var EventResumeController = function($http, $scope, stats) {

  var self = this;

  stats.getEventResume().then(function(result) {
    
    self.eventResume = result;

    $scope.$apply();
    
  });

};

EventResumeController.$inject = ["$http", "$scope", "stats"];

module.exports = function(angularMod) {

  angularMod.component("eventResume", {
    template : template,

    controller : EventResumeController,

    bindings : {}
  });
};