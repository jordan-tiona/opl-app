#!/bin/bash

# Start OPL API and UI servers

# Load env vars from .zshrc (grep only export lines to avoid zsh-specific syntax)
eval "$(grep '^export ' ~/.zshrc 2>/dev/null)"

trap 'kill $(jobs -p) 2>/dev/null' EXIT

echo "Starting OPL API server..."
cd opl-api && uv run fastapi dev main.py &

echo "Starting OPL UI server..."
cd opl-ui && yarn dev &

echo ""
echo "Services starting:"
echo "  API: http://localhost:8000"
echo "  UI:  http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"

wait
