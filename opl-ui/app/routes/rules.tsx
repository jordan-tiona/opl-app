import { Box, Container, Divider, Typography } from '@mui/material'

export const RulesPage = () => {
    return (
        <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
            <Typography
                variant="h3"
                gutterBottom
                sx={{ fontSize: { xs: '1.75rem', md: '2.5rem' } }}
            >
                League Rules
            </Typography>
            <Divider sx={{ mb: 4 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <section>
                    <Typography variant="h5" gutterBottom>
                        Game Format
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        All games are played under standard one-pocket rules. Each player is
                        assigned one of the two corner pockets at the foot of the table. The first
                        player to legally pocket 8 balls into their designated pocket wins the game.
                    </Typography>
                </section>

                <section>
                    <Typography variant="h5" gutterBottom>
                        Match Structure
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Matches consist of multiple games between two players. Match results are
                        determined by the number of games won. Points are awarded based on
                        performance: 1 win earns 1 point, 2 wins earn 3 points, and 3 wins earn 5
                        points.
                    </Typography>
                </section>

                <section>
                    <Typography variant="h5" gutterBottom>
                        Divisions &amp; Scheduling
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Players are assigned to divisions for each season. Within a division,
                        matches are scheduled in a round-robin format so every player faces every
                        other player. Seasons run for a set period with matches scheduled at regular
                        intervals.
                    </Typography>
                </section>

                <section>
                    <Typography variant="h5" gutterBottom>
                        Rating System
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        The league uses an Elo-based rating system. Every player starts at a base
                        rating and their rating adjusts after each game based on the outcome and the
                        relative strength of the opponent. New players' ratings are more volatile,
                        stabilizing as they play more games.
                    </Typography>
                </section>

                <section>
                    <Typography variant="h5" gutterBottom>
                        Sportsmanship
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        All players are expected to conduct themselves with respect and good
                        sportsmanship. Disputes should be resolved amicably or brought to the league
                        administrator. The goal of the league is to foster a competitive but
                        friendly environment for one-pocket enthusiasts.
                    </Typography>
                </section>
            </Box>
        </Container>
    )
}

export default RulesPage
