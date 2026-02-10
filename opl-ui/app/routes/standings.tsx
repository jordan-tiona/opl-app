import { useMemo } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { amber, brown, grey } from '@mui/material/colors';
import { EmojiEvents as EmojiEventsIcon } from '@mui/icons-material';
import { useDivisions, usePlayers, useMatches, useScores } from '~/lib/react-query';
import { useAuth } from '~/lib/auth';

const getRankColor = (rank: number) => {
  switch (rank) {
    case 1:
      return { bgcolor: amber[600], color: '#000' }; // Gold
    case 2:
      return { bgcolor: grey[300], color: '#000' }; // Silver
    case 3:
      return { bgcolor: brown[500], color: '#fff' }; // Bronze
    default:
      return undefined;
  }
};

export const StandingsPage: React.FC = () => {
  const { user } = useAuth();
  const { data: players, isLoading: playersLoading, error } = usePlayers();
  const { data: divisions } = useDivisions();

  // Get player's division if user is a player
  const userPlayer = useMemo(() => {
    if (!user?.player_id || !players) return null;
    return players.find((p) => p.player_id === user.player_id);
  }, [user, players]);

  const targetDivisionId = user?.is_admin ? null : userPlayer?.division_id;

  // Fetch matches for the target division
  const { data: matches, isLoading: matchesLoading } = useMatches({
    division_id: targetDivisionId ?? undefined,
  });

  // Fetch scores for the target division
  const { data: scores, isLoading: scoresLoading } = useScores(targetDivisionId ?? 0);

  const isLoading = playersLoading || matchesLoading || scoresLoading;

  const divisionMap = useMemo(
    () => new Map(divisions?.map((d) => [d.division_id, d.name]) ?? []),
    [divisions],
  );

  // Calculate match records for each player
  const playerStats = useMemo(() => {
    if (!players || !matches || !scores) return [];

    const statsMap = new Map<number, { wins: number; losses: number; points: number }>();

    // Initialize stats from scores
    scores.forEach((score) => {
      statsMap.set(score.player_id, {
        wins: 0,
        losses: 0,
        points: score.score,
      });
    });

    // Calculate match records
    matches.filter((m) => m.completed).forEach((match) => {
      if (match.winner_id) {
        const winnerStats = statsMap.get(match.winner_id);
        if (winnerStats) winnerStats.wins++;
      }
      if (match.loser_id) {
        const loserStats = statsMap.get(match.loser_id);
        if (loserStats) loserStats.losses++;
      }
    });

    return players
      .filter((p) => (targetDivisionId ? p.division_id === targetDivisionId : true))
      .map((player) => ({
        ...player,
        stats: statsMap.get(player.player_id) ?? { wins: 0, losses: 0, points: 0 },
      }));
  }, [players, matches, scores, targetDivisionId]);

  const sortedPlayers = useMemo(() => {
    return [...playerStats].sort((a, b) => {
      // Primary sort by points (descending)
      if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
      // Secondary sort by rating (descending)
      if (b.rating !== a.rating) return b.rating - a.rating;
      // Tertiary sort by games played (descending)
      return b.games_played - a.games_played;
    });
  }, [playerStats]);

  if (error) {
    return <Alert severity="error">Failed to load standings: {error.message}</Alert>;
  }

  const divisionName = targetDivisionId ? divisionMap.get(targetDivisionId) : 'All Divisions';

  return (
    <Box>
      <Typography variant="h3" gutterBottom>
        Standings
      </Typography>
      <Typography color="text.secondary" component="p">
        {divisionName}
      </Typography>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : sortedPlayers.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">No players found</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="center" sx={{ width: 80 }}>
                  Rank
                </TableCell>
                <TableCell>Player</TableCell>
                <TableCell align="right">Points</TableCell>
                <TableCell align="right">Record</TableCell>
                <TableCell align="right">Rating</TableCell>
                <TableCell align="right">Games</TableCell>
                {user?.is_admin && <TableCell align="right">Division</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedPlayers.map((player, index) => {
                const rank = index + 1;
                const rankColor = getRankColor(rank);

                return (
                  <TableRow
                    key={player.player_id}
                    sx={{
                      bgcolor: rank <= 3 ? 'action.hover' : 'inherit',
                    }}
                  >
                    <TableCell align="center">
                      {rank <= 3 ? (
                        <Chip
                          icon={rank === 1 ? <EmojiEventsIcon /> : undefined}
                          label={rank}
                          size="small"
                          sx={rankColor}
                        />
                      ) : (
                        rank
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={rank <= 3 ? 600 : 400}>
                        {player.first_name} {player.last_name}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={600} color="primary">
                        {player.stats.points}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {player.stats.wins}-{player.stats.losses}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={600}>{player.rating}</Typography>
                    </TableCell>
                    <TableCell align="right">{player.games_played}</TableCell>
                    {user?.is_admin && (
                      <TableCell align="right">
                        {player.division_id ? (divisionMap.get(player.division_id) ?? '-') : '-'}
                      </TableCell>
                    )}
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

export default StandingsPage;
