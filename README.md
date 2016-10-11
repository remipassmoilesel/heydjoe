# Hey Djoe !

Instant communication system all-in-one destined to be integrated on any web page.

## Presentation

A small video is available on Youtube: https://youtu.be/dMTQm9NEYTs

## Functionnalities:
* Text chat between two or multiple users
* Collaborative text editing between multiple users
* Videoconference between two or multiple users
* Screen sharing from one to another user, or to multiple users

## Integration code

You can integrate it in your own web page by adding:

```

  <!-- XMPP client dependencies -->

  <link href="bower_components/jquery-ui/themes/base/jquery-ui.css" media="all" rel="stylesheet" type="text/css"/>
  <script src="bower_components/jquery/dist/jquery.js"></script>
  <script src="bower_components/jquery-ui/jquery-ui.js"></script>

  <!-- end XMPP client dependencies -->

  <!-- XMPP client -->

  <link href="jsxc/build/css/jsxc.css" media="all" rel="stylesheet" type="text/css"/>
  <script src="jsxc/build/lib/jsxc.dep.js"></script>
  <script src="jsxc/build/jsxc.js"></script>
  <script src="jsxc/build/jsxc_init.js"></script>

  <!-- end XMPP client -->

```

## Lot of servers to install but ... 

You can launch (almost)all with a few commands thanks to GNU/Linux and Docker:

```

    # /!\ Need Docker, see https://docs.docker.com/engine/installation/
    
    $ git clone https://github.com/remipassmoilesel/djoe-docker
    $ cd djoe-docker
    $ ./build-and-launch.sh

```

This produce an *example* installation with:

* Apache HTTP server
* XMPP server
* Etherpad 
* Postgres database
* Statistics server

After you need to setup a TLS proxy, for example with Apache:

```
    Listen 80
    Listen 443
    ServerSignature Off
    ServerTokens Prod
    
    <VirtualHost *:443>
    
      ServerName heydjoe.ddns.net
    
      LogLevel alert
    
      ErrorLog ${APACHE_LOG_DIR}/error.log
      CustomLog ${APACHE_LOG_DIR}/access.log combined
    
      SSLEngine on
      SSLCertificateFile      /etc/ssl/vps.crt
      SSLCertificateKeyFile   /etc/ssl/vps.key
    
      RewriteEngine on
    
      ProxyVia On
      ProxyRequests Off
      ProxyPreserveHost On
    
      ProxyPass /etherpad/p/ http://localhost:29001/p/
      ProxyPassReverse /etherpad/p/ http://localhost:29001/p/
    
      ProxyPass /etherpad/ http://localhost:29001/
      ProxyPassReverse /etherpad/ http://localhost:29001/
    
      RewriteRule ^/openfire-rest/(.*) http://localhost:29090/plugins/restapi/v1/$1 [P,L]
      ProxyPassReverse /openfire-rest/  http://localhost:29090/plugins/restapi/v1/
    
      ProxyPass /stats http://localhost:23000
      ProxyPassReverse /stats http://localhost:23000
    
      ProxyPass /stats/visualization http://localhost:23000/visualization
      ProxyPassReverse /stats/visualization http://localhost:23000/visualization
    
      ProxyPass / http://localhost:20080/
      ProxyPassReverse / http://localhost:20080/
    
    </VirtualHost>
    
```

Need an external TURN server, credentials can be modified in Docker image configuration.

## Thanks to:

* [JSXC](https://www.jsxc.org/): An XMPP client, improved to correspond to the wole system
* [Openfire](https://www.igniterealtime.org/projects/openfire/): A free XMPP server
* [RFC-5766 TURN Server](https://github.com/coturn/rfc5766-turn-server): A free server to handle media streams
* [Etherpad](http://etherpad.org/): A collaborative editing solution
* [webrtc-experiment.com](https://www.webrtc-experiment.com/)

Nothing would have been possible without these incredible projects !
And of course so many more: GNU/Linux Ubuntu, Apache HTTP, Postgres, ... 

## Screenshot

![Screenshot](var/www/djoe/images/screenshot_1.png)

## Documentation

Djoe is an internship project, the final report is available here: https://github.com/remipassmoilesel/djoe/raw/master/var/www/djoe/documentation/internship-report_final.pdf

To know more check the `var/www/documentation/` folder. Project is in progress, so documentation too.

## What is the status of this project?

Djoe is an internship project writted in few months, currently in alpha version. In its current state it is usable but it 
requires a bit of work to be improved and fully operational. 


