import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  TextField,
  Typography,
} from '@mui/material';
import {
  CalendarToday as CalendarTodayIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useMatches, usePlayers, useScheduleRoundRobin } from '~/lib/queries';
import { MatchAccordion, ScheduleDialog } from '~/components/matches';

export default function MatchesPage() {
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [dateRange, setDateRange] = useState({ start: today, end: nextWeek });
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleData, setScheduleData] = useState({ division: 1, start_date: today });
  const [expandedMatch, setExpandedMatch] = useState<number | null>(null);

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
        <Box>
          {sortedMatches.map((match) => (
            <MatchAccordion
              key={match.match_id}
              match={match}
              players={players ?? []}
              expanded={expandedMatch === match.match_id}
              onToggle={() => setExpandedMatch(expandedMatch === match.match_id ? null : match.match_id)}
            />
          ))}
        </Box>
      )}

      <ScheduleDialog
        open={scheduleDialogOpen}
        onClose={() => setScheduleDialogOpen(false)}
        scheduleData={scheduleData}
        onScheduleDataChange={setScheduleData}
        onSubmit={handleSchedule}
        isPending={scheduleRoundRobin.isPending}
      />
    </Box>
  );
}
