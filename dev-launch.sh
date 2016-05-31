#!/bin/bash

# lundi 23 mai 2016, 20:18:15 (UTC+0200)

echo
echo "Essai en local"
echo

openfire4 start

xampp start

google-chrome --incognito http://127.0.0.1/www/djoe/var.www.djoe/ &> /dev/null &
chromium-browser --incognito http://127.0.0.1/www/djoe/var.www.djoe/xmpp-console/ &> /dev/null &
chromium-browser --incognito http://127.0.0.1/www/djoe/var.www.djoe/ &> /dev/null &
