import {
    ArrowBack as ArrowBackIcon,
    Edit as EditIcon,
    Save as SaveIcon,
    Schedule as ScheduleIcon,
} from '@mui/icons-material'
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    IconButton,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material'
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'

import { ScheduleRoundRobinDialog } from '~/components/divisions'
import {
    useDivision,
    useDivisionPlayers,
    useScores,
    useSession,
    useUpdateSession,
} from '~/lib/react-query'
import { useSnackbar } from '~/lib/snackbar'
import type { Session } from '~/lib/types'

export const SessionDetailPage: React.FC = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const sessionId = Number(id)

    const { data: session, isLoading, error } = useSession(sessionId)
    const { data: division } = useDivision(session?.division_id ?? 0)
    const { data: divisionPlayersList } = useDivisionPlayers(session?.division_id ?? 0)
    const { data: scores } = useScores(sessionId)
    const updateSession = useUpdateSession()
    const { showSnackbar } = useSnackbar()

    const [formData, setFormData] = useState<Partial<Session>>({})
    const [hasChanges, setHasChanges] = useState(false)
    const [scheduleOpen, setScheduleOpen] = useState(false)
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('md'))

    useEffect(() => {
        if (session) {
            setFormData(session)
        }
    }, [session])

    const scoreMap = useMemo(
        () => new Map(scores?.map((s) => [s.player_id, s.score]) ?? []),
        [scores],
    )

    const divisionPlayers = useMemo(
        () =>
            (divisionPlayersList ?? [])
                .map((p) => ({ ...p, score: scoreMap.get(p.player_id) ?? 0 }))
                .sort((a, b) => b.score - a.score),
        [divisionPlayersList, scoreMap],
    )

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target

        setFormData((prev) => ({ ...prev, [name]: value }))
        setHasChanges(true)
    }

    const handleSave = async () => {
        try {
            await updateSession.mutateAsync({ id: sessionId, data: formData })
            showSnackbar('Session updated', 'success')
            setHasChanges(false)
        } catch (err) {
            showSnackbar(err instanceof Error ? err.message : 'Failed to update session', 'error')
        }
    }

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
            </Box>
        )
    }

    if (error) {
        return <Alert severity="error">Failed to load session: {error.message}</Alert>
    }

    if (!session) {
        return <Alert severity="warning">Session not found</Alert>
    }

    return (
        <Box>
            <Button
                startIcon={<ArrowBackIcon />}
                sx={{ mb: 2 }}
                onClick={() => navigate('/sessions')}
            >
                Back to Sessions
            </Button>

            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3,
                }}
            >
                <Box>
                    <Typography variant="h3">{session.name}</Typography>
                    {division && (
                        <Typography color="text.secondary" variant="subtitle1">
                            {division.name}
                        </Typography>
                    )}
                </Box>
                <Button
                    disabled={!hasChanges || updateSession.isPending}
                    startIcon={<SaveIcon />}
                    variant="contained"
                    onClick={handleSave}
                >
                    {updateSession.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
            </Box>

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography gutterBottom variant="h6">
                        Session Details
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <TextField
                            fullWidth
                            label="Name"
                            name="name"
                            value={formData.name ?? ''}
                            onChange={handleInputChange}
                        />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                fullWidth
                                label="Start Date"
                                name="start_date"
                                slotProps={{ inputLabel: { shrink: true } }}
                                type="date"
                                value={formData.start_date ?? ''}
                                onChange={handleInputChange}
                            />
                            <TextField
                                fullWidth
                                label="End Date"
                                name="end_date"
                                slotProps={{ inputLabel: { shrink: true } }}
                                type="date"
                                value={formData.end_date ?? ''}
                                onChange={handleInputChange}
                            />
                        </Box>
                        <TextField
                            fullWidth
                            label="Match Time"
                            name="match_time"
                            slotProps={{ inputLabel: { shrink: true } }}
                            type="time"
                            value={formData.match_time ?? ''}
                            onChange={handleInputChange}
                        />
                    </Box>
                </CardContent>
            </Card>

            <Card>
                <CardContent>
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 2,
                        }}
                    >
                        <Typography variant="h6">Standings ({divisionPlayers.length} players)</Typography>
                        <Button
                            disabled={divisionPlayers.length === 0}
                            startIcon={<ScheduleIcon />}
                            variant="outlined"
                            onClick={() => setScheduleOpen(true)}
                        >
                            Schedule Round Robin
                        </Button>
                    </Box>

                    {divisionPlayers.length > 0 ? (
                        isMobile ? (
                            <Stack spacing={1.5}>
                                {divisionPlayers.map((player, index) => {
                                    const rank = index + 1

                                    return (
                                        <Card
                                            key={player.player_id}
                                            sx={{ bgcolor: rank <= 3 ? 'action.hover' : 'inherit', cursor: 'pointer' }}
                                            variant="outlined"
                                            onClick={() => navigate(`/players/${player.player_id}`)}
                                        >
                                            <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Typography color="text.secondary">#{rank}</Typography>
                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Typography noWrap fontWeight={rank <= 3 ? 600 : 400}>
                                                            {player.first_name} {player.last_name}
                                                        </Typography>
                                                    </Box>
                                                    <Typography color="secondary.main" fontWeight={600}>
                                                        {player.score} pts
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', gap: 2, mt: 0.5, ml: 4 }}>
                                                    <Typography color="text.secondary" variant="body2">
                                                        Rating: {player.rating}
                                                    </Typography>
                                                    <Typography color="text.secondary" variant="body2">
                                                        Games: {player.games_played}
                                                    </Typography>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </Stack>
                        ) : (
                            <TableContainer component={Paper} variant="outlined">
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell align="center">#</TableCell>
                                            <TableCell>Name</TableCell>
                                            <TableCell align="right">Score</TableCell>
                                            <TableCell align="right">Rating</TableCell>
                                            <TableCell align="right">Games Played</TableCell>
                                            <TableCell align="right">Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {divisionPlayers.map((player, index) => (
                                            <TableRow hover key={player.player_id}>
                                                <TableCell align="center">{index + 1}</TableCell>
                                                <TableCell>
                                                    {player.first_name} {player.last_name}
                                                </TableCell>
                                                <TableCell align="right">{player.score}</TableCell>
                                                <TableCell align="right">{player.rating}</TableCell>
                                                <TableCell align="right">
                                                    {player.games_played}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() =>
                                                            navigate(`/players/${player.player_id}`)
                                                        }
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )
                    ) : (
                        <Typography align="center" color="text.secondary" sx={{ py: 3 }}>
                            No players in this division yet.
                        </Typography>
                    )}
                </CardContent>
            </Card>

            <ScheduleRoundRobinDialog
                defaultStartDate={session.start_date}
                open={scheduleOpen}
                sessionId={sessionId}
                onClose={() => setScheduleOpen(false)}
            />
        </Box>
    )
}

export default SessionDetailPage
