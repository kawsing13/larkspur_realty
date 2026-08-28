#!/usr/bin/env bash
# Dumps the database and the object store to ./backups/<timestamp>/.
#
#   ./scripts/backup.sh                 # local dev (docker-compose.yml)
#   COMPOSE_FILE=docker-compose.prod.yml ./scripts/backup.sh
#
# Restore with ./scripts/restore.sh <timestamp>.

set -euo pipefail
cd "$(dirname "$0")/.."

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
DB_USER="${POSTGRES_USER:-rems}"
DB_NAME="${POSTGRES_DB:-rems}"
STAMP="$(date +%Y%m%d-%H%M%S)"
DIR="backups/$STAMP"
mkdir -p "$DIR"

echo "Backing up database -> $DIR/db.dump"
docker compose -f "$COMPOSE_FILE" exec -T db \
  pg_dump -U "$DB_USER" -d "$DB_NAME" -Fc > "$DIR/db.dump"

echo "Backing up object storage -> $DIR/storage.tar"
docker compose -f "$COMPOSE_FILE" exec -T storage \
  tar cf - -C /data . > "$DIR/storage.tar"

echo "Done. $(du -sh "$DIR" | cut -f1) in $DIR"
echo "Keep backups off-box (S3, another host). Test a restore regularly."
