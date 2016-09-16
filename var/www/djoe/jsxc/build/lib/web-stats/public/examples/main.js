/**
 *
 * Simple example of how to use Stats
 *
 *
 */

$(function() {

  var devMode = false;

  var destinationUrl = "https://domain.net/stats";

  if (devMode === true) {
    destinationUrl = "http://127.0.0.1:3005";
  }

  // Create an stat instance
  var stats = new WebStats({

    enabled : true,

    destinationUrl : destinationUrl,

    autosend : true,

    authorization : "DK5I4-0yl9N2KN64Pg5YcEAsdnCXeamr",

    watchErrors: true

  });

  // add a single event
  stats.addEvent("stats.visualization.ready");

  // monitor all action links
  $(".actions a").click(function() {

    var action = $(this).attr("href");

    console.log("Click on: " + action);

    var event = "stats.visualization." + action.substring(1, action.length);

    stats.addEvent(event);

  });

  setTimeout(function(){
    throw "Test error !";
  }, 1000);

});
