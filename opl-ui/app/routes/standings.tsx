import { EmojiEvents as EmojiEventsIcon } from '@mui/icons-material'
import {
    Alert,
    Box,
    Chip,
    CircularProgress,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material'
import { amber, brown, grey } from '@mui/material/colors'
import { useMemo } from 'react'

import { useAuth } from '~/lib/auth'
import { useDivisions, usePlayers, useMatches, useScores } from '~/lib/react-query'
import type { Match, Player, PlayerScore } from '~/lib/types'

const getRankColor = (rank: number) => {
    switch (rank) {
        case 1:
            return { bgcolor: amber[600], color: '#000' } // Gold
        case 2:
            return { bgcolor: grey[300], color: '#000' } // Silver
        case 3:
            return { bgcolor: brown[500], color: '#fff' } // Bronze
        default:
            return undefined
    }
}

interface PlayerWithStats extends Player {
    stats: { wins: number; losses: number; points: number }
}

const buildSortedStandings = (
    players: Player[],
    matches: Match[],
    scores: PlayerScore[],
): PlayerWithStats[] => {
    const statsMap = new Map<number, { wins: number; losses: number; points: number }>()

    scores.forEach((score) => {
        statsMap.set(score.player_id, {
            wins: 0,
            losses: 0,
            points: score.score,
        })
    })

    matches
        .filter((m) => m.completed)
        .forEach((match) => {
            if (match.winner_id) {
                const winnerStats = statsMap.get(match.winner_id)

                if (winnerStats) winnerStats.wins++
            }

            if (match.loser_id) {
                const loserStats = statsMap.get(match.loser_id)

                if (loserStats) loserStats.losses++
            }
        })

    return players
        .map((player) => ({
            ...player,
            stats: statsMap.get(player.player_id) ?? { wins: 0, losses: 0, points: 0 },
        }))
        .sort((a, b) => {
            if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points

            if (b.rating !== a.rating) return b.rating - a.rating

            return b.games_played - a.games_played
        })
}

const StandingsTable: React.FC<{ players: PlayerWithStats[] }> = ({ players }) => (
    <TableContainer component={Paper}>
        <Table>
            <TableHead>
                <TableRow>
                    <TableCell align="center" sx={{ width: 80 }}>
                        Rank
                    </TableCell>
                    <TableCell>Player</TableCell>
                    <TableCell align="right">Points</TableCell>
                    <TableCell align="right">Record</TableCell>
                    <TableCell align="right">Rating</TableCell>
                    <TableCell align="right">Games</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {players.map((player, index) => {
                    const rank = index + 1
                    const rankColor = getRankColor(rank)

                    return (
                        <TableRow
                            key={player.player_id}
                            sx={{ bgcolor: rank <= 3 ? 'action.hover' : 'inherit' }}
                        >
                            <TableCell align="center">
                                {rank <= 3 ? (
                                    <Chip
                                        icon={rank === 1 ? <EmojiEventsIcon /> : undefined}
                                        label={rank}
                                        size="small"
                                        sx={rankColor}
                                    />
                                ) : (
                                    rank
                                )}
                            </TableCell>
                            <TableCell>
                                <Typography fontWeight={rank <= 3 ? 600 : 400}>
                                    {player.first_name} {player.last_name}
                                </Typography>
                            </TableCell>
                            <TableCell align="right">
                                <Typography fontWeight={600} color="secondary.main">
                                    {player.stats.points}
                                </Typography>
                            </TableCell>
                            <TableCell align="right">
                                <Typography variant="body2">
                                    {player.stats.wins}-{player.stats.losses}
                                </Typography>
                            </TableCell>
                            <TableCell align="right">
                                <Typography fontWeight={600}>{player.rating}</Typography>
                            </TableCell>
                            <TableCell align="right">{player.games_played}</TableCell>
                        </TableRow>
                    )
                })}
            </TableBody>
        </Table>
    </TableContainer>
)

const DivisionStandings: React.FC<{
    divisionId: number
    divisionName: string
    allPlayers: Player[]
}> = ({ divisionId, divisionName, allPlayers }) => {
    const { data: matches, isLoading: matchesLoading } = useMatches({ division_id: divisionId })
    const { data: scores, isLoading: scoresLoading } = useScores(divisionId)

    const sorted = useMemo(() => {
        if (!matches || !scores) return []

        const divPlayers = allPlayers.filter((p) => p.division_id === divisionId)

        return buildSortedStandings(divPlayers, matches, scores)
    }, [allPlayers, matches, scores, divisionId])

    const isLoading = matchesLoading || scoresLoading

    return (
        <Box sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom>
                {divisionName}
            </Typography>
            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            ) : sorted.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">No players in this division</Typography>
                </Paper>
            ) : (
                <StandingsTable players={sorted} />
            )}
        </Box>
    )
}

export const StandingsPage: React.FC = () => {
    const { user } = useAuth()
    const { data: players, isLoading: playersLoading, error } = usePlayers()
    const { data: divisions, isLoading: divisionsLoading } = useDivisions()

    const userPlayer = useMemo(() => {
        if (!user?.player_id || !players) return null

        return players.find((p) => p.player_id === user.player_id)
    }, [user, players])

    const targetDivisionId = user?.is_admin ? null : userPlayer?.division_id

    const { data: matches, isLoading: matchesLoading } = useMatches({
        division_id: targetDivisionId ?? undefined,
    })

    const { data: scores, isLoading: scoresLoading } = useScores(targetDivisionId ?? 0)

    const isLoading = playersLoading || divisionsLoading || matchesLoading || scoresLoading

    const playerStandings = useMemo(() => {
        if (!players || !matches || !scores || user?.is_admin) return []

        const divPlayers = targetDivisionId
            ? players.filter((p) => p.division_id === targetDivisionId)
            : players

        return buildSortedStandings(divPlayers, matches, scores)
    }, [players, matches, scores, targetDivisionId, user?.is_admin])

    if (error) {
        return <Alert severity="error">Failed to load standings: {error.message}</Alert>
    }

    return (
        <Box>
            <Typography variant="h3" gutterBottom>
                Standings
            </Typography>

            {playersLoading || divisionsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            ) : user?.is_admin && divisions && players ? (
                divisions.map((division) => (
                    <DivisionStandings
                        key={division.division_id}
                        divisionId={division.division_id}
                        divisionName={division.name}
                        allPlayers={players}
                    />
                ))
            ) : isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            ) : playerStandings.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">No players found</Typography>
                </Paper>
            ) : (
                <StandingsTable players={playerStandings} />
            )}
        </Box>
    )
}

export default StandingsPage
