#!/bin/bash

# Start OPL API and UI servers
# Usage:
#   ./start.sh               - local API + local DB
#   ./start.sh --prod        - local API + prod DB (requires fly proxy)
#   ./start.sh --prod-api    - prod API only (no local API started)

# Load env vars from .zshrc (grep only export lines to avoid zsh-specific syntax)
eval "$(grep '^export ' ~/.zshrc 2>/dev/null)"

trap 'kill $(jobs -p) 2>/dev/null' EXIT

if [[ "$1" == "--prod" ]]; then
    echo "Starting fly proxy to prod DB..."
    fly proxy 5433:5432 -a csopl-db &
    sleep 2

    echo "Starting OPL API server (prod DB)..."
    cd opl-api && env $(cat .env | xargs) uv run fastapi dev main.py &
elif [[ "$1" == "--prod-api" ]]; then
    echo "Skipping local API — UI will connect to prod API."
else
    echo "Starting OPL API server..."
    cd opl-api && AUTO_CONFIRM_SCORES=true uv run fastapi dev main.py &
fi

echo "Starting OPL UI server..."
if [[ "$1" == "--prod-api" ]]; then
    cd opl-ui && VITE_API_BASE_URL=https://csopl-api.fly.dev yarn dev &
else
    cd opl-ui && yarn dev &
fi

echo ""
echo "Services starting:"
if [[ "$1" == "--prod-api" ]]; then
    echo "  API: https://csopl-api.fly.dev (prod)"
else
    echo "  API: http://localhost:8000"
fi
echo "  UI:  http://localhost:5173"
if [[ "$1" == "--prod" ]]; then
    echo "  DB:  prod (via fly proxy on port 5433)"
fi
echo ""
echo "Press Ctrl+C to stop all servers"

wait
