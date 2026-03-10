import { TrendingDown as TrendingDownIcon, TrendingUp as TrendingUpIcon } from '@mui/icons-material'
import { Box, Typography, useMediaQuery, useTheme } from '@mui/material'

import type { Game, Match, Player } from '~/lib/types'

interface GameResultsProps {
    games: Game[]
    match: Match
    players: Player[]
}

export const GameResults: React.FC<GameResultsProps> = ({ games, match, players }: GameResultsProps) => {
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('md'))

    return (
        <Box>
            <Typography gutterBottom fontWeight={600} variant="subtitle1">
                Game Results
            </Typography>
            {games.map((game, index) => {
                const winner = players.find((p) => p.player_id === game.winner_id)
                const loser = players.find((p) => p.player_id === game.loser_id)
                // Use the match's stored weights (set at match creation from initial ratings)
                // to correctly decode balls_remaining, which was recorded using those same weights.
                const isPlayer1Winner = game.winner_id === match.player1_id
                const thisWinnerWeight = isPlayer1Winner ? match.player1_weight : (match.player2_weight ?? 8)
                const thisLoserWeight = isPlayer1Winner ? (match.player2_weight ?? 8) : match.player1_weight
                const loserScore = thisLoserWeight - game.balls_remaining
                const winnerNewRating = game.winner_rating + game.winner_rating_change
                const loserNewRating = game.loser_rating + game.loser_rating_change

                if (isMobile) {
                    return (
                        <Box
                            key={game.game_id}
                            sx={{
                                py: 1.5,
                                borderBottom:
                                    index < games.length - 1 ? '1px solid' : 'none',
                                borderColor: 'divider',
                            }}
                        >
                            <Typography color="text.secondary" sx={{ mb: 0.5 }} variant="body2">
                                Game {index + 1}
                            </Typography>
                            <Typography
                                fontWeight={600}
                                sx={{ mb: 0.5 }}
                            >
                                {thisWinnerWeight}:{loserScore}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <TrendingUpIcon
                                    sx={{ fontSize: 14, color: 'success.main' }}
                                />
                                <Typography variant="body2">
                                    {winner?.first_name} {winner?.last_name} ({winnerNewRating},{' '}
                                    <Typography
                                        color="success.main"
                                        component="span"
                                        variant="body2"
                                    >
                                        +{game.winner_rating_change}
                                    </Typography>
                                    )
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <TrendingDownIcon
                                    sx={{ fontSize: 14, color: 'error.main' }}
                                />
                                <Typography variant="body2">
                                    {loser?.first_name} {loser?.last_name} ({loserNewRating},{' '}
                                    <Typography
                                        color="error.main"
                                        component="span"
                                        variant="body2"
                                    >
                                        -{Math.abs(game.loser_rating_change)}
                                    </Typography>
                                    )
                                </Typography>
                            </Box>
                        </Box>
                    )
                }

                return (
                    <Box
                        key={game.game_id}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            py: 1,
                            borderBottom:
                                index < games.length - 1 ? '1px solid' : 'none',
                            borderColor: 'divider',
                        }}
                    >
                        <Typography color="text.secondary" sx={{ minWidth: 60 }}>
                            Game {index + 1}:
                        </Typography>
                        <Typography component="span">
                            {winner?.first_name} {winner?.last_name} ({winnerNewRating}
                            <TrendingUpIcon
                                sx={{
                                    fontSize: 14,
                                    verticalAlign: 'middle',
                                    ml: 0.5,
                                    mr: 0.25,
                                    color: 'success.main',
                                }}
                            />
                            <Typography color="success.main" component="span" variant="body2">
                                {game.winner_rating_change}
                            </Typography>
                            )
                        </Typography>
                        <Typography fontWeight={600}>
                            {thisWinnerWeight}:{loserScore}
                        </Typography>
                        <Typography component="span">
                            {loser?.first_name} {loser?.last_name} ({loserNewRating}
                            <TrendingDownIcon
                                sx={{
                                    fontSize: 14,
                                    verticalAlign: 'middle',
                                    ml: 0.5,
                                    mr: 0.25,
                                    color: 'error.main',
                                }}
                            />
                            <Typography color="error.main" component="span" variant="body2">
                                {Math.abs(game.loser_rating_change)}
                            </Typography>
                            )
                        </Typography>
                    </Box>
                )
            })}
        </Box>
    )
}
