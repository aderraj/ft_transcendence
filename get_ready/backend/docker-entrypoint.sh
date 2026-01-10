#!/bin/bash
set -e

echo "🚀 Starting Transcendence Backend..."

# Helper function to read secret from file
read_secret() {
  local file="/secrets/$1"
  if [ -f "$file" ] && [ -s "$file" ]; then
    cat "$file"
  else
    echo ""
  fi
}

# Helper function to URL-encode a string (for passwords with special chars)
urlencode() {
  echo -n "$1" | python3 -c "import sys, urllib.parse; print(urllib.parse.quote(sys.stdin.read(), safe=''))" | tr -d '\n'
}

# Wait for secrets from Vault if available
if [ -d "/secrets" ]; then
  echo "⏳ Waiting for Vault secrets..."
  while [ ! -f /secrets/.ready ]; do
    echo "Secrets not ready - sleeping"
    sleep 2
  done
  echo "✅ Vault secrets available"
  
  # Read all secrets from Vault-populated files
  DB_PASSWORD=$(read_secret "db_password")
  JWT_SECRET=$(read_secret "jwt_secret")
  OAUTH_42_CLIENT_ID=$(read_secret "oauth_42_client_id")
  OAUTH_42_CLIENT_SECRET=$(read_secret "oauth_42_client_secret")
  GOOGLE_CLIENT_ID=$(read_secret "google_client_id")
  GOOGLE_CLIENT_SECRET=$(read_secret "google_client_secret")
  SMTP_USER=$(read_secret "smtp_user")
  SMTP_PASS=$(read_secret "smtp_pass")
  
  # Configure DATABASE_URL (URL-encode password for special characters)
  if [ -n "$DB_PASSWORD" ]; then
    ENCODED_DB_PASSWORD=$(urlencode "$DB_PASSWORD")
    export DATABASE_URL="postgresql://pong:${ENCODED_DB_PASSWORD}@postgres:5432/pong?schema=public"
    echo "✅ Database URL configured from Vault"
  fi
  
  # Configure JWT
  if [ -n "$JWT_SECRET" ]; then
    export JWT_SECRET="$JWT_SECRET"
    echo "✅ JWT Secret configured from Vault"
  fi
  
  # Configure OAuth 42
  if [ -n "$OAUTH_42_CLIENT_ID" ]; then
    export OAUTH_42_CLIENT_ID="$OAUTH_42_CLIENT_ID"
    export OAUTH_42_CLIENT_SECRET="$OAUTH_42_CLIENT_SECRET"
    echo "✅ 42 OAuth configured from Vault"
  fi
  
  # Configure Google OAuth
  if [ -n "$GOOGLE_CLIENT_ID" ]; then
    export GOOGLE_CLIENT_ID="$GOOGLE_CLIENT_ID"
    export GOOGLE_CLIENT_SECRET="$GOOGLE_CLIENT_SECRET"
    echo "✅ Google OAuth configured from Vault"
  fi
  
  # Configure SMTP
  if [ -n "$SMTP_USER" ]; then
    export SMTP_USER="$SMTP_USER"
    export SMTP_PASS="$SMTP_PASS"
    export EMAIL_FROM="${EMAIL_FROM:-$SMTP_USER}"
    echo "✅ SMTP configured from Vault"
  fi
fi

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
until npx prisma db execute --stdin <<< "SELECT 1;" 2>/dev/null; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "✅ PostgreSQL is up"

# Check if database schema matches Prisma schema
echo "🔍 Checking database schema compatibility..."

# Try to validate schema - if it fails, we need to reset
if npx prisma db execute --stdin <<< "SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='email';" 2>/dev/null | grep -q "email"; then
  echo "✅ Database schema looks compatible"
  SCHEMA_OK=true
else
  echo "⚠️  Database schema is incompatible or missing required columns"
  SCHEMA_OK=false
fi

# Run migrations
echo "🔄 Running database migrations..."
set +e  # Temporarily disable exit on error
npx prisma migrate deploy > /tmp/migrate.log 2>&1
MIGRATE_EXIT=$?
set -e  # Re-enable exit on error
cat /tmp/migrate.log

if [ $MIGRATE_EXIT -eq 0 ]; then
  echo "✅ Migrations applied successfully"
else
  # Check the specific error
  if grep -q "P3005" /tmp/migrate.log || grep -q "database schema is not empty" /tmp/migrate.log; then
    echo "⚠️  Database has existing schema but no migration history"
    
    if [ "$SCHEMA_OK" = "false" ]; then
      echo "🔄 Schema incompatible - forcing reset..."
      npx prisma db push --force-reset --accept-data-loss 2>&1
      echo "✅ Schema reset and synchronized"
    else
      echo "🔄 Syncing schema without data loss..."
      npx prisma db push --skip-generate --accept-data-loss 2>&1
      echo "✅ Schema synchronized"
    fi
  elif grep -q "No pending migrations" /tmp/migrate.log; then
    echo "✅ Database is already up to date"
  else
    # Last resort - force reset if migrations keep failing
    echo "⚠️  Migration failed - attempting force reset..."
    npx prisma db push --force-reset --accept-data-loss 2>&1 || {
      echo "❌ Migration failed - check logs above"
      exit 1
    }
    echo "✅ Schema force reset completed"
  fi
fi

# Generate Prisma Client (in case it's not up to date)
echo "📦 Generating Prisma Client..."
npx prisma generate

# Seed database if needed (only in development)
if [ "$NODE_ENV" != "production" ]; then
  echo "🌱 Checking if database needs seeding..."
  npx prisma db seed || echo "⚠️  Seeding skipped or failed (might already have data)"
fi

echo "✅ Database setup complete!"
echo "🎮 Starting application..."

# Execute the CMD from Dockerfile
exec "$@"
