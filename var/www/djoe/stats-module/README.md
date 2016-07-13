# Simple statistic module

To save and monitor events. Based on Node, Angular and Chartjs.

Work in progress.

## Getting started

Edit and adapt "configuration.js".

Server side:

    $ git clone "..."
    $ cd web-stats
    $ npm install
    $ cd public
    $ bower instaTB4qIxSR6YsL0YUl5KP35yvEUG27wYBVll
    
    $ sudo service psotgresql start
    $ sudo -u postgres psql -c 'create database Stats' 

    $ cd server
    $ node server.js


   
    
On client where you want to grab statistics:
    
    <script src="../public/bower_components/jquery/dist/jquery.js"></script>
    <script src="../public/bower_components/jquery-ui/jquery-ui.js"></script>
    <script src="../public/dist/Stats-embed.js"></script>
    
    var stats = new Stats({
      destinationUrl: "http://127.0.0.1:3000",
      authorization: "DK5I4-0yl9N2KN64Pg5YcEAsdnCXeamr",
      autosend: true
    });
    
    stats.addEvent("document.loaded", {});
    stats.addEvent("instant-messaging.new-video-call", {});
    stats.addEvent("instant-messaging.error", {message: 'Error: ...'});
    
    // performed automatically every n milliseconds
    stat.sendDataBuffer();
    
Visualize datas and charts on:

    http://.../visualization/

         
## Screenshots


![alt=Screenshot 1](https://github.com/remipassmoilesel/web-stats/blob/master/images/screenshot_1.png)


![alt=Screenshot 2](https://github.com/remipassmoilesel/web-stats/blob/master/images/screenshot_2.png)
