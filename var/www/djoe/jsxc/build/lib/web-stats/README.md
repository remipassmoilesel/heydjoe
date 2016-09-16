# Statistic module

To save and monitor events, and logs. Based on Node, Postgres, Angular and Chartjs.

All data stored is strictly anonymous.

Work in progress.

## Getting started

Edit and adapt "configuration.js".

Server side:

    $ git clone "..."
    $ cd web-stats
    $ npm install
    $ cd public
    $ bower install
    
    $ sudo service psotgresql start
    $ sudo -u postgres psql -c 'create database Stats' 

    $ cd server
    $ node server.js
    
On client where you want to grab statistics:
    
    <script src="../public/bower_components/jquery/dist/jquery.js"></script>
    <script src="../public/dist/Stats-embed.js"></script>
    
    var stats = new Stats({
      
      // server listenning
      destinationUrl: "http://127.0.0.1:3000",
      
      // authorization header, to avoid unexpected requests
      authorization: "DK5I4-0yl9N2KN64Pg5YcEAsdnCXeamr",
      
      // send informations automatically
      autosend: true,
      
      // watch for uncaught errors
      watchErrors: true
      
    });
    
    stats.addEvent("document.loaded", {});
    stats.addEvent("instant-messaging.new-video-call", {});
    stats.addEvent("instant-messaging.error", {message: 'Error: ...'});
    
    // monitor links with JQuery
    $(".actions a").click(function() {
        var event = "stats.preifx." + $(this).attr("href");;
        stats.addEvent(event);
    });
    
    // send logs to server
    stats.addLogEntry("Something happened !", { var_name: "value"}, "INFO");
    
    // unexpected errors are watched
    throw "Something wrong !"
    
    // send data buffer, performed automatically every n milliseconds
    stats.sendDataBuffer();
    
    
Visualize datas and charts on:

    http://.../visualization/

         
## Screenshots


![alt=Screenshot 1](https://github.com/remipassmoilesel/web-stats/blob/master/images/screenshot_1.png)


![alt=Screenshot 2](https://github.com/remipassmoilesel/web-stats/blob/master/images/screenshot_2.png)


![alt=Screenshot 3](https://github.com/remipassmoilesel/web-stats/blob/master/images/screenshot_3.png)