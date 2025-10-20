#!/bin/bash

# Database restore script

set -e

if [ -z "$1" ]; then
    echo "Usage: ./restore.sh <backup_file>"
    exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "🔄 Restoring database from: $BACKUP_FILE"

# Restore MongoDB
mongorestore --uri="$MONGODB_URI" --archive="$BACKUP_FILE" --gzip --drop

echo "✅ Database restored successfully!"