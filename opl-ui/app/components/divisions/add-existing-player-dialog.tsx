import { PersonAdd as PersonAddIcon } from '@mui/icons-material'
import {
    Autocomplete,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
} from '@mui/material'
import { useState } from 'react'

import { useAddPlayerToDivision } from '~/lib/react-query'
import { useSnackbar } from '~/lib/snackbar'
import type { Player } from '~/lib/types'

interface AddExistingPlayerDialogProps {
    open: boolean
    onClose: () => void
    divisionId: number
    availablePlayers: Player[]
    onCreateNewPlayer: () => void
}

export const AddExistingPlayerDialog: React.FC<AddExistingPlayerDialogProps> = ({
    open,
    onClose,
    divisionId,
    availablePlayers,
    onCreateNewPlayer,
}: AddExistingPlayerDialogProps) => {
    const addPlayer = useAddPlayerToDivision()
    const { showSnackbar } = useSnackbar()
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)

    const handleSubmit = async () => {
        if (!selectedPlayer) {
            return
        }

        try {
            await addPlayer.mutateAsync({
                divisionId,
                playerId: selectedPlayer.player_id,
            })
            showSnackbar('Player added to division', 'success')
            setSelectedPlayer(null)
            onClose()
        } catch (err) {
            showSnackbar(err instanceof Error ? err.message : 'Failed to add player', 'error')
        }
    }

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
                        onClose()
                        onCreateNewPlayer()
                    }}
                    sx={{ mr: 'auto' }}
                >
                    Create New Player
                </Button>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={!selectedPlayer || addPlayer.isPending}
                >
                    {addPlayer.isPending ? 'Adding...' : 'Add Player'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
