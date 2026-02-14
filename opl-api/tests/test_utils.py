from datetime import datetime

from utils import calculate_rating_change, schedule_round_robin


class TestCalculateRatingChange:
    def test_winner_positive_loser_negative(self):
        winner_change, loser_change = calculate_rating_change(0, 0, 3)
        assert winner_change > 0
        assert loser_change < 0

    def test_symmetric_magnitude(self):
        winner_change, loser_change = calculate_rating_change(0, 0, 3)
        assert winner_change == -loser_change

    def test_higher_robustness_reduces_base_change(self):
        new_winner, _ = calculate_rating_change(0, 0, 3)
        experienced_winner, _ = calculate_rating_change(50, 0, 3)
        assert new_winner > experienced_winner

    def test_balls_remaining_increases_change(self):
        change_low, _ = calculate_rating_change(10, 10, 1)
        change_high, _ = calculate_rating_change(10, 10, 5)
        assert change_high > change_low

    def test_zero_games_played(self):
        winner_change, loser_change = calculate_rating_change(0, 0, 0)
        # floor(18 * 0.943^0) + 0 = floor(18) + 0 = 18
        assert winner_change == 18
        assert loser_change == -18

    def test_specific_values(self):
        # floor(18 * 0.943^10) + 3 = floor(18 * 0.556) + 3 = floor(10.01) + 3 = 10 + 3 = 13
        winner_change, loser_change = calculate_rating_change(10, 10, 3)
        assert winner_change == 13
        assert loser_change == -13


class TestScheduleRoundRobin:
    def _make_players(self, n):
        from models import Player

        return [
            Player(
                player_id=i + 1,
                first_name=f'Player{i + 1}',
                last_name='Test',
                rating=600,
                games_played=0,
                phone='555-0000',
                email=f'p{i + 1}@test.com',
                division_id=1,
            )
            for i in range(n)
        ]

    def test_fewer_than_two_players_returns_empty(self):
        assert schedule_round_robin([], datetime(2025, 1, 1), 1) == []
        assert schedule_round_robin(self._make_players(1), datetime(2025, 1, 1), 1) == []

    def test_correct_number_of_matches(self):
        players = self._make_players(4)
        matches = schedule_round_robin(players, datetime(2025, 1, 1), 1)
        # N*(N-1) = 4*3 = 12 matches for home-and-away
        assert len(matches) == 12

    def test_each_pairing_appears_twice(self):
        players = self._make_players(4)
        matches = schedule_round_robin(players, datetime(2025, 1, 1), 1)
        pairings = [(m.player1_id, m.player2_id) for m in matches]
        # Each unordered pair should appear exactly twice (once each direction)
        for i, p1 in enumerate(players):
            for p2 in players[i + 1 :]:
                forward = (p1.player_id, p2.player_id)
                reverse = (p2.player_id, p1.player_id)
                assert pairings.count(forward) + pairings.count(reverse) == 2
                # Exactly one in each direction
                assert pairings.count(forward) == 1
                assert pairings.count(reverse) == 1

    def test_odd_number_of_players(self):
        players = self._make_players(3)
        matches = schedule_round_robin(players, datetime(2025, 1, 1), 1)
        # 3 players: 3*2 = 6 matches
        assert len(matches) == 6

    def test_all_matches_have_correct_division(self):
        players = self._make_players(4)
        matches = schedule_round_robin(players, datetime(2025, 1, 1), division_id=42)
        assert all(m.division_id == 42 for m in matches)

    def test_matches_are_not_completed(self):
        players = self._make_players(4)
        matches = schedule_round_robin(players, datetime(2025, 1, 1), 1)
        assert all(not m.completed for m in matches)
