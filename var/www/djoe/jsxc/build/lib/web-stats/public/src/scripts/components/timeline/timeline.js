/**
 * Show a pie chart
 */
var template = require('html!./timeline-template.html');
var Chance = require('chance');

var TimeLineController = function($scope, stats) {
  
  this.id = "timeLine_" + new Date().getTime();

  this.title = "Timeline";

  var self = this;
  stats.getEventTimeline()

      .then(function(result) {
        
        var labels = [];
        var datas = [];
        $.each(result, function(index, value) {
          labels.push(value.date);
          datas.push(value.event_number);
        });

        var lineChart = new Chart($("#" + self.id), {

          type: 'line',

          data : {

            labels : labels,

            datasets : [{
              label : 'Timeline',
              data : datas,
              borderColor: "rgba(75,192,192,1)",
              borderCapStyle: 'butt',

            }]
          },

          options : {}
        });

        $scope.$apply();

      })
      .fail(function() {
        console.log(arguments);
      });

};

TimeLineController.$inject = ["$scope", 'stats'];

module.exports = function(angularMod) {

  angularMod.component("timeline", {

    template : template,

    controller : TimeLineController,

    bindings : {}
  });
};