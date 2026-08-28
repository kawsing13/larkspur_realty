#!/usr/bin/env bash
# Restores a backup made by ./scripts/backup.sh.
#
#   ./scripts/restore.sh 20260827-131500
#
# This OVERWRITES the current database and object store. Confirm before running.

set -euo pipefail
cd "$(dirname "$0")/.."

STAMP="${1:?Usage: ./scripts/restore.sh <timestamp>}"
DIR="backups/$STAMP"
[ -f "$DIR/db.dump" ] || { echo "No backup at $DIR"; exit 1; }

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
DB_USER="${POSTGRES_USER:-rems}"
DB_NAME="${POSTGRES_DB:-rems}"

read -r -p "This will overwrite the database and storage in $COMPOSE_FILE. Type 'yes': " ok
[ "$ok" = "yes" ] || exit 1

echo "Restoring database..."
docker compose -f "$COMPOSE_FILE" exec -T db \
  pg_restore -U "$DB_USER" -d "$DB_NAME" --clean --if-exists --no-owner < "$DIR/db.dump"

echo "Restoring object storage..."
docker compose -f "$COMPOSE_FILE" exec -T storage sh -c 'rm -rf /data/* && tar xf - -C /data' < "$DIR/storage.tar"

echo "Restart the services:  docker compose -f $COMPOSE_FILE restart server"
