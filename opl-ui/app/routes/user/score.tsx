import { Box, Button, CircularProgress, Typography } from '@mui/material'
import { useNavigate, useParams } from 'react-router'

import { ScoringPage } from '~/components/scoring/scoring-page'
import { useAuth } from '~/lib/auth'
import { useMatch, usePlayers } from '~/lib/react-query'
import { getMatchWeight } from '~/lib/utils'

export const ScoreRoute: React.FC = () => {
    const { matchId } = useParams<{ matchId: string }>()
    const navigate = useNavigate()
    const { user } = useAuth()

    const matchIdNum = Number(matchId)
    const { data: match, isLoading: matchLoading } = useMatch(matchIdNum)
    const { data: players, isLoading: playersLoading } = usePlayers()

    const isLoading = matchLoading || playersLoading

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        )
    }

    if (!match) {
        return (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 8 }}>
                Match not found.
            </Typography>
        )
    }

    const currentPlayerId = user?.player_id ?? 0
    if (currentPlayerId !== match.player1_id && currentPlayerId !== match.player2_id) {
        return (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 8 }}>
                You are not a participant in this match.
            </Typography>
        )
    }

    const me = players?.find((p) => p.player_id === currentPlayerId)
    const opponentId = match.player1_id === currentPlayerId ? match.player2_id : match.player1_id
    const opponent = players?.find((p) => p.player_id === opponentId)

    if (!me || !opponent) {
        return (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 8 }}>
                Could not load player data.
            </Typography>
        )
    }

    const [myWeight, oppWeight] = getMatchWeight(me.rating, opponent.rating)

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
                <Button variant="text" onClick={() => navigate('/profile')}>
                    ← Profile
                </Button>
                <Box>
                    <Typography variant="h6">
                        vs. {opponent.first_name} {opponent.last_name}
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                        Weight: {myWeight}:{oppWeight}
                    </Typography>
                </Box>
            </Box>

            <ScoringPage match={match} me={me} opponent={opponent} />
        </Box>
    )
}

export default ScoreRoute
