import { Menu as MenuIcon } from '@mui/icons-material'
import {
    Alert,
    AppBar,
    Box,
    CircularProgress,
    IconButton,
    Toolbar,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material'
import { useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'

import { useAuth } from '~/lib/auth'

import { Sidebar } from './sidebar'

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

const adminPaths = ['/dashboard', '/players', '/divisions', '/sessions', '/matches']

export const AuthLayout: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { user, loading } = useAuth()
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('md'))
    const location = useLocation()

    if (loading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh',
                    gap: 2,
                }}
            >
                <CircularProgress />
                {DEMO_MODE && (
                    <>
                        <Typography color="text.secondary" variant="h6">
                            Starting demo server...
                        </Typography>
                        <Typography color="text.secondary" variant="body2">
                            This may take a few seconds on first visit
                        </Typography>
                    </>
                )}
            </Box>
        )
    }

    if (!user) {
        return <Navigate replace to="/login" />
    }

    // Redirect non-admin users away from admin routes
    if (!user.is_admin && adminPaths.some((p) => location.pathname.startsWith(p))) {
        return <Navigate replace to="/profile" />
    }

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {isMobile && (
                    <AppBar
                        color="default"
                        elevation={1}
                        position="static"
                        sx={{ bgcolor: 'primary.main' }}
                    >
                        <Toolbar variant="dense">
                            <IconButton
                                edge="start"
                                sx={{ mr: 1 }}
                                onClick={() => setSidebarOpen(true)}
                            >
                                <MenuIcon />
                            </IconButton>
                            <Box
                                alt="CSOPL"
                                component="img"
                                src="/img/csopl-logo-transparent.svg"
                                sx={{ height: 36 }}
                            />
                        </Toolbar>
                    </AppBar>
                )}

                {DEMO_MODE && (
                    <Alert severity="info" sx={{ borderRadius: 0 }}>
                        You're viewing a demo — data is read-only
                    </Alert>
                )}

                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        p: 3,
                        bgcolor: 'background.default',
                        minHeight: isMobile ? 'auto' : '100vh',
                    }}
                >
                    <Outlet />
                </Box>
            </Box>
        </Box>
    )
}

export default AuthLayout
