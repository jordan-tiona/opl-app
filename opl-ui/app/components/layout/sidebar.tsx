import {
    CalendarMonth as CalendarMonthIcon,
    Dashboard as DashboardIcon,
    EmojiEvents as EmojiEventsIcon,
    Home as HomeIcon,
    Leaderboard as LeaderboardIcon,
    Logout as LogoutIcon,
    Mail as MailIcon,
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
import { useMessages } from '~/lib/react-query'

export const DRAWER_WIDTH = 240

const adminNavItems = [
    { label: 'Home', path: '/', icon: <HomeIcon /> },
    { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { label: 'Players', path: '/players', icon: <PeopleIcon /> },
    { label: 'Divisions', path: '/divisions', icon: <EmojiEventsIcon /> },
    { label: 'Sessions', path: '/sessions', icon: <CalendarMonthIcon /> },
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

    const { data: messages } = useMessages()
    const hasUnread = messages?.some((m) => !m.is_read) ?? false
    const navItems = user?.is_admin ? adminNavItems : playerNavItems

    const isActive = (path: string) => {
        if (path === '/' || path === '/dashboard') {
            return location.pathname === path
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
                    alt="CSOPL"
                    component="img"
                    src="/img/csopl-logo-transparent.svg"
                    sx={{ height: 36 }}
                />
            </Box>
            <Divider />
            <List sx={{ px: 1, py: 2, flexGrow: 1 }}>
                {navItems.map((item) => (
                    <ListItem disablePadding key={item.path} sx={{ mb: 0.5 }}>
                        <ListItemButton
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
                            onClick={() => handleNavigate(item.path)}
                        >
                            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.label} />
                            {item.path === '/messages' && hasUnread && (
                                <Box
                                    sx={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: '50%',
                                        bgcolor: isActive(item.path) ? 'white' : 'primary.main',
                                        flexShrink: 0,
                                    }}
                                />
                            )}
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>

            {user && (
                <>
                    <Divider />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2 }}>
                        <Avatar src={user.picture ?? undefined} sx={{ width: 32, height: 32 }} />
                        <Typography noWrap sx={{ flexGrow: 1 }} variant="body2">
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
            ModalProps={{ keepMounted: true }}
            open={isMobile ? open : true}
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
            variant={isMobile ? 'temporary' : 'permanent'}
            onClose={onClose}
        >
            {drawerContent}
        </Drawer>
    )
}
