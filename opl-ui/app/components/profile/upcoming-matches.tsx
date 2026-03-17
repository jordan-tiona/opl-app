import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material'
import { useState } from 'react'

import { MatchScoreDialog } from '~/components/matches/match-score-dialog'
import { PaymentDialog } from '~/components/matches/payment-dialog'
import type { Match, Payment, Player } from '~/lib/types'
import { getMatchWeight } from '~/lib/utils'

interface UpcomingMatchesProps {
    matches: Match[]
    player: Player
    players?: Player[]
    payments?: Payment[]
    isLoading: boolean
}

function isMatchWeek(scheduledDate: string): boolean {
    const matchDate = new Date(scheduledDate)
    const dayOfWeek = matchDate.getDay()
    const monday = new Date(matchDate)

    monday.setDate(matchDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    monday.setHours(0, 0, 0, 0)
    const sunday = new Date(monday)

    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)
    const now = new Date()

    return now >= monday && now <= sunday
}

function getScoreChip(scoreStatus: Match['score_status']) {
    if (!scoreStatus) {return null}

    const props = {
        pending: { label: 'Score Pending', color: 'info' as const },
        confirmed: { label: 'Score Confirmed', color: 'success' as const },
        disputed: { label: 'Score Disputed', color: 'warning' as const },
    }[scoreStatus]

    return <Chip {...props} size="small" />
}

function getPaymentChip(payment: Payment | undefined) {
    if (!payment || payment.status === 'unpaid') {return null}

    if (payment.status === 'confirmed') {return <Chip color="success" label="Dues Paid" size="small" />}

    return <Chip color="warning" label="Payment Pending" size="small" />
}

