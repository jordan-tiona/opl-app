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
                <Typography color="text.secondary" variant="h5">
                    No player profile linked to your account.
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }} variant="body1">
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
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 8 }} variant="h5">
                Player not found.
            </Typography>
        )
    }

    return (
        <Box>
            <Typography sx={{ mb: 3 }} variant="h4">
                My Profile
            </Typography>

            <ProfileCard division={division} player={player} user={user} />

            <RatingHistoryCard ratingHistory={ratingHistory} />

            <StatsCards
                gamesPlayed={player.games_played}
                matchesWon={completedMatches.filter((m) => m.winner_id === player.player_id).length}
            />

            <Typography sx={{ mb: 2 }} variant="h5">
                Upcoming Matches
            </Typography>
            <UpcomingMatches
                isLoading={matchesLoading}
                matches={upcomingMatches}
                player={player}
                players={players}
            />

            <Typography sx={{ mb: 2 }} variant="h5">
                Completed Matches
            </Typography>
            <CompletedMatches
                isLoading={matchesLoading}
                matches={completedMatches}
                player={player}
                players={players}
            />
        </Box>
    )
}

export default ProfilePage
