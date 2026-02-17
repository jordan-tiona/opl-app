import { Container, Divider, Paper, Typography } from '@mui/material'

const JoinClosedPage: React.FC = () => {
    return (
        <Container maxWidth="sm" sx={{ py: { xs: 4, md: 6 } }}>
            <Typography
                gutterBottom
                sx={{ fontSize: { xs: '1.75rem', md: '2.5rem' } }}
                variant="h3"
            >
                Join CSOPL
            </Typography>
            <Divider sx={{ mb: 4 }} />

            <Paper sx={{ p: 4 }}>
                <Typography color="text.secondary" variant="body1">
                    Registration is currently closed. Please check back later.
                </Typography>
            </Paper>
        </Container>
    )
}

export default JoinClosedPage
