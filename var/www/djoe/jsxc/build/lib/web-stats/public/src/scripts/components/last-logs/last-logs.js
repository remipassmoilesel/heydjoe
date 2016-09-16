/**
 * Show a list of availables keywords
 */
var template = require('html!./last-logs.html');
var $ = require("jquery");

var LastLogsController = function($http, $scope, stats) {

  var self = this;

  stats.getLastLogs().then(function(result) {

    self.allLogs = result;
    self.displayLogs = result;

    $scope.$apply();

  }).fail(function() {
    console.error(arguments);
  });

};

/**
 * Log in console on demand
 * @param data
 */
LastLogsController.prototype.log = function(data) {

  var logData;
  try {
    logData = JSON.parse(data);
  } catch (e) {
    console.error("Error while logging data");
    logData = data;
  }

  console.log(logData);
};

/**
 * Filter results
 * @param event
 */
LastLogsController.prototype.filter = function(event) {

  var vm = this;
  var filter = this.textFilterValue.trim().toLowerCase();
  this.displayLogs = [];

  if(filter.length < 1){
    this.displayLogs = this.allLogs;
    return;
  }

  $.each(this.allLogs, function(index, element) {

    var tocheck = [
      element.level || '',
      element.request_from || ''
    ];

    for(var i= 0; i < tocheck.length; i++){
      var tc = tocheck[i].toLowerCase();
      if(tc.indexOf(filter) !== -1){
        vm.displayLogs.push(element);
        return true;
      }
    }

  });

};

LastLogsController.$inject = ["$http", "$scope", "stats"];

module.exports = function(angularMod) {

  angularMod.component("lastLogs", {
    template : template,

    controller : LastLogsController,

    bindings : {}
  });
};