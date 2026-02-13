import argparse
import json
import random
import sys
from datetime import datetime
from pathlib import Path

from sqlmodel import Session, SQLModel, select

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from database import engine
from models import Division, DivisionPlayer, Game, Match, Player, User
from models import Session as OPLSession

TEST_DATA = json.loads((Path(__file__).parent / "test_data.json").read_text())


def init_divisions_table():
    with Session(engine) as session:
        session.add(Division(
            name="Tuesday Night",
            day_of_week=1,  # Tuesday
        ))
        session.add(Division(
            name="Wednesday Night",
            day_of_week=2,  # Wednesday
        ))
        session.commit()


def init_sessions_table():
    with Session(engine) as session:
        session.add(OPLSession(
            name="Spring 2026",
            start_date="2026-03-03",
            end_date="2026-06-03",
            match_time="19:00",
        ))
        session.commit()


def init_players_table(num_players: int, player_emails: list[str]):
    players = random.sample(TEST_DATA, min(num_players, len(TEST_DATA)))
    divisions = [1] * (len(players) // 2) + [2] * (len(players) - len(players) // 2)
    random.shuffle(divisions)
    with Session(engine) as session:
        for i, p in enumerate(players):
            player = Player(
                first_name=p["first_name"],
                last_name=p["last_name"],
                phone=p["phone"],
                email=p["email"],
                games_played=0,
            )
            session.add(player)
            session.flush()
            session.add(User(email=player.email, player_id=player.player_id))
            session.add(DivisionPlayer(division_id=divisions[i], player_id=player.player_id))

        for j, email in enumerate(player_emails):
            test_player = Player(
                first_name="Test",
                last_name=f"Player {j + 1}",
                phone=f"555-{j + 1:04d}",
                email=email,
                games_played=0,
            )
            session.add(test_player)
            session.flush()
            # Link to existing user if already created (e.g. admin), otherwise create
            existing_user = session.exec(select(User).where(User.email == email)).first()
            if existing_user:
                existing_user.player_id = test_player.player_id
            else:
                session.add(User(email=email, player_id=test_player.player_id))
            session.add(DivisionPlayer(division_id=1, player_id=test_player.player_id))

        session.commit()


def init_matches_table(start_date: datetime):
    from utils import schedule_round_robin

    with Session(engine) as session:
        opl_session = session.exec(select(OPLSession)).first()
        divisions = session.exec(select(Division)).all()
        for division in divisions:
            players = session.exec(
                select(Player).join(DivisionPlayer, Player.player_id == DivisionPlayer.player_id)
                .where(DivisionPlayer.division_id == division.division_id)
            ).all()
            matches = schedule_round_robin(players, start_date, opl_session.session_id, division.division_id)
            session.add_all(matches)
        session.commit()


def init_games_table():
    from datetime import timedelta

    from sqlalchemy import or_

    from utils import calculate_rating_change

    with Session(engine) as session:
        matches = session.exec(select(Match).order_by(Match.scheduled_date)).all()
        completed_matches = matches[:len(matches) // 2]
        num_games = 0
        base_date = datetime.now() - timedelta(days=30)

        for match in completed_matches:
            p1 = session.exec(select(Player).where(Player.player_id == match.player1_id)).one()
            p2 = session.exec(select(Player).where(Player.player_id == match.player2_id)).one()

            game_wins: dict[int, int] = {p1.player_id: 0, p2.player_id: 0}
            while max(game_wins.values()) < 3:
                winner, loser = random.sample([p1, p2], 2)
                balls_remaining = random.randint(1, 8)

                winner_change, loser_change = calculate_rating_change(
                    winner.games_played, loser.games_played, balls_remaining
                )

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

            uncompleted_matches = session.exec(
                select(Match).where(
                    Match.completed == False,
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


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Initialize the OPL test database")
    parser.add_argument("--num-players", type=int, default=20, help="Number of players to create")
    parser.add_argument("--start-date", type=str, default=None, help="Schedule start date (YYYY-MM-DD). Defaults to today")
    parser.add_argument("--player-email", type=str, nargs="+", default=[], help="Email address(es) for test players")
    args = parser.parse_args()

    print("Script starting...", flush=True)
    start_date = datetime.strptime(args.start_date, "%Y-%m-%d") if args.start_date else datetime.now()

    print(f"Connecting to database...\n  URL: {engine.url}", flush=True)
    print("Dropping tables...", flush=True)
    SQLModel.metadata.drop_all(engine)
    print("Creating tables...", flush=True)
    SQLModel.metadata.create_all(engine)
    print("  Done.\n", flush=True)

    print("Creating admin user...", flush=True)
    with Session(engine) as session:
        session.add(User(email="admin@csopl.com", is_admin=True))
        session.commit()
    print("  Done.\n", flush=True)

    print("Creating divisions...", flush=True)
    init_divisions_table()
    print("  Done.\n", flush=True)

    print("Creating sessions...", flush=True)
    init_sessions_table()
    print("  Done.\n", flush=True)

    print(f"Creating {args.num_players} players...", flush=True)
    init_players_table(args.num_players, args.player_email or [])
    print("  Done.\n", flush=True)

    print("Scheduling matches...", flush=True)
    init_matches_table(start_date)
    print("  Done.\n", flush=True)

    print("Generating games...", flush=True)
    init_games_table()
    print("  Done.\n", flush=True)
