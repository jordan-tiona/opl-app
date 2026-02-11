import {
    ArrowBack as ArrowBackIcon,
    ContentCopy as ContentCopyIcon,
    Edit as EditIcon,
    PersonAdd as PersonAddIcon,
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
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material'
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'

import {
    AddExistingPlayerDialog,
    CopyDivisionDialog,
    ScheduleRoundRobinDialog,
} from '~/components/divisions'
import { AddPlayerDialog } from '~/components/players'
import { useDivision, useDivisionPlayers, usePlayers, useScores, useUpdateDivision } from '~/lib/react-query'
import { useSnackbar } from '~/lib/snackbar'
import type { Division } from '~/lib/types'

export const DivisionDetailPage: React.FC = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const divisionId = Number(id)

    const { data: division, isLoading, error } = useDivision(divisionId)
    const { data: divisionPlayersList } = useDivisionPlayers(divisionId)
    const { data: allPlayers } = usePlayers()
    const { data: scores } = useScores(divisionId)
    const updateDivision = useUpdateDivision()
    const { showSnackbar } = useSnackbar()

    const [formData, setFormData] = useState<Partial<Division>>({})
    const [hasChanges, setHasChanges] = useState(false)
    const [addPlayerOpen, setAddPlayerOpen] = useState(false)
    const [createPlayerOpen, setCreatePlayerOpen] = useState(false)
    const [scheduleOpen, setScheduleOpen] = useState(false)
    const [newDivisionOpen, setNewDivisionOpen] = useState(false)

    useEffect(() => {
        if (division) {
            setFormData(division)
        }
    }, [division])

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

    const divisionPlayerIds = useMemo(
        () => new Set(divisionPlayersList?.map((p) => p.player_id) ?? []),
        [divisionPlayersList],
    )

    const availablePlayers = useMemo(
        () => allPlayers?.filter((p) => !divisionPlayerIds.has(p.player_id)) ?? [],
        [allPlayers, divisionPlayerIds],
    )

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target

        setFormData((prev) => ({ ...prev, [name]: value }))
        setHasChanges(true)
    }

    const handleSave = async () => {
        try {
            await updateDivision.mutateAsync({ id: divisionId, data: formData })
            showSnackbar('Division updated', 'success')
            setHasChanges(false)
        } catch (err) {
            showSnackbar(err instanceof Error ? err.message : 'Failed to update division', 'error')
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
        return <Alert severity="error">Failed to load division: {error.message}</Alert>
    }

    if (!division) {
        return <Alert severity="warning">Division not found</Alert>
    }

    return (
        <Box>
            <Button
                startIcon={<ArrowBackIcon />}
                sx={{ mb: 2 }}
                onClick={() => navigate('/divisions')}
            >
                Back to Divisions
            </Button>

            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3,
                }}
            >
                <Typography variant="h3">{division.name}</Typography>
                <Button
                    disabled={!hasChanges || updateDivision.isPending}
                    startIcon={<SaveIcon />}
                    variant="contained"
                    onClick={handleSave}
                >
                    {updateDivision.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
            </Box>

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography gutterBottom variant="h6">
                        Division Details
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
                        <Typography variant="h6">Players ({divisionPlayers.length})</Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                startIcon={<PersonAddIcon />}
                                variant="outlined"
                                onClick={() => setAddPlayerOpen(true)}
                            >
                                Add Player
                            </Button>
                            <Button
                                disabled={divisionPlayers.length === 0}
                                startIcon={<ScheduleIcon />}
                                variant="outlined"
                                onClick={() => setScheduleOpen(true)}
                            >
                                Schedule Round Robin
                            </Button>
                            <Button
                                disabled={divisionPlayers.length === 0}
                                startIcon={<ContentCopyIcon />}
                                variant="outlined"
                                onClick={() => setNewDivisionOpen(true)}
                            >
                                New Division with Same Players
                            </Button>
                        </Box>
                    </Box>

                    {divisionPlayers.length > 0 ? (
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
                    ) : (
                        <Typography align="center" color="text.secondary" sx={{ py: 3 }}>
                            No players in this division yet.
                        </Typography>
                    )}
                </CardContent>
            </Card>

            <AddExistingPlayerDialog
                availablePlayers={availablePlayers}
                divisionId={divisionId}
                open={addPlayerOpen}
                onClose={() => setAddPlayerOpen(false)}
                onCreateNewPlayer={() => setCreatePlayerOpen(true)}
            />

            <AddPlayerDialog
                divisionId={divisionId}
                open={createPlayerOpen}
                onClose={() => setCreatePlayerOpen(false)}
            />

            <ScheduleRoundRobinDialog
                defaultStartDate={division.start_date}
                divisionId={divisionId}
                open={scheduleOpen}
                onClose={() => setScheduleOpen(false)}
            />

            <CopyDivisionDialog
                defaultMatchTime={division.match_time}
                divisionId={divisionId}
                divisionName={division.name}
                open={newDivisionOpen}
                onClose={() => setNewDivisionOpen(false)}
            />
        </Box>
    )
}

export default DivisionDetailPage