export const UpcomingMatches: React.FC<UpcomingMatchesProps> = ({
    matches,
    player,
    players,
    payments,
    isLoading,
}) => {
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('md'))
    const [scoreDialogMatch, setScoreDialogMatch] = useState<Match | null>(null)
    const [paymentDialogMatch, setPaymentDialogMatch] = useState<Match | null>(null)

    const getPlayerById = (id: number | null) => players?.find((p) => p.player_id === id)

    const getPlayerName = (id: number | null) => {
        const p = getPlayerById(id)

        return p ? `${p.first_name} ${p.last_name}` : `Player #${id}`
    }

    const getMyPayment = (matchId: number) =>
        payments?.find((p) => p.match_id === matchId && p.player_id === player.player_id)

    const renderActions = (match: Match) => {
        if (match.is_bye) {return null}

        const inMatchWeek = isMatchWeek(match.scheduled_date)
        const myPayment = getMyPayment(match.match_id)
        const scoreConfirmed = match.score_status === 'confirmed'
        const paymentDone = myPayment?.status === 'confirmed'
        const canScore = inMatchWeek && !scoreConfirmed && match.score_status !== 'disputed'
        const canPay = scoreConfirmed && !paymentDone

        return (
            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
                {getScoreChip(match.score_status)}
                {getPaymentChip(myPayment)}
                {canScore && (
                    <Button
                        size="small"
                        variant={match.score_status === 'pending' ? 'outlined' : 'contained'}
                        onClick={() => setScoreDialogMatch(match)}
                    >
                        {match.score_status === 'pending' ? 'View Score' : 'Score Match'}
                    </Button>
                )}
                {match.score_status === 'pending' && !canScore && (
                    <Button size="small" variant="outlined" onClick={() => setScoreDialogMatch(match)}>
                        View Score
                    </Button>
                )}
                {canPay && (
                    <Button
                        color="success"
                        size="small"
                        variant="contained"
                        onClick={() => setPaymentDialogMatch(match)}
                    >
                        Pay Dues
                    </Button>
                )}
                {scoreConfirmed && myPayment && myPayment.status !== 'confirmed' && (
                    <Button size="small" variant="outlined" onClick={() => setPaymentDialogMatch(match)}>
                        View Payment
                    </Button>
                )}
            </Stack>
        )
    }

    if (isLoading) {
        return <CircularProgress size={24} />
    }

    if (matches.length === 0) {
        return (
            <Typography color="text.secondary" sx={{ mb: 4 }} variant="body1">
                No upcoming matches.
            </Typography>
        )
    }

    const scoreDialogPlayer1 = scoreDialogMatch ? getPlayerById(scoreDialogMatch.player1_id) : null
    const scoreDialogPlayer2 = scoreDialogMatch ? getPlayerById(scoreDialogMatch.player2_id) : null

    const dialogs = (
        <>
            {scoreDialogMatch && scoreDialogPlayer1 && scoreDialogPlayer2 && (
                <MatchScoreDialog
                    currentPlayerId={player.player_id}
                    match={scoreDialogMatch}
                    open={!!scoreDialogMatch}
                    player1={scoreDialogPlayer1}
                    player2={scoreDialogPlayer2}
                    onClose={() => setScoreDialogMatch(null)}
                />
            )}
            {paymentDialogMatch && (
                <PaymentDialog
                    currentPlayer={player}
                    match={paymentDialogMatch}
                    open={!!paymentDialogMatch}
                    onClose={() => setPaymentDialogMatch(null)}
                />
            )}
        </>
    )

    if (isMobile) {
        return (
            <Box sx={{ mb: 4 }}>
                {dialogs}
                {matches.map((match) => {
                    const isPlayer1 = match.player1_id === player.player_id
                    const opponentId = isPlayer1 ? match.player2_id : match.player1_id
                    const myRating = isPlayer1 ? match.player1_rating : match.player2_rating
                    const oppRating = isPlayer1 ? match.player2_rating : match.player1_rating
                    const date = new Date(match.scheduled_date)
                    const datePart = date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                    })
                    const timePart = date.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                    })
                    const formattedDate = `${datePart} at ${timePart}`
                    const opponentName = getPlayerName(opponentId)
                    const currentMyRating = players?.find((p) => p.player_id === player.player_id)?.rating ?? myRating ?? 0
                    const currentOppRating = players?.find((p) => p.player_id === opponentId)?.rating ?? oppRating ?? 0
                    const [myWeight, oppWeight] = getMatchWeight(currentMyRating, currentOppRating)
                    const weight = `${myWeight}:${oppWeight}`

                    return (
                        <Card key={match.match_id} sx={{ mb: 2 }}>
                            <CardContent>
                                <Typography gutterBottom color="text.secondary" variant="body2">
                                    {formattedDate}
                                </Typography>
                                {match.is_bye ? (
                                    <Typography color="text.secondary" variant="body1">
                                        Bye week
                                    </Typography>
                                ) : (
                                    <>
                                        <Typography sx={{ mb: 1 }} variant="h6">
                                            vs. {opponentName} ({currentOppRating})
                                        </Typography>
                                        <Typography color="primary" sx={{ mb: 1 }} variant="body1">
                                            Weight: {weight}
                                        </Typography>
                                        {renderActions(match)}
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
            </Box>
        )
    }

    return (
        <Box sx={{ mb: 4 }}>
            {dialogs}
            <TableContainer component={Card}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Opponent</TableCell>
                            <TableCell>Weight</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {matches.map((match) => {
                            const isPlayer1 = match.player1_id === player.player_id
                            const opponentId = isPlayer1 ? match.player2_id : match.player1_id
                            const myRating = isPlayer1 ? match.player1_rating : match.player2_rating
                            const oppRating = isPlayer1 ? match.player2_rating : match.player1_rating
                            const date = new Date(match.scheduled_date)
                            const datePart = date.toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                            })
                            const timePart = date.toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                            })
                            const formattedDate = `${datePart} at ${timePart}`
                            const opponentName = getPlayerName(opponentId)
                            const currentMyRating = players?.find((p) => p.player_id === player.player_id)?.rating ?? myRating ?? 0
                            const currentOppRating = players?.find((p) => p.player_id === opponentId)?.rating ?? oppRating ?? 0
                            const [myWeight, oppWeight] = getMatchWeight(currentMyRating, currentOppRating)
                            const weight = `${myWeight}:${oppWeight}`

                            return (
                                <TableRow key={match.match_id}>
                                    <TableCell>{formattedDate}</TableCell>
                                    <TableCell>
                                        {match.is_bye ? 'Bye week' : `vs. ${opponentName} (${currentOppRating})`}
                                    </TableCell>
                                    <TableCell>{match.is_bye ? '—' : weight}</TableCell>
                                    <TableCell>{renderActions(match)}</TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    )
}
