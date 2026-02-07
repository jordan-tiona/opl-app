import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  CalendarMonth as CalendarMonthIcon,
  Edit as EditIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useDivisions, useCreateDivision } from '~/lib/queries';
import type { DivisionInput } from '~/lib/types';

const initialFormState: DivisionInput = {
  name: '',
  start_date: '',
  end_date: '',
  match_time: '19:00',
};

export const DivisionsPage = () => {
  const navigate = useNavigate();
  const { data: divisions, isLoading, error } = useDivisions();
  const createDivision = useCreateDivision();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<DivisionInput>(initialFormState);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    await createDivision.mutateAsync(formData);
    setDialogOpen(false);
    setFormData(initialFormState);
  };

  if (error) {
    return <Alert severity="error">Failed to load divisions: {error.message}</Alert>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h3">Divisions</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          New Division
        </Button>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {divisions?.map((division) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={division.division_id}>
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
                      <EditIcon />
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
                </CardContent>
              </Card>
            </Grid>
          ))}
          {divisions?.length === 0 && (
            <Grid size={{ xs: 12 }}>
              <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                No divisions yet. Create one to get started.
              </Typography>
            </Grid>
          )}
        </Grid>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Division</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              fullWidth
              required
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Start Date"
                name="start_date"
                type="date"
                value={formData.start_date}
                onChange={handleInputChange}
                fullWidth
                required
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="End Date"
                name="end_date"
                type="date"
                value={formData.end_date}
                onChange={handleInputChange}
                fullWidth
                required
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>
            <TextField
              label="Match Time"
              name="match_time"
              type="time"
              value={formData.match_time}
              onChange={handleInputChange}
              fullWidth
              required
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={createDivision.isPending || !formData.name || !formData.start_date || !formData.end_date}
          >
            {createDivision.isPending ? 'Creating...' : 'Create Division'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default DivisionsPage;
