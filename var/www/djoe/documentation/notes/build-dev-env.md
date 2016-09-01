# Build Djoe client

## First setup
        # First you have to install Node LTS 4.4.4 (other version might be not supported)
        $ wget https://nodejs.org/dist/v4.4.4/node-v4.4.4-linux-x64.tar.xz
        $ tar -xvf node-v4.4.4-linux-x64.tar.xz
        $ export PATH=/path/to/node4

        # And install some global dev dependencies
        $ npm install -g grunt-cli bower node-sass

        # Clone project from Github
        $ git clone https://github.com/remipassmoilesel/djoe
        
        # Add first dev dependencies
        $ cd djoe
        $ npm install
        
        # Add demo site dependencies
        $ cd var/www/djoe/
        $ bower install
        
        # Build modified JSXC
        $ cd jsxc
        $ npm install 
        $ bower install
        
        
        After that, submodules may need more operations for development.
 
## Build

        # pwd = var/www/djoe/jsxc/ - Generate JSXC in dev/ and watch
        $ grunt
        
        # pwd = . 
        $ gulp jsxc-grunt
        
        # See all others in gulpfile.js and gruntfile.js
        
 
        
# Setup server-side

This project contains all configurations files needed for an installation on Ubuntu 14.04.