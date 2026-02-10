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

import { useCreateDivision, useUpdatePlayer } from '~/lib/react-query'
import type { DivisionInput, Player } from '~/lib/types'

interface CopyDivisionDialogProps {
    open: boolean
    onClose: () => void
    divisionName: string
    defaultMatchTime: string
    players: Player[]
}

export const CopyDivisionDialog = ({
    open,
    onClose,
    divisionName,
    defaultMatchTime,
    players,
}: CopyDivisionDialogProps) => {
    const navigate = useNavigate()
    const createDivision = useCreateDivision()
    const updatePlayer = useUpdatePlayer()

    const [formData, setFormData] = useState<DivisionInput>({
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
        const newDivision = await createDivision.mutateAsync(formData)

        await Promise.all(
            players.map((p) =>
                updatePlayer.mutateAsync({
                    id: p.player_id,
                    data: { ...p, division_id: newDivision.division_id },
                }),
            ),
        )
        onClose()
        navigate(`/divisions/${newDivision.division_id}`)
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>New Division with Same Players</DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    This will create a new division and move all {players.length} players from
                    &ldquo;{divisionName}&rdquo; to it.
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
                        createDivision.isPending ||
                        updatePlayer.isPending ||
                        !formData.name ||
                        !formData.start_date ||
                        !formData.end_date
                    }
                >
                    {createDivision.isPending || updatePlayer.isPending
                        ? 'Creating...'
                        : 'Create & Move Players'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
