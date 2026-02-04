import argparse
import random
import sys
from datetime import datetime
from pathlib import Path

from faker import Faker
from sqlmodel import SQLModel, create_engine, Session, select

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from routers.player import Player
from routers.match import Match
from routers.game import Game

DATABASE_URL = "sqlite:///opl_db.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})


def init_players_table(num_players: int):
    print(f"Creating {num_players} players...")
    fake = Faker()
    divisions = [1] * (num_players // 2) + [2] * (num_players - num_players // 2)
    random.shuffle(divisions)
    with Session(engine) as session:
        for i in range(num_players):
            session.add(Player(
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                phone=fake.phone_number(),
                email=fake.email(),
                games_played=0,
                division_id=divisions[i],
            ))
        session.commit()
    print(f"  Done. {num_players} players created.")


def init_matches_table(start_date: datetime):
    from utils import schedule_round_robin

    print(f"Scheduling round robin matches starting {start_date.strftime('%Y-%m-%d')}...")
    with Session(engine) as session:
        players = session.exec(select(Player)).all()
        matches = schedule_round_robin(players, start_date)
        session.add_all(matches)
        session.commit()
    print(f"  Done. {len(matches)} matches scheduled.")


def init_games_table():
    print("Generating games for completed matches...")
    with Session(engine) as session:
        matches = session.exec(select(Match)).all()
        completed_matches = random.sample(matches, len(matches) // 2)
        num_games = 0

        for match in completed_matches:
            p1 = session.exec(select(Player).where(Player.player_id == match.player1_id)).one()
            p2 = session.exec(select(Player).where(Player.player_id == match.player2_id)).one()

            for _ in range(random.randint(2, 3)):
                winner, loser = random.sample([p1, p2], 2)
                session.add(Game(
                    match_id=match.match_id,
                    winner_id=winner.player_id,
                    loser_id=loser.player_id,
                    winner_rating=winner.rating,
                    loser_rating=loser.rating,
                    balls_remaining=random.randint(1, 8),
                    played_date=datetime.now(),
                ))
                num_games += 1

            match.completed = True

        session.commit()
    print(f"  Done. {len(completed_matches)} matches completed, {num_games} games created.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Initialize the OPL test database")
    parser.add_argument("--num-players", type=int, default=20, help="Number of players to create")
    parser.add_argument("--start-date", type=str, default=None, help="Schedule start date (YYYY-MM-DD). Defaults to today")
    args = parser.parse_args()

    start_date = datetime.strptime(args.start_date, "%Y-%m-%d") if args.start_date else datetime.now()

    print("Dropping and recreating tables...")
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)
    print("  Done.\n")

    init_players_table(args.num_players)
    print()
    init_matches_table(start_date)
    print()
    init_games_table()
