#!/bin/bash

# Database backup script

set -e

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/mongodb_backup_$DATE.gz"

echo "📦 Starting database backup..."

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# MongoDB backup
mongodump --uri="$MONGODB_URI" --archive="$BACKUP_FILE" --gzip

echo "✅ Backup completed: $BACKUP_FILE"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "mongodb_backup_*.gz" -mtime +7 -delete

echo "🧹 Old backups cleaned up"