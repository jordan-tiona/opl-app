import { Edit as EditIcon, Save as SaveIcon } from '@mui/icons-material'
import { Avatar, Box, Button, Card, CardContent, Chip, TextField, Typography } from '@mui/material'
import { useEffect, useState } from 'react'

import { useUpdatePlayer } from '~/lib/react-query'
import { useSnackbar } from '~/lib/snackbar'
import type { Player, Division, User } from '~/lib/types'

interface ProfileCardProps {
    player: Player
    division: Division | undefined
    user: User
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ player, division, user }) => {
    const [editing, setEditing] = useState(false)
    const [formData, setFormData] = useState({
        first_name: player.first_name,
        last_name: player.last_name,
        phone: player.phone,
    })
    const updatePlayer = useUpdatePlayer()
    const { showSnackbar } = useSnackbar()

    useEffect(() => {
        setFormData({
            first_name: player.first_name,
            last_name: player.last_name,
            phone: player.phone,
        })
    }, [player])

    const handleSave = async () => {
        try {
            await updatePlayer.mutateAsync({ id: player.player_id, data: formData })
            showSnackbar('Profile updated', 'success')
            setEditing(false)
        } catch (err) {
            showSnackbar(err instanceof Error ? err.message : 'Failed to update profile', 'error')
        }
    }

    return (
        <Card sx={{ mb: 4 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                <Avatar
                    src={user.picture ?? undefined}
                    sx={{ width: 72, height: 72, fontSize: 32 }}
                >
                    {player.first_name[0]}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                    {editing ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <Box sx={{ display: 'flex', gap: 1.5 }}>
                                <TextField
                                    label="First Name"
                                    size="small"
                                    value={formData.first_name}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, first_name: e.target.value }))}
                                />
                                <TextField
                                    label="Last Name"
                                    size="small"
                                    value={formData.last_name}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, last_name: e.target.value }))}
                                />
                            </Box>
                            <TextField
                                label="Phone"
                                size="small"
                                sx={{ maxWidth: 200 }}
                                value={formData.phone}
                                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                            />
                        </Box>
                    ) : (
                        <>
                            <Typography variant="h5">
                                {player.first_name} {player.last_name}
                            </Typography>
                            <Typography color="text.secondary" variant="body2">
                                {player.email} &middot; {player.phone}
                            </Typography>
                        </>
                    )}
                    {division && (
                        <Chip
                            color="primary"
                            label={division.name}
                            size="small"
                            sx={{ mt: 1 }}
                            variant="outlined"
                        />
                    )}
                </Box>
                {editing ? (
                    <Button
                        disabled={updatePlayer.isPending || !formData.first_name || !formData.last_name}
                        startIcon={<SaveIcon />}
                        variant="contained"
                        onClick={handleSave}
                    >
                        {updatePlayer.isPending ? 'Saving...' : 'Save'}
                    </Button>
                ) : (
                    <Button
                        startIcon={<EditIcon />}
                        variant="outlined"
                        onClick={() => setEditing(true)}
                    >
                        Edit
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}
