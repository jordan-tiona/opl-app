import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Typography,
} from '@mui/material';
import {
  CalendarMonth as CalendarMonthIcon,
  Launch as LaunchIcon,
  EmojiEvents as EmojiEventsIcon,
  Groups as GroupsIcon,
  Schedule as ScheduleIcon,
  SportsScore as SportsScoreIcon,
} from '@mui/icons-material';
import { useMatches, useScores } from '~/lib/queries';
import type { Division, Player } from '~/lib/types';

interface DivisionCardProps {
  division: Division;
  players: Player[];
}

export const DivisionCard = ({ division, players }: DivisionCardProps) => {
  const navigate = useNavigate();
  const { data: matches } = useMatches({ division_id: division.division_id });
  const { data: scores } = useScores(division.division_id);

  const divisionPlayers = useMemo(
    () => players.filter((p) => p.division_id === division.division_id),
    [players, division.division_id],
  );

  const completedCount = matches?.filter((m) => m.completed).length ?? 0;
  const scheduledCount = matches?.filter((m) => !m.completed).length ?? 0;

  const topPlayersByScore = useMemo(() => {
    if (!scores) return [];
    const playerMap = new Map(divisionPlayers.map((p) => [p.player_id, p]));
    return [...scores]
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((s) => ({ player: playerMap.get(s.player_id)!, score: s.score }))
      .filter((entry) => entry.player != null);
  }, [scores, divisionPlayers]);

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography variant="h5" fontWeight={600}>
            {division.name}
          </Typography>
          <IconButton
            size="small"
            onClick={() => navigate(`/divisions/${division.division_id}`)}
          >
            <LaunchIcon />
          </IconButton>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, color: 'text.secondary' }}>
          <CalendarMonthIcon fontSize="small" />
          <Typography variant="body2">
            {division.start_date} &mdash; {division.end_date}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, color: 'text.secondary' }}>
          <ScheduleIcon fontSize="small" />
          <Typography variant="body2">
            Match time: {division.match_time}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <GroupsIcon fontSize="small" color="action" />
          <Typography variant="body2">
            {divisionPlayers.length} player{divisionPlayers.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <SportsScoreIcon fontSize="small" color="action" />
          <Typography variant="body2">
            {completedCount} completed, {scheduledCount} scheduled
          </Typography>
        </Box>

        {topPlayersByScore.length > 0 && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <EmojiEventsIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                Top scores
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {topPlayersByScore.map(({ player, score }) => (
                <Chip
                  key={player.player_id}
                  label={`${player.first_name} ${player.last_name} (${score}pts)`}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
