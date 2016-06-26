#!/bin/bash

echo
echo "Envoyer l'installation Silverpeas du dossier '/opt' local"
echo

rsync -avz "var/www/djoe/jsxc/dev/" im.silverpeas.net:"/opt/silverpeas-6.0-SNAPSHOT-wildfly10/bin/build/dist/chatclient/"


