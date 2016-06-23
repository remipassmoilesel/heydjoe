#!/bin/bash

# mardi 31 mai 2016, 10:43:27 (UTC+0200)

export PATH=$PATH:/home/remipassmoilesel/nodejs4/bin

cd var/www/djoe/jsxc/

grunt

# Notification d'arrêt en cas d'erreur
alert 'Fin de grunt !'
