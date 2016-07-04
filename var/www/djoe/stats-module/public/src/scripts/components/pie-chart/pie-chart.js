/**
 * Show a pie chart
 */
var template = require('html!./pie-chart-template.html');

var stats = require("../../Stats-embed.js")({
  autosend : false,
  destinationUrl : "http://127.0.0.1:3000",
  authorization : "DK5I4-0yl9N2KN64Pg5YcEAsdnCXeamr"
});

var PieChartController = function($scope) {

  this.id = "pieChart_" + new Date().getTime();

  this.title = "Pie chart";

  var self = this;
  stats.getEventResume()

      .then(function(result) {

        var labels = [];
        var datas = [];
        $.each(result, function(index, value) {
          labels.push(value.event_name);
          datas.push(value.count);
        });

        var myChart = new Chart($("#" + self.id), {

          type : 'pie', data : {
            labels : labels, datasets : [{
              label : 'Number of events',
              data : datas,
              backgroundColor : ['rgba(255, 99, 132, 0.2)', 'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)', 'rgba(75, 192, 192, 0.2)', 'rgba(153, 102, 255, 0.2)',
                'rgba(255, 159, 64, 0.2)'],
              borderColor : ['rgba(255,99,132,1)', 'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)', 'rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)'],
              borderWidth : 1
            }]
          }, options : {}
        });

        $scope.$apply();

      })
      .fail(function(result) {

        console.log(result);

      });

};

PieChartController.$inject = ["$scope"];

module.exports = function(angularMod) {

  angularMod.component("pieChart", {

    template : template,

    controller : PieChartController,

    bindings : {}
  });
};