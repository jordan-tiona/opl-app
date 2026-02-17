"""Create all tables (empty) and seed the admin user."""
import argparse
import sys
from pathlib import Path

from sqlmodel import Session, SQLModel

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from services.database import engine
from models import User  # noqa: F401 — also registers all models via models/__init__

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Initialize an empty OPL database")
    parser.add_argument("--admin-email", type=str, default="admin@csopl.com", help="Admin user email")
    args = parser.parse_args()

    print(f"Database URL: {engine.url}", flush=True)
    confirm = input("This will create tables in the database above. Type 'yes' to confirm: ")
    if confirm.strip().lower() != "yes":
        print("Aborted.", flush=True)
        sys.exit(1)
    print("Creating tables...", flush=True)
    SQLModel.metadata.create_all(engine)
    print("  Done.\n", flush=True)

    print(f"Creating admin user ({args.admin_email})...", flush=True)
    with Session(engine) as session:
        session.add(User(email=args.admin_email, is_admin=True))
        session.commit()
    print("  Done.", flush=True)
