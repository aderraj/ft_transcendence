#!/bin/bash
# ===========================================
# Update Vault Secrets
# ===========================================
# This script updates secrets in the running Vault instance
# Usage: ./scripts/update-vault-secrets.sh

set -e

VAULT_CONTAINER="pong-vault"

echo "🔐 Vault Secrets Updater"
echo "========================"

# Check if Vault container is running
if ! docker ps | grep -q "$VAULT_CONTAINER"; then
    echo "❌ Vault container is not running. Start the stack first."
    exit 1
fi

# Get the current Vault token
VAULT_TOKEN=$(docker exec "$VAULT_CONTAINER" cat /secrets/vault_token 2>/dev/null)
if [ -z "$VAULT_TOKEN" ]; then
    echo "❌ Could not retrieve Vault token"
    exit 1
fi

echo "✅ Connected to Vault"
echo ""

# Function to update a secret
update_secret() {
    local key=$1
    local current_value=$2
    local description=$3
    
    echo "📝 $description"
    echo "   Current: ${current_value:0:10}..."
    read -p "   New value (press Enter to keep current): " new_value
    
    if [ -n "$new_value" ]; then
        echo "$new_value"
    else
        echo "$current_value"
    fi
}

# Get current secrets
echo "📥 Reading current secrets from Vault..."
CURRENT_SECRETS=$(docker exec -e VAULT_TOKEN="$VAULT_TOKEN" "$VAULT_CONTAINER" \
    vault kv get -format=json -tls-skip-verify secret/pong-app 2>/dev/null | jq -r '.data.data')

if [ -z "$CURRENT_SECRETS" ] || [ "$CURRENT_SECRETS" = "null" ]; then
    echo "❌ Could not read current secrets"
    exit 1
fi

# Extract current values
DB_PASSWORD=$(echo "$CURRENT_SECRETS" | jq -r '.db_password // ""')
JWT_SECRET=$(echo "$CURRENT_SECRETS" | jq -r '.jwt_secret // ""')
ELASTIC_PASSWORD=$(echo "$CURRENT_SECRETS" | jq -r '.elastic_password // ""')
API_KEY=$(echo "$CURRENT_SECRETS" | jq -r '.api_key // ""')
GRAFANA_PASSWORD=$(echo "$CURRENT_SECRETS" | jq -r '.grafana_password // ""')
OAUTH_42_CLIENT_ID=$(echo "$CURRENT_SECRETS" | jq -r '.oauth_42_client_id // ""')
OAUTH_42_CLIENT_SECRET=$(echo "$CURRENT_SECRETS" | jq -r '.oauth_42_client_secret // ""')
GOOGLE_CLIENT_ID=$(echo "$CURRENT_SECRETS" | jq -r '.google_client_id // ""')
GOOGLE_CLIENT_SECRET=$(echo "$CURRENT_SECRETS" | jq -r '.google_client_secret // ""')
SMTP_USER=$(echo "$CURRENT_SECRETS" | jq -r '.smtp_user // ""')
SMTP_PASS=$(echo "$CURRENT_SECRETS" | jq -r '.smtp_pass // ""')

echo ""
echo "=== OAuth Configuration ==="
echo ""

read -p "42 OAuth Client ID [${OAUTH_42_CLIENT_ID:0:20}...]: " NEW_42_ID
OAUTH_42_CLIENT_ID=${NEW_42_ID:-$OAUTH_42_CLIENT_ID}

read -p "42 OAuth Client Secret [${OAUTH_42_CLIENT_SECRET:0:10}...]: " NEW_42_SECRET
OAUTH_42_CLIENT_SECRET=${NEW_42_SECRET:-$OAUTH_42_CLIENT_SECRET}

read -p "Google Client ID [${GOOGLE_CLIENT_ID:0:20}...]: " NEW_GOOGLE_ID
GOOGLE_CLIENT_ID=${NEW_GOOGLE_ID:-$GOOGLE_CLIENT_ID}

read -p "Google Client Secret [${GOOGLE_CLIENT_SECRET:0:10}...]: " NEW_GOOGLE_SECRET
GOOGLE_CLIENT_SECRET=${NEW_GOOGLE_SECRET:-$GOOGLE_CLIENT_SECRET}

echo ""
echo "=== SMTP Configuration ==="
echo ""

read -p "SMTP User [${SMTP_USER}]: " NEW_SMTP_USER
SMTP_USER=${NEW_SMTP_USER:-$SMTP_USER}

read -p "SMTP Password [${SMTP_PASS:0:5}...]: " NEW_SMTP_PASS
SMTP_PASS=${NEW_SMTP_PASS:-$SMTP_PASS}

echo ""
echo "📤 Updating secrets in Vault..."

docker exec -e VAULT_TOKEN="$VAULT_TOKEN" "$VAULT_CONTAINER" \
    vault kv put -tls-skip-verify secret/pong-app \
        db_password="$DB_PASSWORD" \
        elastic_password="$ELASTIC_PASSWORD" \
        jwt_secret="$JWT_SECRET" \
        api_key="$API_KEY" \
        grafana_password="$GRAFANA_PASSWORD" \
        oauth_42_client_id="$OAUTH_42_CLIENT_ID" \
        oauth_42_client_secret="$OAUTH_42_CLIENT_SECRET" \
        google_client_id="$GOOGLE_CLIENT_ID" \
        google_client_secret="$GOOGLE_CLIENT_SECRET" \
        smtp_user="$SMTP_USER" \
        smtp_pass="$SMTP_PASS" > /dev/null

echo "✅ Secrets updated in Vault"

# Refresh secrets files
echo "🔄 Refreshing secret files..."
docker exec -e VAULT_TOKEN="$VAULT_TOKEN" "$VAULT_CONTAINER" sh -c '
    vault kv get -tls-skip-verify -field=oauth_42_client_id secret/pong-app > /secrets/oauth_42_client_id
    vault kv get -tls-skip-verify -field=oauth_42_client_secret secret/pong-app > /secrets/oauth_42_client_secret
    vault kv get -tls-skip-verify -field=google_client_id secret/pong-app > /secrets/google_client_id
    vault kv get -tls-skip-verify -field=google_client_secret secret/pong-app > /secrets/google_client_secret
    vault kv get -tls-skip-verify -field=smtp_user secret/pong-app > /secrets/smtp_user
    vault kv get -tls-skip-verify -field=smtp_pass secret/pong-app > /secrets/smtp_pass
    chmod 644 /secrets/*
'

echo "✅ Secret files refreshed"
echo ""
echo "⚠️  Restart the backend to apply changes:"
echo "   docker compose restart backend"
echo ""
