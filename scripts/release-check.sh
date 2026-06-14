#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[1/7] Checking required env templates..."
required_files=(
  ".env.example"
  ".env.production.example"
  "backend/.env.example"
  "backend/.env.production.example"
  "DEPLOYMENT_GUIDE.md"
)
for f in "${required_files[@]}"; do
  if [[ ! -f "$f" ]]; then
    echo "Missing required file: $f"
    exit 1
  fi
done
grep -q '^RAZORPAY_WEBHOOK_SECRET=' backend/.env.production.example

echo "[2/7] Frontend production build..."
npm run build

echo "[3/7] Backend automated tests..."
npm --prefix backend test

echo "[4/7] Backend module load checks..."
npm --prefix backend run check:modules

echo "[5/7] Migration presence checks..."
test -f backend/migrations/009_add_user_location_and_geo_extensions.sql
test -f backend/migrations/027_payment_hardening.sql

echo "[6/7] Route surface sanity checks..."
grep -q "/portfolio" backend/src/routes/contractors.js
grep -q "resolveReport" src/services/api.js
grep -q "rawBody" backend/src/app.js

echo "[7/7] Release checks passed."
echo "Next: run production migrations, configure the Razorpay webhook, and execute UAT against live test-mode payments."
