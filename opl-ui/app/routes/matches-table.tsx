import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Typography,
} from '@mui/material';
import { Schedule as ScheduleIcon } from '@mui/icons-material';
import { useMatches, usePlayers, useScheduleRoundRobin } from '~/lib/queries';
import { MatchAccordion, MatchFilters, ScheduleDialog } from '~/components/matches';
import type { CompletionFilter } from '~/components/matches/match-filters';
import type { Player } from '~/lib/types';

const MatchesPage: React.FC = () => {
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [dateRange, setDateRange] = useState({ start: today, end: nextWeek });
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [divisionId, setDivisionId] = useState<number | null>(null);
  const [completionFilter, setCompletionFilter] = useState<CompletionFilter>('all');
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleData, setScheduleData] = useState({ division: 1, start_date: today });
  const [expandedMatch, setExpandedMatch] = useState<number | null>(null);

  const handleToggle = useCallback((matchId: number) => {
    setExpandedMatch((prev) => (prev === matchId ? null : matchId));
  }, []);

  const matchParams = useMemo(() => {
    const params: { start_date?: string; end_date?: string; player_id?: number; completed?: boolean } = {};
    if (dateRange.start) params.start_date = dateRange.start;
    if (dateRange.end) params.end_date = dateRange.end;
    if (selectedPlayer) params.player_id = selectedPlayer.player_id;
    if (completionFilter === 'completed') params.completed = true;
    if (completionFilter === 'scheduled') params.completed = false;
    return params;
  }, [dateRange, selectedPlayer, completionFilter]);

  const { data: matches, isLoading: matchesLoading, error: matchesError } = useMatches(matchParams);
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

    let filtered = [...matches];

    if (divisionId !== null && players) {
      const playerDivisionMap = new Map(
        players.map((p) => [p.player_id, p.division_id])
      );
      filtered = filtered.filter((match) => {
        const p1Division = playerDivisionMap.get(match.player1_id);
        const p2Division = playerDivisionMap.get(match.player2_id);
        return p1Division === divisionId || p2Division === divisionId;
      });
    }

    return filtered.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime();
    });
  }, [matches, divisionId, players]);

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

      <MatchFilters
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        selectedPlayer={selectedPlayer}
        onPlayerChange={setSelectedPlayer}
        divisionId={divisionId}
        onDivisionIdChange={setDivisionId}
        completionFilter={completionFilter}
        onCompletionFilterChange={setCompletionFilter}
        players={players ?? []}
      />

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : sortedMatches.length === 0 ? (
        <Card>
          <CardContent>
            <Typography color="text.secondary" align="center">
              No matches found for the selected filters
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
              onToggle={handleToggle}
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
};
