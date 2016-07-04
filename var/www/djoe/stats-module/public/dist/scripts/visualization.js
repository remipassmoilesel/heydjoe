/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Small data visualisation module
	 */

	var visualizationModule = angular.module("visualizationModule", ['ngMaterial', 'ngMessages', 'ngAnimate']);

	// load components
	__webpack_require__(1)(visualizationModule);
	__webpack_require__(4)(visualizationModule);
	__webpack_require__(6)(visualizationModule);

	$(function() {

	  console.log("Initialisation");

	});

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Show a pie chart
	 */
	var template = __webpack_require__(2);

	var stats = __webpack_require__(3)({
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

/***/ },
/* 2 */
/***/ function(module, exports) {

	module.exports = "\n\n<div class=\"pieChartContainer\">\n\n  <h2>{{$ctrl.title}}</h2>\n\n  <canvas id=\"{{$ctrl.id}}\" style=\"width: 400px; height: 400px;\"></canvas>\n\n</div>";

/***/ },
/* 3 */
/***/ function(module, exports) {

	/**
	 * Statsistic module. Create a Stats object, add pairs {id, value},
	 * send data to store it or let Stats do it every XX minutes.
	 *
	 * @param options
	 * @constructor
	 */

	var Stats = function(options) {

	  if (!options || !options.destinationUrl) {
	    throw "You must specify destination";
	  }

	  var defaultOptions = {

	    /**
	     * Destination, without trailing slash
	     */
	    // destinationUrl : "http://127.0.0.1:3000",

	    /**
	     * Set true for send data in interval
	     */
	    autosend: true,

	    /**
	     * Interval between auto sent
	     *
	     */
	    interval : 1500, //interval: Math.floor((Math.random() * 14 * 60 * 100) + 8 * 60 * 100),

	    /**
	     * Authorization header
	     */
	    //authorization: 'doenfoenigfozinfeonfoin',

	  };

	  this.options = $.extend(options, defaultOptions);

	  this.options.persistenceUrl = options.destinationUrl + "/persist";
	  this.options.readUrl = options.destinationUrl + "/data";

	  this.buffer = [];

	  // send buffer automatically
	  if (options.autosend === true) {
	    var self = this;
	    setInterval(function() {
	      self.sendDataBuffer();
	    }, options.interval);
	  }

	}

	/**
	 * Add a key / value pair
	 * @param id
	 * @param value
	 */
	Stats.prototype.addEvent = function(event, data) {
	  this.buffer.push({event : event, data : data});
	}

	/**
	 *
	 * @returns {*}
	 */
	Stats.prototype.sendDataBuffer = function() {

	  var self = this;

	  if (Object.keys(self.buffer).length < 1) {
	    // console.log("Empty buffer");
	    return;
	  }

	  var req = {
	    url : self.options.persistenceUrl,
	    type : 'POST',
	    dataType : "json",
	    data : JSON.stringify(self.buffer),
	    headers : {
	      "Authorization" : self.options.authorization,
	      "Content-Type" : "application/json"
	    }
	  };

	  // ajouter entetes si necessaire
	  if (typeof headers !== "undefined") {
	    $.extend(req.headers, headers);
	  }

	  return $.ajax(req)
	      .done(function() {
	        // clear buffer when finished
	        self.buffer = [];
	      })

	      .fail(function(){
	        console.log("fail sending buffer");
	        console.log(arguments);
	      });
	};


	/**
	 * Return the list of events
	 * @returns {*}
	 */
	Stats.prototype.getEventList = function(){

	  var self = this;

	  var req = {
	    url : self.options.readUrl + "/event/list",
	    type : 'POST',
	    headers : {
	      "Authorization" : self.options.authorization,
	      "Content-Type" : "application/json"
	    }
	  };

	  return $.ajax(req);

	}

	/**
	 * Return an events resume
	 * @returns {*}
	 */
	Stats.prototype.getEventResume = function(){

	  var self = this;

	  var req = {
	    url : self.options.readUrl + "/event/resume",
	    type : 'POST',
	    headers : {
	      "Authorization" : self.options.authorization,
	      "Content-Type" : "application/json"
	    }
	  };

	  return $.ajax(req);

	}


	/**
	 * Export module if necesary
	 */
	if(typeof module !== "undefined" && module.exports){
	  module.exports = function(options){
	    return new Stats(options);
	  }
	}




/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Show a list of availables keywords
	 */
	var template = __webpack_require__(5);

	var stats = __webpack_require__(3)({
	  autosend : false,
	  destinationUrl : "http://127.0.0.1:3000",
	  authorization : "DK5I4-0yl9N2KN64Pg5YcEAsdnCXeamr"
	});

	var EventListController = function($http, $scope) {

	  var self = this;

	  stats.getEventList().then(function(result) {

	    self.eventList = result;

	    $scope.$apply();

	  });

	};

	EventListController.$inject = ["$http", "$scope"];

	module.exports = function(angularMod) {

	  angularMod.component("eventList", {
	    template : template,

	    controller : EventListController, bindings : {}
	  });
	};

/***/ },
/* 5 */
/***/ function(module, exports) {

	module.exports = "\n<div class=\"eventListContainer\">\n\n  <h2>Event list</h2>\n\n  <div style=\"overflow: auto\">\n    <div ng-repeat=\"(i, val) in $ctrl.eventList\">{{i + 1}}. {{val}}</div>\n  </div>\n\n</div>";

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Show a list of availables keywords
	 */
	var template = __webpack_require__(7);

	var stats = __webpack_require__(3)({
	  autosend : false,
	  destinationUrl : "http://127.0.0.1:3000",
	  authorization : "DK5I4-0yl9N2KN64Pg5YcEAsdnCXeamr"
	});

	var EventResumeController = function($http, $scope) {

	  var self = this;

	  stats.getEventResume().then(function(result) {
	    
	    self.eventResume = result;

	    $scope.$apply();
	    
	  });

	};

	EventResumeController.$inject = ["$http", "$scope"];

	module.exports = function(angularMod) {

	  angularMod.component("eventResume", {
	    template : template,

	    controller : EventResumeController,

	    bindings : {}
	  });
	};

/***/ },
/* 7 */
/***/ function(module, exports) {

	module.exports = "<div class=\"eventResumeContainer\">\n\n  <h2>Event resume</h2>\n\n  <div style=\"overflow: auto\">\n    <div ng-repeat=\"(i, val) in $ctrl.eventResume\">{{i + 1}}. {{val.event_name + \": \" + val.count}}\n    </div>\n  </div>\n\n</div>";

/***/ }
/******/ ]);