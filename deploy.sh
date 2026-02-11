#!/usr/bin/env bash
set -euo pipefail

DEPLOY_FLAGS="--remote-only --depot=false"

deploy_api() {
    echo "Deploying API..."
    fly deploy -c fly.api.toml $DEPLOY_FLAGS
    echo "API deployed."
}

deploy_ui() {
    echo "Deploying UI..."
    fly deploy -c fly.ui.toml $DEPLOY_FLAGS
    echo "UI deployed."
}

usage() {
    echo "Usage: $0 {api|ui|all}"
    exit 1
}

if [[ $# -ne 1 ]]; then
    usage
fi

case "$1" in
    api) deploy_api ;;
    ui)  deploy_ui ;;
    all) deploy_api && deploy_ui ;;
    *)   usage ;;
esac
