import { Add as AddIcon, ArrowBack as ArrowBackIcon, Delete as DeleteIcon, Edit as EditIcon, Save as SaveIcon } from '@mui/icons-material'
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    FormControl,
    FormControlLabel,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    Switch,
    TextField,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'

import { DeleteConfirmDialog } from '~/components/common'
import { MatchAccordion, MatchCard } from '~/components/matches'
import {
    useAddPlayerToDivision,
    useDeleteMatch,
    useDeletePlayer,
    useDivisions,
    useMatches,
    usePlayer,
    usePlayerDivisions,
    usePlayers,
    useRemovePlayerFromDivision,
    useUpdatePlayer,
} from '~/lib/react-query'
import type { Player } from '~/lib/types'
import { useAuth } from '~/lib/auth'

export const PlayerDetailPage: React.FC = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('md'))
    const playerId = Number(id)

    const { user } = useAuth()
    const { data: player, isLoading, error } = usePlayer(playerId)
    const { data: playerDivisions } = usePlayerDivisions(playerId)
    const { data: allDivisions } = useDivisions()
    const updatePlayer = useUpdatePlayer()
    const deletePlayer = useDeletePlayer()
    const addPlayerToDivision = useAddPlayerToDivision()
    const removePlayerFromDivision = useRemovePlayerFromDivision()
    const { data: matches } = useMatches({ player_id: playerId })
    const { data: allPlayers } = usePlayers()

    const deleteMatch = useDeleteMatch()
    const [formData, setFormData] = useState<Partial<Player>>({})
    const [isEditing, setIsEditing] = useState(false)
    const [expandedMatch, setExpandedMatch] = useState<number | null>(null)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [deleteMatchId, setDeleteMatchId] = useState<number | null>(null)
    const [selectedDivisionId, setSelectedDivisionId] = useState<number | ''>('')
    const [addingDivision, setAddingDivision] = useState(false)
    const [divisionEdits, setDivisionEdits] = useState<{ added: number[]; removed: number[] }>({ added: [], removed: [] })

    const displayedDivisions = useMemo(() => {
        const base = playerDivisions ?? []
        const afterRemove = base.filter((d) => !divisionEdits.removed.includes(d.division_id))
        const addedDivisions = (allDivisions ?? []).filter((d) => divisionEdits.added.includes(d.division_id))
        return [...afterRemove, ...addedDivisions]
    }, [playerDivisions, allDivisions, divisionEdits])

    const availableDivisions = useMemo(
        () => (allDivisions ?? []).filter((d) => !displayedDivisions.some((p) => p.division_id === d.division_id)),
        [allDivisions, displayedDivisions],
    )

    const sortedMatches = useMemo(() => {
        if (!matches) {
            return []
        }

        return [...matches].sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1
            }

            return new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
        })
    }, [matches])

    useEffect(() => {
        if (player) {
            setFormData(player)
        }
    }, [player])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target

        setFormData((prev) => ({
            ...prev,
            [name]:
                name === 'rating' || name === 'games_played'
                    ? value
                        ? Number(value)
                        : null
                    : value,
        }))
    }

    const handleSave = async () => {
        await Promise.all([
            updatePlayer.mutateAsync({ id: playerId, data: formData }),
            ...divisionEdits.added.map((divisionId) => addPlayerToDivision.mutateAsync({ divisionId, playerId })),
            ...divisionEdits.removed.map((divisionId) => removePlayerFromDivision.mutateAsync({ divisionId, playerId })),
        ])
        setDivisionEdits({ added: [], removed: [] })
        setIsEditing(false)
    }

    const handleCancel = () => {
        if (player) {
            setFormData(player)
        }

        setDivisionEdits({ added: [], removed: [] })
        setSelectedDivisionId('')
        setAddingDivision(false)
        setIsEditing(false)
    }

    const handleDelete = async () => {
        await deletePlayer.mutateAsync(playerId)
        navigate('/players')
    }

    const handleToggleMatch = useCallback((matchId: number) => {
        setExpandedMatch((prev) => (prev === matchId ? null : matchId))
    }, [])

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
            </Box>
        )
    }

    if (error) {
        return <Alert severity="error">Failed to load player: {error.message}</Alert>
    }

    if (!player) {
        return <Alert severity="warning">Player not found</Alert>
    }

    return (
        <Box>
            <Button
                startIcon={<ArrowBackIcon />}
                sx={{ mb: 2, color: 'text.secondary' }}
                onClick={() => navigate('/players')}
            >
                Back to Players
            </Button>

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 2,
                        }}
                    >
                        <Typography variant="h6">Player Information</Typography>
                        {!isEditing && (
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <IconButton onClick={() => setIsEditing(true)}>
                                    <EditIcon />
                                </IconButton>
                                {user?.is_admin && (
                                    <IconButton color="error" onClick={() => setDeleteOpen(true)}>
                                        <DeleteIcon />
                                    </IconButton>
                                )}
                            </Box>
                        )}
                    </Box>

                    {isEditing ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    fullWidth
                                    label="First Name"
                                    name="first_name"
                                    value={formData.first_name ?? ''}
                                    onChange={handleInputChange}
                                />
                                <TextField
                                    fullWidth
                                    label="Last Name"
                                    name="last_name"
                                    value={formData.last_name ?? ''}
                                    onChange={handleInputChange}
                                />
                            </Box>
                            <TextField
                                fullWidth
                                label="Email"
                                name="email"
                                type="email"
                                value={formData.email ?? ''}
                                onChange={handleInputChange}
                            />
                            <TextField
                                fullWidth
                                label="Phone"
                                name="phone"
                                value={formData.phone ?? ''}
                                onChange={handleInputChange}
                            />
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    fullWidth
                                    label="Rating"
                                    name="rating"
                                    type="number"
                                    value={formData.rating ?? ''}
                                    onChange={handleInputChange}
                                />
                                <TextField
                                    fullWidth
                                    label="Games Played"
                                    name="games_played"
                                    type="number"
                                    value={formData.games_played ?? ''}
                                    onChange={handleInputChange}
                                />
                            </Box>
                            <Box>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.email_notifications ?? false}
                                            onChange={(_, checked) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    email_notifications: checked,
                                                }))
                                            }
                                        />
                                    }
                                    label="Email notifications"
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.match_reminders ?? false}
                                            onChange={(_, checked) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    match_reminders: checked,
                                                }))
                                            }
                                        />
                                    }
                                    label="Match reminders"
                                />
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                <Button onClick={handleCancel}>Cancel</Button>
                                <Button
                                    disabled={updatePlayer.isPending}
                                    startIcon={<SaveIcon />}
                                    variant="contained"
                                    onClick={handleSave}
                                >
                                    {updatePlayer.isPending ? 'Saving...' : 'Save'}
                                </Button>
                            </Box>
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <Typography variant="h5">
                                {player.first_name} {player.last_name}
                            </Typography>
                            {player.email && (
                                <Typography color="text.secondary">{player.email}</Typography>
                            )}
                            {player.phone && (
                                <Typography color="text.secondary">{player.phone}</Typography>
                            )}
                            <Box sx={{ display: 'flex', gap: 3 }}>
                                <Typography color="text.secondary">
                                    Rating: {player.rating}
                                </Typography>
                                <Typography color="text.secondary">
                                    Games played: {player.games_played}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Chip
                                    color={player.email_notifications ? 'success' : 'default'}
                                    label={player.email_notifications ? 'Email notifications on' : 'Email notifications off'}
                                    size="small"
                                    variant={player.email_notifications ? 'filled' : 'outlined'}
                                />
                                <Chip
                                    color={player.match_reminders ? 'success' : 'default'}
                                    label={player.match_reminders ? 'Match reminders on' : 'Match reminders off'}
                                    size="small"
                                    variant={player.match_reminders ? 'filled' : 'outlined'}
                                />
                            </Box>
                        </Box>
                    )}

                    <Box sx={{ mt: 2 }}>
                        <Typography color="text.secondary" sx={{ mb: 1 }} variant="body2">
                            Divisions
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                            {displayedDivisions.map((d) => (
                                <Chip
                                    clickable={!isEditing}
                                    color={d.active ? 'primary' : 'default'}
                                    key={d.division_id}
                                    label={d.name}
                                    variant={d.active ? 'filled' : 'outlined'}
                                    onClick={!isEditing ? () => navigate(`/divisions/${d.division_id}`) : undefined}
                                    {...(isEditing ? {
                                        onDelete: () => setDivisionEdits((prev) => ({
                                            added: prev.added.filter((id) => id !== d.division_id),
                                            removed: prev.removed.includes(d.division_id) ? prev.removed : [...prev.removed, d.division_id],
                                        })),
                                    } : {})}
                                />
                            ))}
                            {displayedDivisions.length === 0 && !addingDivision && (
                                <Typography color="text.secondary" variant="body2">No divisions</Typography>
                            )}
                            {isEditing && !addingDivision && (
                                <IconButton color="primary" size="small" onClick={() => setAddingDivision(true)}>
                                    <AddIcon />
                                </IconButton>
                            )}
                            {isEditing && addingDivision && (
                                <FormControl size="small" sx={{ minWidth: 160 }}>
                                    <InputLabel>Division</InputLabel>
                                    <Select
                                        autoFocus
                                        label="Division"
                                        value={selectedDivisionId}
                                        onChange={(e) => {
                                            const id = e.target.value as number
                                            setDivisionEdits((prev) => ({
                                                added: prev.added.includes(id) ? prev.added : [...prev.added, id],
                                                removed: prev.removed.filter((r) => r !== id),
                                            }))
                                            setSelectedDivisionId('')
                                            setAddingDivision(false)
                                        }}
                                        onClose={() => {
                                            if (!selectedDivisionId) setAddingDivision(false)
                                        }}
                                    >
                                        {availableDivisions.map((d) => (
                                            <MenuItem key={d.division_id} value={d.division_id}>
                                                {d.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            <Typography sx={{ mb: 2 }} variant="h5">
                Matches
            </Typography>
            {matches && allPlayers ? (
                sortedMatches.length === 0 ? (
                    <Typography color="text.secondary">No matches found</Typography>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 2 : 0 }}>
                        {sortedMatches.map((match) =>
                            isMobile ? (
                                <MatchCard
                                    expanded={expandedMatch === match.match_id}
                                    key={match.match_id}
                                    match={match}
                                    players={allPlayers}
                                    onDelete={user?.is_admin ? setDeleteMatchId : undefined}
                                    onToggle={handleToggleMatch}
                                />
                            ) : (
                                <MatchAccordion
                                    expanded={expandedMatch === match.match_id}
                                    key={match.match_id}
                                    match={match}
                                    players={allPlayers}
                                    onDelete={user?.is_admin ? setDeleteMatchId : undefined}
                                    onToggle={handleToggleMatch}
                                />
                            ),
                        )}
                    </Box>
                )
            ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={24} />
                </Box>
            )}

            <DeleteConfirmDialog
                description={`Are you sure you want to delete ${player.first_name} ${player.last_name}? Their match history will be preserved.`}
                isPending={deletePlayer.isPending}
                open={deleteOpen}
                title="Delete Player"
                onClose={() => setDeleteOpen(false)}
                onConfirm={handleDelete}
            />

            <DeleteConfirmDialog
                description="Are you sure you want to delete this match?"
                isPending={deleteMatch.isPending}
                open={deleteMatchId !== null}
                title="Delete Match"
                onClose={() => setDeleteMatchId(null)}
                onConfirm={async () => {
                    if (deleteMatchId !== null) {
                        await deleteMatch.mutateAsync(deleteMatchId)
                        setDeleteMatchId(null)
                    }
                }}
            />
        </Box>
    )
}

export default PlayerDetailPage
