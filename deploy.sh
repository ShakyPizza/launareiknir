#!/bin/bash
set -euo pipefail

readonly REPOSITORY_DIR='/opt/launareiknir'
readonly COMPOSE_DIR='/opt/traefik'

if [[ -n "$(git -C "$REPOSITORY_DIR" status --porcelain --untracked-files=all)" ]]; then
  echo "Refusing to deploy with local changes in $REPOSITORY_DIR" >&2
  exit 1
fi

echo "Updating main..."
git -C "$REPOSITORY_DIR" fetch --quiet --no-tags origin main
git -C "$REPOSITORY_DIR" checkout --quiet main
git -C "$REPOSITORY_DIR" merge --quiet --ff-only FETCH_HEAD

deployed_commit="$(git -C "$REPOSITORY_DIR" rev-parse HEAD)"

echo "Rebuilding and restarting $deployed_commit..."
docker compose --project-directory "$COMPOSE_DIR" build launareiknir
docker compose --project-directory "$COMPOSE_DIR" up -d launareiknir
echo "Deployed $deployed_commit"
