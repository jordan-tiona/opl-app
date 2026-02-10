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

import { useCreateDivision } from '~/lib/react-query'
import type { DivisionInput } from '~/lib/types'

const initialFormState: DivisionInput = {
    name: '',
    start_date: '',
    end_date: '',
    match_time: '19:00',
}

interface AddDivisionDialogProps {
    open: boolean
    onClose: () => void
}

export const AddDivisionDialog: React.FC<AddDivisionDialogProps> = ({ open, onClose }: AddDivisionDialogProps) => {
    const createDivision = useCreateDivision()
    const [formData, setFormData] = useState<DivisionInput>(initialFormState)

    useEffect(() => {
        if (open) {
            setFormData(initialFormState)
        }
    }, [open])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target

        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async () => {
        await createDivision.mutateAsync(formData)
        onClose()
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
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
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={
                        createDivision.isPending ||
                        !formData.name ||
                        !formData.start_date ||
                        !formData.end_date
                    }
                >
                    {createDivision.isPending ? 'Creating...' : 'Create Division'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
