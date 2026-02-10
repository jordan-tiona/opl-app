import { Email as EmailIcon } from '@mui/icons-material'
import { Box, Container, Divider, Paper, Typography } from '@mui/material'

export const ContactPage: React.FC = () => {
    return (
        <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
            <Typography
                variant="h3"
                gutterBottom
                sx={{ fontSize: { xs: '1.75rem', md: '2.5rem' } }}
            >
                Contact Us
            </Typography>
            <Divider sx={{ mb: 4 }} />

            <Paper sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <EmailIcon color="primary" sx={{ fontSize: 32 }} />
                    <Typography variant="h5">Get in Touch</Typography>
                </Box>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Have questions about the league, want to join, or need to report an issue? Reach
                    out to the league administrator.
                </Typography>
                <Typography variant="body1">
                    <strong>Email:</strong>{' '}
                    <a href="mailto:tionajordan@gmail.com" style={{ color: '#1976d2' }}>
                        tionajordan@gmail.com
                    </a>
                </Typography>
            </Paper>
        </Container>
    )
}

export default ContactPage
