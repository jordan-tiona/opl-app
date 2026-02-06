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
import { getMatchWeight } from '~/lib/utils';
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
  const [p1Weight, p2Weight] = getMatchWeight(match.player1_rating, match.player2_rating);

  return (
    <Accordion expanded={expanded} onChange={onToggle}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', pr: 2 }}>
          <Typography color="text.secondary" sx={{ minWidth: 140 }}>
            {formatDate(match.scheduled_date)}
          </Typography>
          <Typography sx={{ flex: 1 }}>
            {player1 ? `${player1.first_name} ${player1.last_name} (${match.player1_rating})` : 'Unknown'}
            {' vs '}
            {player2 ? `${player2.first_name} ${player2.last_name} (${match.player2_rating})` : 'Unknown'}
          </Typography>
          <Typography color="text.secondary" sx={{ minWidth: 50, textAlign: 'center' }}>
            {p1Weight}-{p2Weight}
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
            <Typography variant="body2" color="text.secondary">
              Rating: {match.player1_rating}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              VS
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {p1Weight}-{p2Weight}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6">
              {player2 ? `${player2.first_name} ${player2.last_name}` : 'Unknown'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Rating: {match.player2_rating}
            </Typography>
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
