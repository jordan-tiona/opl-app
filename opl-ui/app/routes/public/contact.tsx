import {
    Box,
    Button,
    Container,
    Divider,
    MenuItem,
    Paper,
    TextField,
    Typography,
} from '@mui/material'
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3'
import { useState } from 'react'

import { api } from '../../lib/api'
import { useSnackbar } from '../../lib/snackbar'

const REASONS = ['Bug Report', 'Issue with My Account', 'Issue Concerning CSOPL', 'General Question', 'Other'] as const

export const ContactPage: React.FC = () => {
    const [reason, setReason] = useState('')
    const [message, setMessage] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const { executeRecaptcha } = useGoogleReCaptcha()
    const { showSnackbar } = useSnackbar()

    const validate = (): string | null => {
        if (!reason) return 'Please select a reason for contact'
        if (!message.trim()) return 'Message is required'
        return null
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const error = validate()
        if (error) {
            showSnackbar(error, 'error')
            return
        }
        if (!executeRecaptcha) {
            showSnackbar('reCAPTCHA not ready, please try again', 'error')
            return
        }

        setSubmitting(true)
        try {
            const recaptchaToken = await executeRecaptcha('contact')
            await api.contact.submit({ reason, message: message.trim(), recaptchaToken })
            showSnackbar('Your message has been sent!', 'success')
            setReason('')
            setMessage('')
        } catch (err) {
            showSnackbar(err instanceof Error ? err.message : 'Submission failed', 'error')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Container maxWidth="sm" sx={{ py: { xs: 4, md: 6 } }}>
            <Typography
                gutterBottom
                sx={{ fontSize: { xs: '1.75rem', md: '2.5rem' } }}
                variant="h3"
            >
                Contact Us
            </Typography>
            <Divider sx={{ mb: 4 }} />

            <Paper sx={{ p: 4 }}>
                <Typography color="text.secondary" sx={{ mb: 3 }} variant="body1">
                    Have a bug to report, an issue, or a question? Let us know and we'll get back to you.
                </Typography>

                <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }} onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        required
                        select
                        label="Reason for Contact"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    >
                        {REASONS.map((r) => (
                            <MenuItem key={r} value={r}>
                                {r}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        fullWidth
                        multiline
                        required
                        label="Message"
                        minRows={4}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />

                    <Button
                        disabled={submitting}
                        size="large"
                        type="submit"
                        variant="contained"
                    >
                        {submitting ? 'Submitting...' : 'Submit'}
                    </Button>
                </Box>
            </Paper>
        </Container>
    )
}

const ContactPageWrapper: React.FC = () => (
    <GoogleReCaptchaProvider reCaptchaKey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}>
        <ContactPage />
    </GoogleReCaptchaProvider>
)

export default ContactPageWrapper
