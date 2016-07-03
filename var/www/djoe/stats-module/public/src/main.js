/**
 * Small data visualisation module
 */

var stats = require("../../embed/Stats.js")({
  destinationUrl : "http://127.0.0.1:3000", authorization : "DK5I4-0yl9N2KN64Pg5YcEAsdnCXeamr"
});

var Charts = require("../../bower_components/Chart.js/dist/Chart.bundle.min.js");

$(function() {

  console.log("Initialisation");

  makeEventList("#keywordList");
  makeEventResume("#eventResume");
  makeEventResumeChart("#eventResumeChart");

  /**
   * Create a selectable list with events
   * @param selector
   */
  function makeEventResumeChart(selector) {

    stats.getEventResume()

        .then(function(result) {

          var labels = [];
          var datas = [];
          $.each(result, function(index, value) {
            labels.push(value.event_name);
            datas.push(value.count);
          });

          var myChart = new Chart($(selector), {
            
            type: 'pie',
            data: {
              labels: labels,
              datasets: [{
                label: 'Number of events',
                data: datas,
                backgroundColor: [
                  'rgba(255, 99, 132, 0.2)',
                  'rgba(54, 162, 235, 0.2)',
                  'rgba(255, 206, 86, 0.2)',
                  'rgba(75, 192, 192, 0.2)',
                  'rgba(153, 102, 255, 0.2)',
                  'rgba(255, 159, 64, 0.2)'
                ],
                borderColor: [
                  'rgba(255,99,132,1)',
                  'rgba(54, 162, 235, 1)',
                  'rgba(255, 206, 86, 1)',
                  'rgba(75, 192, 192, 1)',
                  'rgba(153, 102, 255, 1)',
                  'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
              }]
            },
            options: {

            }
          });


        })
        .fail(function(result) {

          console.log(result);

          $(selector);

        });

  }

  /**
   * Create a selectable list with events
   * @param selector
   */
  function makeEventResume(selector) {

    stats.getEventResume()

        .then(function(result) {

          var list = $(selector);
          $.each(result, function(index, value) {
            list.append("<div> " + value.event_name + ": " + value.count + " </div>");
          })

        })
        .fail(function(result) {

          console.log(result);

          $(selector);

        });

  }


  /**
   * Create a selectable list with events
   * @param selector
   */
  function makeEventList(selector) {

    stats.getEventList()

        .then(function(result) {

          var list = $(selector);
          $.each(result, function(index, value) {
            list.append("<option value='" + value + "'> " + value + " </option>");
          })

        })
        .fail(function(result) {

          console.log(result);

          $(selector);

        });

  }



});