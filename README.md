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

### Deploy Script

Use `deploy.sh` to deploy either environment:

```bash
./deploy.sh prod api    # deploy prod API only
./deploy.sh prod ui     # deploy prod UI only
./deploy.sh prod all    # deploy both prod API and UI
./deploy.sh demo api    # deploy demo API only
./deploy.sh demo all    # deploy both demo API and UI
```

Pushes to `main` automatically deploy both prod and demo via GitHub Actions.

### Seed Database on Fly.io

Use `seed-db.sh` to seed a deployed database. This temporarily scales the machine to 1GB RAM, runs the seed script, then scales back to 256MB.

```bash
./seed-db.sh demo                                    # seeds demo DB (defaults to --player-email demo@csopl.com)
./seed-db.sh demo --player-email custom@example.com  # seeds demo DB with custom email
./seed-db.sh prod --player-email you@gmail.com       # seeds prod DB with specified email
```

## Demo Mode

A read-only demo instance allows potential employers to explore the app without Google OAuth. It runs as a separate Fly.io deployment with its own database.

- **Demo UI:** https://csopl-demo-ui.fly.dev
- **Demo API:** https://csopl-demo-api.fly.dev

### How It Works

- When `DEMO_MODE=true` is set on the API, a `POST /auth/demo-login` endpoint is available that returns a JWT for a demo admin or player account without Google auth
- All non-GET requests (except `/auth/*`) are blocked with `403 "Demo mode: read-only"` for authenticated users
- When `VITE_DEMO_MODE=true` is set on the UI, "Try Admin" and "Try Player" buttons replace the Google Sign In, and a persistent banner indicates data is read-only
- The demo player account is controlled by the `DEMO_PLAYER_EMAIL` env var (defaults to `demo@csopl.com`)

### Environment Variables

| Variable | Where | Purpose |
|---|---|---|
| `DEMO_MODE` | API (`fly.demo-api.toml`) | Enables demo login endpoint and read-only middleware |
| `DEMO_PLAYER_EMAIL` | API (`fly.demo-api.toml`) | Email of the demo player account (default: `demo@csopl.com`) |
| `VITE_DEMO_MODE` | UI (`fly.demo-ui.toml`) | Shows demo login buttons and read-only banner |

### Initial Setup

```bash
# Create Fly apps
fly apps create csopl-demo-api
fly apps create csopl-demo-ui

# Create and attach a demo database
fly postgres create --name csopl-demo-db --region dfw --vm-size shared-cpu-1x --initial-cluster-size 1 --volume-size 1
fly postgres attach csopl-demo-db --app csopl-demo-api

# Set secrets
fly secrets set --app csopl-demo-api \
  JWT_SECRET="$(openssl rand -base64 32)" \
  CORS_ORIGINS="https://csopl-demo-ui.fly.dev"

# Deploy and seed
./deploy.sh demo all
./seed-db.sh demo
```
