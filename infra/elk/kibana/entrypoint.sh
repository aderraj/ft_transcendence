#!/bin/bash
# Kibana entrypoint - reads password from secrets

SECRETS_DIR="/secrets"

echo "[kibana] Waiting for secrets..."
while [ ! -f "$SECRETS_DIR/.ready" ]; do
    sleep 1
done

export ELASTICSEARCH_PASSWORD=$(cat "$SECRETS_DIR/elastic_password")
echo "[kibana] ✓ Password loaded"

exec /usr/local/bin/kibana-docker
