#!/bin/sh
# Backend entrypoint - reads secrets from volume

SECRETS_DIR="/secrets"

echo "[backend] Waiting for secrets..."
while [ ! -f "$SECRETS_DIR/.ready" ]; do
    sleep 1
done

export DATABASE_PASSWORD=$(cat "$SECRETS_DIR/db_password")
export JWT_SECRET=$(cat "$SECRETS_DIR/jwt_secret")
export VAULT_TOKEN=$(cat "$SECRETS_DIR/vault_token")
echo "[backend] ✓ Secrets loaded"

exec "$@"
