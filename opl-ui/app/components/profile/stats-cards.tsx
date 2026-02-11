import { EmojiEvents as TrophyIcon, VideogameAsset as GamesIcon } from '@mui/icons-material'
import { Card, CardContent, Grid, Typography } from '@mui/material'

interface StatsCardsProps {
    gamesPlayed: number
    matchesWon: number
}

export const StatsCards: React.FC<StatsCardsProps> = ({ gamesPlayed, matchesWon }) => {
    return (
        <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
                <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                        <GamesIcon color="primary" sx={{ fontSize: 36 }} />
                        <Typography sx={{ mt: 1 }} variant="h4">
                            {gamesPlayed}
                        </Typography>
                        <Typography color="text.secondary" variant="body2">
                            Games Played
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
                <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                        <TrophyIcon color="primary" sx={{ fontSize: 36 }} />
                        <Typography sx={{ mt: 1 }} variant="h4">
                            {matchesWon}
                        </Typography>
                        <Typography color="text.secondary" variant="body2">
                            Matches Won
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    )
}
