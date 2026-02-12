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

import { useCreateSession, useDivisions } from '~/lib/react-query'
import { useSnackbar } from '~/lib/snackbar'
import type { SessionInput } from '~/lib/types'

const initialFormState: SessionInput = {
    division_id: 0,
    name: '',
    start_date: '',
    end_date: '',
    match_time: '19:00',
    active: true,
}

interface AddSessionDialogProps {
    open: boolean
    onClose: () => void
    defaultDivisionId?: number
}

export const AddSessionDialog: React.FC<AddSessionDialogProps> = ({
    open,
    onClose,
    defaultDivisionId,
}: AddSessionDialogProps) => {
    const createSession = useCreateSession()
    const { showSnackbar } = useSnackbar()
    const { data: divisions } = useDivisions()
    const [formData, setFormData] = useState<SessionInput>(initialFormState)

    useEffect(() => {
        if (open) {
            setFormData({ ...initialFormState, division_id: defaultDivisionId ?? 0 })
        }
    }, [open, defaultDivisionId])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target

        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async () => {
        try {
            await createSession.mutateAsync(formData)
            showSnackbar('Session created', 'success')
            onClose()
        } catch (err) {
            showSnackbar(err instanceof Error ? err.message : 'Failed to create session', 'error')
        }
    }

    return (
        <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose}>
            <DialogTitle>New Session</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <FormControl fullWidth required>
                        <InputLabel>Division</InputLabel>
                        <Select
                            label="Division"
                            value={formData.division_id || ''}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    division_id: e.target.value as number,
                                }))
                            }
                        >
                            {divisions?.map((d) => (
                                <MenuItem key={d.division_id} value={d.division_id}>
                                    {d.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        fullWidth
                        required
                        label="Name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                    />
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            fullWidth
                            required
                            label="Start Date"
                            name="start_date"
                            slotProps={{ inputLabel: { shrink: true } }}
                            type="date"
                            value={formData.start_date}
                            onChange={handleInputChange}
                        />
                        <TextField
                            fullWidth
                            required
                            label="End Date"
                            name="end_date"
                            slotProps={{ inputLabel: { shrink: true } }}
                            type="date"
                            value={formData.end_date}
                            onChange={handleInputChange}
                        />
                    </Box>
                    <TextField
                        fullWidth
                        required
                        label="Match Time"
                        name="match_time"
                        slotProps={{ inputLabel: { shrink: true } }}
                        type="time"
                        value={formData.match_time}
                        onChange={handleInputChange}
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    disabled={
                        createSession.isPending ||
                        !formData.division_id ||
                        !formData.name ||
                        !formData.start_date ||
                        !formData.end_date
                    }
                    variant="contained"
                    onClick={handleSubmit}
                >
                    {createSession.isPending ? 'Creating...' : 'Create Session'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
