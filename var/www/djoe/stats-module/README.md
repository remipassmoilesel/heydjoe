# Simple statistic module

To save and monitor events.

Server side:

    $ git clone "..."
    $ cd "..."
    $ npm install
    $ bower install
    
    $ cd server
    $ node server.js
    
    
Client side:
    
    <script src=".../jquery.js"/>
    <script src=".../embed/Stats.js"/>
    
    var stat = new Stats({
        destinationUrl: 'http://127.0.0.1:3000
    });
    
    stat.addEvent("document.button1.clicked");
    
    // performed automatically every n milliseconds
    stat.sendDataBuffer();
    
Visualize datas and charts on:

    http://127.0.0.1:3000/visualization/
         
        