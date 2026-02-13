import {
    EmojiEvents as EmojiEventsIcon,
    People as PeopleIcon,
    Sports as SportsIcon,
    TrendingUp as TrendingUpIcon,
} from '@mui/icons-material'
import {
    Box,
    Card,
    CardContent,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableRow,
    Typography,
} from '@mui/material'
import { useMemo } from 'react'

import { useDivisionPlayers, useDivisions, usePlayers, useScores, useSessions } from '~/lib/react-query'
import type { Session } from '~/lib/types'

interface SessionLeadersProps {
    session: Session
    divisionId: number
    divisionName: string
}

const SessionLeaders: React.FC<SessionLeadersProps> = ({
    session,
    divisionId,
    divisionName,
}: SessionLeadersProps) => {
    const { data: scores } = useScores(session.session_id, divisionId)
    const { data: divPlayers } = useDivisionPlayers(divisionId)

    const divisionPlayers = useMemo(
        () => new Map((divPlayers ?? []).map((p) => [p.player_id, p])),
        [divPlayers],
    )

    const leaders = useMemo(() => {
        if (!scores) {
            return []
        }

        return [...scores]
            .sort((a, b) => b.score - a.score)
            .slice(0, 4)
            .map((s) => ({ player: divisionPlayers.get(s.player_id)!, score: s.score }))
            .filter((entry) => entry.player != null)
    }, [scores, divisionPlayers])

    if (leaders.length === 0) {
        return null
    }

    return (
        <Card>
            <CardContent>
                <Typography gutterBottom variant="h6">
                    {divisionName} - {session.name}
                </Typography>
                <Table size="small">
                    <TableBody>
                        {leaders.map(({ player, score }, index) => (
                            <TableRow
                                key={player.player_id}
                                sx={{ '&:last-child td': { border: 0 } }}
                            >
                                <TableCell sx={{ pl: 0, width: 24, color: 'text.secondary' }}>
                                    {index + 1}
                                </TableCell>
                                <TableCell sx={{ pl: 0 }}>
                                    {player.first_name} {player.last_name}
                                </TableCell>
                                <TableCell align="right" sx={{ pr: 0 }}>
                                    {score}pts
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

interface StatCardProps {
    title: string
    value: string | number
    icon: React.ReactNode
    color: string
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }: StatCardProps) => {
    return (
        <Card>
            <CardContent>
                <Box
                    sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                    <Box>
                        <Typography gutterBottom color="text.secondary" variant="body2">
                            {title}
                        </Typography>
                        <Typography fontWeight={600} variant="h4">
                            {value}
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            bgcolor: color,
                            borderRadius: 2,
                            p: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {icon}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    )
}

export const Dashboard: React.FC = () => {
    const { data: players, isLoading } = usePlayers()
    const { data: divisions } = useDivisions()
    const { data: sessions } = useSessions({ active: true })

    const divisionMap = useMemo(
        () => new Map(divisions?.map((d) => [d.division_id, d.name]) ?? []),
        [divisions],
    )

    const totalPlayers = players?.length ?? 0
    const totalGames = Math.floor((players?.reduce((sum, p) => sum + p.games_played, 0) ?? 0) / 2)
    const topRating = players?.length ? Math.max(...players.map((p) => p.rating)) : 0
    const avgRating = players?.length
        ? Math.round(players.reduce((sum, p) => sum + p.rating, 0) / players.length)
        : 0

    return (
        <Box>
            <Typography gutterBottom variant="h3">
                Dashboard
            </Typography>
            <Typography paragraph color="text.secondary">
                Welcome to the One Pocket League management system.
            </Typography>

            <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard
                        color="#1976d2"
                        icon={<PeopleIcon sx={{ color: 'white' }} />}
                        title="Total Players"
                        value={isLoading ? '...' : totalPlayers}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard
                        color="#9c27b0"
                        icon={<SportsIcon sx={{ color: 'white' }} />}
                        title="Games Played"
                        value={isLoading ? '...' : totalGames}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard
                        color="#ed6c02"
                        icon={<EmojiEventsIcon sx={{ color: 'white' }} />}
                        title="Top Rating"
                        value={isLoading ? '...' : topRating}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard
                        color="#2e7d32"
                        icon={<TrendingUpIcon sx={{ color: 'white' }} />}
                        title="Average Rating"
                        value={isLoading ? '...' : avgRating}
                    />
                </Grid>
            </Grid>

            {sessions && sessions.length > 0 && divisions && divisions.length > 0 && (
                <Box sx={{ mt: 4 }}>
                    <Typography gutterBottom variant="h5">
                        Session Leaders
                    </Typography>
                    <Grid container spacing={3}>
                        {sessions.flatMap((session) =>
                            divisions.map((division) => (
                                <Grid key={`${session.session_id}-${division.division_id}`} size={{ xs: 12, sm: 6 }}>
                                    <SessionLeaders
                                        divisionId={division.division_id}
                                        divisionName={division.name}
                                        session={session}
                                    />
                                </Grid>
                            ))
                        )}
                    </Grid>
                </Box>
            )}

            {players && players.length > 0 && (
                <Card sx={{ mt: 4 }}>
                    <CardContent>
                        <Typography gutterBottom variant="h6">
                            Top Rated Players
                        </Typography>
                        <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                            <Box component="thead">
                                <Box component="tr">
                                    <Box
                                        component="th"
                                        sx={{
                                            textAlign: 'left',
                                            p: 1,
                                            borderBottom: '1px solid #eee',
                                        }}
                                    >
                                        Rank
                                    </Box>
                                    <Box
                                        component="th"
                                        sx={{
                                            textAlign: 'left',
                                            p: 1,
                                            borderBottom: '1px solid #eee',
                                        }}
                                    >
                                        Player
                                    </Box>
                                    <Box
                                        component="th"
                                        sx={{
                                            textAlign: 'right',
                                            p: 1,
                                            borderBottom: '1px solid #eee',
                                        }}
                                    >
                                        Rating
                                    </Box>
                                    <Box
                                        component="th"
                                        sx={{
                                            textAlign: 'right',
                                            p: 1,
                                            borderBottom: '1px solid #eee',
                                        }}
                                    >
                                        Games
                                    </Box>
                                </Box>
                            </Box>
                            <Box component="tbody">
                                {[...players]
                                    .sort((a, b) => b.rating - a.rating)
                                    .slice(0, 5)
                                    .map((player, index) => (
                                        <Box component="tr" key={player.player_id}>
                                            <Box
                                                component="td"
                                                sx={{ p: 1, borderBottom: '1px solid #eee' }}
                                            >
                                                {index + 1}
                                            </Box>
                                            <Box
                                                component="td"
                                                sx={{ p: 1, borderBottom: '1px solid #eee' }}
                                            >
                                                {player.first_name} {player.last_name}
                                            </Box>
                                            <Box
                                                component="td"
                                                sx={{
                                                    textAlign: 'right',
                                                    p: 1,
                                                    borderBottom: '1px solid #eee',
                                                }}
                                            >
                                                {player.rating}
                                            </Box>
                                            <Box
                                                component="td"
                                                sx={{
                                                    textAlign: 'right',
                                                    p: 1,
                                                    borderBottom: '1px solid #eee',
                                                }}
                                            >
                                                {player.games_played}
                                            </Box>
                                        </Box>
                                    ))}
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            )}
        </Box>
    )
}

export default Dashboard
