import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
} from '@mui/material'
import { useEffect, useState } from 'react'

import { useAddPlayerToDivision, useCreatePlayer } from '~/lib/react-query'
import { useSnackbar } from '~/lib/snackbar'
import type { PlayerInput } from '~/lib/types'

const initialFormState: PlayerInput = {
    first_name: '',
    last_name: '',
    rating: 600,
    games_played: 0,
    phone: '',
    email: '',
}

interface AddPlayerDialogProps {
    open: boolean
    onClose: () => void
    divisionId?: number
}

export const AddPlayerDialog: React.FC<AddPlayerDialogProps> = ({ open, onClose, divisionId }: AddPlayerDialogProps) => {
    const createPlayer = useCreatePlayer()
    const addPlayerToDivision = useAddPlayerToDivision()
    const { showSnackbar } = useSnackbar()

    const [formData, setFormData] = useState<PlayerInput>({ ...initialFormState })

    useEffect(() => {
        if (open) {
            setFormData({ ...initialFormState })
        }
    }, [open])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target

        setFormData((prev) => ({
            ...prev,
            [name]: name === 'rating' ? (value ? Number(value) : null) : value,
        }))
    }

    const handleSubmit = async () => {
        try {
            const player = await createPlayer.mutateAsync(formData)

            if (divisionId && player.player_id) {
                await addPlayerToDivision.mutateAsync({
                    divisionId,
                    playerId: player.player_id,
                })
            }

            showSnackbar('Player created', 'success')
            onClose()
            setFormData(initialFormState)
        } catch (err) {
            showSnackbar(err instanceof Error ? err.message : 'Failed to create player', 'error')
        }
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Add New Player</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            label="First Name"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleInputChange}
                            fullWidth
                            required
                        />
                        <TextField
                            label="Last Name"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleInputChange}
                            fullWidth
                            required
                        />
                    </Box>
                    <TextField
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        fullWidth
                        required
                    />
                    <TextField
                        label="Phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        fullWidth
                        required
                    />
                    <TextField
                        label="Starting Rating"
                        name="rating"
                        type="number"
                        value={formData.rating}
                        onChange={handleInputChange}
                        fullWidth
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={createPlayer.isPending || addPlayerToDivision.isPending || !formData.first_name || !formData.last_name}
                >
                    {createPlayer.isPending || addPlayerToDivision.isPending ? 'Creating...' : 'Create Player'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
