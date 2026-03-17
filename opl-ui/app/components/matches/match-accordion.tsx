import { Block as BlockIcon, Delete as DeleteIcon, Edit as EditIcon, ExpandMore as ExpandMoreIcon, Print as PrintIcon } from '@mui/icons-material'
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
import { memo, useCallback, useState } from 'react'


import { useGames, useRescoreMatch } from '~/lib/react-query'
import type { Game, GameInput, Match, Player } from '~/lib/types'
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
    focusPlayerId?: number
    onToggle: (matchId: number) => void
    onDelete?: (matchId: number) => void
    onMarkIncompleted?: (matchId: number) => void
}

export const MatchAccordion: React.FC<MatchAccordionProps> = memo(
    ({ match, players, expanded, focusPlayerId, onToggle, onDelete, onMarkIncompleted }: MatchAccordionProps) => {
        const player1 = players.find((p) => p.player_id === match.player1_id)
        const player2 = players.find((p) => p.player_id === match.player2_id)
        const [isEditing, setIsEditing] = useState(false)
        const rescoreMatch = useRescoreMatch()

        const { data: existingGames } = useGames({
            match_id: expanded ? match.match_id : undefined,
        })
        const weekEnd = new Date(match.scheduled_date)
        weekEnd.setDate(weekEnd.getDate() - weekEnd.getDay() + 7)
        const isPastDue = !match.completed && !match.incompleted && !match.is_bye && weekEnd < new Date()

        const p1Rating = match.completed ? (match.player1_rating ?? 0) : (player1?.rating ?? match.player1_rating ?? 0)
        const p2Rating = match.completed ? (match.player2_rating ?? 0) : (player2?.rating ?? match.player2_rating ?? 0)
        const [p1Weight, p2Weight] = match.is_bye
            ? [null, null]
            : match.completed
              ? [match.player1_weight, match.player2_weight]
              : getMatchWeight(p1Rating, p2Rating)

        const handleToggle = useCallback(() => {
            onToggle(match.match_id)
            setIsEditing(false)
        }, [onToggle, match.match_id])

        const buildInitialScores = (games: Game[], p1Weight: number, p2Weight: number) =>
            games.map((g) => {
                if (g.winner_id === match.player1_id) {
                    return { player1Score: p1Weight, player2Score: p2Weight - g.balls_remaining }
                } else {
                    return { player1Score: p1Weight - g.balls_remaining, player2Score: p2Weight }
                }
            })

        const handleRescore = useCallback(
            async (gameInputs: GameInput[]) => {
                await rescoreMatch.mutateAsync({ id: match.match_id, games: gameInputs })
                setIsEditing(false)
            },
            [rescoreMatch, match.match_id],
        )

        return (
            <Accordion
                expanded={expanded}
                slotProps={{ transition: { unmountOnExit: true } }}
                onChange={handleToggle}
            >
                <AccordionSummary expandIcon={<ExpandMoreIcon />} slotProps={{ root: { component: 'div' } }}>
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
                            color={match.is_bye ? 'default' : (match.incompleted || isPastDue) ? 'warning' : match.completed ? 'success' : 'primary'}
                            label={match.is_bye ? 'Bye' : (match.incompleted || isPastDue) ? 'Not Played' : match.completed ? 'Completed' : 'Scheduled'}
                            size="small"
                        />
                        {focusPlayerId && match.completed && !match.is_bye && (
                            <Chip
                                color={match.winner_id === focusPlayerId ? 'success' : 'error'}
                                label={match.winner_id === focusPlayerId ? 'Won' : 'Lost'}
                                size="small"
                                variant="outlined"
                            />
                        )}
                        {!match.completed && !match.incompleted && !match.is_bye && !isPastDue && (
                            <Tooltip title="Print score sheet">
                                <IconButton
                                    aria-label="Print score sheet"
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
                        {onDelete && (
                            <Tooltip title="Delete match">
                                <IconButton
                                    aria-label="Delete match"
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
                                isEditing && player1 && player2 ? (
                                    <GameRecorder
                                        initialGames={buildInitialScores(existingGames, p1Weight!, p2Weight!)}
                                        matchId={match.match_id}
                                        player1={player1}
                                        player2={player2}
                                        weights={[p1Weight!, p2Weight!]}
                                        onSubmit={handleRescore}
                                    />
                                ) : (
                                    <Box>
                                        <GameResults games={existingGames} match={match} players={players} />
                                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                            <Tooltip title="Edit match scores">
                                                <IconButton size="small" onClick={() => setIsEditing(true)}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </Box>
                                )
                            ) : player1 && player2 ? (
                                <Box>
                                    <GameRecorder
                                        matchId={match.match_id}
                                        player1={player1}
                                        player2={player2}
                                    />
                                    {onMarkIncompleted && !match.incompleted && (
                                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                            <Tooltip title="Mark as not played">
                                                <IconButton
                                                    color="warning"
                                                    size="small"
                                                    onClick={() => onMarkIncompleted(match.match_id)}
                                                >
                                                    <BlockIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    )}
                                </Box>
                            ) : null}
                        </>
                    )}
                </AccordionDetails>
            </Accordion>
        )
    },
)
