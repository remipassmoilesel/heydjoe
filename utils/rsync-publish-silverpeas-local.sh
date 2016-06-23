#!/bin/bash

echo
echo "Envoyer la version courante à partir de 'dev' vers: "
echo "'/opt/silverpeas-6.0-SNAPSHOT-wildfly10/bin/build/dist/chatclient/'"
echo "'/opt/silverpeas-sources/Silverpeas-Core/core-war/src/main/webapp/chatclient/'"
echo

rsync -avz "var/www/djoe/jsxc/dev/" "/opt/silverpeas-sources/Silverpeas-Core/core-war/src/main/webapp/chatclient/"

echo

rsync -avz "var/www/djoe/jsxc/dev/" "/opt/silverpeas-6.0-SNAPSHOT-wildfly10/bin/build/dist/chatclient/"

