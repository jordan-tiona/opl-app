#!/bin/bash

# Start OPL API and UI servers
# Usage:
#   ./start.sh          - local API + local DB
#   ./start.sh --prod   - local API + prod DB (requires fly proxy)

# Load env vars from .zshrc (grep only export lines to avoid zsh-specific syntax)
eval "$(grep '^export ' ~/.zshrc 2>/dev/null)"

trap 'kill $(jobs -p) 2>/dev/null' EXIT

if [[ "$1" == "--prod" ]]; then
    echo "Starting fly proxy to prod DB..."
    fly proxy 5433:5432 -a csopl-db &
    sleep 2

    echo "Starting OPL API server (prod DB)..."
    cd opl-api && env $(cat .env | xargs) uv run fastapi dev main.py &
else
    echo "Starting OPL API server..."
    cd opl-api && uv run fastapi dev main.py &
fi

echo "Starting OPL UI server..."
cd opl-ui && yarn dev &

echo ""
echo "Services starting:"
echo "  API: http://localhost:8000"
echo "  UI:  http://localhost:5173"
if [[ "$1" == "--prod" ]]; then
    echo "  DB:  prod (via fly proxy on port 5433)"
fi
echo ""
echo "Press Ctrl+C to stop all servers"

wait
