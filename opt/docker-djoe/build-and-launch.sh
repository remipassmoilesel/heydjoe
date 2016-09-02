#!/bin/bash

echo
echo "Building Docker container..."
echo "NOT READY FOR NOW !"
echo

IMAGE_ID="docker-djoe"

docker build -t "$IMAGE_ID" .

echo 
echo "Launching container ..."
echo

CTR_ID=`docker run -d "$IMAGE_ID"`

echo
echo "Container ID: "
echo "$CTR_ID"

sleep 1

echo
echo "Informations on container: "
docker inspect "$CTR_ID"

