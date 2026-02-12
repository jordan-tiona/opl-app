export const queryKeys = {
    players: ['players'] as const,
    player: (id: number) => ['players', id] as const,
    matches: (params: {
        start_date?: string
        end_date?: string
        player_id?: number
        session_id?: number
        completed?: boolean
    }) => ['matches', params] as const,
    match: (id: number) => ['matches', id] as const,
    games: (matchId: number) => ['games', matchId] as const,
    divisions: ['divisions'] as const,
    division: (id: number) => ['divisions', id] as const,
    divisionPlayers: (divisionId: number) => ['divisions', divisionId, 'players'] as const,
    playerDivisions: (playerId: number) => ['players', playerId, 'divisions'] as const,
    sessions: ['sessions'] as const,
    session: (id: number) => ['sessions', id] as const,
    sessionsByDivision: (divisionId: number) => ['sessions', 'division', divisionId] as const,
    scores: (sessionId: number) => ['scores', sessionId] as const,
}
