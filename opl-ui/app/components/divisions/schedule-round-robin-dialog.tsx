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

import { useScheduleRoundRobin } from '~/lib/react-query'
import { useSnackbar } from '~/lib/snackbar'

interface ScheduleRoundRobinDialogProps {
    open: boolean
    onClose: () => void
    sessionId: number
    defaultStartDate: string
}

export const ScheduleRoundRobinDialog: React.FC<ScheduleRoundRobinDialogProps> = ({
    open,
    onClose,
    sessionId,
    defaultStartDate,
}: ScheduleRoundRobinDialogProps) => {
    const scheduleRoundRobin = useScheduleRoundRobin()
    const { showSnackbar } = useSnackbar()
    const [startDate, setStartDate] = useState(defaultStartDate)

    useEffect(() => {
        if (open) {
            setStartDate(defaultStartDate)
        }
    }, [open, defaultStartDate])

    const handleSubmit = async () => {
        try {
            const scheduledMatches = await scheduleRoundRobin.mutateAsync({
                session_id: sessionId,
                start_date: `${startDate}T00:00:00`,
            })

            showSnackbar(`Successfully scheduled ${scheduledMatches.length} matches`, 'success')
            onClose()
        } catch (err) {
            showSnackbar(err instanceof Error ? err.message : 'Failed to schedule round robin', 'error')
        }
    }

    return (
        <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose}>
            <DialogTitle>Schedule Round Robin</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <TextField
                        fullWidth
                        required
                        label="Start Date"
                        slotProps={{ inputLabel: { shrink: true } }}
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    disabled={scheduleRoundRobin.isPending || !startDate}
                    variant="contained"
                    onClick={handleSubmit}
                >
                    {scheduleRoundRobin.isPending ? 'Scheduling...' : 'Generate Schedule'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
