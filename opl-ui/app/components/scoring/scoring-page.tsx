import {
    Add as AddIcon,
    CheckCircle as CheckIcon,
    Edit as EditIcon,
    HourglassEmpty as WaitingIcon,
    Warning as WarningIcon,
} from '@mui/icons-material'
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Divider,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'

import { DRAWER_WIDTH } from '~/components/layout/sidebar'
import { useMatchScoreSubmission, useSubmitMatchScore } from '~/lib/react-query'
import { useSnackbar } from '~/lib/snackbar'
import type { GameInput, Match, Player } from '~/lib/types'
import { getMatchWeight } from '~/lib/utils'

import { GameStepper, type GameScore } from './game-stepper'

interface ScoringPageProps {
    match: Match
    me: Player
    opponent: Player
}

function draftKey(matchId: number) {
    return `scoring-draft-${matchId}`
}

function loadDraft(matchId: number): GameScore[] {
    try {
        const raw = localStorage.getItem(draftKey(matchId))
        return raw ? JSON.parse(raw) : []
    } catch {
        return []
    }
}

function saveDraft(matchId: number, games: GameScore[]) {
    localStorage.setItem(draftKey(matchId), JSON.stringify(games))
}

function clearDraft(matchId: number) {
    localStorage.removeItem(draftKey(matchId))
}

function gameInputsToScores(
    games: GameInput[],
    p1Id: number,
    p1Weight: number,
    p2Weight: number,
): GameScore[] {
    return games.map((g) => {
        if (g.winner_id === p1Id) {
            return { player1Score: p1Weight, player2Score: p2Weight - g.balls_remaining }
        }
        return { player1Score: p1Weight - g.balls_remaining, player2Score: p2Weight }
    })
}

function scoresToGameInputs(
    games: GameScore[],
    p1Id: number,
    p2Id: number,
    p1Weight: number,
    p2Weight: number,
): GameInput[] {
    return games.map((g) => {
        if (g.player1Score === p1Weight) {
            return { winner_id: p1Id, loser_id: p2Id, balls_remaining: p2Weight - g.player2Score }
        }
        return { winner_id: p2Id, loser_id: p1Id, balls_remaining: p1Weight - g.player1Score }
    })
}

function isValidGame(g: GameScore, p1Weight: number, p2Weight: number): boolean {
    return (
        (g.player1Score === p1Weight && g.player2Score < p2Weight) ||
        (g.player2Score === p2Weight && g.player1Score < p1Weight)
    )
}

