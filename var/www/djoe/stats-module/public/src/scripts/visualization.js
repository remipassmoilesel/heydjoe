/**
 * Small data visualisation module
 */

var visualizationModule = angular.module("visualizationModule", ['ngMaterial', 'ngMessages', 'ngAnimate']);

// load components
require("./components/pie-chart/pie-chart.js")(visualizationModule);
require("./components/event-list/event-list.js")(visualizationModule);
require("./components/event-resume/event-resume.js")(visualizationModule);

$(function() {

  console.log("Initialisation");

});