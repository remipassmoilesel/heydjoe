#!/bin/bash

echo
echo "Envoyer la version courante à partir de 'dev' vers: "
echo "'/opt/silverpeas-6.0-SNAPSHOT-wildfly10/bin/build/dist/chatclient/'"
echo

cd /home/remipassmoilesel/projects/www/djoe/var/www

rsync -avz djoe/* im.silverpeas.net:/var/www/djoe



