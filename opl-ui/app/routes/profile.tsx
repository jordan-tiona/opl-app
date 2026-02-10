import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  SportsScore as RatingIcon,
  VideogameAsset as GamesIcon,
} from '@mui/icons-material';
import { useAuth } from '~/lib/auth';
import { usePlayer, usePlayers, useMatches, useDivision } from '~/lib/react-query';

export const ProfilePage = () => {
  const { user } = useAuth();
  const { data: player, isLoading: playerLoading } = usePlayer(user?.player_id ?? 0);
  const { data: players } = usePlayers();
  const { data: division } = useDivision(player?.division_id ?? 0);
  const { data: matches, isLoading: matchesLoading } = useMatches({
    player_id: user?.player_id ?? undefined,
  });

  if (!user?.player_id) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5" color="text.secondary">
          No player profile linked to your account.
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Contact the league administrator to link your account to a player.
        </Typography>
      </Box>
    );
  }

  if (playerLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!player) {
    return (
      <Typography variant="h5" color="text.secondary" sx={{ textAlign: 'center', py: 8 }}>
        Player not found.
      </Typography>
    );
  }

  const getPlayerName = (id: number) => {
    const p = players?.find((pl) => pl.player_id === id);
    return p ? `${p.first_name} ${p.last_name}` : `Player #${id}`;
  };

  const upcomingMatches = matches
    ?.filter((m) => !m.completed)
    .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
    ?? [];

  const completedMatches = matches
    ?.filter((m) => m.completed)
    .sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime())
    ?? [];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        My Profile
      </Typography>

      {/* Profile Card */}
      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
          <Avatar src={user.picture ?? undefined} sx={{ width: 72, height: 72, fontSize: 32 }}>
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
              <Chip label={division.name} size="small" color="primary" variant="outlined" sx={{ mt: 1 }} />
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <RatingIcon color="primary" sx={{ fontSize: 36 }} />
              <Typography variant="h4" sx={{ mt: 1 }}>{player.rating}</Typography>
              <Typography variant="body2" color="text.secondary">Rating</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <GamesIcon color="primary" sx={{ fontSize: 36 }} />
              <Typography variant="h4" sx={{ mt: 1 }}>{player.games_played}</Typography>
              <Typography variant="body2" color="text.secondary">Games Played</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrophyIcon color="primary" sx={{ fontSize: 36 }} />
              <Typography variant="h4" sx={{ mt: 1 }}>
                {completedMatches.filter((m) => m.winner_id === player.player_id).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">Matches Won</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Upcoming Matches */}
      <Typography variant="h5" sx={{ mb: 2 }}>Upcoming Matches</Typography>
      {matchesLoading ? (
        <CircularProgress size={24} />
      ) : upcomingMatches.length === 0 ? (
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>No upcoming matches.</Typography>
      ) : (
        <TableContainer component={Card} sx={{ mb: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Opponent</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Your Rating</TableCell>
                <TableCell>Opp. Rating</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {upcomingMatches.map((match) => {
                const isPlayer1 = match.player1_id === player.player_id;
                const opponentId = isPlayer1 ? match.player2_id : match.player1_id;
                const myRating = isPlayer1 ? match.player1_rating : match.player2_rating;
                const oppRating = isPlayer1 ? match.player2_rating : match.player1_rating;
                return (
                  <TableRow key={match.match_id}>
                    <TableCell>{getPlayerName(opponentId)}</TableCell>
                    <TableCell>{new Date(match.scheduled_date).toLocaleDateString()}</TableCell>
                    <TableCell>{myRating}</TableCell>
                    <TableCell>{oppRating}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Completed Matches */}
      <Typography variant="h5" sx={{ mb: 2 }}>Completed Matches</Typography>
      {matchesLoading ? (
        <CircularProgress size={24} />
      ) : completedMatches.length === 0 ? (
        <Typography variant="body1" color="text.secondary">No completed matches yet.</Typography>
      ) : (
        <TableContainer component={Card}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Opponent</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Result</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {completedMatches.map((match) => {
                const isPlayer1 = match.player1_id === player.player_id;
                const opponentId = isPlayer1 ? match.player2_id : match.player1_id;
                const won = match.winner_id === player.player_id;
                return (
                  <TableRow key={match.match_id}>
                    <TableCell>{getPlayerName(opponentId)}</TableCell>
                    <TableCell>{new Date(match.scheduled_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={won ? 'Won' : 'Lost'}
                        color={won ? 'success' : 'error'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default ProfilePage;
