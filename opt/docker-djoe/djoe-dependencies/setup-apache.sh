#!/bin/bash

# Apache setup
# Apache can be set up with non certified keys or with provided keys

# get configuration
source ../djoe-docker-config.sh

# verbose if needed
if [ $DJOE_DEBUG_MODE = true ] ; then
  set -x
fi

function setupNonCertifiedKeys {

  # Generate keys
  cd /etc/ssl
  openssl req -new -newkey rsa:4096 -days 365 -nodes -x509 \
    -subj "/C=AA/ST=BB/L=CC/O=DD/CN=EE" \
    -keyout djoe.key -out djoe.cert

}

function setupCertifiedKeys {
  echo "Setup with certified keys not implemented for now"
  exit 1
}

# activate Apache2 needed modules
a2enmod ssl rewrite

# setup keys
if [ $DJOE_USE_NON_CERTIF_KEYS = true ] ; then
  setupNonCertifiedKeys
else
  setupCertifiedKeys
fi

# configure Apache
rm /etc/apache2/sites-available/*
cp /opt/djoe-project/etc/apache2/sites-available/djoe.conf /etc/apache2/sites-available/djoe.conf

a2ensite djoe.conf
service apache2 restart