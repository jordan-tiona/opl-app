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

import { useCreateDivision } from '~/lib/react-query'
import { useSnackbar } from '~/lib/snackbar'
import type { DivisionInput } from '~/lib/types'

const DAYS_OF_WEEK = [
    { value: 0, label: 'Monday' },
    { value: 1, label: 'Tuesday' },
    { value: 2, label: 'Wednesday' },
    { value: 3, label: 'Thursday' },
    { value: 4, label: 'Friday' },
    { value: 5, label: 'Saturday' },
    { value: 6, label: 'Sunday' },
]

const initialFormState: DivisionInput = {
    name: '',
    day_of_week: 0,
    active: true,
}

interface AddDivisionDialogProps {
    open: boolean
    onClose: () => void
}

export const AddDivisionDialog: React.FC<AddDivisionDialogProps> = ({ open, onClose }: AddDivisionDialogProps) => {
    const createDivision = useCreateDivision()
    const { showSnackbar } = useSnackbar()
    const [formData, setFormData] = useState<DivisionInput>(initialFormState)

    useEffect(() => {
        if (open) {
            setFormData(initialFormState)
        }
    }, [open])

    const handleSubmit = async () => {
        try {
            await createDivision.mutateAsync(formData)
            showSnackbar('Division created', 'success')
            onClose()
        } catch (err) {
            showSnackbar(err instanceof Error ? err.message : 'Failed to create division', 'error')
        }
    }

    return (
        <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose}>
            <DialogTitle>New Division</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <TextField
                        fullWidth
                        required
                        label="Name"
                        name="name"
                        value={formData.name}
                        onChange={(e) =>
                            setFormData((prev) => ({ ...prev, name: e.target.value }))
                        }
                    />
                    <FormControl fullWidth>
                        <InputLabel>Day of Week</InputLabel>
                        <Select
                            label="Day of Week"
                            value={formData.day_of_week}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    day_of_week: e.target.value as number,
                                }))
                            }
                        >
                            {DAYS_OF_WEEK.map((d) => (
                                <MenuItem key={d.value} value={d.value}>
                                    {d.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    disabled={createDivision.isPending || !formData.name}
                    variant="contained"
                    onClick={handleSubmit}
                >
                    {createDivision.isPending ? 'Creating...' : 'Create Division'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
