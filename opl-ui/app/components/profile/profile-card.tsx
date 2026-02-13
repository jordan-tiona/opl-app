import { Close as CancelIcon, Edit as EditIcon, Save as SaveIcon } from '@mui/icons-material'
import {
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    FormControlLabel,
    IconButton,
    Switch,
    TextField,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material'
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
        email_notifications: player.email_notifications,
        match_reminders: player.match_reminders,
    })
    const updatePlayer = useUpdatePlayer()
    const { showSnackbar } = useSnackbar()
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

    useEffect(() => {
        setFormData({
            first_name: player.first_name,
            last_name: player.last_name,
            phone: player.phone,
            email_notifications: player.email_notifications,
            match_reminders: player.match_reminders,
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
            <CardContent sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 2, sm: 3 }, flexWrap: 'wrap', position: 'relative' }}>
                <Avatar
                    src={user.picture ?? undefined}
                    sx={{ width: 72, height: 72, fontSize: 32 }}
                >
                    {player.first_name[0]}
                </Avatar>
                <Box sx={{ flexGrow: 1, minWidth: { xs: '100%', sm: 0 } }}>
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
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
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
                            sx={{ mt: 1, alignSelf: 'flex-start' }}
                        />
                    )}
                </Box>
                {editing ? (
                    <Box sx={{ display: 'flex', gap: 1, ...(isMobile && { position: 'absolute', top: 16, right: 16 }) }}>
                        {isMobile ? (
                            <>
                                <IconButton
                                    onClick={() => {
                                        setEditing(false)
                                        setFormData({
                                            first_name: player.first_name,
                                            last_name: player.last_name,
                                            phone: player.phone,
                                            email_notifications: player.email_notifications,
                                            match_reminders: player.match_reminders,
                                        })
                                    }}
                                >
                                    <CancelIcon />
                                </IconButton>
                                <IconButton
                                    color="primary"
                                    disabled={updatePlayer.isPending || !formData.first_name || !formData.last_name}
                                    onClick={handleSave}
                                >
                                    <SaveIcon />
                                </IconButton>
                            </>
                        ) : (
                            <>
                                <Button
                                    startIcon={<CancelIcon />}
                                    variant="text"
                                    onClick={() => {
                                        setEditing(false)
                                        setFormData({
                                            first_name: player.first_name,
                                            last_name: player.last_name,
                                            phone: player.phone,
                                            email_notifications: player.email_notifications,
                                            match_reminders: player.match_reminders,
                                        })
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    disabled={updatePlayer.isPending || !formData.first_name || !formData.last_name}
                                    startIcon={<SaveIcon />}
                                    variant="contained"
                                    onClick={handleSave}
                                >
                                    {updatePlayer.isPending ? 'Saving...' : 'Save'}
                                </Button>
                            </>
                        )}
                    </Box>
                ) : isMobile ? (
                    <IconButton
                        sx={{ position: 'absolute', top: 16, right: 16 }}
                        onClick={() => setEditing(true)}
                    >
                        <EditIcon />
                    </IconButton>
                ) : (
                    <Button
                        startIcon={<EditIcon />}
                        variant="text"
                        onClick={() => setEditing(true)}
                    >
                        Edit
                    </Button>
                )}
            </CardContent>
            <Box
                sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1,
                    px: 2,
                    pb: 2,
                }}
            >
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
        </Card>
    )
}
