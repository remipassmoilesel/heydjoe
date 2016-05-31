#!/bin/bash

# lundi 23 mai 2016, 10:07:27 (UTC+0200)

echo
echo "Construire le conteneur et le lancer."

echo
echo "Construction du conteneur ..."
echo

IMAGE_ID="jsxc-etherpad-openfire"

docker build -t "$IMAGE_ID" .

echo 
echo "Lancement du conteneur, veuillez patienter quelques minutes..."
echo

CTR_ID=`docker run -d "$IMAGE_ID"`
#CTR_ID=`docker run -ti jsxc-etherpad-openfire`

echo
echo "Identifiant du conteneur: "
echo "$CTR_ID"

sleep 1

echo
echo "Informations sur le conteneur: "
docker inspect "$CTR_ID"

