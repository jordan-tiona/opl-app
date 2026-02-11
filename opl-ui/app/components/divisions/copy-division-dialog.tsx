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
        <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose}>
            <DialogTitle>New Division with Same Players</DialogTitle>
            <DialogContent>
                <Typography color="text.secondary" sx={{ mb: 2 }} variant="body2">
                    This will create a new division with all players from
                    &ldquo;{divisionName}&rdquo; and deactivate the current division.
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <TextField
                        fullWidth
                        required
                        label="Name"
                        name="name"
                        value={formData.name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
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
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, start_date: e.target.value }))
                            }
                        />
                        <TextField
                            fullWidth
                            required
                            label="End Date"
                            name="end_date"
                            slotProps={{ inputLabel: { shrink: true } }}
                            type="date"
                            value={formData.end_date}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, end_date: e.target.value }))
                            }
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
                        onChange={(e) =>
                            setFormData((prev) => ({ ...prev, match_time: e.target.value }))
                        }
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    disabled={
                        copyDivision.isPending ||
                        !formData.name ||
                        !formData.start_date ||
                        !formData.end_date
                    }
                    variant="contained"
                    onClick={handleSubmit}
                >
                    {copyDivision.isPending ? 'Creating...' : 'Create Division'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
