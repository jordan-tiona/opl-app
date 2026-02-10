import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useDivisions, usePlayer, useUpdatePlayer } from '~/lib/react-query';
import type { Player } from '~/lib/types';

export const PlayerDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const playerId = Number(id);

  const { data: player, isLoading, error } = usePlayer(playerId);
  const { data: divisions } = useDivisions();
  const updatePlayer = useUpdatePlayer();

  const [formData, setFormData] = useState<Partial<Player>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (player) {
      setFormData(player);
    }
  }, [player]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'rating' || name === 'games_played' || name === 'division_id'
          ? value
            ? Number(value)
            : null
          : value,
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    await updatePlayer.mutateAsync({ id: playerId, data: formData });
    setHasChanges(false);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Failed to load player: {error.message}</Alert>;
  }

  if (!player) {
    return <Alert severity="warning">Player not found</Alert>;
  }

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/players')}
        sx={{ mb: 2 }}
      >
        Back to Players
      </Button>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h3">
          {player.first_name} {player.last_name}
        </Typography>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={!hasChanges || updatePlayer.isPending}
        >
          {updatePlayer.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>

      {updatePlayer.isSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Player updated successfully
        </Alert>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Player Information
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="First Name"
                name="first_name"
                value={formData.first_name ?? ''}
                onChange={handleInputChange}
                fullWidth
              />
              <TextField
                label="Last Name"
                name="last_name"
                value={formData.last_name ?? ''}
                onChange={handleInputChange}
                fullWidth
              />
            </Box>
            <TextField
              label="Email"
              name="email"
              type="email"
              value={formData.email ?? ''}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              label="Phone"
              name="phone"
              value={formData.phone ?? ''}
              onChange={handleInputChange}
              fullWidth
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Rating"
                name="rating"
                type="number"
                value={formData.rating ?? ''}
                onChange={handleInputChange}
                fullWidth
              />
              <TextField
                label="Games Played"
                name="games_played"
                type="number"
                value={formData.games_played ?? ''}
                onChange={handleInputChange}
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Division</InputLabel>
                <Select
                  value={formData.division_id != null ? String(formData.division_id) : ''}
                  label="Division"
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      division_id: e.target.value === '' ? null : Number(e.target.value),
                    }));
                    setHasChanges(true);
                  }}
                >
                  <MenuItem value="">None</MenuItem>
                  {divisions?.map((d) => (
                    <MenuItem key={d.division_id} value={String(d.division_id)}>
                      {d.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default PlayerDetailPage
