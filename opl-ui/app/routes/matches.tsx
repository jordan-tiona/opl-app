import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import {
  CalendarToday as CalendarTodayIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useMatches, usePlayers, useScheduleRoundRobin } from '~/lib/queries';
import type { Match, Player } from '~/lib/types';

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

interface MatchCardProps {
  match: Match;
  players: Player[];
  onView: () => void;
}

function MatchCard({ match, players, onView }: MatchCardProps) {
  const player1 = players.find((p) => p.player_id === match.player1_id);
  const player2 = players.find((p) => p.player_id === match.player2_id);

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {formatDate(match.scheduled_date)}
          </Typography>
          <Chip
            label={match.completed ? 'Completed' : 'Scheduled'}
            color={match.completed ? 'success' : 'primary'}
            size="small"
          />
        </Box>
        <Typography variant="h6">
          {player1 ? `${player1.first_name} ${player1.last_name}` : 'Unknown'}
        </Typography>
        <Typography color="text.secondary" sx={{ my: 1 }}>
          vs
        </Typography>
        <Typography variant="h6">
          {player2 ? `${player2.first_name} ${player2.last_name}` : 'Unknown'}
        </Typography>
      </CardContent>
      <CardActions>
        <Button size="small" onClick={onView}>
          {match.completed ? 'View Results' : 'Record Games'}
        </Button>
      </CardActions>
    </Card>
  );
}

export default function MatchesPage() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [dateRange, setDateRange] = useState({ start: today, end: nextWeek });
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleData, setScheduleData] = useState({ division: 1, start_date: today });

  const { data: matches, isLoading: matchesLoading, error: matchesError } = useMatches({
    start_date: dateRange.start,
    end_date: dateRange.end,
  });
  const { data: players, isLoading: playersLoading } = usePlayers();
  const scheduleRoundRobin = useScheduleRoundRobin();

  const isLoading = matchesLoading || playersLoading;

  const handleSchedule = async () => {
    await scheduleRoundRobin.mutateAsync({
      division: scheduleData.division,
      start_date: `${scheduleData.start_date}T00:00:00`,
    });
    setScheduleDialogOpen(false);
  };

  const sortedMatches = useMemo(() => {
    if (!matches) return [];
    return [...matches].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime();
    });
  }, [matches]);

  if (matchesError) {
    return <Alert severity="error">Failed to load matches: {matchesError.message}</Alert>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h3">Matches</Typography>
        <Button
          variant="contained"
          startIcon={<ScheduleIcon />}
          onClick={() => setScheduleDialogOpen(true)}
        >
          Schedule Round Robin
        </Button>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <CalendarTodayIcon color="action" />
        <TextField
          label="From"
          type="date"
          value={dateRange.start}
          onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
          size="small"
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <Typography color="text.secondary">to</Typography>
        <TextField
          label="To"
          type="date"
          value={dateRange.end}
          onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
          size="small"
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : sortedMatches.length === 0 ? (
        <Card>
          <CardContent>
            <Typography color="text.secondary" align="center">
              No matches scheduled for this date range
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {sortedMatches.map((match) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={match.match_id}>
              <MatchCard
                match={match}
                players={players ?? []}
                onView={() => navigate(`/matches/${match.match_id}`)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={scheduleDialogOpen} onClose={() => setScheduleDialogOpen(false)}>
        <DialogTitle>Schedule Round Robin</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, minWidth: 300 }}>
            <TextField
              label="Division"
              type="number"
              value={scheduleData.division}
              onChange={(e) =>
                setScheduleData((prev) => ({ ...prev, division: Number(e.target.value) }))
              }
              fullWidth
            />
            <TextField
              label="Start Date"
              type="date"
              value={scheduleData.start_date}
              onChange={(e) =>
                setScheduleData((prev) => ({ ...prev, start_date: e.target.value }))
              }
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSchedule}
            disabled={scheduleRoundRobin.isPending}
          >
            {scheduleRoundRobin.isPending ? 'Scheduling...' : 'Generate Schedule'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
