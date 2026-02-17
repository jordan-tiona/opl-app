from datetime import datetime, timedelta
from math import floor

from models import Match, Player


def get_match_weight(rating1: int, rating2: int) -> tuple[int, int]:
    """Calculate match weights (race lengths) based on rating difference.

    The higher-rated player gets the higher weight (more balls to pocket).
    Returns (player1_weight, player2_weight).
    """
    diff = abs(rating1 - rating2)

    if diff <= 50:
        high, low = 8, 8
    elif diff <= 100:
        high, low = 8, 7
    elif diff <= 150:
        high, low = 9, 7
    elif diff <= 200:
        high, low = 9, 6
    elif diff <= 250:
        high, low = 10, 6
    elif diff <= 300:
        high, low = 10, 5
    elif diff <= 350:
        high, low = 11, 5
    elif diff <= 400:
        high, low = 11, 4
    else:
        high, low = 12, 4

    if rating1 >= rating2:
        return (high, low)
    return (low, high)


def schedule_round_robin(players: list[Player], start_date: datetime, session_id: int, division_id: int, *, double: bool = True) -> list[Match]:
    """Generate a round robin schedule using the circle method.

    When *double* is True (default), each pairing plays twice (home-and-away).
    When False, each pairing plays only once (single round robin).
    Rounds are one week apart.
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
    num_legs = 2 if double else 1
    for leg in range(num_legs):
        for round_num in range(num_rounds):
            round_date = start_date + timedelta(weeks=round_num + leg * num_rounds)
            for p1, p2 in get_round_pairings(round_num):
                if p1 is None or p2 is None:
                    continue  # bye — skip
                # Swap home/away between legs
                home, away = (p1, p2) if leg == 0 else (p2, p1)
                w1, w2 = get_match_weight(home.rating, away.rating)
                matches.append(Match(
                    session_id=session_id,
                    division_id=division_id,
                    player1_id=home.player_id,
                    player2_id=away.player_id,
                    player1_rating=home.rating,
                    player2_rating=away.rating,
                    player1_weight=w1,
                    player2_weight=w2,
                    scheduled_date=round_date,
                    completed=False,
                ))

    return matches

def calculate_rating_change(winner_robustness: int, loser_robustness: int, balls_remaining: int) -> tuple[int, int]:
    winner_change = floor(23 * (0.943 ** winner_robustness)) + balls_remaining
    loser_change = -(floor(23 * (0.943 ** loser_robustness)) + balls_remaining)
    return (winner_change, loser_change)
