import {
    Dashboard as DashboardIcon,
    EmojiEvents as EmojiEventsIcon,
    Home as HomeIcon,
    Leaderboard as LeaderboardIcon,
    Login as LoginIcon,
    Logout as LogoutIcon,
    Menu as MenuIcon,
    People as PeopleIcon,
    Person as PersonIcon,
    Sports as SportsIcon,
} from '@mui/icons-material'
import {
    AppBar,
    Avatar,
    Box,
    Button,
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
    useMediaQuery,
    useTheme,
} from '@mui/material'
import { useGoogleOAuth } from '@react-oauth/google'
import { useCallback, useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router'

import { useAuth } from '../../lib/auth'

const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Rules', path: '/rules' },
    { label: 'Contact', path: '/contact' },
]

const adminNavItems = [
    { label: 'Home', path: '/', icon: <HomeIcon /> },
    { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { label: 'Players', path: '/players', icon: <PeopleIcon /> },
    { label: 'Divisions', path: '/divisions', icon: <EmojiEventsIcon /> },
    { label: 'Matches', path: '/matches', icon: <SportsIcon /> },
    { label: 'Standings', path: '/standings', icon: <LeaderboardIcon /> },
]

const playerNavItems = [
    { label: 'Home', path: '/', icon: <HomeIcon /> },
    { label: 'My Profile', path: '/profile', icon: <PersonIcon /> },
    { label: 'Standings', path: '/standings', icon: <LeaderboardIcon /> },
]

export const PublicLayout: React.FC = () => {
    const [mobileOpen, setMobileOpen] = useState(false)
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
    const navigate = useNavigate()
    const location = useLocation()
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
    const { user, login, logout } = useAuth()
    const { clientId } = useGoogleOAuth()

    const profileMenuItems = user?.is_admin ? adminNavItems : playerNavItems

    const handleGoogleSuccess = useCallback(
        async (response: Parameters<typeof login>[0]) => {
            const result = await login(response)

            if (result.success && result.user) {
                navigate(result.user.is_admin ? '/dashboard' : '/profile')
            }
        },
        [login, navigate],
    )

    const triggerGoogleSignIn = useCallback(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const google = (window as any).google

        if (!google?.accounts?.id) {
            return
        }

        google.accounts.id.initialize({
            client_id: clientId,
            callback: (response: { credential: string }) => {
                handleGoogleSuccess({ credential: response.credential })
            },
        })
        google.accounts.id.prompt()
    }, [clientId, handleGoogleSuccess])

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
                ) : (
                    <>
                        <Divider sx={{ my: 1 }} />
                        <ListItem disablePadding>
                            <ListItemButton onClick={triggerGoogleSignIn}>
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                    <LoginIcon />
                                </ListItemIcon>
                                <ListItemText primary="Sign In" />
                            </ListItemButton>
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
                                            }}
                                        >
                                            <ListItemIcon>
                                                <LogoutIcon />
                                            </ListItemIcon>
                                            Logout
                                        </MenuItem>
                                    </Menu>
                                </>
                            ) : (
                                <Button
                                    startIcon={<LoginIcon />}
                                    sx={{ color: 'inherit' }}
                                    onClick={triggerGoogleSignIn}
                                >
                                    Sign In
                                </Button>
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
        </Box>
    )
}

export default PublicLayout
