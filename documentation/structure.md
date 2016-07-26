# Djoe structure

Djoe is an instant communication system comprising several systems using multiple protocols.

Most interactions are made through the customer JSXC that has been extensively modified for this purpose.


Structure of the project:

* `docker/` : Contains what is necessary to build a Docker image. For now the image is no longer supported and will be updated soon.
* `documentation/` : Contains documentation and notes on the project.
* `etc/ opt/` : Contains all the necessary configuration files for installation on a Linux Ubuntu Server 14.04
* `utils/` : Contains utils for project. `configuration.list` is a list of files that can be copied from a remote server. 
`firewall-text/` : Is a small set of file that can be used to simulate a strict firewall env for clients.
* `var/www/djoe/` : Is the demo website and development environment of the client side.



Structure of `var/www/djoe`:

* `bosh-test/` : A tool to test if a bosh connection is reachable.
* `css/` : Stylesheets for the demo website.
* `ice-test/` : A tool to test ICE connetion. 
* `images/` : Images for demo website. 
* `jquery.eventconsole/` : A tool to view JQuery triggered events.  
* `jquery.xmppinspector/` : A tool to monitor a Strophe connection.  
* `js/` : Javascript for demo website.
* `jsxc/` : The modified JSXC client.
* `openfire-rest/` : Development tools to work with Openfire.
* `screen-capture/` : Web browser extensions to capture and share screen. 
* `xmpp-console/` : Console to send and receive raw XMPP. 
* `xmpp-disco/` : Console to discover XMPP capabilities of entities.
* `index.html` : The demo website main page. 