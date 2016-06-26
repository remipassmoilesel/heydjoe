#!/bin/bash

echo
echo "Envoyer la version courante à partir de 'dev' vers: "
echo "'/opt/silverpeas-6.0-SNAPSHOT-wildfly10/bin/build/dist/chatclient/'"
echo

cd ~/projects/www/djoe

utils/publish-silverpeas-local.sh

/opt/silverpeas-6.0-SNAPSHOT-wildfly10/publish-distant.sh



