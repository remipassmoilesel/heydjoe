#!/bin/bash

echo
echo "Envoyer la version courante à partir de la demo vers le serveur distant"
echo

cd /home/remipassmoilesel/projects/www/djoe/var/www

rsync -avz djoe/* im.silverpeas.net:/var/www/djoe



