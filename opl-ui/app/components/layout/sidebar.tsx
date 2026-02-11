import {
    Dashboard as DashboardIcon,
    EmojiEvents as EmojiEventsIcon,
    Leaderboard as LeaderboardIcon,
    Logout as LogoutIcon,
    People as PeopleIcon,
    Person as PersonIcon,
    Sports as SportsIcon,
} from '@mui/icons-material'
import {
    Avatar,
    Box,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material'
import { useLocation, useNavigate } from 'react-router'

import { useAuth } from '~/lib/auth'

export const DRAWER_WIDTH = 240

const adminNavItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { label: 'Players', path: '/players', icon: <PeopleIcon /> },
    { label: 'Divisions', path: '/divisions', icon: <EmojiEventsIcon /> },
    { label: 'Matches', path: '/matches', icon: <SportsIcon /> },
    { label: 'Standings', path: '/standings', icon: <LeaderboardIcon /> },
]

const playerNavItems = [
    { label: 'My Profile', path: '/profile', icon: <PersonIcon /> },
    { label: 'Standings', path: '/standings', icon: <LeaderboardIcon /> },
]

interface SidebarProps {
    open: boolean
    onClose: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ open, onClose }: SidebarProps) => {
    const location = useLocation()
    const navigate = useNavigate()
    const { user, logout } = useAuth()
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('md'))

    const navItems = user?.is_admin ? adminNavItems : playerNavItems

    const isActive = (path: string) => {
        if (path === '/dashboard') {
            return location.pathname === '/dashboard'
        }

        return location.pathname.startsWith(path)
    }

    const handleNavigate = (path: string) => {
        navigate(path)

        if (isMobile) {
            onClose()
        }
    }

    const drawerContent = (
        <>
            <Box sx={{ p: 1, bgcolor: 'primary.main' }}>
                <Box
                    component="img"
                    src="/img/csopl-logo-transparent.svg"
                    alt="CSOPL"
                    sx={{ height: 36 }}
                />
            </Box>
            <Divider />
            <List sx={{ px: 1, py: 2, flexGrow: 1 }}>
                {navItems.map((item) => (
                    <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                        <ListItemButton
                            onClick={() => handleNavigate(item.path)}
                            selected={isActive(item.path)}
                            sx={{
                                borderRadius: 2,
                                '&.Mui-selected': {
                                    bgcolor: 'primary.main',
                                    color: 'white',
                                    '&:hover': {
                                        bgcolor: 'primary.dark',
                                    },
                                    '& .MuiListItemIcon-root': {
                                        color: 'white',
                                    },
                                },
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.label} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>

            {user && (
                <>
                    <Divider />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2 }}>
                        <Avatar src={user.picture ?? undefined} sx={{ width: 32, height: 32 }} />
                        <Typography variant="body2" noWrap sx={{ flexGrow: 1 }}>
                            {user.name ?? user.email}
                        </Typography>
                        <IconButton size="small" onClick={logout}>
                            <LogoutIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </>
            )}
        </>
    )

    return (
        <Drawer
            variant={isMobile ? 'temporary' : 'permanent'}
            open={isMobile ? open : true}
            onClose={onClose}
            ModalProps={{ keepMounted: true }}
            sx={{
                width: isMobile ? 0 : DRAWER_WIDTH,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: DRAWER_WIDTH,
                    boxSizing: 'border-box',
                    bgcolor: 'background.paper',
                    display: 'flex',
                    flexDirection: 'column',
                },
            }}
        >
            {drawerContent}
        </Drawer>
    )
}
