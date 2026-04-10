import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import EditIcon from '@mui/icons-material/Edit'
import ErrorIcon from '@mui/icons-material/Error'
import PaidIcon from '@mui/icons-material/Paid'
import PaymentsIcon from '@mui/icons-material/Payments'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import ScheduleIcon from '@mui/icons-material/Schedule'
import VisibilityIcon from '@mui/icons-material/Visibility'
import {
    Box,
    Card,
    CardContent,
    CircularProgress,
    IconButton,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material'

import { useState } from 'react'

import { MatchScoreDialog } from '~/components/matches/match-score-dialog'
import { PaymentDialog } from '~/components/matches/payment-dialog'
import type { Match, Payment, Player, Session } from '~/lib/types'
import { getMatchWeight } from '~/lib/utils'

interface UpcomingMatchesProps {
    matches: Match[]
    player: Player
    players?: Player[]
    payments?: Payment[]
    sessions?: Session[]
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

function getScoreIcon(scoreStatus: Match['score_status']) {
    if (!scoreStatus) {return null}

    if (scoreStatus === 'pending') {return <Tooltip title="Score Pending"><ScheduleIcon color="info" fontSize="small" /></Tooltip>}
    if (scoreStatus === 'confirmed') {return <Tooltip title="Score Confirmed"><CheckCircleIcon color="success" fontSize="small" /></Tooltip>}
    if (scoreStatus === 'disputed') {return <Tooltip title="Score Disputed"><ErrorIcon color="warning" fontSize="small" /></Tooltip>}
}

function getPaymentIcon(payment: Payment | undefined) {
    if (!payment || payment.status === 'unpaid') {return null}

    if (payment.status === 'confirmed') {return <Tooltip title="Dues Paid"><PaidIcon color="success" fontSize="small" /></Tooltip>}

    return <Tooltip title="Payment Pending"><ScheduleIcon color="warning" fontSize="small" /></Tooltip>
}

export const UpcomingMatches: React.FC<UpcomingMatchesProps> = ({
    matches,
    player,
    players,
    payments,
    sessions,
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
        const sessionDues = sessions?.find((s) => s.session_id === match.session_id)?.dues ?? 10
        const canPay = scoreConfirmed && !paymentDone && sessionDues > 0

        return (
            <Stack alignItems="center" direction="row" gap={0.5}>
                {getScoreIcon(match.score_status)}
                {getPaymentIcon(myPayment)}
                {canScore && (
                    <Tooltip title={match.score_status === 'pending' ? 'View Score' : 'Score Match'}>
                        <IconButton size="small" onClick={() => setScoreDialogMatch(match)}>
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}
                {match.score_status === 'pending' && !canScore && (
                    <Tooltip title="View Score">
                        <IconButton size="small" onClick={() => setScoreDialogMatch(match)}>
                            <VisibilityIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}
                {canPay && (
                    <Tooltip title="Pay Dues">
                        <IconButton color="success" size="small" onClick={() => setPaymentDialogMatch(match)}>
                            <PaymentsIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}
                {scoreConfirmed && myPayment && myPayment.status !== 'confirmed' && sessionDues > 0 && (
                    <Tooltip title="View Payment">
                        <IconButton size="small" onClick={() => setPaymentDialogMatch(match)}>
                            <ReceiptLongIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
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
                    const formattedDate = match.is_weekly
                        ? `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                        : `${date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
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
                            <TableCell />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {matches.map((match) => {
                            const isPlayer1 = match.player1_id === player.player_id
                            const opponentId = isPlayer1 ? match.player2_id : match.player1_id
                            const myRating = isPlayer1 ? match.player1_rating : match.player2_rating
                            const oppRating = isPlayer1 ? match.player2_rating : match.player1_rating
                            const date = new Date(match.scheduled_date)
                            const formattedDate = match.is_weekly
                                ? `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                                : `${date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
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
