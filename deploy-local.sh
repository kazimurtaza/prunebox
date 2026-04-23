#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# Read port from config or use default
CONFIG_FILE=".lazydave/manifests/config.json"
if [ -f "$CONFIG_FILE" ]; then
    HOST_PORT=$(grep -o '"dev_port":[[:space:]]*[0-9]*' "$CONFIG_FILE" | grep -o '[0-9]*' || echo "3001")
else
    HOST_PORT=3001
fi

echo "Starting Prunebox development environment..."
echo "Server will be available at http://localhost:$HOST_PORT"

# Start docker-compose
docker compose -f docker-compose.dev.yml up -d --build

# Wait for server to be ready
echo "Waiting for server to be ready..."
max_wait=120
waited=0
while [ $waited -lt $max_wait ]; do
    if curl -s "http://localhost:$HOST_PORT/api/health" > /dev/null 2>&1; then
        echo "✓ Server is ready at http://localhost:$HOST_PORT"
        exit 0
    fi
    sleep 2
    waited=$((waited + 2))
done

echo "✗ Server did not become ready within ${max_wait}s"
echo "Check logs with: docker compose -f docker-compose.dev.yml logs -f"
exit 1
