/**
 *
 * Simple stat module for Javascript apps.
 *
 * Serverside, receive datas and store them.
 *
 * Display them on /stats-visual
 *
 */

/**
 * Dependencies
 */
var express = require('express');
var CJSON = require('circular-json')
var _ = require('underscore')
var colors = require('colors');
var fs = require('fs');
var winston = require('winston');

function log(str) {
  if (!str) {
    console.log();
    return;
  } else {
    console.log(new Date());
    console.log(str);
  }
}

/**
 * Launching app
 */
log("Starting Stats server ...".blue);
log();

/**
 * Manage database
 */
var dbmanager = require('./database.js');

/**
 * Grab configuration
 */
var config = require("./configuration.js");

/**
 * Check if table database ready
 */
//dbmanager.resetTableScheme();
dbmanager.createTableScheme();

/**
 * Express APP
 */
var app = express(); // the main app

/**
 * Enable use of request bodies
 */
var bodyparser = require("body-parser");
app.use(bodyparser.json());

/**
 * Enable CORS on main app
 */
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", config.ACCES_CONTROL_ALLOW_ORIGN);
  res.header("Access-Control-Allow-Headers", config.ACCESS_CONTROL_ALLOW_HEADERS);
  next();
});

/**
 * Check if request is authorized
 * @param res
 * @param req
 */
function checkAuthorization(req, res) {

  var key = req.get('Authorization');

  if (!key || key !== config.AUTHORIZATION) {

    log(("401 - Unauthorized: " + req.ip).red);

    res.status(401).json({"error" : 'Unauthorized'});
    res.send();

    return;

  }

}

var embedScript;
fs.readFile('../public/src/scripts/Stats-embed.js', function(err, data){

  if(err){
    throw err;
  }

  embedScript = data;

});



/**
 * Static data access
 */
app.get('/script', function(req, res) {

  res.status(200);
  res.set({
    'Content-Type': 'text/javascript',
  });

  res.send(embedScript);


});

app.use('/visualization', express.static('../public'));
app.use('/bower_components', express.static('../bower_components'));
app.use('/embed', express.static('../embed'));



/**
 * Requests persistence
 */
var statPersistence = express(); // the sub app

statPersistence.get('/', function(req, res) {
  res.status(200).json({"state" : 'OK'});
});

/**
 * Where clients send data
 */
statPersistence.post('/persist', function(req, res) {

  log("");
  log(("Receiving data request: " + req.ip + "").green);

  checkAuthorization(req, res);

  // save datas
  dbmanager.saveRequest(req);

  res.status(200).json({"state" : 'OK'});
  res.send();

});

app.use('/', statPersistence); // mount the sub app


/**
 * Where clients can see datas and charts
 */
var dataAccess = express(); // the sub app

dataAccess.post('/', function(req, res) {

});

dataAccess.post('/event/list', function(req, res) {

  checkAuthorization(req, res);

  dbmanager.query("SELECT DISTINCT event_name FROM data_requests ORDER BY event_name ASC;")

      .then(function(result) {

        var finalRes = [];
        if (result && result.rows) {

          _.each(result.rows, function(value, key, list) {
            finalRes.push(value.event_name);
          });

        }

        res.status(200).json(finalRes);
        res.send();

      })
      .catch(function(error) {
        log("500 - Internal error".red);
        log(error);

        res.status(500).json({"error" : '500'});
        res.send();
      });

});

dataAccess.post('/event/resume', function(req, res) {

  checkAuthorization(req, res);

  dbmanager.query("SELECT event_name, COUNT(*) FROM data_requests GROUP BY event_name ORDER BY event_name ASC;")

      .then(function(result) {

        var finalRes = [];
        if (result && result.rows) {
          _.each(result.rows, function(value, key, list) {
            finalRes.push({
              "event_name" : value.event_name, "count" : value.count
            });
          });

        }

        res.status(200).json(finalRes);
        res.send();

      })
      .catch(function(error) {
        log("500 - Internal error".red);
        log(error);

        res.status(500).json({"error" : '500'});
        res.send();
      });

});

app.use('/data', dataAccess); // mount the sub app

app.listen(config.PORT);

