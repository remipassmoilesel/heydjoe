/**
 * Show a pie chart
 */
var template = require('html!./pie-chart-template.html');
var Chance = require('chance');

var PieChartController = function($scope, stats) {

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

        var backgrounds = [];
        var borders = [];
        var chance = new Chance();
        $.each(datas, function(){

          var c1 = chance.color({format: 'shorthex'});
          while(backgrounds.indexOf(c1) > 0){
            c1 = chance.color({format: 'shorthex'});
          }
          var c2 = chance.color({format: 'shorthex'});
          while(borders.indexOf(c2) > 0){
            c2 = "#333333";
          }

          backgrounds.push(c1);
          borders.push(c2);
        });

        var myChart = new Chart($("#" + self.id), {

          type : 'pie', 
          
          data : {
            labels : labels, datasets : [{
              label : 'Number of events',
              data : datas,
              backgroundColor : backgrounds,
              borderColor : borders,
              borderWidth : 1
            }]
          }, 
          
          options : {}
        });

        $scope.$apply();

      })
      .fail(function(result) {

        console.log(result);

      });

};

PieChartController.$inject = ["$scope", 'stats'];

module.exports = function(angularMod) {

  angularMod.component("pieChart", {

    template : template,

    controller : PieChartController,

    bindings : {}
  });
};