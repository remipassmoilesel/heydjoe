/**
 * Database manager
 *
 *
 */

var pg = require('pg');
var fs = require('fs');
var _ = require('underscore');

var config = require("../configuration.js");
var sql_templates = ['create-tables.sql'];

var DBManager = function() {

  var self = this;

  // reading templates
  this.templates = {};

  _.each(sql_templates, function(value, key, list) {
    self.templates[value] = fs.readFileSync('sql-templates/' + value, 'utf8');
  });

  var pg_config = {
    user : config.PG_USER, //env var: PGUSER
    database : config.PG_DATABASE, //env var: PGDATABASE
    password : config.PG_SECRET, //env var: PGPASSWORD
    port : config.PG_PORT, //env var: PGPORT
    max : 10, // max number of clients in the pool
    idleTimeoutMillis : 30000, // how long a client is allowed to remain idle before being closed
  };

  //this initializes a connection pool
  //it will keep idle connections open for a 30 seconds
  //and set a limit of maximum 10 idle clients
  this.pool = new pg.Pool(pg_config);

  this.pool.on('error', function(err, client) {
    // if an error is encountered by a client while it sits idle in the pool
    // the pool itself will emit an error event with both the error and
    // the client which emitted the original error
    // this is a rare occurrence but can happen if there is a network partition
    // between your application and the database, the database restarts, etc.
    // and so you might want to handle it and at least log it out
    console.error('idle client error', err.message, err.stack)
  })

};

/**
 * Create tables scheme if not exist
 */
DBManager.prototype.createTableScheme = function() {
  this.query(this.templates['create-tables.sql']);
};

/**
 * /!\ /!\ /!\ /!\
 *
 * Reset tables scheme
 */
DBManager.prototype.resetTableScheme = function() {

  var self = this;

  console.log(" !!! Table scheme have been reseted.");
  console.log(" !!! Table scheme have been reseted.");
  console.log(" !!! Table scheme have been reseted.");
  console.log(" !!! Table scheme have been reseted.");
  console.log("");

  this.query("DROP TABLE data_requests").then(function() {
    self.createTableScheme();
  });

};

/**
 * Execute a postgres query
 * @param query
 * @param arguments
 * @returns {Promise}
 */
DBManager.prototype.query = function(query, arguments) {

  var self = this;

  var args = arguments;

  return new Promise(function(resolve, reject) {

    // to run a query we can acquire a client from the pool,
    // run a query on the client, and then return the client to the pool
    self.pool.connect(function(err, client, done) {

      if (err) {
        reject(err);
        return;
      }

      client.query(query, args, function(err, result) {
        //call `done()` to release the client back to the pool
        done();

        if (err) {
          reject(err);
          return console.error('error running query', err);
        }

        resolve(result);
      });
    });
  });
};

/**
 * Save a request from client
 *
 * Request contains:
 *  - One session id called 'request_from'
 *  - Possible multiple pair key/value
 *
 * @param req
 */
DBManager.prototype.saveRequest = function(req) {

  var self = this;

  var datas = req.body.datas;

  var request_from = req.body.request_from;

  // to run a query we can acquire a client from the pool,
  // run a query on the client, and then return the client to the pool
  self.pool.connect(function(err, client, done) {

    if (err) {
      console.error('Error getting client', err);
      return;
    }

    var sqlReq = "INSERT INTO data_requests (request_from, event_name, event_data)";
    sqlReq += " VALUES ($1, $2, $3)";

    _.each(datas, function(value, key, list) {

      try {

        var event = value.event;
        var value = Object.keys(value).length > 0 ? JSON.stringify(value.data) : "";

        client.query(sqlReq, [request_from, event, value], function(err, result) {
          //call `done()` to release the client back to the pool
          done();

          if (err) {
            console.error('Error running query', err);
            return;
          }

        });

      } catch (e) {
        console.error(e);
      }

    });

  });

};

/**
 * 
 * Save session request in database
 * 
 * 
 * @param req
 */
DBManager.prototype.saveSession = function(req){

  var self = this;

  var datas = req.body;

  self.pool.connect(function(err, client, done) {

    if (err) {
      console.error('error getting client', err);
      return;
    }

    try {

      var sqlReq = "INSERT INTO data_sessions (request_from, navigator_language, user_agent)";
      sqlReq += " VALUES ($1, $2, $3)";

      var request_from = datas.request_from;
      var navigator_language = datas.navigator_language;
      var user_agent = datas.user_agent;

      client.query(sqlReq, [request_from, navigator_language, user_agent], function(err, result) {
        //call `done()` to release the client back to the pool
        done();

        if (err) {
          console.error('Error running query', err);
          return;
        }

      });

    } catch (e) {
      console.error(e);
    }

  });


};

/**
 *
 * Save log request in database
 *
 *
 * @param req
 */
DBManager.prototype.saveLog = function(req){

  var self = this;

  var request_from = req.body.request_from;
  var datas = req.body.datas;

  self.pool.connect(function(err, client, done) {

    if (err) {
      console.error('error getting client', err);
      return;
    }

    var sqlReq = "INSERT INTO data_logs(request_from, text, data, level)";
    sqlReq += " VALUES ($1, $2, $3, $4)";

    _.each(datas, function(value, key, list) {

      try {

        var text = value.text;
        var level = value.level || "INFO";
        var datas = value.datas && value.datas.length > 0 ? JSON.stringify(value.datas) : "";

        client.query(sqlReq, [request_from, text, datas, level], function(err, result) {
          //call `done()` to release the client back to the pool
          done();

          if (err) {
            console.error('Error running query', err);
            return;
          }

        });

      } catch (e) {
        console.error(e);
      }

    });

  });


};

module.exports = new DBManager();