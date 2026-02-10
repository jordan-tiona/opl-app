from datetime import datetime, timedelta
from math import floor

from routers.match import Match
from routers.player import Player


def schedule_round_robin(players: list[Player], start_date: datetime, division_id: int) -> list[Match]:
    """Generate a full home-and-away round robin schedule using the circle method.

    Each pairing plays twice: once with each player as "home" (player1).
    Rounds are one week apart, with the second leg continuing after the first.
    """
    n = len(players)
    if n < 2:
        return []

    # Circle method requires an even number; pad with None (bye) if odd
    padded = list(players) + ([None] if n % 2 != 0 else [])
    num_players = len(padded)
    num_rounds = num_players - 1  # rounds per leg

    def get_round_pairings(round_num: int) -> list[tuple]:
        # Fixed player (last) vs the rotating slot
        pairings = [(padded[num_rounds], padded[round_num])]
        # Remaining pairs mirror around the fixed slot
        for i in range(1, num_players // 2):
            pairings.append((
                padded[(round_num + i) % num_rounds],
                padded[(round_num - i) % num_rounds],
            ))
        return pairings

    matches = []
    for leg in range(2):
        for round_num in range(num_rounds):
            round_date = start_date + timedelta(weeks=round_num + leg * num_rounds)
            for p1, p2 in get_round_pairings(round_num):
                if p1 is None or p2 is None:
                    continue  # bye — skip
                # Swap home/away between legs
                home, away = (p1, p2) if leg == 0 else (p2, p1)
                matches.append(Match(
                    division_id=division_id,
                    player1_id=home.player_id,
                    player2_id=away.player_id,
                    player1_rating=home.rating,
                    player2_rating=away.rating,
                    scheduled_date=round_date,
                    completed=False,
                ))

    return matches

def calculate_rating_change(winner_robustness: int, loser_robustness: int, balls_remaining: int) -> tuple[int, int]:
    winner_change = floor(18 * (0.943 ** winner_robustness)) + balls_remaining
    loser_change = -(floor(18 * (0.943 ** loser_robustness)) + balls_remaining)
    return (winner_change, loser_change)
