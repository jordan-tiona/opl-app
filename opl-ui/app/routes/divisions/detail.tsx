import {
    ArrowBack as ArrowBackIcon,
    Edit as EditIcon,
    PersonAdd as PersonAddIcon,
    Save as SaveIcon,
} from '@mui/icons-material'
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
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

import { AddExistingPlayerDialog } from '~/components/divisions'
import { AddPlayerDialog } from '~/components/players'
import { useDivision, useDivisionPlayers, usePlayers, useSessions, useUpdateDivision } from '~/lib/react-query'
import { useSnackbar } from '~/lib/snackbar'
import type { Division } from '~/lib/types'

const DAYS_OF_WEEK = [
    { value: 0, label: 'Monday' },
    { value: 1, label: 'Tuesday' },
    { value: 2, label: 'Wednesday' },
    { value: 3, label: 'Thursday' },
    { value: 4, label: 'Friday' },
    { value: 5, label: 'Saturday' },
    { value: 6, label: 'Sunday' },
]

export const DivisionDetailPage: React.FC = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const divisionId = Number(id)

    const { data: division, isLoading, error } = useDivision(divisionId)
    const { data: divisionPlayersList } = useDivisionPlayers(divisionId)
    const { data: allPlayers } = usePlayers()
    const { data: sessions } = useSessions({ division_id: divisionId })
    const updateDivision = useUpdateDivision()
    const { showSnackbar } = useSnackbar()

    const [formData, setFormData] = useState<Partial<Division>>({})
    const [hasChanges, setHasChanges] = useState(false)
    const [addPlayerOpen, setAddPlayerOpen] = useState(false)
    const [createPlayerOpen, setCreatePlayerOpen] = useState(false)

    useEffect(() => {
        if (division) {
            setFormData(division)
        }
    }, [division])

    const divisionPlayers = useMemo(
        () =>
            (divisionPlayersList ?? [])
                .sort((a, b) => b.rating - a.rating),
        [divisionPlayersList],
    )

    const divisionPlayerIds = useMemo(
        () => new Set(divisionPlayersList?.map((p) => p.player_id) ?? []),
        [divisionPlayersList],
    )

    const availablePlayers = useMemo(
        () => allPlayers?.filter((p) => !divisionPlayerIds.has(p.player_id)) ?? [],
        [allPlayers, divisionPlayerIds],
    )

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

    const activeSessions = sessions?.filter((s) => s.active) ?? []
    const inactiveSessions = sessions?.filter((s) => !s.active) ?? []

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
                            onChange={(e) => {
                                setFormData((prev) => ({ ...prev, name: e.target.value }))
                                setHasChanges(true)
                            }}
                        />
                        <FormControl fullWidth>
                            <InputLabel>Day of Week</InputLabel>
                            <Select
                                label="Day of Week"
                                value={formData.day_of_week ?? 0}
                                onChange={(e) => {
                                    setFormData((prev) => ({
                                        ...prev,
                                        day_of_week: e.target.value as number,
                                    }))
                                    setHasChanges(true)
                                }}
                            >
                                {DAYS_OF_WEEK.map((d) => (
                                    <MenuItem key={d.value} value={d.value}>
                                        {d.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </CardContent>
            </Card>

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography gutterBottom variant="h6">
                        Sessions
                    </Typography>
                    {activeSessions.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                            {activeSessions.map((s) => (
                                <Chip
                                    clickable
                                    color="primary"
                                    key={s.session_id}
                                    label={`${s.name} (${s.start_date} - ${s.end_date})`}
                                    onClick={() => navigate(`/sessions/${s.session_id}`)}
                                />
                            ))}
                        </Box>
                    )}
                    {inactiveSessions.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {inactiveSessions.map((s) => (
                                <Chip
                                    clickable
                                    key={s.session_id}
                                    label={`${s.name} (${s.start_date} - ${s.end_date})`}
                                    variant="outlined"
                                    onClick={() => navigate(`/sessions/${s.session_id}`)}
                                />
                            ))}
                        </Box>
                    )}
                    {(sessions?.length ?? 0) === 0 && (
                        <Typography color="text.secondary" variant="body2">
                            No sessions yet.
                        </Typography>
                    )}
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
                        <Button
                            startIcon={<PersonAddIcon />}
                            variant="outlined"
                            onClick={() => setAddPlayerOpen(true)}
                        >
                            Add Player
                        </Button>
                    </Box>

                    {divisionPlayers.length > 0 ? (
                        <TableContainer component={Paper} variant="outlined">
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Name</TableCell>
                                        <TableCell align="right">Rating</TableCell>
                                        <TableCell align="right">Games Played</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {divisionPlayers.map((player) => (
                                        <TableRow hover key={player.player_id}>
                                            <TableCell>
                                                {player.first_name} {player.last_name}
                                            </TableCell>
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
        </Box>
    )
}

export default DivisionDetailPage
