import { useState } from 'react';
import {
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import { PersonAdd as PersonAddIcon } from '@mui/icons-material';
import { useUpdatePlayer } from '~/lib/react-query';
import type { Player } from '~/lib/types';

interface AddExistingPlayerDialogProps {
  open: boolean;
  onClose: () => void;
  divisionId: number;
  availablePlayers: Player[];
  onCreateNewPlayer: () => void;
}

export const AddExistingPlayerDialog = ({
  open,
  onClose,
  divisionId,
  availablePlayers,
  onCreateNewPlayer,
}: AddExistingPlayerDialogProps) => {
  const updatePlayer = useUpdatePlayer();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const handleSubmit = async () => {
    if (!selectedPlayer) return;
    await updatePlayer.mutateAsync({
      id: selectedPlayer.player_id,
      data: { ...selectedPlayer, division_id: divisionId },
    });
    setSelectedPlayer(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
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
        <Button
          startIcon={<PersonAddIcon />}
          onClick={() => {
            onClose();
            onCreateNewPlayer();
          }}
          sx={{ mr: 'auto' }}
        >
          Create New Player
        </Button>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!selectedPlayer || updatePlayer.isPending}
        >
          {updatePlayer.isPending ? 'Adding...' : 'Add Player'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
