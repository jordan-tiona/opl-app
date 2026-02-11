import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'

import { useCopyDivision } from '~/lib/react-query'
import { useSnackbar } from '~/lib/snackbar'
import type { CopyDivisionInput } from '~/lib/types'

interface CopyDivisionDialogProps {
    open: boolean
    onClose: () => void
    divisionId: number
    divisionName: string
    defaultMatchTime: string
}

export const CopyDivisionDialog: React.FC<CopyDivisionDialogProps> = ({
    open,
    onClose,
    divisionId,
    divisionName,
    defaultMatchTime,
}: CopyDivisionDialogProps) => {
    const navigate = useNavigate()
    const copyDivision = useCopyDivision()
    const { showSnackbar } = useSnackbar()

    const [formData, setFormData] = useState<CopyDivisionInput>({
        name: '',
        start_date: '',
        end_date: '',
        match_time: defaultMatchTime,
    })

    useEffect(() => {
        if (open) {
            setFormData({
                name: '',
                start_date: '',
                end_date: '',
                match_time: defaultMatchTime,
            })
        }
    }, [open, defaultMatchTime])

    const handleSubmit = async () => {
        try {
            const newDivision = await copyDivision.mutateAsync({
                divisionId,
                data: formData,
            })

            showSnackbar('Division created with same players', 'success')
            onClose()
            navigate(`/divisions/${newDivision.division_id}`)
        } catch (err) {
            showSnackbar(err instanceof Error ? err.message : 'Failed to create division', 'error')
        }
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>New Division with Same Players</DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    This will create a new division with all players from
                    &ldquo;{divisionName}&rdquo; and deactivate the current division.
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <TextField
                        label="Name"
                        name="name"
                        value={formData.name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                        fullWidth
                        required
                    />
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            label="Start Date"
                            name="start_date"
                            type="date"
                            value={formData.start_date}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, start_date: e.target.value }))
                            }
                            fullWidth
                            required
                            slotProps={{ inputLabel: { shrink: true } }}
                        />
                        <TextField
                            label="End Date"
                            name="end_date"
                            type="date"
                            value={formData.end_date}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, end_date: e.target.value }))
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
                        value={formData.match_time}
                        onChange={(e) =>
                            setFormData((prev) => ({ ...prev, match_time: e.target.value }))
                        }
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
                        copyDivision.isPending ||
                        !formData.name ||
                        !formData.start_date ||
                        !formData.end_date
                    }
                >
                    {copyDivision.isPending ? 'Creating...' : 'Create Division'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
