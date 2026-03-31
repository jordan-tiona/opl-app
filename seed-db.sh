#!/usr/bin/env bash
set -euo pipefail

# Usage: ./seed-db.sh <prod|demo> [--player-email email1 email2 ...]
# Seeds the database for the given environment by temporarily scaling the machine to 1GB RAM.

ENV="${1:?Usage: $0 <prod|demo> [--player-email email1 email2 ...]}"
shift

case "$ENV" in
  prod)
    APP="csopl-api"
    ;;
  demo)
    APP="csopl-demo-api"
    ;;
  *)
    echo "Usage: $0 <prod|demo> [--player-email email1 email2 ...]"
    exit 1
    ;;
esac

# Default demo to include demo@opl.com if no args provided
if [[ "$ENV" == "demo" && $# -eq 0 ]]; then
  set -- --player-email demo@csopl.com
fi

SEED_ARGS="$*"

# Ensure at least one machine is running before we try to SSH in
MACHINE_ID=$(fly machine list --app "$APP" --json 2>/dev/null | python3 -c "
import json, sys
machines = json.load(sys.stdin)
running = next((m['id'] for m in machines if m['state'] == 'started'), None)
stopped = next((m['id'] for m in machines if m['state'] in ('stopped', 'suspended')), None)
print(running or stopped or '')
")
if [[ -z "$MACHINE_ID" ]]; then
  echo "Error: no machines found for $APP" >&2
  exit 1
fi

STATE=$(fly machine list --app "$APP" --json 2>/dev/null | python3 -c "
import json, sys
machines = json.load(sys.stdin)
m = next((m for m in machines if m['id'] == '$MACHINE_ID'), None)
print(m['state'] if m else '')
")

if [[ "$STATE" != "started" ]]; then
  echo "==> Starting machine $MACHINE_ID..."
  fly machine start "$MACHINE_ID" --app "$APP"
  echo "==> Waiting for machine to be ready..."
  fly machine wait "$MACHINE_ID" --app "$APP" --state started
fi

echo "==> Scaling $APP to 1GB RAM..."
fly scale memory 1024 --app "$APP"

echo "==> Running seed script..."
fly ssh console --app "$APP" -C "python scripts/init_test_db.py $SEED_ARGS"

echo "==> Scaling $APP back to 256MB RAM..."
fly scale memory 256 --app "$APP"

echo "==> Done."
