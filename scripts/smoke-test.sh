#!/usr/bin/env bash
set -euo pipefail

BACKEND_URL="${BACKEND_URL:-http://localhost:5000}"
HEALTH_URL="$BACKEND_URL/health"

echo "Checking backend health at $HEALTH_URL"
HTTP_CODE=$(curl -sS -o /dev/null -w "%{http_code}" "$HEALTH_URL" || true)
if [ "$HTTP_CODE" != "200" ] && [ "$HTTP_CODE" != "204" ]; then
  echo "Backend health check failed: HTTP $HTTP_CODE"
  exit 2
fi
echo "Backend healthy (HTTP $HTTP_CODE)"

if [ -f "./build/index.html" ]; then
  echo "Frontend build found at ./build/index.html"
else
  echo "Frontend build not found at ./build/index.html — skipping frontend check"
fi

echo "Smoke tests passed"
