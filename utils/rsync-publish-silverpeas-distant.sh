#!/bin/bash

echo
echo "Envoyer l'installation Silverpeas du dossier '/opt' local"
echo

rsync -avz "/opt/silverpeas-6.0-SNAPSHOT-wildfly10/" im.silverpeas.net:"/opt/silverpeas-6.0-SNAPSHOT-wildfly10/"

echo

rsync -avz "/opt/wildfly-10.0.0.Final/" im.silverpeas.net:"/opt/wildfly-10.0.0.Final/"