#!/bin/bash

#
# Download optionally dependencies and extract them in /opt directory
# See config.sh
#

# get configuration
source ../djoe-docker-config.sh

# verbose if needed
if [ $DJOE_DEBUG_MODE = true ] ; then
  set -x
fi

function downloadDependencies {

  # Openfire server
  wget https://www.igniterealtime.org/downloadServlet?filename=openfire/openfire_4_0_2.tar.gz -O openfire.tar.gz

  # Node JS
  wget https://nodejs.org/dist/v4.4.7/node-v4.4.7-linux-x64.tar.xz -O nodejs4.tar.gz

}

function extractDependencies {

    tar -xf openfire.tar.gz
    mv openfire /opt/

    tar -xf nodejs4.tar.gz
    mv node-v4.4.7-linux-x64 /opt/nodejs4/

}

# if download is disabled, return
if [ $DJOE_DOWNLOAD_DEPENDENCIES = true ] ; then
  downloadDependencies
fi

extractDependencies

