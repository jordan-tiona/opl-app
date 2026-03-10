import { Block as BlockIcon, Delete as DeleteIcon, ExpandMore as ExpandMoreIcon, Print as PrintIcon } from '@mui/icons-material'
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Chip,
    Divider,
    IconButton,
    Tooltip,
    Typography,
} from '@mui/material'
import { memo, useCallback } from 'react'


import { useGames, useMarkIncompletedMatch } from '~/lib/react-query'
import type { Match, Player } from '~/lib/types'
import { getMatchWeight } from '~/lib/utils'

import { GameRecorder } from './game-recorder'
import { GameResults } from './game-results'

function formatDate(dateString: string, isWeekly: boolean): string {
    const date = new Date(dateString)
    if (isWeekly) {
        const monday = new Date(date)
        monday.setDate(date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1))
        return 'Week of ' + monday.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
    }
    return date.toLocaleDateString('en-US', {
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
    onDelete?: (matchId: number) => void
    onMarkIncompleted?: (matchId: number) => void
}

export const MatchAccordion: React.FC<MatchAccordionProps> = memo(
    ({ match, players, expanded, onToggle, onDelete, onMarkIncompleted }: MatchAccordionProps) => {
        const player1 = players.find((p) => p.player_id === match.player1_id)
        const player2 = players.find((p) => p.player_id === match.player2_id)

        const { data: existingGames } = useGames({
            match_id: expanded ? match.match_id : undefined,
        })
        const p1Rating = match.completed ? (match.player1_rating ?? 0) : (player1?.rating ?? match.player1_rating ?? 0)
        const p2Rating = match.completed ? (match.player2_rating ?? 0) : (player2?.rating ?? match.player2_rating ?? 0)
        const [p1Weight, p2Weight] = match.is_bye
            ? [null, null]
            : match.completed
              ? [match.player1_weight, match.player2_weight]
              : getMatchWeight(p1Rating, p2Rating)

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
                            {formatDate(match.scheduled_date, match.is_weekly)}
                        </Typography>
                        <Typography sx={{ flex: 1 }}>
                            {match.is_bye ? (
                                <>
                                    {player1
                                        ? `${player1.first_name} ${player1.last_name}`
                                        : 'Unknown'}
                                    {' — Bye'}
                                </>
                            ) : (
                                <>
                                    {player1
                                        ? `${player1.first_name} ${player1.last_name} (${p1Rating})`
                                        : 'Unknown'}
                                    {' vs '}
                                    {player2
                                        ? `${player2.first_name} ${player2.last_name} (${p2Rating})`
                                        : 'Unknown'}
                                </>
                            )}
                        </Typography>
                        {!match.is_bye && (
                            <Typography
                                color="text.secondary"
                                sx={{ minWidth: 50, textAlign: 'center' }}
                            >
                                {p1Weight}-{p2Weight}
                            </Typography>
                        )}
                        <Chip
                            color={match.is_bye ? 'default' : match.incompleted ? 'warning' : match.completed ? 'success' : 'primary'}
                            label={match.is_bye ? 'Bye' : match.incompleted ? 'Not Played' : match.completed ? 'Completed' : 'Scheduled'}
                            size="small"
                        />
                        {!match.completed && !match.incompleted && !match.is_bye && (
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
                        {onMarkIncompleted && !match.completed && !match.incompleted && !match.is_bye && (
                            <Tooltip title="Mark as not played">
                                <IconButton
                                    color="warning"
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onMarkIncompleted(match.match_id)
                                    }}
                                >
                                    <BlockIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                        {onDelete && (
                            <Tooltip title="Delete match">
                                <IconButton
                                    color="error"
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onDelete(match.match_id)
                                    }}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    {match.is_bye ? (
                        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 1 }}>
                            {player1 ? `${player1.first_name} ${player1.last_name}` : 'Unknown'} has a bye this week.
                        </Typography>
                    ) : (
                        <>
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
                        </>
                    )}
                </AccordionDetails>
            </Accordion>
        )
    },
)
