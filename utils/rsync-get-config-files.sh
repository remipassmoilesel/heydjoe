#!/bin/bash

echo
echo "Récupérer les fichiers de configuration du serveur via Rsync/SSH..."
echo

# si des clefs sont utilisées, compléter le fichier ~/.ssh/config
rsync -av --files-from=utils/config-list.txt im.silverpeas.net:/ .



