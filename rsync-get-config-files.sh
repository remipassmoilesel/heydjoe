#!/bin/bash

echo
echo "Récupérer les fichiers de configuration du serveur via Rsync/SSH..."
echo

# si des clefs sont utilisées, compléter le fichier ~/.ssh/config
rsync -av --exclude="opt.openfire" --files-from=config-files/list.txt im.silverpeas.net:/ config-files/



