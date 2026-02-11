import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material'
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Chip,
    Divider,
    Typography,
} from '@mui/material'
import { memo, useCallback } from 'react'


import { useGames } from '~/lib/react-query'
import type { Match, Player } from '~/lib/types'
import { getMatchWeight } from '~/lib/utils'

import { GameRecorder } from './game-recorder'
import { GameResults } from './game-results'

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
}

interface MatchAccordionProps {
    match: Match
    players: Player[]
    expanded: boolean
    onToggle: (matchId: number) => void
}

export const MatchAccordion: React.FC<MatchAccordionProps> = memo(
    ({ match, players, expanded, onToggle }: MatchAccordionProps) => {
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
            <Accordion
                expanded={expanded}
                slotProps={{ transition: { unmountOnExit: true } }}
                onChange={handleToggle}
            >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', pr: 2 }}
                    >
                        <Typography color="text.secondary" sx={{ minWidth: 140 }}>
                            {formatDate(match.scheduled_date)}
                        </Typography>
                        <Typography sx={{ flex: 1 }}>
                            {player1
                                ? `${player1.first_name} ${player1.last_name} (${p1Rating})`
                                : 'Unknown'}
                            {' vs '}
                            {player2
                                ? `${player2.first_name} ${player2.last_name} (${p2Rating})`
                                : 'Unknown'}
                        </Typography>
                        <Typography
                            color="text.secondary"
                            sx={{ minWidth: 50, textAlign: 'center' }}
                        >
                            {p1Weight}-{p2Weight}
                        </Typography>
                        <Chip
                            color={match.completed ? 'success' : 'primary'}
                            label={match.completed ? 'Completed' : 'Scheduled'}
                            size="small"
                        />
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            mb: 3,
                            justifyContent: 'center',
                        }}
                    >
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6">
                                {player1 ? `${player1.first_name} ${player1.last_name}` : 'Unknown'}
                            </Typography>
                            <Typography color="text.secondary" variant="body2">
                                Rating: {p1Rating}
                            </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography color="text.secondary" variant="h6">
                                VS
                            </Typography>
                            <Typography color="text.secondary" variant="body2">
                                {p1Weight}-{p2Weight}
                            </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6">
                                {player2 ? `${player2.first_name} ${player2.last_name}` : 'Unknown'}
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
                </AccordionDetails>
            </Accordion>
        )
    },
)
