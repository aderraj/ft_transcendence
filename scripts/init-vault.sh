#!/bin/bash
# ===========================================
# Vault Initialization Script (Self-Managed)
# ===========================================
# Run this ONCE after first `docker-compose up`
# This script initializes and unseals Vault, then creates the pong-app secrets.

set -e

VAULT_CONTAINER="pong-vault"

echo "=== ft_transcendence Vault Setup ==="
echo ""

# Check if Vault container is running
if ! docker ps | grep -q "$VAULT_CONTAINER"; then
    echo "[ERROR] Vault container not running. Start with: docker-compose up -d vault"
    exit 1
fi

# Initialize Vault (if not already initialized)
echo "[1/4] Checking Vault status..."
INIT_STATUS=$(docker exec $VAULT_CONTAINER vault status -format=json 2>/dev/null | jq -r '.initialized' || echo "false")

if [ "$INIT_STATUS" == "false" ]; then
    echo "[2/4] Initializing Vault..."
    INIT_OUTPUT=$(docker exec $VAULT_CONTAINER vault operator init -key-shares=1 -key-threshold=1 -format=json)
    
    UNSEAL_KEY=$(echo $INIT_OUTPUT | jq -r '.unseal_keys_b64[0]')
    ROOT_TOKEN=$(echo $INIT_OUTPUT | jq -r '.root_token')
    
    echo ""
    echo "============================================"
    echo "⚠️  SAVE THESE CREDENTIALS SECURELY! ⚠️"
    echo "============================================"
    echo "Unseal Key: $UNSEAL_KEY"
    echo "Root Token: $ROOT_TOKEN"
    echo "============================================"
    echo ""
    
    # Save to local file (for development only!)
    cat > .vault-credentials <<EOF
# Vault Credentials (DEVELOPMENT ONLY - DO NOT COMMIT)
VAULT_UNSEAL_KEY=$UNSEAL_KEY
VAULT_TOKEN=$ROOT_TOKEN
EOF
    chmod 600 .vault-credentials
    echo "[INFO] Credentials saved to .vault-credentials"
else
    echo "[INFO] Vault already initialized."
    if [ -f .vault-credentials ]; then
        source .vault-credentials
        UNSEAL_KEY=$VAULT_UNSEAL_KEY
        ROOT_TOKEN=$VAULT_TOKEN
    else
        echo "[ERROR] Vault initialized but no .vault-credentials file found."
        echo "Please provide UNSEAL_KEY and ROOT_TOKEN manually."
        exit 1
    fi
fi

# Unseal Vault
echo "[3/4] Unsealing Vault..."
SEALED=$(docker exec $VAULT_CONTAINER vault status -format=json 2>/dev/null | jq -r '.sealed')
if [ "$SEALED" == "true" ]; then
    docker exec $VAULT_CONTAINER vault operator unseal "$UNSEAL_KEY"
    echo "[INFO] Vault unsealed."
else
    echo "[INFO] Vault already unsealed."
fi

# Configure secrets
echo "[4/4] Configuring Pong App secrets..."
docker exec -e VAULT_TOKEN="$ROOT_TOKEN" $VAULT_CONTAINER vault secrets enable -path=secret kv-v2 2>/dev/null || true

# Use the same DB password as in docker-compose.yml
DB_PASSWORD="${DB_PASSWORD:-pong_secret_123}"

docker exec -e VAULT_TOKEN="$ROOT_TOKEN" $VAULT_CONTAINER vault kv put secret/pong-app \
    admin_password="P0ng_Adm1n_2024!" \
    db_password="$DB_PASSWORD" \
    api_key="pong-api-key-$(date +%s)" \
    jwt_secret="jwt-secret-$(openssl rand -hex 16)"

# Update .env file with Vault token
if [ -f .env ]; then
    sed -i '/^VAULT_TOKEN=/d' .env
fi
echo "VAULT_TOKEN=$ROOT_TOKEN" >> .env
echo "DB_PASSWORD=$DB_PASSWORD" >> .env

echo ""
echo "=== Vault Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. .env file updated with VAULT_TOKEN and DB_PASSWORD"
echo "2. Restart the stack: docker-compose down && docker-compose up -d"
echo "3. Test: curl -k https://localhost/api/health"
echo ""
