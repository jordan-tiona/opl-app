import argparse
import random
import sys
from datetime import datetime
from pathlib import Path

from faker import Faker
from sqlmodel import Session, SQLModel, create_engine, select

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from routers.division import Division
from routers.game import Game
from routers.match import Match
from routers.player import Player
from routers.user import User

DATABASE_URL = "sqlite:///opl_db.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})


def init_divisions_table():
    print("Creating divisions...")
    with Session(engine) as session:
        session.add(Division(
            name="Tuesday OPL",
            start_date="2026-03-03",
            end_date="2026-06-02",
            match_time="19:00",
        ))
        session.add(Division(
            name="Wednesday OPL",
            start_date="2026-03-04",
            end_date="2026-06-03",
            match_time="19:00",
        ))
        session.commit()
    print("  Done. 2 divisions created.")


def init_players_table(num_players: int, player_email: str | None):
    print(f"Creating {num_players} players...")
    fake = Faker()
    divisions = [1] * (num_players // 2) + [2] * (num_players - num_players // 2)
    random.shuffle(divisions)
    with Session(engine) as session:
        for i in range(num_players):
            player = Player(
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                phone=fake.phone_number(),
                email=fake.email(),
                games_played=0,
                division_id=divisions[i],
            )
            session.add(player)
            session.flush()
            session.add(User(email=player.email, player_id=player.player_id))

        # Create test player with specific email if provided
        if player_email:
            print(f"  Creating test player with email: {player_email}")
            test_player = Player(
                first_name="Test",
                last_name="Player",
                phone="555-0100",
                email=player_email,
                games_played=0,
                division_id=1,  # Always assign to first division
            )
            session.add(test_player)
            session.flush()
            session.add(User(email=player_email, player_id=test_player.player_id))

        session.commit()
    total_created = num_players + (1 if player_email else 0)
    print(f"  Done. {total_created} players and users created.")


def init_matches_table(start_date: datetime):
    from utils import schedule_round_robin

    print(f"Scheduling round robin matches starting {start_date.strftime('%Y-%m-%d')}...")
    with Session(engine) as session:
        divisions = session.exec(select(Division)).all()
        total = 0
        for division in divisions:
            players = session.exec(select(Player).where(Player.division_id == division.division_id)).all()
            matches = schedule_round_robin(players, start_date, division.division_id)
            session.add_all(matches)
            total += len(matches)
        session.commit()
    print(f"  Done. {total} matches scheduled across {len(divisions)} divisions.")


def init_games_table():
    from datetime import timedelta

    from sqlalchemy import or_

    from utils import calculate_rating_change

    print("Generating games for completed matches...")
    with Session(engine) as session:
        matches = session.exec(select(Match)).all()
        completed_matches = random.sample(matches, len(matches) // 2)
        num_games = 0
        # Spread games over the past 30 days for realistic rating history
        base_date = datetime.now() - timedelta(days=30)

        for match in completed_matches:
            p1 = session.exec(select(Player).where(Player.player_id == match.player1_id)).one()
            p2 = session.exec(select(Player).where(Player.player_id == match.player2_id)).one()

            game_wins: dict[int, int] = {}
            for _game_num in range(random.randint(2, 3)):
                winner, loser = random.sample([p1, p2], 2)
                balls_remaining = random.randint(1, 8)

                winner_change, loser_change = calculate_rating_change(
                    winner.games_played, loser.games_played, balls_remaining
                )

                # Spread games over time: each game is some hours after the base date
                played_date = base_date + timedelta(hours=num_games * 6)

                session.add(Game(
                    match_id=match.match_id,
                    winner_id=winner.player_id,
                    loser_id=loser.player_id,
                    winner_rating=winner.rating,
                    loser_rating=loser.rating,
                    winner_rating_change=winner_change,
                    loser_rating_change=loser_change,
                    balls_remaining=balls_remaining,
                    played_date=played_date,
                ))

                winner.rating += winner_change
                loser.rating += loser_change
                winner.games_played += 1
                loser.games_played += 1
                num_games += 1
                game_wins[winner.player_id] = game_wins.get(winner.player_id, 0) + 1

            match.completed = True
            match.winner_id = max(game_wins, key=game_wins.get)
            match.loser_id = min(game_wins, key=game_wins.get)

            # Update ratings in uncompleted matches for both players
            uncompleted_matches = session.exec(
                select(Match).where(
                    not Match.completed,
                    or_(
                        Match.player1_id == p1.player_id,
                        Match.player2_id == p1.player_id,
                        Match.player1_id == p2.player_id,
                        Match.player2_id == p2.player_id,
                    )
                )
            ).all()

            for m in uncompleted_matches:
                if m.player1_id == p1.player_id:
                    m.player1_rating = p1.rating
                if m.player2_id == p1.player_id:
                    m.player2_rating = p1.rating
                if m.player1_id == p2.player_id:
                    m.player1_rating = p2.rating
                if m.player2_id == p2.player_id:
                    m.player2_rating = p2.rating

        session.commit()
    print(f"  Done. {len(completed_matches)} matches completed, {num_games} games created.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Initialize the OPL test database")
    parser.add_argument("--num-players", type=int, default=20, help="Number of players to create")
    parser.add_argument("--start-date", type=str, default=None, help="Schedule start date (YYYY-MM-DD). Defaults to today")
    parser.add_argument("--player-email", type=str, default=None, help="Email address for a test player (e.g., your personal Google account)")
    args = parser.parse_args()

    start_date = datetime.strptime(args.start_date, "%Y-%m-%d") if args.start_date else datetime.now()

    print("Dropping and recreating tables...")
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)
    print("  Done.\n")

    print("Creating admin user...")
    with Session(engine) as session:
        session.add(User(email="tionajordan@gmail.com", is_admin=True))
        session.commit()
    print("  Done.\n")

    init_divisions_table()
    print()
    init_players_table(args.num_players, args.player_email)
    print()
    init_matches_table(start_date)
    print()
    init_games_table()
