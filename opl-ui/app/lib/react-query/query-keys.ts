export const queryKeys = {
    players: ['players'] as const,
    player: (id: number) => ['players', id] as const,
    matches: (params: {
        start_date?: string
        end_date?: string
        player_id?: number
        division_id?: number
        completed?: boolean
    }) => ['matches', params] as const,
    match: (id: number) => ['matches', id] as const,
    games: (matchId: number) => ['games', matchId] as const,
    divisions: ['divisions'] as const,
    division: (id: number) => ['divisions', id] as const,
    scores: (divisionId: number) => ['scores', divisionId] as const,
    divisionPlayers: (divisionId: number) => ['divisions', divisionId, 'players'] as const,
    playerDivisions: (playerId: number) => ['players', playerId, 'divisions'] as const,
}
