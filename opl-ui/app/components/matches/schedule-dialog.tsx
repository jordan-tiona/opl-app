import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
} from '@mui/material'
import type React from 'react'

interface ScheduleDialogProps {
    open: boolean
    onClose: () => void
    scheduleData: { division: number; start_date: string }
    onScheduleDataChange: (data: { division: number; start_date: string }) => void
    onSubmit: () => void
    isPending: boolean
}

export const ScheduleDialog: React.FC<ScheduleDialogProps> = ({
    open,
    onClose,
    scheduleData,
    onScheduleDataChange,
    onSubmit,
    isPending,
}: ScheduleDialogProps) => {
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Schedule Round Robin</DialogTitle>
            <DialogContent>
                <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, minWidth: 300 }}
                >
                    <TextField
                        fullWidth
                        label="Division"
                        type="number"
                        value={scheduleData.division}
                        onChange={(e) =>
                            onScheduleDataChange({
                                ...scheduleData,
                                division: Number(e.target.value),
                            })
                        }
                    />
                    <TextField
                        fullWidth
                        label="Start Date"
                        slotProps={{ inputLabel: { shrink: true } }}
                        type="date"
                        value={scheduleData.start_date}
                        onChange={(e) =>
                            onScheduleDataChange({ ...scheduleData, start_date: e.target.value })
                        }
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button disabled={isPending} variant="contained" onClick={onSubmit}>
                    {isPending ? 'Scheduling...' : 'Generate Schedule'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
