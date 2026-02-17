import {
    Dashboard as DashboardIcon,
    EmojiEvents as EmojiEventsIcon,
    Home as HomeIcon,
    Leaderboard as LeaderboardIcon,
    Login as LoginIcon,
    Logout as LogoutIcon,
    Mail as MailIcon,
    Menu as MenuIcon,
    People as PeopleIcon,
    Person as PersonIcon,
    Sports as SportsIcon,
} from '@mui/icons-material'
import {
    AppBar,
    Avatar,
    Backdrop,
    Box,
    Button,
    CircularProgress,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Toolbar,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material'
import { useGoogleOAuth } from '@react-oauth/google'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router'

import { useAuth } from '../../lib/auth'
import { useSnackbar } from '../../lib/snackbar'

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

const navItems = [
    { label: 'Home', path: '/' },
    { label: 'About CSOPL', path: '/about' },
    { label: 'Join CSOPL', path: '/join' },
]

const adminNavItems = [
    { label: 'Home', path: '/', icon: <HomeIcon /> },
    { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { label: 'Players', path: '/players', icon: <PeopleIcon /> },
    { label: 'Divisions', path: '/divisions', icon: <EmojiEventsIcon /> },
    { label: 'Matches', path: '/matches', icon: <SportsIcon /> },
    { label: 'Standings', path: '/standings', icon: <LeaderboardIcon /> },
    { label: 'Message Center', path: '/messages', icon: <MailIcon /> },
]

const playerNavItems = [
    { label: 'Home', path: '/', icon: <HomeIcon /> },
    { label: 'My Profile', path: '/profile', icon: <PersonIcon /> },
    { label: 'Standings', path: '/standings', icon: <LeaderboardIcon /> },
    { label: 'Messages', path: '/messages', icon: <MailIcon /> },
]

export const PublicLayout: React.FC = () => {
    const [mobileOpen, setMobileOpen] = useState(false)
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
    const [demoLoading, setDemoLoading] = useState(false)
    const navigate = useNavigate()
    const location = useLocation()
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
    const { user, login, demoLogin, logout } = useAuth()
    const { showSnackbar } = useSnackbar()
    const { clientId } = useGoogleOAuth()
    const desktopGoogleBtnRef = useRef<HTMLDivElement>(null)
    const mobileGoogleBtnRef = useRef<HTMLDivElement>(null)

    const profileMenuItems = user?.is_admin ? adminNavItems : playerNavItems

    const handleDemoLogin = useCallback(
        async (role: 'admin' | 'player') => {
            setDemoLoading(true)

            try {
                const result = await demoLogin(role)

                if (result.success && result.user) {
                    navigate(result.user.is_admin ? '/dashboard' : '/profile')
                } else if (result.error) {
                    showSnackbar(result.error, 'error')
                }
            } finally {
                setDemoLoading(false)
            }
        },
        [demoLogin, navigate, showSnackbar],
    )

    const handleGoogleSuccess = useCallback(
        async (response: Parameters<typeof login>[0]) => {
            const result = await login(response)

            if (result.success && result.user) {
                navigate(result.user.is_admin ? '/dashboard' : '/profile')
            } else if (result.error) {
                showSnackbar(result.error, 'error')
            }
        },
        [login, navigate, showSnackbar],
    )

    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const google = (window as any).google

        if (!google?.accounts?.id || user) {
            return
        }

        google.accounts.id.initialize({
            client_id: clientId,
            callback: (response: { credential: string }) => {
                handleGoogleSuccess({ credential: response.credential })
            },
        })

        for (const ref of [desktopGoogleBtnRef, mobileGoogleBtnRef]) {
            if (ref.current) {
                google.accounts.id.renderButton(ref.current, {
                    type: 'standard',
                    size: 'large',
                    width: 250,
                })
            }
        }
    }, [clientId, handleGoogleSuccess, user])

    const drawer = (
        <Box sx={{ p: 2 }}>
            <List>
                {navItems.map((item) => (
                    <ListItem disablePadding key={item.path}>
                        <ListItemButton
                            selected={location.pathname === item.path}
                            onClick={() => {
                                navigate(item.path)
                                setMobileOpen(false)
                            }}
                        >
                            <ListItemText primary={item.label} />
                        </ListItemButton>
                    </ListItem>
                ))}
                {user ? (
                    <>
                        <Divider sx={{ my: 1 }} />
                        {profileMenuItems.map((item) => (
                            <ListItem disablePadding key={item.path}>
                                <ListItemButton
                                    onClick={() => {
                                        navigate(item.path)
                                        setMobileOpen(false)
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                                    <ListItemText primary={item.label} />
                                </ListItemButton>
                            </ListItem>
                        ))}
                        <Divider sx={{ my: 1 }} />
                        <ListItem disablePadding>
                            <ListItemButton
                                onClick={() => {
                                    logout()
                                    showSnackbar('You have been signed out', 'success')
                                    setMobileOpen(false)
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                    <LogoutIcon />
                                </ListItemIcon>
                                <ListItemText primary="Logout" />
                            </ListItemButton>
                        </ListItem>
                    </>
                ) : DEMO_MODE ? (
                    <>
                        <Divider sx={{ my: 1 }} />
                        <ListItem disablePadding>
                            <ListItemButton onClick={() => { handleDemoLogin('admin'); setMobileOpen(false) }}>
                                <ListItemIcon sx={{ minWidth: 36 }}><LoginIcon /></ListItemIcon>
                                <ListItemText primary="Try Admin" />
                            </ListItemButton>
                        </ListItem>
                        <ListItem disablePadding>
                            <ListItemButton onClick={() => { handleDemoLogin('player'); setMobileOpen(false) }}>
                                <ListItemIcon sx={{ minWidth: 36 }}><LoginIcon /></ListItemIcon>
                                <ListItemText primary="Try Player" />
                            </ListItemButton>
                        </ListItem>
                    </>
                ) : (
                    <>
                        <Divider sx={{ my: 1 }} />
                        <ListItem disablePadding>
                            <Box sx={{ position: 'relative', width: '100%' }}>
                                <ListItemButton>
                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                        <LoginIcon />
                                    </ListItemIcon>
                                    <ListItemText primary="Sign In" />
                                </ListItemButton>
                                <Box
                                    ref={mobileGoogleBtnRef}
                                    sx={{
                                        position: 'absolute',
                                        inset: 0,
                                        opacity: 0,
                                        overflow: 'hidden',
                                        '& iframe': { width: '100% !important', height: '100% !important' },
                                    }}
                                />
                            </Box>
                        </ListItem>
                    </>
                )}
            </List>
        </Box>
    )

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <AppBar
                color="default"
                elevation={1}
                position="static"
                sx={{ bgcolor: 'primary.main' }}
            >
                <Toolbar>
                    {isMobile && (
                        <IconButton edge="start" sx={{ mr: 1 }} onClick={() => setMobileOpen(true)}>
                            <MenuIcon />
                        </IconButton>
                    )}
                    <Box
                        alt="CSOPL"
                        component="img"
                        src="/img/csopl-logo-transparent.svg"
                        sx={{ height: 40, cursor: 'pointer' }}
                        onClick={() => navigate('/')}
                    />
                    {!isMobile && (
                        <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto', gap: 1 }}>
                            {navItems.map((item) => (
                                <Button
                                    key={item.path}
                                    sx={{
                                        color:
                                            location.pathname === item.path
                                                ? 'primary.light'
                                                : 'inherit',
                                    }}
                                    onClick={() => navigate(item.path)}
                                >
                                    {item.label}
                                </Button>
                            ))}
                            {user ? (
                                <>
                                    <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                                        <Avatar
                                            src={user.picture ?? undefined}
                                            sx={{ width: 32, height: 32 }}
                                        />
                                    </IconButton>
                                    <Menu
                                        anchorEl={anchorEl}
                                        open={Boolean(anchorEl)}
                                        onClose={() => setAnchorEl(null)}
                                    >
                                        {profileMenuItems.map((item) => (
                                            <MenuItem
                                                key={item.path}
                                                onClick={() => {
                                                    setAnchorEl(null)
                                                    navigate(item.path)
                                                }}
                                            >
                                                <ListItemIcon>{item.icon}</ListItemIcon>
                                                {item.label}
                                            </MenuItem>
                                        ))}
                                        <Divider />
                                        <MenuItem
                                            onClick={() => {
                                                setAnchorEl(null)
                                                logout()
                                                showSnackbar('You have been signed out', 'success')
                                            }}
                                        >
                                            <ListItemIcon>
                                                <LogoutIcon />
                                            </ListItemIcon>
                                            Logout
                                        </MenuItem>
                                    </Menu>
                                </>
                            ) : DEMO_MODE ? (
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                        startIcon={<LoginIcon />}
                                        sx={{ color: 'inherit' }}
                                        variant="outlined"
                                        onClick={() => handleDemoLogin('admin')}
                                    >
                                        Try Admin
                                    </Button>
                                    <Button
                                        startIcon={<LoginIcon />}
                                        sx={{ color: 'inherit' }}
                                        variant="outlined"
                                        onClick={() => handleDemoLogin('player')}
                                    >
                                        Try Player
                                    </Button>
                                </Box>
                            ) : (
                                <Box sx={{ position: 'relative' }}>
                                    <Button
                                        startIcon={<LoginIcon />}
                                        sx={{ color: 'inherit' }}
                                    >
                                        Sign In
                                    </Button>
                                    <Box
                                        ref={desktopGoogleBtnRef}
                                        sx={{
                                            position: 'absolute',
                                            inset: 0,
                                            opacity: 0,
                                            overflow: 'hidden',
                                            '& iframe': { width: '100% !important', height: '100% !important' },
                                        }}
                                    />
                                </Box>
                            )}
                        </Box>
                    )}
                </Toolbar>
            </AppBar>

            <Drawer
                ModalProps={{ keepMounted: true }}
                open={mobileOpen}
                sx={{ display: { sm: 'none' }, '& .MuiDrawer-paper': { width: 240 } }}
                variant="temporary"
                onClose={() => setMobileOpen(false)}
            >
                {drawer}
            </Drawer>

            <Box sx={{ flexGrow: 1 }}>
                <Outlet />
            </Box>

            <Backdrop open={demoLoading} sx={{ zIndex: (theme) => theme.zIndex.modal + 1, flexDirection: 'column', gap: 2 }}>
                <CircularProgress color="inherit" />
                <Typography color="inherit" variant="h6">
                    Starting demo server...
                </Typography>
                <Typography color="inherit" variant="body2">
                    This may take a few seconds on first visit
                </Typography>
            </Backdrop>
        </Box>
    )
}

export default PublicLayout
