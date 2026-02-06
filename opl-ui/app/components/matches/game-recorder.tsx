import { useState } from 'react';
import {
  Box,
  Button,
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
  Delete as DeleteIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useCompleteMatch } from '~/lib/queries';
import type { Player, GameInput } from '~/lib/types';

interface GameRecorderProps {
  matchId: number;
  player1: Player;
  player2: Player;
}

export function GameRecorder({ matchId, player1, player2 }: GameRecorderProps) {
  const completeMatch = useCompleteMatch();
  const [games, setGames] = useState<GameInput[]>([]);

  const addGame = () => {
    setGames((prev) => [
      ...prev,
      { winner_id: player1.player_id, loser_id: player2.player_id, balls_remaining: 1 },
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
          const loserId = value === player1.player_id ? player2.player_id : player1.player_id;
          return { ...game, winner_id: value, loser_id: loserId };
        }
        return { ...game, [field]: value };
      })
    );
  };

  const handleSubmit = async () => {
    if (games.length === 0) return;
    await completeMatch.mutateAsync({ id: matchId, games });
    setGames([]);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={600}>
          Record Games
        </Typography>
        <Button startIcon={<AddIcon />} onClick={addGame} size="small">
          Add Game
        </Button>
      </Box>

      {games.length === 0 ? (
        <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
          Click "Add Game" to start recording game results
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {games.map((game, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Typography sx={{ minWidth: 60 }}>Game {index + 1}</Typography>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Winner</InputLabel>
                <Select
                  value={game.winner_id}
                  label="Winner"
                  onChange={(e) => updateGame(index, 'winner_id', Number(e.target.value))}
                >
                  <MenuItem value={player1.player_id}>
                    {player1.first_name} {player1.last_name}
                  </MenuItem>
                  <MenuItem value={player2.player_id}>
                    {player2.first_name} {player2.last_name}
                  </MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Balls"
                type="number"
                size="small"
                value={game.balls_remaining}
                onChange={(e) => updateGame(index, 'balls_remaining', Number(e.target.value))}
                slotProps={{ htmlInput: { min: 1, max: 8 } }}
                sx={{ width: 80 }}
              />
              <IconButton color="error" size="small" onClick={() => removeGame(index)}>
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}

      {games.length > 0 && (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSubmit}
            disabled={completeMatch.isPending}
            size="small"
          >
            {completeMatch.isPending ? 'Saving...' : 'Complete Match'}
          </Button>
        </Box>
      )}
    </Box>
  );
}
