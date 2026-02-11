import { Menu as MenuIcon } from '@mui/icons-material'
import {
    AppBar,
    Box,
    Button,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Toolbar,
    useMediaQuery,
    useTheme,
} from '@mui/material'
import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router'

const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Rules', path: '/rules' },
    { label: 'Contact', path: '/contact' },
]

export const PublicLayout: React.FC = () => {
    const [mobileOpen, setMobileOpen] = useState(false)
    const navigate = useNavigate()
    const location = useLocation()
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

    const drawer = (
        <Box sx={{ p: 2 }}>
            <List>
                {navItems.map((item) => (
                    <ListItem key={item.path} disablePadding>
                        <ListItemButton
                            onClick={() => {
                                navigate(item.path)
                                setMobileOpen(false)
                            }}
                            selected={location.pathname === item.path}
                        >
                            <ListItemText primary={item.label} />
                        </ListItemButton>
                    </ListItem>
                ))}
                <ListItem disablePadding>
                    <ListItemButton
                        onClick={() => {
                            navigate('/login')
                            setMobileOpen(false)
                        }}
                    >
                        <ListItemText primary="Sign In" />
                    </ListItemButton>
                </ListItem>
            </List>
        </Box>
    )

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <AppBar
                position="static"
                color="default"
                elevation={1}
                sx={{ bgcolor: 'primary.main' }}
            >
                <Toolbar>
                    {isMobile && (
                        <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 1 }}>
                            <MenuIcon />
                        </IconButton>
                    )}
                    <Box
                        component="img"
                        src="/img/csopl-logo-transparent.svg"
                        alt="CSOPL"
                        sx={{ height: 40, cursor: 'pointer' }}
                        onClick={() => navigate('/')}
                    />
                    {!isMobile && (
                        <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto', gap: 1 }}>
                            {navItems.map((item) => (
                                <Button
                                    key={item.path}
                                    onClick={() => navigate(item.path)}
                                    sx={{ color: location.pathname === item.path ? 'primary.light': 'inherit' }}
                                >
                                    {item.label}
                                </Button>
                            ))}
                            <Button variant="contained" onClick={() => navigate('/login')}>
                                Sign In
                            </Button>
                        </Box>
                    )}
                </Toolbar>
            </AppBar>

            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={() => setMobileOpen(false)}
                ModalProps={{ keepMounted: true }}
                sx={{ display: { sm: 'none' }, '& .MuiDrawer-paper': { width: 240 } }}
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