export const ScoringPage: React.FC<ScoringPageProps> = ({ match, me, opponent }) => {
    const navigate = useNavigate()
    const { showSnackbar } = useSnackbar()
    const submitScore = useSubmitMatchScore()

    const { data: submission, isLoading } = useMatchScoreSubmission(match.match_id)

    // Always use current ratings so weights match what the profile page shows
    const [myP1Weight, myP2Weight] = getMatchWeight(me.rating, opponent.rating)
    const myWeight = myP1Weight
    const oppWeight = myP2Weight
    const iAmP1 = me.player_id === match.player1_id

    const [games, setGames] = useState<GameScore[]>(() => loadDraft(match.match_id))
    const [editing, setEditing] = useState(false)

    // Persist draft on every change
    useEffect(() => {
        saveDraft(match.match_id, games)
    }, [games, match.match_id])

    const myName = `${me.first_name} ${me.last_name}`
    const oppName = `${opponent.first_name} ${opponent.last_name}`

    // Current tally
    const myWins = games.filter((g) => isValidGame(g, myP1Weight, myP2Weight) && g.player1Score === myP1Weight).length
    const oppWins = games.filter((g) => isValidGame(g, myP1Weight, myP2Weight) && g.player2Score === myP2Weight).length
    const allValid = games.length > 0 && games.every((g) => isValidGame(g, myP1Weight, myP2Weight))
    const matchComplete =
        allValid &&
        ((myWins === match.race && oppWins < match.race) ||
            (oppWins === match.race && myWins < match.race))

    const handleAddGame = () => {
        setGames((prev) => [...prev, { player1Score: 0, player2Score: 0 }])
    }

    const handleChangeGame = (index: number, game: GameScore) => {
        setGames((prev) => prev.map((g, i) => (i === index ? game : g)))
    }

    const handleDeleteGame = (index: number) => {
        setGames((prev) => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = async () => {
        const gameInputs = scoresToGameInputs(
            games,
            me.player_id,
            opponent.player_id,
            myP1Weight,
            myP2Weight,
        )
        try {
            await submitScore.mutateAsync({ matchId: match.match_id, games: gameInputs })
            clearDraft(match.match_id)
            setEditing(false)
            showSnackbar('Score submitted', 'success')
        } catch (err) {
            showSnackbar(err instanceof Error ? err.message : 'Failed to submit score', 'error')
        }
    }

    const handleEditResubmit = () => {
        if (submission?.my_submission) {
            const parsed: GameInput[] = JSON.parse(submission.my_submission.games_json)
            const asScores = gameInputsToScores(
                parsed,
                me.player_id,
                myP1Weight,
                myP2Weight,
            )
            setGames(asScores)
        }
        setEditing(true)
    }

    const renderGameList = (gamesJson: string, label: string) => {
        const parsed: GameInput[] = JSON.parse(gamesJson)

        return (
            <Box>
                {label && (
                    <Typography color="text.secondary" sx={{ mb: 1 }} variant="caption">
                        {label}
                    </Typography>
                )}
                {parsed.map((g, i) => {
                    const iWon = g.winner_id === me.player_id
                    const myScore = iWon ? myP1Weight : myP1Weight - g.balls_remaining
                    const oppScore = iWon ? myP2Weight - g.balls_remaining : myP2Weight

                    return (
                        <Typography key={i} variant="body2" sx={{ mb: 0.5 }}>
                            Game {i + 1}: {myName} {iWon ? 'wins' : 'loses'}{' '}
                            <Box
                                component="strong"
                                sx={{ color: iWon ? 'success.main' : 'error.main' }}
                            >
                                {myScore}:{oppScore}
                            </Box>
                        </Typography>
                    )
                })}
            </Box>
        )
    }

    const renderComparisonTable = () => {
        if (!submission?.my_submission || !submission.opponent_submission) return null

        const mine: GameInput[] = JSON.parse(submission.my_submission.games_json)
        const theirs: GameInput[] = JSON.parse(submission.opponent_submission.games_json)
        const maxLen = Math.max(mine.length, theirs.length)

        return (
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>Game</TableCell>
                        <TableCell>Your submission</TableCell>
                        <TableCell>Their submission</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {Array.from({ length: maxLen }, (_, i) => {
                        const m = mine[i]
                        const t = theirs[i]
                        const differ =
                            !m ||
                            !t ||
                            m.winner_id !== t.winner_id ||
                            m.balls_remaining !== t.balls_remaining

                        const fmt = (g: GameInput | undefined) => {
                            if (!g) return '—'
                            const winnerName = g.winner_id === me.player_id ? myName : oppName
                            const loserName = g.winner_id === me.player_id ? oppName : myName
                            const loserWeight = g.winner_id === me.player_id ? oppWeight : myWeight
                            const loserScore = loserWeight - g.balls_remaining
                            const winnerWeight = g.winner_id === me.player_id ? myWeight : oppWeight
                            return `${winnerName} ${winnerWeight} – ${loserName} ${loserScore}`
                        }

                        return (
                            <TableRow
                                key={i}
                                sx={differ ? { backgroundColor: 'warning.main', opacity: 0.15 } : {}}
                            >
                                <TableCell>{i + 1}</TableCell>
                                <TableCell sx={differ ? { fontWeight: 700 } : {}}>{fmt(m)}</TableCell>
                                <TableCell sx={differ ? { fontWeight: 700 } : {}}>{fmt(t)}</TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        )
    }

    const renderInputView = () => (
        <Box>
            {submission?.opponent_submitted && !submission.my_submission && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    {oppName} has already submitted their score. Enter yours independently.
                </Alert>
            )}

            <Stack spacing={2}>
                {games.map((game, index) => (
                    <GameStepper
                        key={index}
                        game={game}
                        index={index}
                        p1Weight={myP1Weight}
                        p2Weight={myP2Weight}
                        player1Name={myName}
                        player2Name={oppName}
                        onChange={(g) => handleChangeGame(index, g)}
                        onDelete={() => handleDeleteGame(index)}
                    />
                ))}
            </Stack>

            {games.length === 0 && (
                <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
                    Tap "Add Game" to start recording.
                </Typography>
            )}

            {games.length > 0 && (
                <Box sx={{ mt: 1.5, px: 0.5 }}>
                    <Typography color="text.secondary" variant="body2">
                        {myName} <strong>{myWins}</strong> – <strong>{oppWins}</strong> {oppName}
                        &nbsp;(Race to {match.race})
                    </Typography>
                </Box>
            )}
        </Box>
    )

    const renderBody = () => {
        if (isLoading) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                </Box>
            )
        }

        const status = submission?.my_submission?.status

        // Confirmed
        if (match.score_status === 'confirmed') {
            return (
                <Alert icon={<CheckIcon />} severity="success">
                    Scores matched — confirmed. You can now pay your dues.
                </Alert>
            )
        }

        // Disputed (admin escalated)
        if (match.score_status === 'disputed') {
            return (
                <Box>
                    <Alert icon={<WarningIcon />} severity="warning" sx={{ mb: 2 }}>
                        Scores couldn't be resolved and an admin has been notified.
                    </Alert>
                    {submission?.my_submission && submission.opponent_submission && (
                        renderComparisonTable()
                    )}
                </Box>
            )
        }

        // Needs review — show comparison and allow resubmit
        if (status === 'needs_review' && !editing) {
            const since = submission?.my_submission?.needs_review_since
            const deadline = since
                ? new Date(new Date(since).getTime() + 24 * 60 * 60 * 1000)
                : null
            const hoursLeft = deadline
                ? Math.max(0, Math.ceil((deadline.getTime() - Date.now()) / (60 * 60 * 1000)))
                : null

            return (
                <Box>
                    <Alert icon={<WarningIcon />} severity="warning" sx={{ mb: 2 }}>
                        Your scores don't match {oppName}'s.
                        {hoursLeft !== null && hoursLeft > 0
                            ? ` Admin is notified in ${hoursLeft}h if not resolved.`
                            : ' Admin has been notified.'}
                    </Alert>
                    {renderComparisonTable()}
                    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                        <Button
                            color="secondary"
                            startIcon={<EditIcon />}
                            variant="outlined"
                            onClick={handleEditResubmit}
                        >
                            Edit &amp; Resubmit
                        </Button>
                        <Button sx={{ flex: { xs: 1, md: 'unset' } }} variant="contained" onClick={() => navigate('/profile')}>
                            Profile
                        </Button>
                    </Stack>
                </Box>
            )
        }

        // I submitted, waiting for opponent
        if (status === 'pending' && !editing) {
            return (
                <Box>
                    <Alert icon={<WaitingIcon />} severity="info" sx={{ mb: 2 }}>
                        Score submitted — waiting for {oppName} to submit theirs.
                    </Alert>
                    {submission?.my_submission && renderGameList(submission.my_submission.games_json, 'Your submitted score')}
                    <Divider sx={{ my: 2 }} />
                    <Stack direction="row" spacing={1}>
                        <Button
                            color="secondary"
                            startIcon={<EditIcon />}
                            variant="outlined"
                            onClick={handleEditResubmit}
                        >
                            Edit &amp; Resubmit
                        </Button>
                        <Button sx={{ flex: { xs: 1, md: 'unset' } }} variant="contained" onClick={() => navigate('/profile')}>
                            Profile
                        </Button>
                    </Stack>
                </Box>
            )
        }

        // Input / editing mode
        return renderInputView()
    }

    const showSubmitBar =
        !isLoading &&
        match.score_status !== 'confirmed' &&
        match.score_status !== 'disputed' &&
        (submission?.my_submission?.status !== 'needs_review' || editing) &&
        (submission?.my_submission?.status !== 'pending' || editing)

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
            {/* Body */}
            <Box sx={{ flex: 1, pb: showSubmitBar ? 12 : 0 }}>
                {renderBody()}
            </Box>

            {/* Sticky footer */}
            {showSubmitBar && (
                <Box
                    sx={{
                        position: 'fixed',
                        bottom: { xs: 0, md: 16 },
                        left: { xs: 0, md: DRAWER_WIDTH + 16 },
                        right: { xs: 0, md: 16 },
                        bgcolor: 'background.paper',
                        borderTop: { xs: 1, md: 0 },
                        borderColor: 'divider',
                        borderRadius: { xs: 0, md: 2 },
                        boxShadow: { xs: 0, md: 4 },
                        p: 2,
                        display: 'flex',
                        gap: 1,
                    }}
                >
                    <Button
                        fullWidth
                        color="secondary"
                        startIcon={<AddIcon />}
                        variant="outlined"
                        onClick={handleAddGame}
                    >
                        Add Game
                    </Button>
                    <Button
                        fullWidth
                        disabled={!matchComplete || submitScore.isPending}
                        variant="contained"
                        onClick={handleSubmit}
                    >
                        {submitScore.isPending ? 'Submitting…' : 'Submit Score'}
                    </Button>
                </Box>
            )}
        </Box>
    )
}
