import {
    Box,
    Container,
    Divider,
    Link,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material'
import type React from 'react'

export const AboutPage: React.FC = () => {
    return (
        <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
            <Typography
                gutterBottom
                sx={{ fontSize: { xs: '1.75rem', md: '2.5rem' } }}
                variant="h3"
            >
                What is CSOPL?
            </Typography>
            <Divider sx={{ mb: 4 }} />

            <Typography color="text.secondary" sx={{ mb: 4 }} variant="body1">
                The Colorado Springs One Pocket League is a ranked, weighted, weekly one-pocket
                league. Face opponents every week in a fairly weighted match and compete with others
                to be at the top of your division to get an invite into a session's end tournament
                with thousands of dollars in the prize pool.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <section>
                    <Typography gutterBottom variant="h5">
                        How to Play
                    </Typography>
                    <Typography color="text.secondary" variant="body1">
                        Play a different opponent from your division every week in a race to three
                        games. Check out{' '}
                        <Link
                            href="https://www.billiards.com/blogs/articles/official-bca-one-pocket-rules"
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            the official BCA one-pocket rules
                        </Link>{' '}
                        for more information on how to play.
                    </Typography>
                </section>

                <section>
                    <Typography gutterBottom variant="h5">
                        OPL Rating
                    </Typography>
                    <Typography color="text.secondary" variant="body1">
                        CSOPL has an elo style rating system to enable fair matches regardless of
                        skill level. New players start with a rating of 600, and ratings go up or
                        down with every reported game. Match weights are determined by the difference
                        in rating between the two players:
                    </Typography>
                    <TableContainer component={Paper} sx={{ mt: 2, width: 'fit-content', mx: 'auto' }} variant="outlined">
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Rating Difference</TableCell>
                                    <TableCell>Match Weight</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {[
                                    ['0–50', '8–8'],
                                    ['51–100', '8–7'],
                                    ['101–150', '9–7'],
                                    ['151–200', '9–6'],
                                    ['201–250', '10–6'],
                                    ['251–300', '10–5'],
                                    ['301–350', '11–5'],
                                    ['351–400', '11–4'],
                                    ['401–450', '12–4'],
                                ].map(([diff, weight]) => (
                                    <TableRow key={diff}>
                                        <TableCell>{diff}</TableCell>
                                        <TableCell>{weight}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </section>

                <section>
                    <Typography gutterBottom variant="h5">
                        OPL Division
                    </Typography>
                    <Typography color="text.secondary" variant="body1">
                        Players are placed into divisions with up to 7 other players. Each division
                        meets on the same day each week to play their match at the same time each
                        week. Match schedules can be viewed in the app.
                    </Typography>
                </section>

                <section>
                    <Typography gutterBottom variant="h5">
                        OPL Session
                    </Typography>
                    <Typography color="text.secondary" variant="body1">
                        Each session consists of a double round robin, where each player is matched
                        against every other player twice. Each match is a race to three games, and
                        players can earn up to three points:
                    </Typography>
                    <TableContainer component={Paper} sx={{ mt: 2, width: 'fit-content', mx: 'auto' }} variant="outlined">
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Score</TableCell>
                                    <TableCell>Winner</TableCell>
                                    <TableCell>Loser</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {[
                                    ['3–0', '3 points', '0 points'],
                                    ['3–1', '2 points', '0 points'],
                                    ['3–2', '2 points', '1 point'],
                                ].map(([score, winner, loser]) => (
                                    <TableRow key={score}>
                                        <TableCell>{score}</TableCell>
                                        <TableCell>{winner}</TableCell>
                                        <TableCell>{loser}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <Typography color="text.secondary" sx={{ mt: 2 }} variant="body1">
                        To report the match results and receive points, both players submit a signed
                        score sheet along with $10 for league dues. Any match that does not have a
                        score sheet or league dues is not scored.
                    </Typography>
                </section>

                <section>
                    <Typography gutterBottom variant="h5">
                        End of Session Tournament
                    </Typography>
                    <Typography color="text.secondary" variant="body1">
                        All league dues are collected in a pot to be used as the prize pool for a
                        double elimination tournament at the end of the session. The top four players
                        from each division are invited to play for a piece of the prize pool.
                    </Typography>
                </section>

                <section>
                    <Typography gutterBottom variant="h5">
                        How to Join
                    </Typography>
                    <Typography color="text.secondary" variant="body1">
                        If you want to join, contact the league admin at{' '}
                        <Link href="mailto:admin@csopl.com">admin@csopl.com</Link> with your name,
                        phone number, and google account email address. You can request a night of
                        the week you'd like to play, currently available are Tuesday nights or
                        Wednesday nights at 5:30pm. The admin will let you know when you've been
                        added at which point you will be able to sign in to the web app using the
                        google account given to the admin.
                    </Typography>
                </section>
            </Box>
        </Container>
    )
}

export default AboutPage
