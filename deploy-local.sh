#!/usr/bin/env bash
# Dev server deployment script for Lazydave QA
# Brings up the development server on the configured port

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Load config if available
if [[ -f ".lazydave/manifests/config.json" ]]; then
  PORT=$(jq -r '.docker.port // empty' .lazydave/manifests/config.json 2>/dev/null)
fi

if [[ -z "$PORT" ]]; then
  echo "Error: No docker port detected. Set 'docker.port' in .lazydave/manifests/config.json or add EXPOSE to your Dockerfile."
  exit 1
fi

echo "Starting dev server on port $PORT..."

# Check if docker-compose exists
if [[ -f "docker-compose.yml" ]]; then
  docker compose up -d
elif [[ -f "docker/docker-compose.yml" ]]; then
  cd docker && docker compose up -d
elif [[ -f "Dockerfile" ]]; then
  # Fallback: build and run directly
  docker build -t dev-server .
  docker run -d --name dev-server -p "$PORT:3000" dev-server
else
  echo "Error: No docker-compose.yml or Dockerfile found"
  exit 1
fi

# Wait for server to be ready
echo "Waiting for server to start..."
if ! timeout 60 bash -c 'until curl -s http://localhost:$1 > /dev/null 2>&1; do sleep 2; done' _ "$PORT"; then
  echo "Warning: Server did not start within 60 seconds" >&2
fi

echo "Server is ready at http://localhost:$PORT"
