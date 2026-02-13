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


def progress_bar(current: int, total: int, width: int = 30):
    pct = current / total
    filled = int(width * pct)
    bar = "█" * filled + "░" * (width - filled)
    print(f"\r  [{bar}] {current}/{total}", end="", flush=True)
    if current == total:
        print()


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
    total = len(players) + len(player_emails)
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
            progress_bar(i + 1, total)

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
            progress_bar(len(players) + j + 1, total)

        session.commit()


def init_matches_table(start_date: datetime):
    from utils import schedule_round_robin

    with Session(engine) as session:
        opl_session = session.exec(select(OPLSession)).first()
        divisions = session.exec(select(Division)).all()
        for i, division in enumerate(divisions):
            players = session.exec(
                select(Player).join(DivisionPlayer, Player.player_id == DivisionPlayer.player_id)
                .where(DivisionPlayer.division_id == division.division_id)
            ).all()
            matches = schedule_round_robin(players, start_date, opl_session.session_id, division.division_id)
            session.add_all(matches)
            progress_bar(i + 1, len(divisions))
        session.commit()


def init_games_table():
    from datetime import timedelta

    from utils import calculate_rating_change

    with Session(engine) as session:
        # Load all players into a dict to avoid per-match queries
        all_players = {p.player_id: p for p in session.exec(select(Player)).all()}
        matches = session.exec(select(Match).order_by(Match.scheduled_date)).all()
        completed_matches = matches[:len(matches) // 2]
        uncompleted_matches = matches[len(matches) // 2:]

        # Index uncompleted matches by player_id for fast lookup
        uncompleted_by_player: dict[int, list[Match]] = {}
        for m in uncompleted_matches:
            uncompleted_by_player.setdefault(m.player1_id, []).append(m)
            uncompleted_by_player.setdefault(m.player2_id, []).append(m)

        num_games = 0
        base_date = datetime.now() - timedelta(days=30)
        total = len(completed_matches)
        games_to_add = []

        for match_idx, match in enumerate(completed_matches):
            p1 = all_players[match.player1_id]
            p2 = all_players[match.player2_id]

            game_wins: dict[int, int] = {p1.player_id: 0, p2.player_id: 0}
            while max(game_wins.values()) < 3:
                winner, loser = random.sample([p1, p2], 2)
                balls_remaining = random.randint(1, 8)

                winner_change, loser_change = calculate_rating_change(
                    winner.games_played, loser.games_played, balls_remaining
                )

                played_date = base_date + timedelta(hours=num_games * 6)

                games_to_add.append(Game(
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
            progress_bar(match_idx + 1, total)

            # Update ratings on uncompleted matches using in-memory index
            for pid in (p1.player_id, p2.player_id):
                player = all_players[pid]
                for m in uncompleted_by_player.get(pid, []):
                    if m.player1_id == pid:
                        m.player1_rating = player.rating
                    if m.player2_id == pid:
                        m.player2_rating = player.rating

        print(f"\n  Committing {len(games_to_add)} games...", flush=True)
        session.add_all(games_to_add)
        session.commit()
        print("  Committed.", flush=True)


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
    print()

    print("Scheduling matches...", flush=True)
    init_matches_table(start_date)
    print()

    print("Generating games...", flush=True)
    init_games_table()
    print("\nDone!", flush=True)
    sys.exit(0)
