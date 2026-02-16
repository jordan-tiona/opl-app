#!/usr/bin/env bash
set -euo pipefail

DEPLOY_FLAGS="--remote-only --depot=false"

ENV="${1:-}"
TARGET="${2:-}"

case "$ENV" in
  prod)
    API_CONFIG="fly.api.toml"
    UI_CONFIG="fly.ui.toml"
    ;;
  demo)
    API_CONFIG="fly.demo-api.toml"
    UI_CONFIG="fly.demo-ui.toml"
    ;;
  *)
    echo "Usage: $0 <prod|demo> <api|ui|all>"
    exit 1
    ;;
esac

deploy_api() {
    echo "Deploying $ENV API..."
    fly deploy -c "$API_CONFIG" $DEPLOY_FLAGS
    echo "$ENV API deployed."
}

deploy_ui() {
    echo "Deploying $ENV UI..."
    fly deploy -c "$UI_CONFIG" $DEPLOY_FLAGS
    echo "$ENV UI deployed."
}

case "$TARGET" in
    api) deploy_api ;;
    ui)  deploy_ui ;;
    all) deploy_api && deploy_ui ;;
    *)
        echo "Usage: $0 <prod|demo> <api|ui|all>"
        exit 1
        ;;
esac
