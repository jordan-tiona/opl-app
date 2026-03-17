import {
    Box,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material'

import { useGames } from '~/lib/react-query'
import type { Match, Player } from '~/lib/types'

interface MatchGamesDetailProps {
    matchId: number
    playerId: number
    players?: Player[]
    match?: Match
}

export const MatchGamesDetail: React.FC<MatchGamesDetailProps> = ({
    matchId,
    playerId,
    players,
    match,
}) => {
    const { data: games, isLoading } = useGames({ match_id: matchId })

    if (isLoading) {
        return <CircularProgress size={20} />
    }

    if (!games || games.length === 0) {
        return (
            <Typography color="text.secondary" variant="body2">
                No games recorded.
            </Typography>
        )
    }

    const getPlayerName = (id: number) => {
        const p = players?.find((pl) => pl.player_id === id)

        return p ? `${p.first_name} ${p.last_name}` : `Player #${id}`
    }

    return (
        <Table size="small">
            <TableHead>
                <TableRow>
                    <TableCell>Game</TableCell>
                    <TableCell>Result</TableCell>
                    <TableCell>Rating Change</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {games.map((game, index) => {
                    const isWinner = game.winner_id === playerId
                    const ratingChange = isWinner
                        ? game.winner_rating_change
                        : game.loser_rating_change
                    const winnerName = getPlayerName(game.winner_id)
                    const loserName = getPlayerName(game.loser_id)
                    const isPlayer1Winner = match && game.winner_id === match.player1_id
                    const winnerWeight = match
                        ? (isPlayer1Winner ? match.player1_weight : (match.player2_weight ?? 8))
                        : 8
                    const loserWeight = match
                        ? (isPlayer1Winner ? (match.player2_weight ?? 8) : match.player1_weight)
                        : 8
                    const loserScore = loserWeight - game.balls_remaining

                    return (
                        <TableRow key={game.game_id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>
                                <Box component="span">
                                    <Typography component="span" sx={{ fontWeight: 600 }}>
                                        {winnerName}
                                    </Typography>
                                    <Typography
                                        component="span"
                                        sx={{ mx: 1, color: 'text.secondary' }}
                                    >
                                        {winnerWeight}:{loserScore}
                                    </Typography>
                                    <Typography component="span">{loserName}</Typography>
                                </Box>
                            </TableCell>
                            <TableCell>
                                <Typography
                                    color={ratingChange > 0 ? 'success.main' : 'error.main'}
                                    sx={{ fontWeight: 600 }}
                                >
                                    {ratingChange > 0 ? '+' : ''}
                                    {ratingChange}
                                </Typography>
                            </TableCell>
                        </TableRow>
                    )
                })}
            </TableBody>
        </Table>
    )
}
