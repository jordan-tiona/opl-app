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

echo "==> Scaling $APP to 1GB RAM..."
fly scale memory 1024 --app "$APP"

echo "==> Running seed script..."
fly ssh console --app "$APP" -C "python scripts/init_test_db.py $SEED_ARGS"

echo "==> Scaling $APP back to 256MB RAM..."
fly scale memory 256 --app "$APP"

echo "==> Done."
