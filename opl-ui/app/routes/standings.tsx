import { EmojiEvents as EmojiEventsIcon } from '@mui/icons-material'
import {
    Alert,
    Box,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Paper,
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
import { amber, brown, grey } from '@mui/material/colors'
import { useMemo, useRef } from 'react'

import { useAuth } from '~/lib/auth'
import { useDivisionPlayers, useDivisions, useMatches, usePlayerDivisions, usePlayers, useScores } from '~/lib/react-query'
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

const RankChip: React.FC<{ rank: number }> = ({ rank }) => {
    const rankColor = getRankColor(rank)

    if (rank <= 3) {
        return (
            <Chip
                icon={rank === 1 ? <EmojiEventsIcon /> : undefined}
                label={rank}
                size="small"
                sx={rankColor}
            />
        )
    }

    return <Typography color="text.secondary">#{rank}</Typography>
}

const StandingsCards: React.FC<{ players: PlayerWithStats[] }> = ({ players }) => (
    <Stack spacing={1.5}>
        {players.map((player, index) => {
            const rank = index + 1

            return (
                <Card
                    key={player.player_id}
                    variant="outlined"
                    sx={{ bgcolor: rank <= 3 ? 'action.hover' : 'inherit' }}
                >
                    <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <RankChip rank={rank} />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography fontWeight={rank <= 3 ? 600 : 400} noWrap>
                                    {player.first_name} {player.last_name}
                                </Typography>
                            </Box>
                            <Typography fontWeight={600} color="secondary.main">
                                {player.stats.points} pts
                            </Typography>
                        </Box>
                        <Box
                            sx={{
                                display: 'flex',
                                gap: 2,
                                mt: 0.5,
                                ml: 5.5,
                            }}
                        >
                            <Typography variant="body2" color="text.secondary">
                                {player.stats.wins}-{player.stats.losses}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Rating: {player.rating}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Games: {player.games_played}
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            )
        })}
    </Stack>
)

const StandingsTable: React.FC<{ players: PlayerWithStats[]; isMobile: boolean }> = ({
    players,
    isMobile,
}) => {
    if (isMobile) return <StandingsCards players={players} />

    return (
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

                        return (
                            <TableRow
                                key={player.player_id}
                                sx={{ bgcolor: rank <= 3 ? 'action.hover' : 'inherit' }}
                            >
                                <TableCell align="center">
                                    <RankChip rank={rank} />
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
}

const DivisionStandings: React.FC<{
    divisionId: number
    divisionName: string
    isMobile: boolean
    sectionRef: (el: HTMLDivElement | null) => void
}> = ({ divisionId, divisionName, isMobile, sectionRef }) => {
    const { data: divisionPlayers } = useDivisionPlayers(divisionId)
    const { data: matches, isLoading: matchesLoading } = useMatches({ division_id: divisionId })
    const { data: scores, isLoading: scoresLoading } = useScores(divisionId)

    const sorted = useMemo(() => {
        if (!divisionPlayers || !matches || !scores) return []

        return buildSortedStandings(divisionPlayers, matches, scores)
    }, [divisionPlayers, matches, scores])

    const isLoading = matchesLoading || scoresLoading

    return (
        <Box ref={sectionRef} sx={{ mb: 4 }}>
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
                <StandingsTable players={sorted} isMobile={isMobile} />
            )}
        </Box>
    )
}

export const StandingsPage: React.FC = () => {
    const { user } = useAuth()
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('md'))
    const { data: players, isLoading: playersLoading, error } = usePlayers()
    const { data: divisions, isLoading: divisionsLoading } = useDivisions()
    const { data: playerActiveDivisions } = usePlayerDivisions(user?.player_id ?? 0, true)
    const sectionRefs = useRef<Map<number, HTMLDivElement>>(new Map())

    const targetDivisionId = user?.is_admin ? null : (playerActiveDivisions?.[0]?.division_id ?? null)

    const { data: targetDivisionPlayers } = useDivisionPlayers(targetDivisionId ?? 0)

    const { data: matches, isLoading: matchesLoading } = useMatches({
        division_id: targetDivisionId ?? undefined,
    })

    const { data: scores, isLoading: scoresLoading } = useScores(targetDivisionId ?? 0)

    const isLoading = playersLoading || divisionsLoading || matchesLoading || scoresLoading

    const playerStandings = useMemo(() => {
        if (!players || !matches || !scores || user?.is_admin) return []

        const divPlayers = targetDivisionPlayers ?? []

        return buildSortedStandings(divPlayers, matches, scores)
    }, [players, matches, scores, targetDivisionPlayers, user?.is_admin])

    const scrollToDivision = (divisionId: number) => {
        sectionRefs.current.get(divisionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    if (error) {
        return <Alert severity="error">Failed to load standings: {error.message}</Alert>
    }

    const activeDivisions = divisions?.filter((d) => d.active) ?? []
    const showDivisionNav = user?.is_admin && activeDivisions.length > 1

    return (
        <Box>
            <Typography variant="h3" gutterBottom>
                Standings
            </Typography>

            {showDivisionNav && (
                <Box
                    sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 1,
                        mb: 3,
                        position: 'sticky',
                        top: 0,
                        zIndex: 10,
                        bgcolor: 'background.default',
                        py: 1,
                    }}
                >
                    {activeDivisions.map((division) => (
                        <Chip
                            key={division.division_id}
                            label={division.name}
                            onClick={() => scrollToDivision(division.division_id)}
                            clickable
                            color="primary"
                            variant="outlined"
                        />
                    ))}
                </Box>
            )}

            {playersLoading || divisionsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            ) : user?.is_admin && divisions && players ? (
                activeDivisions.map((division) => (
                    <DivisionStandings
                        key={division.division_id}
                        divisionId={division.division_id}
                        divisionName={division.name}
                        isMobile={isMobile}
                        sectionRef={(el) => {
                            if (el) sectionRefs.current.set(division.division_id, el)
                            else sectionRefs.current.delete(division.division_id)
                        }}
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
                <StandingsTable players={playerStandings} isMobile={isMobile} />
            )}
        </Box>
    )
}

export default StandingsPage
