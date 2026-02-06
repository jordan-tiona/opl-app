import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Divider,
  Typography,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { useGames } from '~/lib/queries';
import { GameResults } from './game-results';
import { GameRecorder } from './game-recorder';
import type { Match, Player } from '~/lib/types';

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

interface MatchAccordionProps {
  match: Match;
  players: Player[];
  expanded: boolean;
  onToggle: () => void;
}

export function MatchAccordion({ match, players, expanded, onToggle }: MatchAccordionProps) {
  const player1 = players.find((p) => p.player_id === match.player1_id);
  const player2 = players.find((p) => p.player_id === match.player2_id);

  const { data: existingGames } = useGames(expanded ? match.match_id : 0);

  return (
    <Accordion expanded={expanded} onChange={onToggle}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', pr: 2 }}>
          <Typography color="text.secondary" sx={{ minWidth: 140 }}>
            {formatDate(match.scheduled_date)}
          </Typography>
          <Typography sx={{ flex: 1 }}>
            {player1 ? `${player1.first_name} ${player1.last_name}` : 'Unknown'}
            {' vs '}
            {player2 ? `${player2.first_name} ${player2.last_name}` : 'Unknown'}
          </Typography>
          <Chip
            label={match.completed ? 'Completed' : 'Scheduled'}
            color={match.completed ? 'success' : 'primary'}
            size="small"
          />
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, mb: 3, justifyContent: 'center' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6">
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
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6">
              {player2 ? `${player2.first_name} ${player2.last_name}` : 'Unknown'}
            </Typography>
            {player2 && (
              <Typography variant="body2" color="text.secondary">
                Rating: {player2.rating}
              </Typography>
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {match.completed && existingGames && existingGames.length > 0 ? (
          <GameResults games={existingGames} players={players} />
        ) : player1 && player2 ? (
          <GameRecorder matchId={match.match_id} player1={player1} player2={player2} />
        ) : null}
      </AccordionDetails>
    </Accordion>
  );
}
