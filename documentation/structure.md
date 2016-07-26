# Djoe structure

Djoe is an instant communication system comprising several systems using multiple protocols.

Most interactions are made through the customer JSXC that has been extensively modified for this purpose.

Structure of the project:

* `docker/` : Contains what is necessary to build a Docker image. For now the image is no longer supported and will be updated soon.
* `documentation/` : Contains documentation and notes on the project.
* `etc/ opt/` : Contains all the necessary configuration files for installation on a Linux Ubuntu Server 14.04
* `utils/` : Contains utils for project. `configuration.list` is a list of files that can be copied from a remote server. 
`firewall-text` : Is a small set of file that can be used to simulate a strict firewall env for clients.
* `var/www/djoe` : Is the site demo and development environment of the client side.