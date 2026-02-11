# opl-app
API and UI for One Pocket League management

## Running the API

```bash
cd opl-api
uv sync
fastapi dev
```

The API will be available at http://localhost:8000.

## Running the UI

```bash
cd opl-ui
yarn install
yarn dev
```

The UI will be available at http://localhost:5173.

## Shortcut script to start both
```bash
./start.sh
```

## Scripts

### Initialize Test Database

Populate the database with fake test data:

```bash
cd opl-api
python scripts/init_test_db.py
```

**Options:**
- `--num-players <N>` — Number of players to create (default: 20)
- `--start-date YYYY-MM-DD` — Schedule start date (default: today)
- `--player-email <email> [email ...]` — Create additional test players with the specified emails (useful for testing with your Google accounts)

**Examples:**
```bash
# Create 16 players starting on March 1st
python scripts/init_test_db.py --num-players 16 --start-date 2026-03-01

# Create default players plus test players linked to your Google accounts
python scripts/init_test_db.py --player-email you@gmail.com friend@gmail.com
```

This script will drop and recreate all tables, create fake players, schedule round-robin matches, and generate games for the earliest half of matches.

## Fly.io Deployment

Both apps are deployed from the repo root using separate config files.

### API Secrets

```bash
fly secrets set -a csopl-api \
  DATABASE_URL="your-database-url" \
  JWT_SECRET="your-jwt-secret" \
  OPL_GOOGLE_CLIENT_ID="your-google-client-id" \
  CORS_ORIGINS="https://csopl-ui.fly.dev"
```

### Deploy API

```bash
fly deploy -c fly.api.toml --remote-only --depot=false
```

### Deploy UI

The UI requires build args since Vite embeds environment variables at build time:

```bash
fly deploy -c fly.ui.toml \
  --build-arg VITE_API_BASE_URL="https://csopl-api.fly.dev" \
  --build-arg VITE_OPL_CLIENT_ID="your-google-client-id" \
  --remote-only \
  --depot=false
```

These are also configured in `fly.ui.toml` under `[build.args]`.
