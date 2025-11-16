#!/bin/sh
set -e

# Run migrations as root (has permissions)
echo "Running database migrations..."
npx prisma migrate deploy

# Start the application
echo "Starting application..."
exec node server.js
