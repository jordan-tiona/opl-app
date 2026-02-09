import { useLocation, useNavigate } from 'react-router';
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
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  EmojiEvents as EmojiEventsIcon,
  Leaderboard as LeaderboardIcon,
  Logout as LogoutIcon,
  People as PeopleIcon,
  Sports as SportsIcon,
} from '@mui/icons-material';
import { useAuth } from '~/lib/auth';

export const DRAWER_WIDTH = 240;

const navItems = [
  { label: 'Dashboard', path: '/', icon: <DashboardIcon /> },
  { label: 'Players', path: '/players', icon: <PeopleIcon /> },
  { label: 'Divisions', path: '/divisions', icon: <EmojiEventsIcon /> },
  { label: 'Matches', path: '/matches', icon: <SportsIcon /> },
  { label: 'Standings', path: '/standings', icon: <LeaderboardIcon /> },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
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
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" fontWeight={700} color="primary">
          One Pocket League
        </Typography>
      </Box>
      <Divider />
      <List sx={{ px: 1, py: 2, flexGrow: 1 }}>
        {navItems.map((item) => (
          <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => navigate(item.path)}
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
    </Drawer>
  );
}
