#!/bin/sh
# ============================================
# Vault Container Entrypoint
# Auto-initializes and writes secrets to shared volume
# ============================================

set -e

CREDS_FILE="/vault/file/init-status"
SECRETS_DIR="/secrets"

# Start Vault in background
vault server -config=/vault/config/vault.hcl &
VAULT_PID=$!

wait_for_vault() {
    echo "[vault] Waiting for Vault to start..."
    for i in $(seq 1 30); do
        if vault status -format=json -tls-skip-verify 2>/dev/null | grep -q '"initialized"'; then
            return 0
        fi
        sleep 1
    done
    return 1
}

write_secrets_to_volume() {
    # Write secrets to shared volume for other containers
    echo "[vault] Writing secrets to shared volume..."
    
    . "$CREDS_FILE"
    export VAULT_TOKEN="$VAULT_TOKEN"
    
    # Get secrets from Vault and write to files
    vault kv get -tls-skip-verify -field=db_password secret/pong-app > "$SECRETS_DIR/db_password"
    vault kv get -tls-skip-verify -field=elastic_password secret/pong-app > "$SECRETS_DIR/elastic_password"
    vault kv get -tls-skip-verify -field=jwt_secret secret/pong-app > "$SECRETS_DIR/jwt_secret"
    vault kv get -tls-skip-verify -field=api_key secret/pong-app > "$SECRETS_DIR/api_key"
    echo "$VAULT_TOKEN" > "$SECRETS_DIR/vault_token"
    
    chmod 644 "$SECRETS_DIR"/*
    
    # Signal that secrets are ready
    touch "$SECRETS_DIR/.ready"
    echo "[vault] ✓ Secrets written to $SECRETS_DIR"
}

initialize_vault() {
    echo "[vault] Initializing Vault (first time setup)..."
    
    INIT_OUTPUT=$(vault operator init -key-shares=1 -key-threshold=1 -format=json -tls-skip-verify 2>/dev/null)
    
    if [ -z "$INIT_OUTPUT" ]; then
        echo "[vault] Failed to initialize Vault"
        return 1
    fi
    
    UNSEAL_KEY=$(echo "$INIT_OUTPUT" | jq -r '.unseal_keys_b64[0]')
    ROOT_TOKEN=$(echo "$INIT_OUTPUT" | jq -r '.root_token')
    
    # Save credentials
    echo "VAULT_UNSEAL_KEY=$UNSEAL_KEY" > "$CREDS_FILE"
    echo "VAULT_TOKEN=$ROOT_TOKEN" >> "$CREDS_FILE"
    chmod 600 "$CREDS_FILE"
    
    # Unseal
    vault operator unseal -tls-skip-verify "$UNSEAL_KEY" > /dev/null 2>&1
    echo "[vault] ✓ Vault unsealed"
    
    sleep 2
    
    # Enable secrets engine and store secrets
    export VAULT_TOKEN="$ROOT_TOKEN"
    vault secrets enable -path=secret -tls-skip-verify kv-v2 > /dev/null 2>&1 || true
    
    # Generate random secrets
    vault kv put -tls-skip-verify secret/pong-app \
        db_password="$(openssl rand -base64 16)" \
        elastic_password="$(openssl rand -base64 16 | tr -d '/+=')" \
        jwt_secret="$(openssl rand -hex 32)" \
        api_key="$(openssl rand -hex 16)" > /dev/null 2>&1
    
    echo "[vault] ✓ Secrets generated"
    
    # Output credentials for user
    echo ""
    echo "============================================"
    echo "  VAULT CREDENTIALS - SAVE THESE!"
    echo "============================================"
    echo "VAULT_UNSEAL_KEY=$UNSEAL_KEY"
    echo "VAULT_ROOT_TOKEN=$ROOT_TOKEN"
    echo "============================================"
    echo ""
    
    write_secrets_to_volume
}

unseal_vault() {
    if [ ! -f "$CREDS_FILE" ]; then
        echo "[vault] No credentials found"
        return 1
    fi
    
    . "$CREDS_FILE"
    vault operator unseal -tls-skip-verify "$VAULT_UNSEAL_KEY" > /dev/null 2>&1
    echo "[vault] ✓ Vault unsealed"
    
    write_secrets_to_volume
}

# Main
wait_for_vault || { echo "[vault] Failed to start"; exit 1; }

INITIALIZED=$(vault status -format=json -tls-skip-verify 2>/dev/null | jq -r '.initialized')
SEALED=$(vault status -format=json -tls-skip-verify 2>/dev/null | jq -r '.sealed')

if [ "$INITIALIZED" = "false" ]; then
    initialize_vault
elif [ "$SEALED" = "true" ]; then
    unseal_vault
else
    echo "[vault] ✓ Already initialized and unsealed"
    write_secrets_to_volume
fi

echo "[vault] Ready"
wait $VAULT_PID
