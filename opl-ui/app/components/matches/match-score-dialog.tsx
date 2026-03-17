import { CheckCircle as CheckIcon, Warning as WarningIcon } from '@mui/icons-material'
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Typography,
} from '@mui/material'
import { useState } from 'react'

import {
    useMatchScoreSubmission,
    useSubmitMatchScore,
    useConfirmMatchScore,
    useDisputeMatchScore,
} from '~/lib/react-query'
import { useSnackbar } from '~/lib/snackbar'
import type { GameInput, Match, Player } from '~/lib/types'
import { getMatchWeight } from '~/lib/utils'

import { GameRecorder } from './game-recorder'

interface MatchScoreDialogProps {
    open: boolean
    onClose: () => void
    match: Match
    player1: Player
    player2: Player
    currentPlayerId: number
}

export const MatchScoreDialog: React.FC<MatchScoreDialogProps> = ({
    open,
    onClose,
    match,
    player1,
    player2,
    currentPlayerId,
}) => {
    const { showSnackbar } = useSnackbar()
    const [submitting, setSubmitting] = useState(false)

    const { data: submission, isLoading } = useMatchScoreSubmission(open ? match.match_id : 0)
    const submitScore = useSubmitMatchScore()
    const confirmScore = useConfirmMatchScore()
    const disputeScore = useDisputeMatchScore()

    const iSubmitted = submission?.submitted_by_player_id === currentPlayerId
    const opponentSubmitted = submission && !iSubmitted

    const getPlayerName = (id: number) => {
        if (id === player1.player_id) {return `${player1.first_name} ${player1.last_name}`}

        if (id === player2.player_id) {return `${player2.first_name} ${player2.last_name}`}

        return `Player #${id}`
    }

    const handleSubmit = async (games: GameInput[]) => {
        setSubmitting(true)
        try {
            await submitScore.mutateAsync({ matchId: match.match_id, games })
            showSnackbar('Score submitted — waiting for opponent to confirm', 'success')
        } catch (err) {
            showSnackbar(err instanceof Error ? err.message : 'Failed to submit score', 'error')
        } finally {
            setSubmitting(false)
        }
    }

    const handleConfirm = async () => {
        try {
            await confirmScore.mutateAsync(match.match_id)
            showSnackbar('Score confirmed! You can now pay your dues.', 'success')
            onClose()
        } catch (err) {
            showSnackbar(err instanceof Error ? err.message : 'Failed to confirm score', 'error')
        }
    }

    const handleDispute = async () => {
        try {
            await disputeScore.mutateAsync(match.match_id)
            showSnackbar('Score disputed. An admin will be notified to resolve it.', 'error')
            onClose()
        } catch (err) {
            showSnackbar(err instanceof Error ? err.message : 'Failed to dispute score', 'error')
        }
    }

    const [p1Weight, p2Weight] = getMatchWeight(match.player1_rating, match.player2_rating ?? 0)

    const renderSubmittedGames = () => {
        if (!submission) {return null}

        const games: GameInput[] = JSON.parse(submission.games_json)

        return (
            <Box>
                <Typography fontWeight={600} sx={{ mb: 1 }} variant="subtitle2">
                    Submitted Score
                </Typography>
                {games.map((g, i) => (
                    <Typography key={i} variant="body2">
                        Game {i + 1}: <strong>{getPlayerName(g.winner_id)}</strong> wins
                        ({g.balls_remaining} ball{g.balls_remaining !== 1 ? 's' : ''} remaining)
                    </Typography>
                ))}
            </Box>
        )
    }

    const renderContent = () => {
        if (isLoading) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            )
        }

        if (match.score_status === 'confirmed') {
            return (
                <Alert icon={<CheckIcon />} severity="success">
                    Score confirmed by both players. Pay your dues to make it official.
                </Alert>
            )
        }

        if (match.score_status === 'disputed') {
            return (
                <Alert icon={<WarningIcon />} severity="warning">
                    Score is disputed. An admin has been notified and will resolve it.
                </Alert>
            )
        }

        if (submission?.status === 'pending' && iSubmitted) {
            return (
                <Box>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        Score submitted — waiting for {getPlayerName(
                            currentPlayerId === player1.player_id ? player2.player_id : player1.player_id
                        )} to confirm.
                    </Alert>
                    {renderSubmittedGames()}
                    <Divider sx={{ my: 2 }} />
                    <Typography color="text.secondary" variant="body2">
                        If you made a mistake, you can resubmit the score.
                    </Typography>
                    <GameRecorder
                        matchId={match.match_id}
                        player1={player1}
                        player2={player2}
                        weights={[p1Weight, p2Weight]}
                        onSubmit={handleSubmit}
                    />
                </Box>
            )
        }

        if (submission?.status === 'pending' && opponentSubmitted) {
            return (
                <Box>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        Your opponent submitted the score below. Please confirm or dispute.
                    </Alert>
                    {renderSubmittedGames()}
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            color="success"
                            disabled={confirmScore.isPending || disputeScore.isPending}
                            variant="contained"
                            onClick={handleConfirm}
                        >
                            {confirmScore.isPending ? 'Confirming...' : 'Confirm Score'}
                        </Button>
                        <Button
                            color="warning"
                            disabled={confirmScore.isPending || disputeScore.isPending}
                            variant="outlined"
                            onClick={handleDispute}
                        >
                            {disputeScore.isPending ? 'Disputing...' : 'Dispute Score'}
                        </Button>
                    </Box>
                </Box>
            )
        }

        // No submission yet — show recorder
        return (
            <Box>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 2,
                    }}
                >
                    <Typography variant="body2">
                        <strong>{player1.first_name} {player1.last_name}</strong> ({p1Weight})
                    </Typography>
                    <Typography color="text.secondary" variant="body2">vs.</Typography>
                    <Typography variant="body2">
                        ({p2Weight}) <strong>{player2.first_name} {player2.last_name}</strong>
                    </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <GameRecorder
                    matchId={match.match_id}
                    player1={player1}
                    player2={player2}
                    weights={[p1Weight, p2Weight]}
                    onSubmit={handleSubmit}
                />
                {submitting && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <CircularProgress size={24} />
                    </Box>
                )}
            </Box>
        )
    }

    const statusChip = match.score_status && (
        <Chip
            color={
                match.score_status === 'confirmed'
                    ? 'success'
                    : match.score_status === 'disputed'
                      ? 'warning'
                      : 'info'
            }
            label={
                match.score_status === 'confirmed'
                    ? 'Confirmed'
                    : match.score_status === 'disputed'
                      ? 'Disputed'
                      : 'Pending Confirmation'
            }
            size="small"
            sx={{ ml: 1 }}
        />
    )

    return (
        <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose}>
            <DialogTitle>
                Score Match {statusChip}
            </DialogTitle>
            <DialogContent>{renderContent()}</DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    )
}
