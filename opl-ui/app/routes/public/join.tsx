import {
    Box,
    Button,
    Checkbox,
    Container,
    Divider,
    FormControl,
    FormControlLabel,
    FormGroup,
    FormHelperText,
    FormLabel,
    Paper,
    TextField,
    Typography,
} from '@mui/material'
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'
import { useState } from 'react'

import { api } from '../../lib/api'
import { useSnackbar } from '../../lib/snackbar'

const NIGHTS = ['Tuesday', 'Wednesday', 'Thursday'] as const

export const JoinPage: React.FC = () => {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [nights, setNights] = useState<string[]>([])
    const [submitting, setSubmitting] = useState(false)
    const { executeRecaptcha } = useGoogleReCaptcha()
    const { showSnackbar } = useSnackbar()

    const toggleNight = (night: string) => {
        setNights((prev) =>
            prev.includes(night) ? prev.filter((n) => n !== night) : [...prev, night],
        )
    }

    const validate = (): string | null => {
        if (!name.trim()) return 'Name is required'
        if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            return 'A valid email is required'
        if (!phone.trim()) return 'Phone number is required'
        if (nights.length === 0) return 'Select at least one preferred night'
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
            const recaptchaToken = await executeRecaptcha('join')
            await api.join.submit({ name: name.trim(), email: email.trim(), phone: phone.trim(), nights, recaptchaToken })
            showSnackbar('Your request has been submitted!', 'success')
            setName('')
            setEmail('')
            setPhone('')
            setNights([])
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
                Join CSOPL
            </Typography>
            <Divider sx={{ mb: 4 }} />

            <Paper sx={{ p: 4 }}>
                <Typography color="text.secondary" sx={{ mb: 3 }} variant="body1">
                    Interested in joining the league? Fill out the form below and we'll be in touch.
                </Typography>

                <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }} onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        required
                        label="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <TextField
                        fullWidth
                        required
                        label="Google Account Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <TextField
                        fullWidth
                        required
                        label="Phone Number"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                    />

                    <FormControl required>
                        <FormLabel>Preferred Nights</FormLabel>
                        <FormGroup row>
                            {NIGHTS.map((night) => (
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={nights.includes(night)}
                                            onChange={() => toggleNight(night)}
                                        />
                                    }
                                    key={night}
                                    label={night}
                                />
                            ))}
                        </FormGroup>
                        <FormHelperText>Select at least one night</FormHelperText>
                    </FormControl>

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

export default JoinPage
