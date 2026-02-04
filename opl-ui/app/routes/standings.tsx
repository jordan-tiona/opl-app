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
import { EmojiEvents as EmojiEventsIcon } from '@mui/icons-material';
import { usePlayers } from '~/lib/queries';

function getRankColor(rank: number): 'warning' | 'default' | 'primary' | undefined {
  switch (rank) {
    case 1:
      return 'warning'; // Gold
    case 2:
      return 'default'; // Silver
    case 3:
      return 'primary'; // Bronze-ish
    default:
      return undefined;
  }
}

export default function StandingsPage() {
  const { data: players, isLoading, error } = usePlayers();

  const sortedPlayers = useMemo(() => {
    if (!players) return [];
    return [...players].sort((a, b) => {
      // Primary sort by rating (descending)
      if (b.rating !== a.rating) return b.rating - a.rating;
      // Secondary sort by games played (descending) for tiebreaker
      return b.games_played - a.games_played;
    });
  }, [players]);

  if (error) {
    return <Alert severity="error">Failed to load standings: {error.message}</Alert>;
  }

  return (
    <Box>
      <Typography variant="h3" gutterBottom>
        Standings
      </Typography>
      <Typography color="text.secondary" paragraph>
        Player rankings sorted by rating
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
                <TableCell align="right">Rating</TableCell>
                <TableCell align="right">Games Played</TableCell>
                <TableCell align="right">Division</TableCell>
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
                          color={rankColor}
                          size="small"
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
                      <Typography fontWeight={600}>{player.rating}</Typography>
                    </TableCell>
                    <TableCell align="right">{player.games_played}</TableCell>
                    <TableCell align="right">
                      {player.division_id ?? '-'}
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
}
