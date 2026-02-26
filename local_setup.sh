#!/usr/bin/env bash
set -euo pipefail

# local_setup.sh — Automates local setup for Thekedaar frontend+backend
# Usage: ./local_setup.sh
# This script must be run from the repository root.

ROOT=$(pwd)
BACKEND_DIR="$ROOT/backend"

echo "Starting Thekedaar local setup..."

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: Node/npm are required. Install Node.js (>=16) and retry." >&2
  exit 1
fi

cd "$BACKEND_DIR"

# Ensure .env exists
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
    echo "Copied .env.example to .env. Edit backend/.env if needed (DATABASE_URL, JWT_SECRET)."
  else
    echo "No .env.example found. Create backend/.env with DATABASE_URL and JWT_SECRET." >&2
  fi
fi

# If docker-compose exists, bring up Postgres from docker-compose.yml
if command -v docker-compose >/dev/null 2>&1; then
  echo "docker-compose found — starting Postgres container..."
  docker-compose -f "$BACKEND_DIR/docker-compose.yml" up -d
  echo "Waiting for Postgres to accept connections (may take a few seconds)..."
fi

echo "Installing backend dependencies (this may take a while)..."
npm install

echo "Running SQL migrations using Node runner..."
npm run migrate:all

echo "Backend migrations complete. Start backend with:"
echo "  cd backend && npm run dev"

cd "$ROOT"
echo "Installing frontend dependencies..."
npm install

echo "To start the frontend run:"
echo "  npm start"

echo "Setup complete. If you want this script to start servers automatically, edit it to run 'npm run dev' and 'npm start' in background processes."
