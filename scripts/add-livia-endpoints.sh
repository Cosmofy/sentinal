#!/bin/bash

# Script to add Livia endpoints to the status page
API_URL="http://localhost:3000/api/endpoints"

echo "Adding Livia endpoints..."

# GraphQL endpoints
curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d '{
    "title": "prod1-graphql",
    "url": "https://prod1.livia.arryan.xyz/health",
    "intervalSeconds": 60,
    "expectedStatusCode": 200
  }'
echo ""

curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d '{
    "title": "prod2-graphql",
    "url": "https://prod2.livia.arryan.xyz/health",
    "intervalSeconds": 60,
    "expectedStatusCode": 200
  }'
echo ""

curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d '{
    "title": "prod3-graphql",
    "url": "https://prod3.livia.arryan.xyz/health",
    "intervalSeconds": 60,
    "expectedStatusCode": 200
  }'
echo ""

# Server endpoints
curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d '{
    "title": "prod1-server",
    "url": "https://prod1.livia.arryan.xyz/healthz",
    "intervalSeconds": 60,
    "expectedStatusCode": 200
  }'
echo ""

curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d '{
    "title": "prod2-server",
    "url": "https://prod2.livia.arryan.xyz/healthz",
    "intervalSeconds": 60,
    "expectedStatusCode": 200
  }'
echo ""

curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d '{
    "title": "prod3-server",
    "url": "https://prod3.livia.arryan.xyz/healthz",
    "intervalSeconds": 60,
    "expectedStatusCode": 200
  }'
echo ""

echo "Done! All 6 Livia endpoints have been added."
