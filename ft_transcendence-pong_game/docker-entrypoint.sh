#!/bin/sh
set -e

echo "🎮 Starting Pong Game Service..."

# ============================================
# Load secrets from Vault (shared volume)
# ============================================
SECRETS_PATH="${VAULT_SECRETS_PATH:-/secrets}"

echo "⏳ Waiting for Vault secrets..."
while [ ! -f "$SECRETS_PATH/.ready" ]; do
  echo "Vault secrets not ready - sleeping"
  sleep 2
done
echo "✅ Vault secrets are ready"

# Load database password from Vault
if [ -f "$SECRETS_PATH/db_password" ]; then
  DB_PASSWORD=$(cat "$SECRETS_PATH/db_password")
  export DATABASE_URL="postgresql://transcendence:${DB_PASSWORD}@postgres:5432/transcendence?schema=public"
  echo "✅ DATABASE_URL configured from Vault"
fi

# ============================================
# Generate Prisma Client
# ============================================
echo "📦 Generating Prisma Client..."
npx prisma generate

echo "✅ Game service ready!"
echo "🎮 Starting application..."

exec "$@"
