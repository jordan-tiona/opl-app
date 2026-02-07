import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ContentCopy as ContentCopyIcon,
  Edit as EditIcon,
  PersonAdd as PersonAddIcon,
  Save as SaveIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import {
  useCreateDivision,
  useDivision,
  usePlayers,
  useScheduleRoundRobin,
  useUpdateDivision,
  useUpdatePlayer,
} from '~/lib/queries';
import type { Division, DivisionInput, Player } from '~/lib/types';

export const DivisionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const divisionId = Number(id);

  const { data: division, isLoading, error } = useDivision(divisionId);
  const { data: allPlayers } = usePlayers();
  const updateDivision = useUpdateDivision();
  const updatePlayer = useUpdatePlayer();
  const createDivision = useCreateDivision();
  const scheduleRoundRobin = useScheduleRoundRobin();

  const [formData, setFormData] = useState<Partial<Division>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [addPlayerOpen, setAddPlayerOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [newDivisionOpen, setNewDivisionOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleStartDate, setScheduleStartDate] = useState('');
  const [newDivisionForm, setNewDivisionForm] = useState<DivisionInput>({
    name: '',
    start_date: '',
    end_date: '',
    match_time: '19:00',
  });

  useEffect(() => {
    if (division) {
      setFormData(division);
    }
  }, [division]);

  const divisionPlayers = useMemo(
    () => allPlayers?.filter((p) => p.division_id === divisionId) ?? [],
    [allPlayers, divisionId],
  );

  const availablePlayers = useMemo(
    () => allPlayers?.filter((p) => p.division_id !== divisionId) ?? [],
    [allPlayers, divisionId],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    await updateDivision.mutateAsync({ id: divisionId, data: formData });
    setHasChanges(false);
  };

  const handleAddPlayer = async () => {
    if (!selectedPlayer) return;
    await updatePlayer.mutateAsync({
      id: selectedPlayer.player_id,
      data: { ...selectedPlayer, division_id: divisionId },
    });
    setSelectedPlayer(null);
    setAddPlayerOpen(false);
  };

  const handleSchedule = async () => {
    await scheduleRoundRobin.mutateAsync({
      division: divisionId,
      start_date: `${scheduleStartDate}T00:00:00`,
    });
    setScheduleOpen(false);
    setScheduleStartDate('');
  };

  const handleNewDivisionWithPlayers = async () => {
    const newDivision = await createDivision.mutateAsync(newDivisionForm);
    await Promise.all(
      divisionPlayers.map((p) =>
        updatePlayer.mutateAsync({
          id: p.player_id,
          data: { ...p, division_id: newDivision.division_id },
        }),
      ),
    );
    setNewDivisionOpen(false);
    navigate(`/divisions/${newDivision.division_id}`);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Failed to load division: {error.message}</Alert>;
  }

  if (!division) {
    return <Alert severity="warning">Division not found</Alert>;
  }

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/divisions')}
        sx={{ mb: 2 }}
      >
        Back to Divisions
      </Button>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h3">{division.name}</Typography>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={!hasChanges || updateDivision.isPending}
        >
          {updateDivision.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>

      {updateDivision.isSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Division updated successfully
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Division Details
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Name"
              name="name"
              value={formData.name ?? ''}
              onChange={handleInputChange}
              fullWidth
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Start Date"
                name="start_date"
                type="date"
                value={formData.start_date ?? ''}
                onChange={handleInputChange}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="End Date"
                name="end_date"
                type="date"
                value={formData.end_date ?? ''}
                onChange={handleInputChange}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>
            <TextField
              label="Match Time"
              name="match_time"
              type="time"
              value={formData.match_time ?? ''}
              onChange={handleInputChange}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Players ({divisionPlayers.length})
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<PersonAddIcon />}
                onClick={() => setAddPlayerOpen(true)}
              >
                Add Player
              </Button>
              <Button
                variant="outlined"
                startIcon={<ScheduleIcon />}
                onClick={() => {
                  setScheduleStartDate(division.start_date);
                  setScheduleOpen(true);
                }}
                disabled={divisionPlayers.length === 0}
              >
                Schedule Round Robin
              </Button>
              <Button
                variant="outlined"
                startIcon={<ContentCopyIcon />}
                onClick={() => {
                  setNewDivisionForm({
                    name: '',
                    start_date: '',
                    end_date: '',
                    match_time: division.match_time,
                  });
                  setNewDivisionOpen(true);
                }}
                disabled={divisionPlayers.length === 0}
              >
                New Division with Same Players
              </Button>
            </Box>
          </Box>

          {divisionPlayers.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell align="right">Rating</TableCell>
                    <TableCell align="right">Games Played</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {divisionPlayers.map((player) => (
                    <TableRow key={player.player_id} hover>
                      <TableCell>
                        {player.first_name} {player.last_name}
                      </TableCell>
                      <TableCell>{player.email}</TableCell>
                      <TableCell align="right">{player.rating}</TableCell>
                      <TableCell align="right">{player.games_played}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/players/${player.player_id}`)}
                        >
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
              No players in this division yet.
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Add Player Dialog */}
      <Dialog open={addPlayerOpen} onClose={() => setAddPlayerOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Player to Division</DialogTitle>
        <DialogContent>
          <Autocomplete
            sx={{ mt: 1 }}
            options={availablePlayers}
            getOptionLabel={(p) => `${p.first_name} ${p.last_name}`}
            value={selectedPlayer}
            onChange={(_, value) => setSelectedPlayer(value)}
            renderInput={(params) => (
              <TextField {...params} label="Select Player" fullWidth />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddPlayerOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddPlayer}
            disabled={!selectedPlayer || updatePlayer.isPending}
          >
            {updatePlayer.isPending ? 'Adding...' : 'Add Player'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Schedule Round Robin Dialog */}
      <Dialog open={scheduleOpen} onClose={() => setScheduleOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule Round Robin</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Start Date"
              type="date"
              value={scheduleStartDate}
              onChange={(e) => setScheduleStartDate(e.target.value)}
              fullWidth
              required
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSchedule}
            disabled={scheduleRoundRobin.isPending || !scheduleStartDate}
          >
            {scheduleRoundRobin.isPending ? 'Scheduling...' : 'Generate Schedule'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Division with Same Players Dialog */}
      <Dialog open={newDivisionOpen} onClose={() => setNewDivisionOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Division with Same Players</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This will create a new division and move all {divisionPlayers.length} players from
            &ldquo;{division.name}&rdquo; to it.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Name"
              name="name"
              value={newDivisionForm.name}
              onChange={(e) =>
                setNewDivisionForm((prev) => ({ ...prev, name: e.target.value }))
              }
              fullWidth
              required
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Start Date"
                name="start_date"
                type="date"
                value={newDivisionForm.start_date}
                onChange={(e) =>
                  setNewDivisionForm((prev) => ({ ...prev, start_date: e.target.value }))
                }
                fullWidth
                required
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="End Date"
                name="end_date"
                type="date"
                value={newDivisionForm.end_date}
                onChange={(e) =>
                  setNewDivisionForm((prev) => ({ ...prev, end_date: e.target.value }))
                }
                fullWidth
                required
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>
            <TextField
              label="Match Time"
              name="match_time"
              type="time"
              value={newDivisionForm.match_time}
              onChange={(e) =>
                setNewDivisionForm((prev) => ({ ...prev, match_time: e.target.value }))
              }
              fullWidth
              required
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewDivisionOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleNewDivisionWithPlayers}
            disabled={
              createDivision.isPending ||
              updatePlayer.isPending ||
              !newDivisionForm.name ||
              !newDivisionForm.start_date ||
              !newDivisionForm.end_date
            }
          >
            {createDivision.isPending || updatePlayer.isPending
              ? 'Creating...'
              : 'Create & Move Players'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default DivisionDetailPage;
