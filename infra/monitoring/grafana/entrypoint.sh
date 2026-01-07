#!/bin/sh
# ============================================
# Grafana Entrypoint Script
# Reads admin password from secrets volume
# ============================================

set -e

SECRETS_DIR="/secrets"

echo "[grafana] Starting Grafana..."

# Wait for secrets to be ready
while [ ! -f "$SECRETS_DIR/.ready" ]; do
    echo "[grafana] Waiting for secrets..."
    sleep 2
done

# Read admin password from secrets
if [ -f "$SECRETS_DIR/grafana_password" ]; then
    export GF_SECURITY_ADMIN_PASSWORD=$(cat "$SECRETS_DIR/grafana_password")
    echo "[grafana] ✓ Admin password loaded from secrets"
else
    echo "[grafana] Warning: No grafana_password found, using default"
    export GF_SECURITY_ADMIN_PASSWORD="admin"
fi

# Start Grafana
exec /run.sh
