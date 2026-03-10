"""Undo a completed match: reverse all rating/games_played changes and reset the match.

After running this, the match will appear as unplayed and can be re-entered via the admin UI.

Usage:
    python scripts/undo_match.py <match_id>
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from models import Game, Match, Player  # noqa: E402
from services.database import engine  # noqa: E402
from sqlmodel import Session, select  # noqa: E402


def undo_match(match_id: int) -> None:
    with Session(engine) as session:
        match = session.get(Match, match_id)
        if not match:
            print(f"Match {match_id} not found.")
            sys.exit(1)
        if not match.completed:
            print(f"Match {match_id} is not completed. Nothing to undo.")
            sys.exit(1)

        games = session.exec(select(Game).where(Game.match_id == match_id)).all()
        if not games:
            print(f"No games found for match {match_id}.")
            sys.exit(1)

        player1 = session.get(Player, match.player1_id)
        player2 = session.get(Player, match.player2_id)

        print(f"Match {match_id}: {player1.first_name} {player1.last_name} vs {player2.first_name} {player2.last_name}")
        print(f"  {len(games)} game(s) to reverse:\n")

        rating_deltas: dict[int, int] = {}
        games_played_deltas: dict[int, int] = {}

        for g in games:
            winner = session.get(Player, g.winner_id)
            loser = session.get(Player, g.loser_id)
            print(f"  Game {g.game_id}: {winner.first_name} wins {g.winner_rating_change:+d}, {loser.first_name} {g.loser_rating_change:+d} (balls_remaining={g.balls_remaining})")
            rating_deltas[g.winner_id] = rating_deltas.get(g.winner_id, 0) - g.winner_rating_change
            rating_deltas[g.loser_id] = rating_deltas.get(g.loser_id, 0) - g.loser_rating_change
            games_played_deltas[g.winner_id] = games_played_deltas.get(g.winner_id, 0) - 1
            games_played_deltas[g.loser_id] = games_played_deltas.get(g.loser_id, 0) - 1

        print()
        for pid, delta in rating_deltas.items():
            p = session.get(Player, pid)
            print(f"  {p.first_name} {p.last_name}: rating {p.rating} → {p.rating + delta}, games_played {p.games_played} → {p.games_played + games_played_deltas[pid]}")

        print()
        confirm = input("Undo this match? [y/N] ")
        if confirm.strip().lower() != 'y':
            print("Aborted.")
            return

        # Apply rating/games_played reversals
        all_player_ids = set(rating_deltas.keys())
        for pid in all_player_ids:
            p = session.get(Player, pid)
            p.rating += rating_deltas[pid]
            p.games_played += games_played_deltas[pid]
            session.add(p)

        # Delete games
        for g in games:
            session.delete(g)

        # Reset match to unplayed
        match.completed = False
        match.winner_id = None
        match.loser_id = None
        session.add(match)

        session.commit()
        print("Done. Match has been reset and can be re-entered via the admin UI.")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python scripts/undo_match.py <match_id>")
        sys.exit(1)
    undo_match(int(sys.argv[1]))
