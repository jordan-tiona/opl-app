import { Add as AddIcon } from '@mui/icons-material'
import { Alert, Box, Button, CircularProgress, Grid, Typography } from '@mui/material'
import { useState } from 'react'

import { AddSessionDialog, SessionCard } from '~/components/sessions'
import { useDivisions, useSessions } from '~/lib/react-query'

export const SessionsPage: React.FC = () => {
    const { data: sessions, isLoading, error } = useSessions()
    const { data: divisions } = useDivisions()
    const [dialogOpen, setDialogOpen] = useState(false)

    if (error) {
        return <Alert severity="error">Failed to load sessions: {error.message}</Alert>
    }

    const divisionMap = new Map(divisions?.map((d) => [d.division_id, d.name]) ?? [])
    const activeSessions = sessions?.filter((s) => s.active) ?? []
    const inactiveSessions = sessions?.filter((s) => !s.active) ?? []

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
                <Typography variant="h3">Sessions</Typography>
                <Button
                    startIcon={<AddIcon />}
                    variant="contained"
                    onClick={() => setDialogOpen(true)}
                >
                    New Session
                </Button>
            </Box>

            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    <Grid container spacing={3}>
                        {activeSessions.map((session) => (
                            <Grid key={session.session_id} size={{ xs: 12, sm: 6, md: 4 }}>
                                <SessionCard
                                    divisionName={divisionMap.get(session.division_id)}
                                    session={session}
                                />
                            </Grid>
                        ))}
                        {activeSessions.length === 0 && (
                            <Grid size={{ xs: 12 }}>
                                <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
                                    No active sessions. Create one to get started.
                                </Typography>
                            </Grid>
                        )}
                    </Grid>

                    {inactiveSessions.length > 0 && (
                        <>
                            <Typography sx={{ mt: 4, mb: 2 }} variant="h5">
                                Past Sessions
                            </Typography>
                            <Grid container spacing={3}>
                                {inactiveSessions.map((session) => (
                                    <Grid key={session.session_id} size={{ xs: 12, sm: 6, md: 4 }}>
                                        <SessionCard
                                            divisionName={divisionMap.get(session.division_id)}
                                            session={session}
                                        />
                                    </Grid>
                                ))}
                            </Grid>
                        </>
                    )}
                </>
            )}

            <AddSessionDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
        </Box>
    )
}

export default SessionsPage
