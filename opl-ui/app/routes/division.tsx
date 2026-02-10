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
import { useDivision, usePlayers, useScores, useUpdateDivision } from '~/lib/react-query'
import type { Division } from '~/lib/types'

export const DivisionDetailPage: React.FC = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const divisionId = Number(id)

    const { data: division, isLoading, error } = useDivision(divisionId)
    const { data: allPlayers } = usePlayers()
    const { data: scores } = useScores(divisionId)
    const updateDivision = useUpdateDivision()

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
            (allPlayers?.filter((p) => p.division_id === divisionId) ?? [])
                .map((p) => ({ ...p, score: scoreMap.get(p.player_id) ?? 0 }))
                .sort((a, b) => b.score - a.score),
        [allPlayers, divisionId, scoreMap],
    )

    const availablePlayers = useMemo(
        () => allPlayers?.filter((p) => p.division_id !== divisionId) ?? [],
        [allPlayers, divisionId],
    )

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target

        setFormData((prev) => ({ ...prev, [name]: value }))
        setHasChanges(true)
    }

    const handleSave = async () => {
        await updateDivision.mutateAsync({ id: divisionId, data: formData })
        setHasChanges(false)
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
                onClick={() => navigate('/divisions')}
                sx={{ mb: 2 }}
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
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    disabled={!hasChanges || updateDivision.isPending}
                >
                    {updateDivision.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
            </Box>

            {updateDivision.isSuccess && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    Division updated successfully
                </Alert>
            )}

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Division Details
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <TextField
                            label="Name"
                            name="name"
                            value={formData.name ?? ''}
                            onChange={handleInputChange}
                            fullWidth
                        />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="Start Date"
                                name="start_date"
                                type="date"
                                value={formData.start_date ?? ''}
                                onChange={handleInputChange}
                                fullWidth
                                slotProps={{ inputLabel: { shrink: true } }}
                            />
                            <TextField
                                label="End Date"
                                name="end_date"
                                type="date"
                                value={formData.end_date ?? ''}
                                onChange={handleInputChange}
                                fullWidth
                                slotProps={{ inputLabel: { shrink: true } }}
                            />
                        </Box>
                        <TextField
                            label="Match Time"
                            name="match_time"
                            type="time"
                            value={formData.match_time ?? ''}
                            onChange={handleInputChange}
                            fullWidth
                            slotProps={{ inputLabel: { shrink: true } }}
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
                                variant="outlined"
                                startIcon={<PersonAddIcon />}
                                onClick={() => setAddPlayerOpen(true)}
                            >
                                Add Player
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<ScheduleIcon />}
                                onClick={() => setScheduleOpen(true)}
                                disabled={divisionPlayers.length === 0}
                            >
                                Schedule Round Robin
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<ContentCopyIcon />}
                                onClick={() => setNewDivisionOpen(true)}
                                disabled={divisionPlayers.length === 0}
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
                                        <TableRow key={player.player_id} hover>
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
                        <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
                            No players in this division yet.
                        </Typography>
                    )}
                </CardContent>
            </Card>

            <AddExistingPlayerDialog
                open={addPlayerOpen}
                onClose={() => setAddPlayerOpen(false)}
                divisionId={divisionId}
                availablePlayers={availablePlayers}
                onCreateNewPlayer={() => setCreatePlayerOpen(true)}
            />

            <AddPlayerDialog
                open={createPlayerOpen}
                onClose={() => setCreatePlayerOpen(false)}
                divisionId={divisionId}
            />

            <ScheduleRoundRobinDialog
                open={scheduleOpen}
                onClose={() => setScheduleOpen(false)}
                divisionId={divisionId}
                defaultStartDate={division.start_date}
            />

            <CopyDivisionDialog
                open={newDivisionOpen}
                onClose={() => setNewDivisionOpen(false)}
                divisionName={division.name}
                defaultMatchTime={division.match_time}
                players={divisionPlayers}
            />
        </Box>
    )
}

export default DivisionDetailPage
