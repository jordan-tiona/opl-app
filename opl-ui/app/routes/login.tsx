import { Alert, Box, Card, CardContent, Typography } from '@mui/material'
import { GoogleLogin } from '@react-oauth/google'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router'

import { useAuth } from '~/lib/auth'

export const LoginPage: React.FC = () => {
    const { user, loading, login } = useAuth()
    const navigate = useNavigate()
    const [error, setError] = useState<string | null>(null)

    // Already logged in — redirect based on role
    if (!loading && user) {
        return <Navigate to={user.is_admin ? '/dashboard' : '/profile'} replace />
    }

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '80vh',
            }}
        >
            <Card sx={{ maxWidth: 400, width: '100%', mx: 2 }}>
                <CardContent
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 3,
                        py: 4,
                    }}
                >
                    <Typography variant="h4" fontWeight={700} color="primary">
                        One Pocket League
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Sign in to continue
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ width: '100%' }}>
                            {error}
                        </Alert>
                    )}

                    <GoogleLogin
                        size="large"
                        width={350}
                        auto_select={false}
                        ux_mode="popup"
                        onSuccess={async (response) => {
                            const result = await login(response)

                            if (result.success && result.user) {
                                navigate(result.user.is_admin ? '/dashboard' : '/profile')
                            } else if (!result.success) {
                                setError(result.error ?? 'Login failed')
                            }
                        }}
                        onError={() => setError('Google sign-in failed')}
                    />
                </CardContent>
            </Card>
        </Box>
    )
}

export default LoginPage
