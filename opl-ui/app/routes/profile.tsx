import { Box, CircularProgress, Typography } from '@mui/material'
import { useMemo } from 'react'

import {
    CompletedMatches,
    ProfileCard,
    RatingHistoryCard,
    StatsCards,
    UpcomingMatches,
} from '~/components/profile'
import { useAuth } from '~/lib/auth'
import { usePlayer, usePlayerDivisions, usePlayers, useMatches, useGames } from '~/lib/react-query'

export const ProfilePage: React.FC = () => {
    const { user } = useAuth()
    const { data: player, isLoading: playerLoading } = usePlayer(user?.player_id ?? 0)
    const { data: players } = usePlayers()
    const { data: playerDivisions } = usePlayerDivisions(user?.player_id ?? 0, true)
    const division = playerDivisions?.[0]
    const { data: matches, isLoading: matchesLoading } = useMatches({
        player_id: user?.player_id ?? undefined,
    })
    const { data: games } = useGames({ player_id: user?.player_id ?? undefined })

    // Build rating history from games
    const ratingHistory = useMemo(() => {
        if (!games || !player) {
            return []
        }

        const history: { gameNumber: number; rating: number }[] = []

        // Process games in chronological order (oldest first)
        const sortedGames = [...games].sort(
            (a, b) => new Date(a.played_date).getTime() - new Date(b.played_date).getTime(),
        )

        sortedGames.forEach((game, index) => {
            const isWinner = game.winner_id === player.player_id
            const ratingBefore = isWinner ? game.winner_rating : game.loser_rating
            const ratingChange = isWinner ? game.winner_rating_change : game.loser_rating_change
            const ratingAfter = ratingBefore + ratingChange

            history.push({
                gameNumber: index + 1,
                rating: ratingAfter,
            })
        })

        return history
    }, [games, player])

    const upcomingMatches =
        matches
            ?.filter((m) => !m.completed)
            .sort(
                (a, b) =>
                    new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime(),
            ) ?? []

    const completedMatches =
        matches
            ?.filter((m) => m.completed)
            .sort(
                (a, b) =>
                    new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime(),
            ) ?? []

    if (!user?.player_id) {
        return (
            <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h5" color="text.secondary">
                    No player profile linked to your account.
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                    Contact the league administrator to link your account to a player.
                </Typography>
            </Box>
        )
    }

    if (playerLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        )
    }

    if (!player) {
        return (
            <Typography variant="h5" color="text.secondary" sx={{ textAlign: 'center', py: 8 }}>
                Player not found.
            </Typography>
        )
    }

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 3 }}>
                My Profile
            </Typography>

            <ProfileCard player={player} division={division} user={user} />

            <RatingHistoryCard ratingHistory={ratingHistory} />

            <StatsCards
                gamesPlayed={player.games_played}
                matchesWon={completedMatches.filter((m) => m.winner_id === player.player_id).length}
            />

            <Typography variant="h5" sx={{ mb: 2 }}>
                Upcoming Matches
            </Typography>
            <UpcomingMatches
                matches={upcomingMatches}
                player={player}
                players={players}
                isLoading={matchesLoading}
            />

            <Typography variant="h5" sx={{ mb: 2 }}>
                Completed Matches
            </Typography>
            <CompletedMatches
                matches={completedMatches}
                player={player}
                players={players}
                isLoading={matchesLoading}
            />
        </Box>
    )
}

export default ProfilePage
