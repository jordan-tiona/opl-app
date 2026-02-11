import {
    ArrowBack as ArrowBackIcon,
    Edit as EditIcon,
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
    IconButton,
    TextField,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'

import { MatchAccordion, MatchCard } from '~/components/matches'
import {
    useMatches,
    usePlayer,
    usePlayerDivisions,
    usePlayers,
    useUpdatePlayer,
} from '~/lib/react-query'
import type { Player } from '~/lib/types'

export const PlayerDetailPage: React.FC = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('md'))
    const playerId = Number(id)

    const { data: player, isLoading, error } = usePlayer(playerId)
    const { data: playerDivisions } = usePlayerDivisions(playerId)
    const updatePlayer = useUpdatePlayer()
    const { data: matches } = useMatches({ player_id: playerId })
    const { data: allPlayers } = usePlayers()

    const [formData, setFormData] = useState<Partial<Player>>({})
    const [isEditing, setIsEditing] = useState(false)
    const [expandedMatch, setExpandedMatch] = useState<number | null>(null)

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
        await updatePlayer.mutateAsync({ id: playerId, data: formData })
        setIsEditing(false)
    }

    const handleCancel = () => {
        if (player) {
            setFormData(player)
        }
        setIsEditing(false)
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
                sx={{ mb: 2 }}
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
                            <IconButton onClick={() => setIsEditing(true)}>
                                <EditIcon />
                            </IconButton>
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
                        </Box>
                    )}

                    {playerDivisions && playerDivisions.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                            <Typography color="text.secondary" sx={{ mb: 1 }} variant="body2">
                                Divisions
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {playerDivisions.map((d) => (
                                    <Chip
                                        clickable
                                        color={d.active ? 'primary' : 'default'}
                                        key={d.division_id}
                                        label={d.name}
                                        variant={d.active ? 'filled' : 'outlined'}
                                        onClick={() => navigate(`/divisions/${d.division_id}`)}
                                    />
                                ))}
                            </Box>
                        </Box>
                    )}
                </CardContent>
            </Card>

            <Typography sx={{ mb: 2 }} variant="h5">
                Matches
            </Typography>
            {matches && allPlayers ? (
                matches.length === 0 ? (
                    <Typography color="text.secondary">No matches found</Typography>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 2 : 0 }}>
                        {matches.map((match) =>
                            isMobile ? (
                                <MatchCard
                                    expanded={expandedMatch === match.match_id}
                                    key={match.match_id}
                                    match={match}
                                    players={allPlayers}
                                    onToggle={handleToggleMatch}
                                />
                            ) : (
                                <MatchAccordion
                                    expanded={expandedMatch === match.match_id}
                                    key={match.match_id}
                                    match={match}
                                    players={allPlayers}
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
        </Box>
    )
}

export default PlayerDetailPage
