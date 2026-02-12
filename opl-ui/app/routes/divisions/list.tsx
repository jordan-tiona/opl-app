import { Add as AddIcon } from '@mui/icons-material'
import { Alert, Box, Button, CircularProgress, Grid, Typography } from '@mui/material'
import { useState } from 'react'

import { AddDivisionDialog, DivisionCard } from '~/components/divisions'
import { useDivisions } from '~/lib/react-query'

export const DivisionsPage: React.FC = () => {
    const { data: divisions, isLoading, error } = useDivisions()

    const [dialogOpen, setDialogOpen] = useState(false)

    if (error) {
        return <Alert severity="error">Failed to load divisions: {error.message}</Alert>
    }

    return (
        <Box>
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3,
                }}
            >
                <Typography variant="h3">Divisions</Typography>
                <Button
                    startIcon={<AddIcon />}
                    variant="contained"
                    onClick={() => setDialogOpen(true)}
                >
                    New Division
                </Button>
            </Box>

            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {divisions?.map((division) => (
                        <Grid key={division.division_id} size={{ xs: 12, sm: 6, md: 4 }}>
                            <DivisionCard division={division} />
                        </Grid>
                    ))}
                    {(divisions?.length ?? 0) === 0 && (
                        <Grid size={{ xs: 12 }}>
                            <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
                                No divisions. Create one to get started.
                            </Typography>
                        </Grid>
                    )}
                </Grid>
            )}

            <AddDivisionDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
        </Box>
    )
}

export default DivisionsPage
