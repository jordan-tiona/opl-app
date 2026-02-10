import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
} from '@mui/material'
import { useEffect, useState } from 'react'

import { useDivisions, useCreatePlayer } from '~/lib/react-query'
import type { PlayerInput } from '~/lib/types'

const initialFormState: PlayerInput = {
    division_id: null,
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
    const { data: divisions } = useDivisions()
    const createPlayer = useCreatePlayer()

    const [formData, setFormData] = useState<PlayerInput>({
        ...initialFormState,
        division_id: divisionId ?? null,
    })

    useEffect(() => {
        if (open) {
            setFormData({ ...initialFormState, division_id: divisionId ?? null })
        }
    }, [open, divisionId])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target

        setFormData((prev) => ({
            ...prev,
            [name]: name === 'rating' ? (value ? Number(value) : null) : value,
        }))
    }

    const handleSubmit = async () => {
        await createPlayer.mutateAsync(formData)
        onClose()
        setFormData(initialFormState)
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
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            label="Starting Rating"
                            name="rating"
                            type="number"
                            value={formData.rating}
                            onChange={handleInputChange}
                            fullWidth
                        />
                        <FormControl fullWidth>
                            <InputLabel>Division</InputLabel>
                            <Select
                                value={
                                    formData.division_id != null ? String(formData.division_id) : ''
                                }
                                label="Division"
                                onChange={(e) => {
                                    setFormData((prev) => ({
                                        ...prev,
                                        division_id:
                                            e.target.value === '' ? null : Number(e.target.value),
                                    }))
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
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={createPlayer.isPending || !formData.first_name || !formData.last_name}
                >
                    {createPlayer.isPending ? 'Creating...' : 'Create Player'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
