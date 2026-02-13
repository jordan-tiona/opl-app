import {
    EmojiEvents as TrophyIcon,
    Groups as GroupsIcon,
    Leaderboard as LeaderboardIcon,
} from '@mui/icons-material'
import { Box, Button, Card, CardContent, Container, Grid, Typography } from '@mui/material'
import { useNavigate } from 'react-router'

const features = [
    {
        icon: <LeaderboardIcon sx={{ color: 'primary.light', fontSize: 48 }} />,
        title: 'Weighted Matches',
        description:
            'An Elo-style rating system determines match weights so every game is competitive, regardless of skill level.',
    },
    {
        icon: <GroupsIcon sx={{ color: 'primary.light', fontSize: 48 }} />,
        title: 'Weekly Divisions',
        description:
            'Play a different opponent from your division each week in a race to three games during a double round robin session.',
    },
    {
        icon: <TrophyIcon sx={{ color: 'primary.light', fontSize: 48 }} />,
        title: 'End of Session Tournament',
        description:
            'Top players from every division qualify for a double elimination tournament with thousands of dollars in the prize pool.',
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
                    textAlign: 'center',
                    position: 'relative',
                }}
            >
                <Box
                    alt="Pikes Peak"
                    component="img"
                    src="/img/pikes-peak.png"
                    sx={{
                        width: '100%',
                        display: 'block',
                    }}
                />
                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Typography
                        fontWeight={700}
                        sx={{
                            fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem' },
                            textShadow: '2px 2px 8px rgba(0,0,0,0.5)',
                        }}
                        variant="h2"
                    >
                        Colorado Springs One Pocket League
                    </Typography>
                    <Button
                        size="large"
                        sx={{
                            mt: 3,
                            borderColor: 'white',
                            color: 'white',
                            '&:hover': {
                                borderColor: 'white',
                                bgcolor: 'rgba(255,255,255,0.15)',
                            },
                        }}
                        variant="outlined"
                        onClick={() => navigate('/about')}
                    >
                        About CSOPL
                    </Button>
                </Box>
            </Box>

            <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
                <Typography
                    gutterBottom
                    sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}
                    textAlign="center"
                    variant="h3"
                >
                    About CSOPL
                </Typography>
                <Typography
                    color="text.secondary"
                    sx={{ mb: 6, maxWidth: 600, mx: 'auto' }}
                    textAlign="center"
                    variant="body1"
                >
                    A ranked, weighted, weekly one-pocket league. Face opponents every week in a
                    fairly weighted match and compete to earn an invite to the end of session
                    tournament.
                </Typography>

                <Grid container spacing={4}>
                    {features.map((feature) => (
                        <Grid key={feature.title} size={{ xs: 12, md: 4 }}>
                            <Card sx={{ height: '100%', textAlign: 'center' }}>
                                <CardContent sx={{ p: 4 }}>
                                    {feature.icon}
                                    <Typography sx={{ mt: 2, mb: 1 }} variant="h5">
                                        {feature.title}
                                    </Typography>
                                    <Typography color="text.secondary" variant="body1">
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
