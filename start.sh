#!/bin/sh
set -e

echo "Running database migrations..."
pnpm db:push

echo "Starting server..."
exec node server.js
