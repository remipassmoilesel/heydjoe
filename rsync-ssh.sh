#!/bin/bash

echo
echo "Copier les fichiers locaux vers le serveur via Rsync/SSH..."
echo

# si des clefs sont utilisées, compléter le fichier ~/.ssh/config
rsync -avz --exclude="opt.openfire" . im.silverpeas.net:/var/www/djoe

