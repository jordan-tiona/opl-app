import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
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
import { useDivisions, usePlayers } from '~/lib/queries';
import { AddPlayerDialog } from '~/components/players/add-player-dialog';

export const PlayersPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: players, isLoading, error } = usePlayers();
  const { data: divisions } = useDivisions();

  const [search, setSearch] = useState('');
  const [divisionFilter, setDivisionFilter] = useState<number | ''>('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredPlayers = players?.filter((player) => {
    const fullName = `${player.first_name} ${player.last_name}`.toLowerCase();
    if (!fullName.includes(search.toLowerCase())) return false;
    if (divisionFilter !== '' && player.division_id !== divisionFilter) return false;
    return true;
  }).sort((a, b) => { return a.last_name.localeCompare(b.last_name)});

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

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search players..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Division</InputLabel>
          <Select
            value={divisionFilter}
            label="Division"
            onChange={(e) => setDivisionFilter(e.target.value as number | '')}
          >
            <MenuItem value="">All</MenuItem>
            {divisions?.map((d) => (
              <MenuItem key={d.division_id} value={d.division_id}>
                {d.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

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
