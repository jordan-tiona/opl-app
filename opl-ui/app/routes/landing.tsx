import {
    EmojiEvents as TrophyIcon,
    Groups as GroupsIcon,
    Leaderboard as LeaderboardIcon,
} from '@mui/icons-material'
import { Box, Button, Card, CardContent, Container, Grid, Typography } from '@mui/material'
import { useNavigate } from 'react-router'

const features = [
    {
        icon: <GroupsIcon sx={{ color: 'primary.light', fontSize: 48 }} />,
        title: 'Divisions',
        description:
            'Players are organized into divisions and compete in round-robin format throughout the season.',
    },
    {
        icon: <TrophyIcon sx={{ color: 'primary.light', fontSize: 48 }} />,
        title: 'Competitive Matches',
        description:
            'Each match consists of multiple games of one-pocket, with results tracked and scored.',
    },
    {
        icon: <LeaderboardIcon sx={{ color: 'primary.light', fontSize: 48 }} />,
        title: 'Rating System',
        description:
            'An Elo-based rating system tracks player skill, updating after every game played.',
    },
]

export const LandingPage: React.FC = () => {
    const navigate = useNavigate()

    return (
        <Box>
            <Box
                sx={{
                    bgcolor: 'primary.light',
                    color: 'white',
                    py: { xs: 8, md: 12 },
                    textAlign: 'center',
                }}
            >
                <Container maxWidth="md">
                    <Typography
                        variant="h2"
                        fontWeight={700}
                        gutterBottom
                        sx={{ fontSize: { xs: '2rem', md: '3rem' } }}
                    >
                        One Pocket League
                    </Typography>
                    <Typography
                        variant="h5"
                        sx={{ mb: 4, opacity: 0.9, fontSize: { xs: '1.1rem', md: '1.5rem' } }}
                    >
                        Competitive one-pocket pool, organized into seasons with divisions,
                        round-robin scheduling, and player ratings.
                    </Typography>
                    <Box
                        sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}
                    >
                        <Button
                            variant="contained"
                            size="large"
                            onClick={() => navigate('/login')}
                            sx={{
                                bgcolor: 'background.paper',
                                color: 'text.main',
                                '&:hover': { bgcolor: 'grey.800' },
                            }}
                        >
                            Sign In
                        </Button>
                        <Button
                            variant="outlined"
                            size="large"
                            onClick={() => navigate('/rules')}
                            sx={{
                                borderColor: 'background.default',
                                color: 'background.default',
                                '&:hover': {
                                    borderColor: 'background.paper',
                                    bgcolor: 'rgba(255,255,255,0.1)',
                                },
                            }}
                        >
                            View Rules
                        </Button>
                    </Box>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
                <Typography
                    variant="h3"
                    textAlign="center"
                    gutterBottom
                    sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}
                >
                    How It Works
                </Typography>
                <Typography
                    variant="body1"
                    textAlign="center"
                    color="text.secondary"
                    sx={{ mb: 6, maxWidth: 600, mx: 'auto' }}
                >
                    The One Pocket League runs in seasonal divisions. Players compete in round-robin
                    matches, earn points, and climb the ratings ladder.
                </Typography>

                <Grid container spacing={4}>
                    {features.map((feature) => (
                        <Grid key={feature.title} size={{ xs: 12, md: 4 }}>
                            <Card sx={{ height: '100%', textAlign: 'center' }}>
                                <CardContent sx={{ p: 4 }}>
                                    {feature.icon}
                                    <Typography variant="h5" sx={{ mt: 2, mb: 1 }}>
                                        {feature.title}
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary">
                                        {feature.description}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Container>
        </Box>
    )
}

export default LandingPage
