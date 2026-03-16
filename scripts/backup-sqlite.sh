#!/bin/bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/opt/backups/devstage}"
RETENTION_DAYS=7
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"
docker compose exec -T backend sqlite3 /app/data/devstage.db "PRAGMA wal_checkpoint(TRUNCATE);"
docker compose exec -T backend sqlite3 /app/data/devstage.db ".backup '/tmp/backup.db'"
docker compose cp backend:/tmp/backup.db "$BACKUP_DIR/devstage_${TIMESTAMP}.db"
docker compose exec -T backend rm -f /tmp/backup.db
gzip "$BACKUP_DIR/devstage_${TIMESTAMP}.db"
find "$BACKUP_DIR" -name "devstage_*.db.gz" -mtime +${RETENTION_DAYS} -delete
echo "[$(date)] Backup: devstage_${TIMESTAMP}.db.gz"
