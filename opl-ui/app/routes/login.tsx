import { useState } from 'react';
import { Alert, Box, Card, CardContent, Typography } from '@mui/material';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '~/lib/auth';

export const LoginPage = () => {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%', mx: 2 }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, py: 4 }}>
          <Typography variant="h4" fontWeight={700} color="primary">
            One Pocket League
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Sign in to manage the league
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%' }}>
              {error}
            </Alert>
          )}

          <GoogleLogin
            onSuccess={async (response) => {
              console.log( response )
              const result = await login(response);
              if (!result.success) {
                setError(result.error ?? 'Login failed');
              }
            }}
            onError={() => setError('Google sign-in failed')}
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage;
