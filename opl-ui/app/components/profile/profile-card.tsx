import { Avatar, Box, Card, CardContent, Chip, Typography } from '@mui/material'

import type { Player, Division } from '~/lib/types'

interface ProfileCardProps {
    player: Player
    division: Division | undefined
    user: any
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
                    <Typography variant="body2" color="text.secondary">
                        {player.email}
                    </Typography>
                    {division && (
                        <Chip
                            label={division.name}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ mt: 1 }}
                        />
                    )}
                </Box>
            </CardContent>
        </Card>
    )
}
