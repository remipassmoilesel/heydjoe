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
var _ = require('underscore');
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
 * Grab configuration
 */
var config = require("../configuration.js");

/**
 * Launching app
 */
log(("Starting Stats server on port: " + config.PORT + " ...").blue);
log();

/**
 * Manage database
 */
var dbmanager = require('./database.js');

/**
 * Check if table database ready
 */
// dbmanager.resetTableScheme();
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
fs.readFile('../public/src/scripts/Stats-embed.js', function(err, data) {

  if (err) {
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
    'Content-Type' : 'text/javascript',
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
statPersistence.post('/event', function(req, res) {

  log("");
  log(("Receiving data request: " + req.ip + "").green);

  checkAuthorization(req, res);

  // save datas
  dbmanager.saveRequest(req);

  res.status(200).json({"state" : 'OK'});
  res.send();

});

/**
 * Where clients send data
 */
statPersistence.post('/session', function(req, res) {

  log("");
  log(("Receiving session request: " + req.ip + "").green);

  checkAuthorization(req, res);

  // save datas
  dbmanager.saveSession(req);

  res.status(200).json({"state" : 'OK'});
  res.send();

});

/**
 * Where clients send data
 */
statPersistence.post('/log', function(req, res) {

  log("");
  log(("Receiving log request: " + req.ip + "").green);

  checkAuthorization(req, res);

  // save datas
  dbmanager.saveLog(req);

  res.status(200).json({"state" : 'OK'});
  res.send();

});

app.use('/persist', statPersistence); // mount the sub app

/**
 *
 *
 *
 *
 *
 * Where clients can get datas
 *
 *
 *
 *
 *
 *
 *
 */
var dataAccess = express(); // the sub app

/**
 * Get event list
 */
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

/**
 * Get event list with occurence number for each
 */
dataAccess.post('/event/resume', function(req, res) {

  checkAuthorization(req, res);

  dbmanager.query(
      "SELECT event_name, COUNT(*) FROM data_requests GROUP BY event_name ORDER BY event_name ASC;")

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

/**
 * Get the last events
 */
dataAccess.post('/event/last', function(req, res) {

  checkAuthorization(req, res);

  dbmanager.query(
      "SELECT * FROM data_requests ORDER BY datetime DESC LIMIT 300;")

      .then(function(result) {

        var finalRes = [];
        if (result && result.rows) {
          _.each(result.rows, function(value, key, list) {
            finalRes.push({
              "id" : value.id,
              "event_name" : value.event_name,
              "event_data" : value.event_data,
              "datetime": value.datetime
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

/**
 * Get events occurence per hours
 */
dataAccess.post('/event/timeline/hours', function(req, res) {

  checkAuthorization(req, res);

  var prettyDate = function(d) {
    return d.substring(0, 4) + "-" + d.substring(4, 6) + "-" + d.substring(6, 8) + " " +
        d.substring(8, 10) + ":00:00";
  };

  dbmanager.query(
      "SELECT COUNT(*), to_char(datetime, 'YYYYMMDDHH24') FROM data_requests GROUP BY to_char(datetime, 'YYYYMMDDHH24') ORDER BY to_char DESC LIMIT 100")

      .then(function(result) {

        var finalRes = [];
        if (result && result.rows) {
          _.each(result.rows, function(value, key, list) {
            finalRes.push({
              "event_number" : value.count,

              "date" : prettyDate(value.to_char)
            });
          });

          finalRes.reverse();

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

/**
 * Get events occurence per hours
 */
dataAccess.post('/log/last', function(req, res) {

  checkAuthorization(req, res);

  dbmanager.query(
      "SELECT * FROM data_logs ORDER BY datetime DESC LIMIT 100")

      .then(function(result) {

        var finalRes = [];
        if (result && result.rows) {

          _.each(result.rows, function(value, key, list) {

            var logDatas = "";
            if(value.data.length > 0) {
              try {
                logDatas = JSON.parse(value.data);
              } catch (e) {
                logDatas = "Error while parsing JSON datas";
              }
            }

            finalRes.push({

              "level" : value.level,

              "request_from" : value.request_from,

              "text" : value.text,

              "data" : logDatas,

              "datetime" : value.datetime,
              
              "id" : value.id,

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

