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
- `--player-email <email>` — Create an additional test player with the specified email (useful for testing with your personal Google account)

**Examples:**
```bash
# Create 16 players starting on March 1st
python scripts/init_test_db.py --num-players 16 --start-date 2026-03-01

# Create default players plus a test player linked to your Google account
python scripts/init_test_db.py --player-email "your-email@gmail.com"
```

This script will drop and recreate all tables, create fake players, schedule round-robin matches, and generate games for half the matches. If `--player-email` is provided, an additional "Test Player" will be created and linked to a User account with that email address.
