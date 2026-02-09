export interface Player {
  player_id: number;
  division_id: number | null;
  first_name: string;
  last_name: string;
  rating: number;
  games_played: number;
  phone: string;
  email: string;
}

export interface Match {
  match_id: number;
  division_id: number | null;
  player1_id: number;
  player2_id: number;
  player1_rating: number;
  player2_rating: number;
  scheduled_date: string;
  completed: boolean;
  winner_id: number | null;
  loser_id: number | null;
}

export interface Game {
  game_id: number;
  match_id: number;
  winner_id: number;
  loser_id: number;
  winner_rating: number;
  loser_rating: number;
  winner_rating_change: number;
  loser_rating_change: number;
  balls_remaining: number;
  played_date: string;
}

export interface GameInput {
  winner_id: number;
  loser_id: number;
  balls_remaining: number;
}

export interface ScheduleInput {
  division: number;
  start_date: string;
}

export type PlayerInput = Omit<Player, 'player_id'>;

export interface Division {
  division_id: number;
  name: string;
  start_date: string;
  end_date: string;
  match_time: string;
}

export type DivisionInput = Omit<Division, 'division_id'>;

export interface PlayerScore {
  player_id: number;
  score: number;
}

export interface User {
  user_id: number;
  email: string;
  google_id: string | null;
  name: string | null;
  picture: string | null;
  is_admin: boolean;
  player_id: number | null;
}
