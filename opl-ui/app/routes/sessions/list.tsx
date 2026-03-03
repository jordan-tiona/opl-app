import { Add as AddIcon } from '@mui/icons-material'
import { Alert, Box, Button, CircularProgress, Grid, Typography } from '@mui/material'
import { useState } from 'react'

import { DeleteConfirmDialog } from '~/components/common'
import { AddSessionDialog, SessionCard } from '~/components/sessions'
import { useAuth } from '~/lib/auth'
import { useDeleteSession, useSessions } from '~/lib/react-query'

export const SessionsPage: React.FC = () => {
    const { user } = useAuth()
    const { data: sessions, isLoading, error } = useSessions()
    const deleteSession = useDeleteSession()
    const [dialogOpen, setDialogOpen] = useState(false)
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)

    if (error) {
        return <Alert severity="error">Failed to load sessions: {error.message}</Alert>
    }

    const activeSessions = sessions?.filter((s) => s.active) ?? []
    const inactiveSessions = sessions?.filter((s) => !s.active) ?? []
    const deleteTarget = sessions?.find((s) => s.session_id === deleteTargetId)

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
                                    session={session}
                                    onDelete={user?.is_admin ? () => setDeleteTargetId(session.session_id) : undefined}
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
                                            session={session}
                                            onDelete={user?.is_admin ? () => setDeleteTargetId(session.session_id) : undefined}
                                        />
                                    </Grid>
                                ))}
                            </Grid>
                        </>
                    )}
                </>
            )}

            <AddSessionDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />

            <DeleteConfirmDialog
                description={deleteTarget ? `Are you sure you want to delete "${deleteTarget.name}"? All matches in this session will also be deleted.` : ''}
                isPending={deleteSession.isPending}
                open={deleteTargetId !== null}
                title="Delete Session"
                onClose={() => setDeleteTargetId(null)}
                onConfirm={async () => {
                    if (deleteTargetId !== null) {
                        await deleteSession.mutateAsync(deleteTargetId)
                        setDeleteTargetId(null)
                    }
                }}
            />
        </Box>
    )
}

export default SessionsPage
