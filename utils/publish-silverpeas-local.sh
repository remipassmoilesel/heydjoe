#!/bin/bash

echo
echo "Envoyer la version courante à partir de 'dev' vers: "
echo "'/opt/silverpeas-6.0-SNAPSHOT-wildfly10/bin/build/dist/chatclient/'"
echo

cd ~/projects/www/djoe

export PATH=$PATH:/home/remipassmoilesel/nodejs4/bin

cd var/www/djoe/jsxc/

grunt build

cd ~/projects/www/djoe

rsync -avz "var/www/djoe/jsxc/dev/" "/home/remipassmoilesel/projects/javaee/silverpeas/Silverpeas-Core/core-war/src/main/webapp/chatclient/"

rsync -avz "var/www/djoe/jsxc/dev/" "/opt/silverpeas-6.0-SNAPSHOT-wildfly10/bin/build/dist/chatclient/"

