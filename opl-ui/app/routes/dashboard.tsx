import { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from '@mui/material';
import {
  EmojiEvents as EmojiEventsIcon,
  People as PeopleIcon,
  Sports as SportsIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useDivisions, usePlayers, useScores } from '~/lib/react-query';
import type { Division, Player } from '~/lib/types';

interface DivisionLeadersProps {
  division: Division;
  players: Player[];
}

const DivisionLeaders: React.FC<DivisionLeadersProps> = ({ division, players }: DivisionLeadersProps) => {
  const { data: scores } = useScores(division.division_id);

  const divisionPlayers = useMemo(
    () => new Map(players.filter((p) => p.division_id === division.division_id).map((p) => [p.player_id, p])),
    [players, division.division_id],
  );

  const leaders = useMemo(() => {
    if (!scores) return [];
    return [...scores]
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((s) => ({ player: divisionPlayers.get(s.player_id)!, score: s.score }))
      .filter((entry) => entry.player != null);
  }, [scores, divisionPlayers]);

  if (leaders.length === 0) return null;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {division.name}
        </Typography>
        <Table size="small">
          <TableBody>
            {leaders.map(({ player, score }, index) => (
              <TableRow key={player.player_id} sx={{ '&:last-child td': { border: 0 } }}>
                <TableCell sx={{ pl: 0, width: 24, color: 'text.secondary' }}>{index + 1}</TableCell>
                <TableCell sx={{ pl: 0 }}>{player.first_name} {player.last_name}</TableCell>
                <TableCell align="right" sx={{ pr: 0 }}>{score}pts</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }: StatCardProps) => {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="text.secondary" variant="body2" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={600}>
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              bgcolor: color,
              borderRadius: 2,
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export const Dashboard: React.FC = () => {
  const { data: players, isLoading } = usePlayers();
  const { data: divisions } = useDivisions();

  const activeDivisions = useMemo(() => {
    if (!divisions) return [];
    const today = new Date().toISOString().slice(0, 10);
    return divisions.filter((d) => d.end_date >= today);
  }, [divisions]);

  const totalPlayers = players?.length ?? 0;
  const totalGames = players?.reduce((sum, p) => sum + p.games_played, 0) ?? 0;
  const topRating = players?.length
    ? Math.max(...players.map((p) => p.rating))
    : 0;
  const avgRating = players?.length
    ? Math.round(players.reduce((sum, p) => sum + p.rating, 0) / players.length)
    : 0;

  return (
    <Box>
      <Typography variant="h3" gutterBottom>
        Dashboard
      </Typography>
      <Typography color="text.secondary" paragraph>
        Welcome to the One Pocket League management system.
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Players"
            value={isLoading ? '...' : totalPlayers}
            icon={<PeopleIcon sx={{ color: 'white' }} />}
            color="#1976d2"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Games Played"
            value={isLoading ? '...' : totalGames}
            icon={<SportsIcon sx={{ color: 'white' }} />}
            color="#9c27b0"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Top Rating"
            value={isLoading ? '...' : topRating}
            icon={<EmojiEventsIcon sx={{ color: 'white' }} />}
            color="#ed6c02"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Average Rating"
            value={isLoading ? '...' : avgRating}
            icon={<TrendingUpIcon sx={{ color: 'white' }} />}
            color="#2e7d32"
          />
        </Grid>
      </Grid>

      {activeDivisions.length > 0 && players && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Division Leaders
          </Typography>
          <Grid container spacing={3}>
            {activeDivisions.map((division) => (
              <Grid size={{ xs: 12, sm: 6 }} key={division.division_id}>
                <DivisionLeaders division={division} players={players} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {players && players.length > 0 && (
        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Top Rated Players
            </Typography>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
              <Box component="thead">
                <Box component="tr">
                  <Box component="th" sx={{ textAlign: 'left', p: 1, borderBottom: '1px solid #eee' }}>
                    Rank
                  </Box>
                  <Box component="th" sx={{ textAlign: 'left', p: 1, borderBottom: '1px solid #eee' }}>
                    Player
                  </Box>
                  <Box component="th" sx={{ textAlign: 'right', p: 1, borderBottom: '1px solid #eee' }}>
                    Rating
                  </Box>
                  <Box component="th" sx={{ textAlign: 'right', p: 1, borderBottom: '1px solid #eee' }}>
                    Games
                  </Box>
                </Box>
              </Box>
              <Box component="tbody">
                {[...players]
                  .sort((a, b) => b.rating - a.rating)
                  .slice(0, 5)
                  .map((player, index) => (
                    <Box component="tr" key={player.player_id}>
                      <Box component="td" sx={{ p: 1, borderBottom: '1px solid #eee' }}>
                        {index + 1}
                      </Box>
                      <Box component="td" sx={{ p: 1, borderBottom: '1px solid #eee' }}>
                        {player.first_name} {player.last_name}
                      </Box>
                      <Box component="td" sx={{ textAlign: 'right', p: 1, borderBottom: '1px solid #eee' }}>
                        {player.rating}
                      </Box>
                      <Box component="td" sx={{ textAlign: 'right', p: 1, borderBottom: '1px solid #eee' }}>
                        {player.games_played}
                      </Box>
                    </Box>
                  ))}
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

export default Dashboard
