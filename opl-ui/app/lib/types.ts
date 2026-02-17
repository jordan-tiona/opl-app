export interface Player {
    player_id: number
    first_name: string
    last_name: string
    rating: number
    games_played: number
    phone: string
    email: string
    email_notifications: boolean
    match_reminders: boolean
}

export interface Match {
    match_id: number
    session_id: number | null
    division_id: number
    player1_id: number
    player2_id: number
    player1_rating: number
    player2_rating: number
    player1_weight: number
    player2_weight: number
    scheduled_date: string
    completed: boolean
    winner_id: number | null
    loser_id: number | null
}

export interface Game {
    game_id: number
    match_id: number
    winner_id: number
    loser_id: number
    winner_rating: number
    loser_rating: number
    winner_rating_change: number
    loser_rating_change: number
    balls_remaining: number
    played_date: string
}

export interface GameInput {
    winner_id: number
    loser_id: number
    balls_remaining: number
}

export interface ScheduleInput {
    session_id: number
    start_date: string
    double?: boolean
}

export type PlayerInput = Omit<Player, 'player_id'>

export interface Division {
    division_id: number
    name: string
    day_of_week: number
    active: boolean
}

export type DivisionInput = Omit<Division, 'division_id'>

export interface Session {
    session_id: number
    name: string
    start_date: string
    end_date: string
    match_time: string
    active: boolean
}

export type SessionInput = Omit<Session, 'session_id'>

export interface PlayerScore {
    player_id: number
    score: number
}

export interface Message {
    message_id: number
    subject: string
    body: string
    sender_id: number
    recipient_type: 'player' | 'division' | 'league'
    recipient_id: number | null
    created_at: string
    is_read: boolean
}

export interface MessageInput {
    subject: string
    body: string
    recipient_type: 'player' | 'division' | 'league'
    recipient_id?: number | null
    player_ids?: number[]
    send_email?: boolean
}

export interface User {
    user_id: number
    email: string
    google_id: string | null
    name: string | null
    picture: string | null
    is_admin: boolean
    player_id: number | null
}
