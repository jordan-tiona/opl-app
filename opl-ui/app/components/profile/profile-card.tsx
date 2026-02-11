import { Avatar, Box, Card, CardContent, Chip, Typography } from '@mui/material'

import type { Player, Division, User } from '~/lib/types'

interface ProfileCardProps {
    player: Player
    division: Division | undefined
    user: User
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ player, division, user }) => {
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
                    <Typography variant="h5">
                        {player.first_name} {player.last_name}
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                        {player.email}
                    </Typography>
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
            </CardContent>
        </Card>
    )
}
