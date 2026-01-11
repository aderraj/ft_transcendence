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

# Seeding is now manual - run 'make seed' to seed the database
echo "ℹ️  To seed the database, run: make seed"

echo "✅ Database setup complete!"
echo "🎮 Starting application..."

exec "$@"
