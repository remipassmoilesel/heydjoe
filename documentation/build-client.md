# How to build Djoe client

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
        