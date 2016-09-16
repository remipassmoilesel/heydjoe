/**
 * Show a list of availables keywords
 */
var template = require('html!./last-events.html');

var LastEventsController = function($http, $scope, stats) {

  var self = this;

  stats.getLastEvents().then(function(result) {

    self.lastEvents = result;

    $.each(self.lastEvents, function(index, element){
      //2016-07-03T17:05:00.585Z
      var month = element.datetime.substring(5,7);
      var day = element.datetime.substring(8,10);
      var hour = element.datetime.substring(11,16);
      element.prettyDate = day + "/" + month + " - " + hour ;
    });

    $scope.$apply();

  })
      .fail(function() {
        console.error(arguments);
      });

};

LastEventsController.$inject = ["$http", "$scope", "stats"];

module.exports = function(angularMod) {

  angularMod.component("lastEvents", {
    template : template,

    controller : LastEventsController,

    bindings : {}
  });
};