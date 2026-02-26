#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[1/6] Checking required env templates..."
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

echo "[2/6] Frontend production build..."
npm run build >/tmp/thekedaar_release_build.log 2>&1 || {
  cat /tmp/thekedaar_release_build.log
  exit 1
}

echo "[3/6] Backend module load checks..."
node -e "require('./backend/src/routes/index'); require('./backend/src/controllers/adminController'); require('./backend/src/controllers/contractorController'); console.log('backend load checks passed')" >/tmp/thekedaar_release_backend.log 2>&1 || {
  cat /tmp/thekedaar_release_backend.log
  exit 1
}

echo "[4/6] Migration presence checks..."
ls backend/migrations/*.sql >/dev/null

echo "[5/6] Route surface sanity checks..."
grep -q "/portfolio" backend/src/routes/contractors.js
grep -q "resolveReport" src/services/api.js

echo "[6/6] Release checks passed."
echo "Next: run migrations in production and verify /health + full user flows."
