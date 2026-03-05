import {
    ArrowBack as ArrowBackIcon,
    Delete as DeleteIcon,
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
    Checkbox,
    Chip,
    CircularProgress,
    FormControl,
    FormControlLabel,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
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

import { DeleteConfirmDialog } from '~/components/common'
import { AddExistingPlayerDialog } from '~/components/divisions'
import { AddPlayerDialog } from '~/components/players'
import { useAuth } from '~/lib/auth'
import {
    useDeleteDivision,
    useDivision,
    useDivisionPlayers,
    usePlayers,
    useRemovePlayerFromDivision,
    useSessions,
    useUpdateDivision,
} from '~/lib/react-query'
import { useSnackbar } from '~/lib/snackbar'
import type { Division } from '~/lib/types'

const DAYS_OF_WEEK = [
    { value: null, label: 'No specific day (flexible)' },
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

    const { user } = useAuth()
    const { data: division, isLoading, error } = useDivision(divisionId)
    const { data: divisionPlayersList } = useDivisionPlayers(divisionId)
    const { data: allPlayers } = usePlayers()
    const { data: sessions } = useSessions()
    const updateDivision = useUpdateDivision()
    const deleteDivision = useDeleteDivision()
    const removePlayer = useRemovePlayerFromDivision()
    const { showSnackbar } = useSnackbar()

    const [formData, setFormData] = useState<Partial<Division>>({})
    const [hasChanges, setHasChanges] = useState(false)
    const [dayOfWeekChanged, setDayOfWeekChanged] = useState(false)
    const [updateExistingMatches, setUpdateExistingMatches] = useState(false)
    const [addPlayerOpen, setAddPlayerOpen] = useState(false)
    const [createPlayerOpen, setCreatePlayerOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [removePlayerTarget, setRemovePlayerTarget] = useState<{
        id: number
        name: string
    } | null>(null)
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('md'))

    useEffect(() => {
        if (division) {
            setFormData(division)
            setDayOfWeekChanged(false)
            setUpdateExistingMatches(false)
        }
    }, [division])

    const divisionPlayers = useMemo(
        () => (divisionPlayersList ?? []).sort((a, b) => b.rating - a.rating),
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
            await updateDivision.mutateAsync({
                id: divisionId,
                data: {
                    name: formData.name ?? '',
                    day_of_week: formData.day_of_week ?? null,
                    active: formData.active ?? true,
                    update_existing_matches: updateExistingMatches,
                },
            })
            showSnackbar('Division updated', 'success')
            setHasChanges(false)
            setDayOfWeekChanged(false)
            setUpdateExistingMatches(false)
        } catch (err) {
            showSnackbar(err instanceof Error ? err.message : 'Failed to update division', 'error')
        }
    }

    const handleDelete = async () => {
        await deleteDivision.mutateAsync(divisionId)
        navigate('/divisions')
    }

    const handleRemovePlayer = async () => {
        if (!removePlayerTarget) {
            return
        }

        try {
            await removePlayer.mutateAsync({ divisionId, playerId: removePlayerTarget.id })
            showSnackbar('Player removed from division', 'success')
        } catch (err) {
            showSnackbar(err instanceof Error ? err.message : 'Failed to remove player', 'error')
        } finally {
            setRemovePlayerTarget(null)
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
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {user?.is_admin && (
                        <Button
                            color="error"
                            startIcon={<DeleteIcon />}
                            variant="outlined"
                            onClick={() => setDeleteOpen(true)}
                        >
                            Delete
                        </Button>
                    )}
                    <Button
                        disabled={!hasChanges || updateDivision.isPending}
                        startIcon={<SaveIcon />}
                        variant="contained"
                        onClick={handleSave}
                    >
                        {updateDivision.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                </Box>
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
                                value={formData.day_of_week ?? 'none'}
                                onChange={(e) => {
                                    const newVal = e.target.value === 'none' ? null : e.target.value as number

                                    setFormData((prev) => ({ ...prev, day_of_week: newVal }))
                                    setHasChanges(true)
                                    setDayOfWeekChanged(newVal !== division?.day_of_week)


                                    if (newVal === division?.day_of_week) {
                                        setUpdateExistingMatches(false)
                                    }
                                }}
                            >
                                {DAYS_OF_WEEK.map((d) => (
                                    <MenuItem key={d.value ?? 'none'} value={d.value ?? 'none'}>
                                        {d.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {dayOfWeekChanged && (
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={updateExistingMatches}
                                        onChange={(e) => setUpdateExistingMatches(e.target.checked)}
                                    />
                                }
                                label="Update scheduled (uncompleted) matches to reflect new scheduling format"
                            />
                        )}
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
                                    variant="filled"
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
                            color="primary"
                            startIcon={<PersonAddIcon />}
                            variant="contained"
                            onClick={() => setAddPlayerOpen(true)}
                        >
                            Add Player
                        </Button>
                    </Box>

                    {divisionPlayers.length > 0 ? (
                        isMobile ? (
                            <Stack spacing={1.5}>
                                {divisionPlayers.map((player) => (
                                    <Card key={player.player_id} variant="outlined">
                                        <CardContent
                                            sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}
                                        >
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1.5,
                                                }}
                                            >
                                                <Box
                                                    sx={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                                                    onClick={() =>
                                                        navigate(`/players/${player.player_id}`)
                                                    }
                                                >
                                                    <Typography noWrap fontWeight={500}>
                                                        {player.first_name} {player.last_name}
                                                    </Typography>
                                                </Box>
                                                <Typography color="secondary.main" fontWeight={600}>
                                                    {player.rating}
                                                </Typography>
                                                {user?.is_admin && (
                                                    <IconButton
                                                        color="error"
                                                        size="small"
                                                        onClick={() =>
                                                            setRemovePlayerTarget({
                                                                id: player.player_id,
                                                                name: `${player.first_name} ${player.last_name}`,
                                                            })
                                                        }
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                )}
                                            </Box>
                                            <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                                                <Typography color="text.secondary" variant="body2">
                                                    Games: {player.games_played}
                                                </Typography>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Stack>
                        ) : (
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
                                                    {user?.is_admin && (
                                                        <IconButton
                                                            color="error"
                                                            size="small"
                                                            onClick={() =>
                                                                setRemovePlayerTarget({
                                                                    id: player.player_id,
                                                                    name: `${player.first_name} ${player.last_name}`,
                                                                })
                                                            }
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    )}
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

            <DeleteConfirmDialog
                description={`Are you sure you want to delete "${division.name}"? All matches in this division will also be deleted.`}
                isPending={deleteDivision.isPending}
                open={deleteOpen}
                title="Delete Division"
                onClose={() => setDeleteOpen(false)}
                onConfirm={handleDelete}
            />

            <DeleteConfirmDialog
                description={`Remove ${removePlayerTarget?.name} from this division?`}
                isPending={removePlayer.isPending}
                open={!!removePlayerTarget}
                title="Remove Player"
                onClose={() => setRemovePlayerTarget(null)}
                onConfirm={handleRemovePlayer}
            />
        </Box>
    )
}

export default DivisionDetailPage
