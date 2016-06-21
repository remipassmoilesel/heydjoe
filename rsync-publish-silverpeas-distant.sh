#!/bin/bash

echo
echo "Envoyer la version courante à partir de 'dev' vers '/opt/silverpeas-6.0-SNAPSHOT-wildfly10/bin/build/dist/chatclient/'"
echo

rsync -avz "var.www.djoe/jsxc/dev/" "im.silverpeas.net:/opt/silverpeas-6.0-SNAPSHOT-wildfly10/bin/build/dist/chatclient/"

