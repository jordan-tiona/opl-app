"""Drop all tables from the database."""
import sys
from pathlib import Path

from sqlmodel import SQLModel

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from services.database import engine
import models  # noqa: F401 — ensure all models are registered

if __name__ == "__main__":
    print(f"Database URL: {engine.url}", flush=True)
    confirm = input("This will DROP ALL TABLES and delete all data. Type 'yes' to confirm: ")
    if confirm.strip().lower() != "yes":
        print("Aborted.", flush=True)
        sys.exit(1)
    print("Dropping all tables...", flush=True)
    SQLModel.metadata.drop_all(engine)
    print("Done.", flush=True)
