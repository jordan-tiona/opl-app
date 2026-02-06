import { Box, Typography } from '@mui/material';
import type { Game, Player } from '~/lib/types';

interface GameResultsProps {
  games: Game[];
  players: Player[];
}

export function GameResults({ games, players }: GameResultsProps) {
  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Game Results
      </Typography>
      {games.map((game, index) => {
        const winner = players.find((p) => p.player_id === game.winner_id);
        return (
          <Box
            key={game.game_id}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              py: 1,
              borderBottom: index < games.length - 1 ? '1px solid #eee' : 'none',
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
    </Box>
  );
}
