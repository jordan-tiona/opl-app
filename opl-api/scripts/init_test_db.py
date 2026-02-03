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
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False}, echo=True)
SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session

def init_players_table():
    fake = Faker()
    with Session(engine) as session:
        for _ in range(20):
            session.add(Player(
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                phone=fake.phone_number(),
                email=fake.email(),
                games_played=0,
            ))
        session.commit()

def init_matches_table():
    with Session(engine) as session:
        players = session.exec(select(Player)).all()
        for _ in range(24):
            p1, p2 = random.sample(players, 2)
            session.add(Match(
                player1_id=p1.player_id,
                player2_id=p2.player_id,
                scheduled_date=datetime.now(),
                completed=False,
            ))
        session.commit()

def init_games_table():
    with Session(engine) as session:
        matches = session.exec(select(Match)).all()
        completed_matches = random.sample(matches, len(matches) // 2)

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

            match.completed = True

        session.commit()


if __name__ == "__main__":
    init_players_table()
    init_matches_table()
    init_games_table()
