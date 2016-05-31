#!/bin/bash

# démarrage d'openfire
/opt/openfire/bin/openfire start

# démarrage d'etherpad en arrière plan
export PATH=$PATH:/opt/node/bin/
/opt/etherpad-lite/bin/run.sh --root &

# démarrage d'apache au premier plan
apachectl -D FOREGROUND


