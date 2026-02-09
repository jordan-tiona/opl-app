import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { usePlayers } from '~/lib/queries';
import { AddPlayerDialog } from '~/components/players/add-player-dialog';

export const PlayersPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: players, isLoading, error } = usePlayers();

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredPlayers = players?.filter((player) => {
    const fullName = `${player.first_name} ${player.last_name}`.toLowerCase();
    return fullName.includes(search.toLowerCase());
  });

  if (error) {
    return <Alert severity="error">Failed to load players: {error.message}</Alert>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h3">Players</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Add Player
        </Button>
      </Box>

      <TextField
        fullWidth
        placeholder="Search players..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 3 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          },
        }}
      />

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell align="right">Rating</TableCell>
                <TableCell align="right">Games Played</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPlayers?.map((player) => (
                <TableRow key={player.player_id} hover>
                  <TableCell>
                    {player.first_name} {player.last_name}
                  </TableCell>
                  <TableCell>{player.email}</TableCell>
                  <TableCell>{player.phone}</TableCell>
                  <TableCell align="right">{player.rating}</TableCell>
                  <TableCell align="right">{player.games_played}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/players/${player.player_id}`)}
                    >
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {filteredPlayers?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No players found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <AddPlayerDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </Box>
  );
}

export default PlayersPage
