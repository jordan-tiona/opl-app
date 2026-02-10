import { Card, CardContent, Grid, Typography } from '@mui/material';
import { EmojiEvents as TrophyIcon, VideogameAsset as GamesIcon } from '@mui/icons-material';

interface StatsCardsProps {
  gamesPlayed: number;
  matchesWon: number;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ gamesPlayed, matchesWon }) => {
  return (
    <Grid container spacing={2} sx={{ mb: 4 }}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <GamesIcon color="primary" sx={{ fontSize: 36 }} />
            <Typography variant="h4" sx={{ mt: 1 }}>{gamesPlayed}</Typography>
            <Typography variant="body2" color="text.secondary">Games Played</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <TrophyIcon color="primary" sx={{ fontSize: 36 }} />
            <Typography variant="h4" sx={{ mt: 1 }}>{matchesWon}</Typography>
            <Typography variant="body2" color="text.secondary">Matches Won</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};
