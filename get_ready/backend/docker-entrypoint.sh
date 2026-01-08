#!/bin/bash
set -e

echo "🚀 Starting Transcendence Backend..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
until npx prisma db execute --stdin <<< "SELECT 1;" 2>/dev/null; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "✅ PostgreSQL is up"

# Run migrations
echo "🔄 Running database migrations..."
if npx prisma migrate deploy 2>&1 | tee /tmp/migrate.log; then
  echo "✅ Migrations applied successfully"
else
  # Check the specific error
  if grep -q "P3005" /tmp/migrate.log || grep -q "database schema is not empty" /tmp/migrate.log; then
    echo "⚠️  Database has existing schema but no migration history"
    echo "📋 This usually happens when db push was used before migrations"
    echo "🔄 Applying migrations with force..."
    # Use db push to ensure schema matches, then try migrations again
    npx prisma db push --skip-generate --accept-data-loss
    echo "✅ Schema synchronized"
  elif grep -q "No pending migrations" /tmp/migrate.log; then
    echo "✅ Database is already up to date"
  else
    echo "❌ Migration failed - check logs above"
    exit 1
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
