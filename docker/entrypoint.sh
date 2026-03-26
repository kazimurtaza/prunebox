#!/bin/sh

echo "🚀 Starting Prunebox All-in-One Container..."

# Fix PostgreSQL data directory permissions if it exists
if [ -d /var/lib/postgresql/data ]; then
    # Fix permissions for existing data
    chmod 700 /var/lib/postgresql/data 2>/dev/null || true
    chown -R postgres:postgres /var/lib/postgresql/data 2>/dev/null || true
    # Remove stale lock files
    rm -f /var/lib/postgresql/data/postmaster.pid 2>/dev/null || true
fi

# Fix PostgreSQL run directory permissions
mkdir -p /run/postgresql
chmod 775 /run/postgresql
chown -R postgres:postgres /run/postgresql

# Initialize PostgreSQL if data directory is truly empty
if [ ! -d /var/lib/postgresql/data/base ]; then
    echo "📦 Initializing PostgreSQL database..."
    # Ensure proper permissions before initdb
    mkdir -p /var/lib/postgresql/data
    chmod 700 /var/lib/postgresql/data
    chown -R postgres:postgres /var/lib/postgresql/data

    # Initialize the database
    su-exec postgres initdb -D /var/lib/postgresql/data

    # Configure PostgreSQL for local connections
    echo "host all all 0.0.0.0/0 md5" >> /var/lib/postgresql/data/pg_hba.conf
    echo "listen_addresses='*'" >> /var/lib/postgresql/data/postgresql.conf

    # Start PostgreSQL temporarily to create database
    su-exec postgres pg_ctl -D /var/lib/postgresql/data -l /var/lib/postgresql/logfile start

    # Wait for PostgreSQL to be ready
    sleep 3

    # Create database and user
    su-exec postgres psql -v ON_ERROR_STOP=1 --username postgres <<EOSQL
        CREATE USER prunebox WITH PASSWORD '${POSTGRES_PASSWORD:-prunebox}';
        CREATE DATABASE prunebox OWNER prunebox;
        GRANT ALL PRIVILEGES ON DATABASE prunebox TO prunebox;
EOSQL

    echo "✅ PostgreSQL initialized"
else
    echo "📦 PostgreSQL data already exists, skipping initialization..."
fi

# Ensure proper permissions
chown -R postgres:postgres /var/lib/postgresql/data 2>/dev/null || true

# Start PostgreSQL temporarily for schema setup
echo "🔄 Starting PostgreSQL temporarily for schema setup..."
su-exec postgres pg_ctl -D /var/lib/postgresql/data -l /var/lib/postgresql/logfile start 2>/dev/null || true

# Wait for PostgreSQL to be ready
for i in 1 2 3 4 5 6 7 8 9 10; do
    if su-exec postgres pg_isready -q 2>/dev/null; then
        echo "✅ PostgreSQL is ready"
        break
    fi
    echo "⏳ Waiting for PostgreSQL... ($i/10)"
    sleep 1
done

# Run Prisma migrations if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
    echo "🔄 Running database schema setup..."
    cd /app
    # Try migrations first, then db push if no migrations exist
    if npx prisma migrate deploy 2>/dev/null | grep -q "No migration"; then
        echo "📦 No migrations found, applying schema directly..."
        if ! npx prisma db push --skip-generate; then
            echo "❌ Schema setup failed. Please check your database configuration."
            echo "   You may need to run: npx prisma migrate dev --name init"
            exit 1
        fi
    fi
fi

# Stop PostgreSQL so supervisord can manage it
echo "🛑 Stopping temporary PostgreSQL..."
su-exec postgres pg_ctl -D /var/lib/postgresql/data stop 2>/dev/null || true
sleep 2

echo "🎯 Starting all services with supervisord..."

# Start supervisord
exec supervisord -c /etc/supervisord.conf
