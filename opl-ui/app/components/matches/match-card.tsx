import { Block as BlockIcon, Delete as DeleteIcon, ExpandMore as ExpandMoreIcon, Print as PrintIcon } from '@mui/icons-material'
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Collapse,
    Divider,
    IconButton,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material'
import { memo, useCallback } from 'react'

import { useAuth } from '~/lib/auth'
import { useGames , useMatchPayments, useConfirmPayment } from '~/lib/react-query'
import { useSnackbar } from '~/lib/snackbar'
import type { Match, Player } from '~/lib/types'
import { getMatchWeight } from '~/lib/utils'

import { GameRecorder } from './game-recorder'
import { GameResults } from './game-results'

function formatDate(dateString: string, isWeekly: boolean): string {
    const date = new Date(dateString)

    if (isWeekly) {
        // Show the Monday of the week
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

interface MatchCardProps {
    match: Match
    players: Player[]
    expanded: boolean
    focusPlayerId?: number
    onToggle: (matchId: number) => void
    onDelete?: (matchId: number) => void
    onMarkIncompleted?: (matchId: number) => void
}

export const MatchCard: React.FC<MatchCardProps> = memo(
    ({ match, players, expanded, focusPlayerId, onToggle, onDelete, onMarkIncompleted }: MatchCardProps) => {
        const { user } = useAuth()
        const { showSnackbar } = useSnackbar()
        const player1 = players.find((p) => p.player_id === match.player1_id)
        const player2 = players.find((p) => p.player_id === match.player2_id)

        const { data: existingGames } = useGames({
            match_id: expanded ? match.match_id : undefined,
        })
        const weekEnd = new Date(match.scheduled_date)
        weekEnd.setDate(weekEnd.getDate() - weekEnd.getDay() + 7)
        const isPastDue = !match.completed && !match.incompleted && !match.is_bye && weekEnd < new Date()

        const { data: payments } = useMatchPayments(
            expanded && user?.is_admin && !match.completed && !match.is_bye ? match.match_id : 0
        )
        const confirmPayment = useConfirmPayment()
        const p1Rating = match.completed ? (match.player1_rating ?? 0) : (player1?.rating ?? match.player1_rating ?? 0)
        const p2Rating = match.completed ? (match.player2_rating ?? 0) : (player2?.rating ?? match.player2_rating ?? 0)
        const [p1Weight, p2Weight] = match.is_bye
            ? [null, null]
            : match.completed
              ? [match.player1_weight, match.player2_weight]
              : getMatchWeight(p1Rating, p2Rating)

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
                        <Box sx={{ flex: 1 }} />
                        {!match.completed && !match.incompleted && !match.is_bye && !isPastDue && (
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
                        {onMarkIncompleted && !match.completed && !match.incompleted && !match.is_bye && !isPastDue && (
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
                        {formatDate(match.scheduled_date, match.is_weekly)}
                    </Typography>
                    <Typography sx={{ mb: 0.5 }} variant="h6">
                        {player1 ? `${player1.first_name} ${player1.last_name}` : 'Unknown'} (
                        {p1Rating})
                    </Typography>
                    {match.is_bye ? (
                        <Typography color="text.secondary" sx={{ mb: 1 }} variant="body1">
                            Bye week
                        </Typography>
                    ) : (
                        <>
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
                        </>
                    )}
                </CardContent>
                <Collapse unmountOnExit in={expanded} timeout="auto">
                    <CardContent sx={{ pt: 0 }}>
                        <Divider sx={{ mb: 2 }} />
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
                                    <GameResults games={existingGames} match={match} players={players} />
                                ) : player1 && player2 ? (
                                    <GameRecorder
                                        matchId={match.match_id}
                                        player1={player1}
                                        player2={player2}
                                    />
                                ) : null}

                                {user?.is_admin && !match.completed && payments && payments.length > 0 && (
                                    <>
                                        <Divider sx={{ my: 2 }} />
                                        <Typography fontWeight={600} sx={{ mb: 1 }} variant="subtitle2">
                                            Payment Status
                                        </Typography>
                                        <Stack spacing={1}>
                                            {[match.player1_id, match.player2_id].filter(Boolean).map((pid) => {
                                                const p = players.find((pl) => pl.player_id === pid)
                                                const payment = payments.find((pay) => pay.player_id === pid)
                                                const name = p ? `${p.first_name} ${p.last_name}` : `Player #${pid}`

                                                return (
                                                    <Box key={pid} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Typography sx={{ minWidth: 160 }} variant="body2">{name}</Typography>
                                                        {!payment || payment.status === 'unpaid' ? (
                                                            <Chip color="default" label="Unpaid" size="small" />
                                                        ) : payment.status === 'confirmed' ? (
                                                            <Chip color="success" label="Confirmed" size="small" />
                                                        ) : (
                                                            <>
                                                                <Chip color="warning" label={`Pending (${payment.payment_method ?? 'unknown'})`} size="small" />
                                                                <Button
                                                                    disabled={confirmPayment.isPending}
                                                                    size="small"
                                                                    variant="outlined"
                                                                    onClick={async () => {
                                                                        try {
                                                                            await confirmPayment.mutateAsync({ matchId: match.match_id, playerId: pid! })
                                                                            showSnackbar('Payment confirmed', 'success')
                                                                        } catch (err) {
                                                                            showSnackbar(err instanceof Error ? err.message : 'Failed', 'error')
                                                                        }
                                                                    }}
                                                                >
                                                                    Confirm Payment
                                                                </Button>
                                                            </>
                                                        )}
                                                    </Box>
                                                )
                                            })}
                                        </Stack>
                                    </>
                                )}
                            </>
                        )}
                    </CardContent>
                </Collapse>
            </Card>
        )
    },
)
