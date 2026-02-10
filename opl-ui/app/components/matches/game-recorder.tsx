import { useEffect, useRef, useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useCompleteMatch } from '~/lib/react-query';
import { getMatchWeight } from '~/lib/utils';
import type { GameInput, Player } from '~/lib/types';

interface GameScore {
  player1Score: number;
  player2Score: number;
}

interface GameRecorderProps {
  matchId: number;
  player1: Player;
  player2: Player;
}

export const GameRecorder: React.FC<GameRecorderProps> = ({ matchId, player1, player2 }: GameRecorderProps) => {
  const completeMatch = useCompleteMatch();
  const [games, setGames] = useState<GameScore[]>([]);
  const [p1Weight, p2Weight] = getMatchWeight(player1.rating, player2.rating);
  const p1Options = Array.from({ length: p1Weight + 1 }, (_, i) => String(i));
  const p2Options = Array.from({ length: p2Weight + 1 }, (_, i) => String(i));
  const lastGameRef = useRef<HTMLInputElement>(null);
  const [focusLastGame, setFocusLastGame] = useState(false);

  useEffect(() => {
    if (focusLastGame && lastGameRef.current) {
      lastGameRef.current.focus();
      lastGameRef.current.select();
      setFocusLastGame(false);
    }
  }, [focusLastGame, games.length]);

  const addGame = () => {
    setGames((prev) => [...prev, { player1Score: 0, player2Score: 0 }]);
    setFocusLastGame(true);
  };

  const removeGame = (index: number) => {
    setGames((prev) => prev.filter((_, i) => i !== index));
  };

  const updateScore = (index: number, player: 'player1Score' | 'player2Score', value: string | number) => {
    const numValue = Math.max(0, Number(value) || 0);
    setGames((prev) =>
      prev.map((game, i) => (i === index ? { ...game, [player]: numValue } : game))
    );
  };

  const isValidGame = (game: GameScore): boolean => {
    const p1AtWeight = game.player1Score === p1Weight && game.player2Score < p2Weight;
    const p2AtWeight = game.player2Score === p2Weight && game.player1Score < p1Weight;
    return p1AtWeight || p2AtWeight;
  };

  const convertToGameInput = (game: GameScore): GameInput => {
    if (game.player1Score === p1Weight) {
      return {
        winner_id: player1.player_id,
        loser_id: player2.player_id,
        balls_remaining: p2Weight - game.player2Score,
      };
    } else {
      return {
        winner_id: player2.player_id,
        loser_id: player1.player_id,
        balls_remaining: p1Weight - game.player1Score,
      };
    }
  };

  const handleSubmit = async () => {
    if (games.length === 0) return;
    const gameInputs = games.map(convertToGameInput);
    await completeMatch.mutateAsync({ id: matchId, games: gameInputs });
    setGames([]);
  };

  const allGamesValid = games.length > 0 && games.every(isValidGame);

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
        Record Games
      </Typography>

      {games.length === 0 ? (
        <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
          Click "Add Game" to start recording game results
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {games.map((game, index) => {
            const valid = isValidGame(game);
            return (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography color="text.secondary" sx={{ minWidth: 60 }}>
                  Game {index + 1}:
                </Typography>
                <Typography sx={{ minWidth: 120 }}>
                  {player1.first_name} {player1.last_name}
                </Typography>
                <Autocomplete
                  freeSolo
                  autoSelect
                  size="small"
                  options={p1Options}
                  value={String(game.player1Score)}
                  onChange={(_, value) => updateScore(index, 'player1Score', value ?? 0)}
                  onInputChange={(_, value, reason) => {
                    if (reason === 'input') updateScore(index, 'player1Score', value);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      error={!valid && game.player1Score > 0}
                      inputRef={index === games.length - 1 ? lastGameRef : undefined}
                    />
                  )}
                  disableClearable
                  sx={{ width: 80 }}
                />
                <Typography fontWeight={600}>:</Typography>
                <Autocomplete
                  freeSolo
                  autoSelect
                  size="small"
                  options={p2Options}
                  value={String(game.player2Score)}
                  onChange={(_, value) => updateScore(index, 'player2Score', value ?? 0)}
                  onInputChange={(_, value, reason) => {
                    if (reason === 'input') updateScore(index, 'player2Score', value);
                  }}
                  renderInput={(params) => (
                    <TextField {...params} error={!valid && game.player2Score > 0} />
                  )}
                  disableClearable
                  sx={{ width: 80 }}
                />
                <Typography sx={{ minWidth: 120 }}>
                  {player2.first_name} {player2.last_name}
                </Typography>
                <IconButton color="error" size="small" onClick={() => removeGame(index)} tabIndex={-1}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            );
          })}
        </Box>
      )}

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button startIcon={<AddIcon />} onClick={addGame} size="small">
          Add Game
        </Button>
        {games.length > 0 && (
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSubmit}
            disabled={completeMatch.isPending || !allGamesValid}
            size="small"
          >
            {completeMatch.isPending ? 'Saving...' : 'Complete Match'}
          </Button>
        )}
      </Box>
    </Box>
  );
}
