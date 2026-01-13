#!/bin/bash
set -e

echo "🚀 Starting Transcendence Backend..."

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

# Load secrets into environment variables
if [ -f "$SECRETS_PATH/db_password" ]; then
  DB_PASSWORD=$(cat "$SECRETS_PATH/db_password")
  # URL encode the password to handle special characters
  DB_PASSWORD_ENCODED=$(printf '%s' "$DB_PASSWORD" | jq -sRr @uri)
  export DATABASE_URL="postgresql://transcendence:${DB_PASSWORD_ENCODED}@postgres:5432/transcendence?schema=public"
  echo "✅ DATABASE_URL configured from Vault"
fi

if [ -f "$SECRETS_PATH/jwt_secret" ]; then
  export JWT_SECRET=$(cat "$SECRETS_PATH/jwt_secret")
  echo "✅ JWT_SECRET loaded from Vault"
fi

if [ -f "$SECRETS_PATH/oauth_42_client_id" ]; then
  export OAUTH_42_CLIENT_ID=$(cat "$SECRETS_PATH/oauth_42_client_id")
fi

if [ -f "$SECRETS_PATH/oauth_42_client_secret" ]; then
  export OAUTH_42_CLIENT_SECRET=$(cat "$SECRETS_PATH/oauth_42_client_secret")
fi

if [ -f "$SECRETS_PATH/google_client_id" ]; then
  export GOOGLE_CLIENT_ID=$(cat "$SECRETS_PATH/google_client_id")
fi

if [ -f "$SECRETS_PATH/google_client_secret" ]; then
  export GOOGLE_CLIENT_SECRET=$(cat "$SECRETS_PATH/google_client_secret")
fi

if [ -f "$SECRETS_PATH/smtp_user" ]; then
  export SMTP_USER=$(cat "$SECRETS_PATH/smtp_user")
fi

if [ -f "$SECRETS_PATH/smtp_pass" ]; then
  export SMTP_PASS=$(cat "$SECRETS_PATH/smtp_pass")
fi

echo "✅ All secrets loaded from Vault"

# ============================================
# Wait for PostgreSQL to be ready
# ============================================
echo "⏳ Waiting for PostgreSQL..."
until PGPASSWORD="$DB_PASSWORD" psql -h postgres -U transcendence -d transcendence -c '\q' 2>/dev/null; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "✅ PostgreSQL is up"

# Run migrations
echo "🔄 Running database migrations..."
if npx prisma migrate deploy 2>&1 | tee /tmp/migrate.log; then
  echo "✅ Migrations applied successfully"
else
  if grep -q "P3005" /tmp/migrate.log || grep -q "database schema is not empty" /tmp/migrate.log; then
    echo "⚠️  Database has existing schema but no migration history"
    echo " Applying migrations with force..."
    npx prisma db push --skip-generate --accept-data-loss
    echo "✅ Schema synchronized"
  elif grep -q "No pending migrations" /tmp/migrate.log; then
    echo "✅ Database is already up to date"
  else
    echo "❌ Migration failed - check logs above"
    exit 1
  fi
fi

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate

# Seed the database with test data
echo "🌱 Seeding database..."
if npx prisma db seed 2>&1; then
  echo "✅ Database seeded successfully!"
else
  echo "⚠️  Seeding skipped or already seeded"
fi

echo "✅ Database setup complete!"
echo "🎮 Starting application..."

exec "$@"
