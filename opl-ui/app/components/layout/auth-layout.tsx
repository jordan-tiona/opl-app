import { Menu as MenuIcon } from '@mui/icons-material'
import {
    AppBar,
    Box,
    CircularProgress,
    IconButton,
    Toolbar,
    useMediaQuery,
    useTheme,
} from '@mui/material'
import { useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'

import { useAuth } from '~/lib/auth'

import { Sidebar } from './sidebar'


const adminPaths = ['/dashboard', '/players', '/divisions', '/matches']

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
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh',
                }}
            >
                <CircularProgress />
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
