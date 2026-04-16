#!/bin/bash
set -e
echo "Pulling latest changes..."
cd /opt/launareiknir
git pull
echo "Rebuilding and restarting..."
cd /opt/traefik
docker compose build launareiknir
docker compose up -d launareiknir
echo "Done!"
