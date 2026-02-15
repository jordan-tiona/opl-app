import { ExpandMore as ExpandMoreIcon, Print as PrintIcon } from '@mui/icons-material'
import {
    Box,
    Card,
    CardContent,
    Chip,
    Collapse,
    Divider,
    IconButton,
    Tooltip,
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
                    sx={{ cursor: 'pointer', pb: expanded ? 2 : undefined }}
                    onClick={handleToggle}
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
                            color={match.completed ? 'success' : 'primary'}
                            label={match.completed ? 'Completed' : 'Scheduled'}
                            size="small"
                        />
                        <Box sx={{ flex: 1 }} />
                        {!match.completed && (
                            <Tooltip title="Print score sheet">
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        window.open(`/matches/print?match_id=${match.match_id}`, '_blank')
                                    }}
                                >
                                    <PrintIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
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
                    <Typography gutterBottom color="text.secondary" variant="body2">
                        {formatDate(match.scheduled_date)}
                    </Typography>
                    <Typography sx={{ mb: 0.5 }} variant="h6">
                        {player1 ? `${player1.first_name} ${player1.last_name}` : 'Unknown'} (
                        {p1Rating})
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 0.5 }} variant="body2">
                        vs.
                    </Typography>
                    <Typography sx={{ mb: 1 }} variant="h6">
                        {player2 ? `${player2.first_name} ${player2.last_name}` : 'Unknown'} (
                        {p2Rating})
                    </Typography>
                    <Typography color="secondary" variant="body1">
                        Weight: {p1Weight}-{p2Weight}
                    </Typography>
                </CardContent>
                <Collapse unmountOnExit in={expanded} timeout="auto">
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
                                <Typography fontWeight={600} variant="subtitle1">
                                    {player1
                                        ? `${player1.first_name} ${player1.last_name}`
                                        : 'Unknown'}
                                </Typography>
                                <Typography color="text.secondary" variant="body2">
                                    Rating: {p1Rating}
                                </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography color="text.secondary" variant="subtitle1">
                                    VS
                                </Typography>
                                <Typography color="text.secondary" variant="body2">
                                    {p1Weight}-{p2Weight}
                                </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography fontWeight={600} variant="subtitle1">
                                    {player2
                                        ? `${player2.first_name} ${player2.last_name}`
                                        : 'Unknown'}
                                </Typography>
                                <Typography color="text.secondary" variant="body2">
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
