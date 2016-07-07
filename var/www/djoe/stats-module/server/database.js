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
}

/**
 * /!\ /!\ /!\ /!\
 *
 * Reset tables scheme
 */
DBManager.prototype.resetTableScheme = function() {

  var self = this;
  this.query("DROP TABLE data_requests").then(function() {
    self.createTableScheme();
  });

}

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

DBManager.prototype.saveRequest = function(req) {

  var self = this;

  var remoteaddr = req.connection.remoteAddress;

  var indexOfColon = remoteaddr.lastIndexOf(':');
  var from = remoteaddr.substring(indexOfColon + 1, remoteaddr.length);

  console.log(remoteaddr);
  console.log(indexOfColon);
  console.log(from);

  var datas = req.body;

  // to run a query we can acquire a client from the pool,
  // run a query on the client, and then return the client to the pool
  self.pool.connect(function(err, client, done) {

    if (err) {
      console.error('error getting client', err);
      return;
    }

    _.each(datas, function(value, key, list) {

      try {

        var req = "INSERT INTO data_requests (request_from, event_name, event_data)"
        req += " VALUES ($1, $2, $3)";

        console.log(value);

        var event = value.event;
        var value = Object.keys(value).length > 0 ? JSON.stringify(value.data) : "";

        client.query(req, [from, event, value], function(err, result) {
          //call `done()` to release the client back to the pool
          done();

          if (err) {
            console.error('error running query', err);
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