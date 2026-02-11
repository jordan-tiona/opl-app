import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material'
import {
    Box,
    Card,
    CardContent,
    Chip,
    Collapse,
    Divider,
    IconButton,
    Typography,
} from '@mui/material'
import { memo, useCallback } from 'react'

import { useGames } from '~/lib/react-query'
import type { Match, Player } from '~/lib/types'
import { getMatchWeight } from '~/lib/utils'

import { GameRecorder } from './game-recorder'
import { GameResults } from './game-results'

function formatDate(dateString: string): string {
    const date = new Date(dateString)
    const datePart = date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })

    return datePart
}

interface MatchCardProps {
    match: Match
    players: Player[]
    expanded: boolean
    onToggle: (matchId: number) => void
}

export const MatchCard: React.FC<MatchCardProps> = memo(
    ({ match, players, expanded, onToggle }: MatchCardProps) => {
        const player1 = players.find((p) => p.player_id === match.player1_id)
        const player2 = players.find((p) => p.player_id === match.player2_id)

        const { data: existingGames } = useGames({
            match_id: expanded ? match.match_id : undefined,
        })
        const p1Rating = player1?.rating ?? match.player1_rating
        const p2Rating = player2?.rating ?? match.player2_rating
        const [p1Weight, p2Weight] = getMatchWeight(p1Rating, p2Rating)

        const handleToggle = useCallback(() => onToggle(match.match_id), [onToggle, match.match_id])

        return (
            <Card sx={{ mb: 2 }}>
                <CardContent
                    onClick={handleToggle}
                    sx={{ cursor: 'pointer', pb: expanded ? 2 : undefined }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 1,
                        }}
                    >
                        <Chip
                            label={match.completed ? 'Completed' : 'Scheduled'}
                            color={match.completed ? 'success' : 'primary'}
                            size="small"
                        />
                        <IconButton
                            size="small"
                            sx={{
                                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s',
                            }}
                        >
                            <ExpandMoreIcon />
                        </IconButton>
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        {formatDate(match.scheduled_date)}
                    </Typography>
                    <Typography variant="h6" sx={{ mb: 0.5 }}>
                        {player1 ? `${player1.first_name} ${player1.last_name}` : 'Unknown'} (
                        {p1Rating})
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        vs.
                    </Typography>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                        {player2 ? `${player2.first_name} ${player2.last_name}` : 'Unknown'} (
                        {p2Rating})
                    </Typography>
                    <Typography variant="body1" color="secondary">
                        Weight: {p1Weight}-{p2Weight}
                    </Typography>
                </CardContent>
                <Collapse in={expanded} timeout="auto" unmountOnExit>
                    <CardContent sx={{ pt: 0 }}>
                        <Divider sx={{ mb: 2 }} />
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3,
                                mb: 2,
                                justifyContent: 'center',
                            }}
                        >
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="subtitle1" fontWeight={600}>
                                    {player1
                                        ? `${player1.first_name} ${player1.last_name}`
                                        : 'Unknown'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Rating: {p1Rating}
                                </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="subtitle1" color="text.secondary">
                                    VS
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {p1Weight}-{p2Weight}
                                </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="subtitle1" fontWeight={600}>
                                    {player2
                                        ? `${player2.first_name} ${player2.last_name}`
                                        : 'Unknown'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Rating: {p2Rating}
                                </Typography>
                            </Box>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        {match.completed && existingGames && existingGames.length > 0 ? (
                            <GameResults games={existingGames} players={players} />
                        ) : player1 && player2 ? (
                            <GameRecorder
                                matchId={match.match_id}
                                player1={player1}
                                player2={player2}
                            />
                        ) : null}
                    </CardContent>
                </Collapse>
            </Card>
        )
    },
)
