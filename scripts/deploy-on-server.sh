#!/usr/bin/env bash
# Run this on the Proxmox server to pull latest code and rebuild/restart the backend API.
# Usage: ./scripts/deploy-on-server.sh
# Or from project root: bash scripts/deploy-on-server.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$REPO_ROOT/backend"

echo "==> Repo root: $REPO_ROOT"
cd "$REPO_ROOT"

echo "==> Pulling latest from GitHub..."
git pull

echo "==> Building and restarting backend..."
cd "$BACKEND_DIR"
docker-compose up -d --build

echo "==> Done. API should be up. Check with: docker-compose logs -f"
