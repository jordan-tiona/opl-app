import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useMatch, usePlayers, useGames, useCompleteMatch } from '~/lib/queries';
import type { GameInput } from '~/lib/types';

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function MatchDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const matchId = Number(id);

  const { data: match, isLoading: matchLoading } = useMatch(matchId);
  const { data: players } = usePlayers();
  const { data: existingGames } = useGames(matchId);
  const completeMatch = useCompleteMatch();

  const [games, setGames] = useState<GameInput[]>([]);

  const player1 = players?.find((p) => p.player_id === match?.player1_id);
  const player2 = players?.find((p) => p.player_id === match?.player2_id);

  const addGame = () => {
    if (!match) return;
    setGames((prev) => [
      ...prev,
      { winner_id: match.player1_id, loser_id: match.player2_id, balls_remaining: 1 },
    ]);
  };

  const removeGame = (index: number) => {
    setGames((prev) => prev.filter((_, i) => i !== index));
  };

  const updateGame = (index: number, field: keyof GameInput, value: number) => {
    setGames((prev) =>
      prev.map((game, i) => {
        if (i !== index) return game;

        if (field === 'winner_id') {
          const loserId = value === match?.player1_id ? match?.player2_id : match?.player1_id;
          return { ...game, winner_id: value, loser_id: loserId ?? game.loser_id };
        }
        return { ...game, [field]: value };
      })
    );
  };

  const handleSubmit = async () => {
    if (games.length === 0) return;
    await completeMatch.mutateAsync({ id: matchId, games });
    navigate('/matches');
  };

  if (matchLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!match) {
    return <Alert severity="warning">Match not found</Alert>;
  }

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/matches')}
        sx={{ mb: 2 }}
      >
        Back to Matches
      </Button>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h3">Match Details</Typography>
        <Chip
          label={match.completed ? 'Completed' : 'Scheduled'}
          color={match.completed ? 'success' : 'primary'}
        />
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {formatDate(match.scheduled_date)}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 2 }}>
            <Box sx={{ flex: 1, textAlign: 'center' }}>
              <Typography variant="h5">
                {player1 ? `${player1.first_name} ${player1.last_name}` : 'Unknown'}
              </Typography>
              {player1 && (
                <Typography variant="body2" color="text.secondary">
                  Rating: {player1.rating}
                </Typography>
              )}
            </Box>
            <Typography variant="h6" color="text.secondary">
              VS
            </Typography>
            <Box sx={{ flex: 1, textAlign: 'center' }}>
              <Typography variant="h5">
                {player2 ? `${player2.first_name} ${player2.last_name}` : 'Unknown'}
              </Typography>
              {player2 && (
                <Typography variant="body2" color="text.secondary">
                  Rating: {player2.rating}
                </Typography>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {match.completed && existingGames && existingGames.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Game Results
            </Typography>
            {existingGames.map((game, index) => {
              const winner = players?.find((p) => p.player_id === game.winner_id);
              return (
                <Box
                  key={game.game_id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    py: 1,
                    borderBottom: index < existingGames.length - 1 ? '1px solid #eee' : 'none',
                  }}
                >
                  <Typography>
                    Game {index + 1}: {winner?.first_name} {winner?.last_name} won
                  </Typography>
                  <Typography color="text.secondary">
                    {game.balls_remaining} balls remaining
                  </Typography>
                </Box>
              );
            })}
          </CardContent>
        </Card>
      )}

      {!match.completed && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Record Games</Typography>
              <Button startIcon={<AddIcon />} onClick={addGame}>
                Add Game
              </Button>
            </Box>

            {games.length === 0 ? (
              <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
                Click &quot;Add Game&quot; to start recording game results
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {games.map((game, index) => (
                  <Box key={index}>
                    {index > 0 && <Divider sx={{ mb: 2 }} />}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography sx={{ minWidth: 70 }}>Game {index + 1}</Typography>
                      <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>Winner</InputLabel>
                        <Select
                          value={game.winner_id}
                          label="Winner"
                          onChange={(e) => updateGame(index, 'winner_id', Number(e.target.value))}
                        >
                          <MenuItem value={match.player1_id}>
                            {player1?.first_name} {player1?.last_name}
                          </MenuItem>
                          <MenuItem value={match.player2_id}>
                            {player2?.first_name} {player2?.last_name}
                          </MenuItem>
                        </Select>
                      </FormControl>
                      <TextField
                        label="Balls Remaining"
                        type="number"
                        value={game.balls_remaining}
                        onChange={(e) =>
                          updateGame(index, 'balls_remaining', Number(e.target.value))
                        }
                        slotProps={{ htmlInput: { min: 1, max: 8 } }}
                        sx={{ width: 150 }}
                      />
                      <IconButton color="error" onClick={() => removeGame(index)}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}

            {games.length > 0 && (
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSubmit}
                  disabled={completeMatch.isPending}
                >
                  {completeMatch.isPending ? 'Saving...' : 'Complete Match'}
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
