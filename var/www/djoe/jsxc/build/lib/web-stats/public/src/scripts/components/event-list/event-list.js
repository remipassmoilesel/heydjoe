/**
 * Show a list of availables keywords
 */
var template = require('html!./event-list-template.html');

var EventListController = function($http, $scope, stats) {

  var self = this;

  stats.getEventList().then(function(result) {

    self.eventList = result;

    $scope.$apply();

  }).fail(function() {
    console.error(arguments);
  });

};

EventListController.$inject = ["$http", "$scope", 'stats'];

module.exports = function(angularMod) {

  angularMod.component("eventList", {
    template : template,

    controller : EventListController, bindings : {}
  });
};