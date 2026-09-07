#!/bin/bash
set -euo pipefail

readonly REPOSITORY_DIR='/opt/launareiknir'
readonly COMPOSE_DIR='/opt/traefik'
readonly EXPECTED_COMMIT="${1:-}"

if [[ ! "$EXPECTED_COMMIT" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Usage: $0 <40-character commit SHA>" >&2
  exit 2
fi

if [[ -n "$(git -C "$REPOSITORY_DIR" status --porcelain --untracked-files=all)" ]]; then
  echo "Refusing to deploy with local changes in $REPOSITORY_DIR" >&2
  exit 1
fi

echo "Fetching verified commit $EXPECTED_COMMIT..."
git -C "$REPOSITORY_DIR" fetch --quiet --no-tags origin "$EXPECTED_COMMIT"
git -C "$REPOSITORY_DIR" checkout --quiet --detach "$EXPECTED_COMMIT"

deployed_commit="$(git -C "$REPOSITORY_DIR" rev-parse HEAD)"
if [[ "$deployed_commit" != "$EXPECTED_COMMIT" ]]; then
  echo "Refusing to deploy unexpected commit $deployed_commit" >&2
  exit 1
fi

echo "Rebuilding and restarting $deployed_commit..."
docker compose --project-directory "$COMPOSE_DIR" build launareiknir
docker compose --project-directory "$COMPOSE_DIR" up -d launareiknir
echo "Deployed $deployed_commit"
