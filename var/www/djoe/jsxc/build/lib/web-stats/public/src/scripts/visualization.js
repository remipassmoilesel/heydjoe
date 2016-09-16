/**
 * Small data visualisation module
 */

var visualizationModule = angular.module("visualizationModule", ['ngMaterial', 'ngMessages', 'ngAnimate']);

// load components
require("./services/stats-service.js")(visualizationModule);

require("./components/timeline/timeline.js")(visualizationModule);
require("./components/pie-chart/pie-chart.js")(visualizationModule);
require("./components/event-list/event-list.js")(visualizationModule);
require("./components/event-resume/event-resume.js")(visualizationModule);
require("./components/last-events/last-events.js")(visualizationModule);
require("./components/last-logs/last-logs.js")(visualizationModule);

$(function() {

  console.log("Initialisation");

});