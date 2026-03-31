"""
Backfill player1_rating and player2_rating on completed matches
using the winner_rating/loser_rating from the first game of each match.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import Session, select
from models import Match, Game
from services.database import engine


def backfill():
    with Session(engine) as session:
        completed_matches = session.exec(
            select(Match).where(Match.completed == True, Match.deleted == False)  # noqa: E712
        ).all()

        updated = 0
        skipped = 0

        for match in completed_matches:
            games = session.exec(
                select(Game).where(Game.match_id == match.match_id).order_by(Game.game_id)
            ).all()

            if not games:
                skipped += 1
                continue

            first_game = games[0]

            if first_game.winner_id == match.player1_id:
                p1_rating = first_game.winner_rating
                p2_rating = first_game.loser_rating
            else:
                p1_rating = first_game.loser_rating
                p2_rating = first_game.winner_rating

            match.player1_rating = p1_rating
            match.player2_rating = p2_rating
            session.add(match)
            updated += 1

        session.commit()
        print(f"Updated {updated} matches, skipped {skipped} (no games recorded).")


if __name__ == "__main__":
    backfill()
