#!/usr/bin/env bash
# Simple test flow using curl. Ensure backend is running on port 5000 and DATABASE migrated.

BASE=http://localhost:5000/api

echo "=== Create customer account ==="
curl -s -X POST "$BASE/auth/register" -H "Content-Type: application/json" -d '{"name":"Test Customer","phone":"9000000001","password":"pass123","role":"customer"}' | jq || true
echo

echo "=== Login customer ==="
curl -s -i -X POST "$BASE/auth/login" -H "Content-Type: application/json" -d '{"phone":"9000000001","password":"pass123"}' | sed -n '1,20p'
echo

echo "=== Create contractor account ==="
curl -s -X POST "$BASE/auth/register" -H "Content-Type: application/json" -d '{"name":"Demo Contractor","phone":"9000000002","password":"contractorpass","role":"contractor","business_name":"Handy Services","description":"General handyman","categories":["handyman","repair"],"services":["plumbing","electrical"],"latitude":28.6,"longitude":77.2}' | jq || true
echo

echo "=== List contractors ==="
curl -s "$BASE/contractors" | jq || true
echo

echo "=== Try adding review (will need login cookie) ==="
echo "Manual testing: use browser or Postman to authenticate and POST /api/contractors/:id/reviews with cookie"

echo "Done"
