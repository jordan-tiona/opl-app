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

interface ScheduleRoundRobinDialogProps {
    open: boolean
    onClose: () => void
    divisionId: number
    defaultStartDate: string
}

export const ScheduleRoundRobinDialog: React.FC<ScheduleRoundRobinDialogProps> = ({
    open,
    onClose,
    divisionId,
    defaultStartDate,
}: ScheduleRoundRobinDialogProps) => {
    const scheduleRoundRobin = useScheduleRoundRobin()
    const [startDate, setStartDate] = useState(defaultStartDate)

    useEffect(() => {
        if (open) {
            setStartDate(defaultStartDate)
        }
    }, [open, defaultStartDate])

    const handleSubmit = async () => {
        await scheduleRoundRobin.mutateAsync({
            division: divisionId,
            start_date: `${startDate}T00:00:00`,
        })
        onClose()
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Schedule Round Robin</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <TextField
                        label="Start Date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
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
                    disabled={scheduleRoundRobin.isPending || !startDate}
                >
                    {scheduleRoundRobin.isPending ? 'Scheduling...' : 'Generate Schedule'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
