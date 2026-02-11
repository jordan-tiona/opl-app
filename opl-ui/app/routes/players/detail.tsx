import { ArrowBack as ArrowBackIcon, Save as SaveIcon } from '@mui/icons-material'
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    TextField,
    Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'

import { usePlayer, usePlayerDivisions, useUpdatePlayer } from '~/lib/react-query'
import type { Player } from '~/lib/types'

export const PlayerDetailPage: React.FC = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const playerId = Number(id)

    const { data: player, isLoading, error } = usePlayer(playerId)
    const { data: playerDivisions } = usePlayerDivisions(playerId)
    const updatePlayer = useUpdatePlayer()

    const [formData, setFormData] = useState<Partial<Player>>({})
    const [hasChanges, setHasChanges] = useState(false)

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
        setHasChanges(true)
    }

    const handleSave = async () => {
        await updatePlayer.mutateAsync({ id: playerId, data: formData })
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

            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3,
                }}
            >
                <Typography variant="h3">
                    {player.first_name} {player.last_name}
                </Typography>
                <Button
                    disabled={!hasChanges || updatePlayer.isPending}
                    startIcon={<SaveIcon />}
                    variant="contained"
                    onClick={handleSave}
                >
                    {updatePlayer.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
            </Box>

            {updatePlayer.isSuccess && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    Player updated successfully
                </Alert>
            )}

            <Card>
                <CardContent>
                    <Typography gutterBottom variant="h6">
                        Player Information
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
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
                        {playerDivisions && playerDivisions.length > 0 && (
                            <Box>
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
                    </Box>
                </CardContent>
            </Card>
        </Box>
    )
}

export default PlayerDetailPage
