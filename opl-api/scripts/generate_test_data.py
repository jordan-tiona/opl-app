"""Generate fake player data to a JSON file. Run locally (requires faker)."""

import argparse
import json
from pathlib import Path

from faker import Faker


def main():
    parser = argparse.ArgumentParser(description="Generate test player data")
    parser.add_argument("--num-players", type=int, default=20)
    args = parser.parse_args()

    fake = Faker()
    players = []
    for _ in range(args.num_players):
        players.append({
            "first_name": fake.first_name(),
            "last_name": fake.last_name(),
            "phone": fake.phone_number(),
            "email": fake.email(),
        })

    out = Path(__file__).parent / "test_data.json"
    out.write_text(json.dumps(players, indent=2) + "\n")
    print(f"Wrote {len(players)} players to {out}")


if __name__ == "__main__":
    main()
