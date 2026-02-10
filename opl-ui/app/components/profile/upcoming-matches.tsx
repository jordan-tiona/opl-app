import {
    Box,
    Card,
    CardContent,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material'

import type { Match, Player } from '~/lib/types'
import { getMatchWeight } from '~/lib/utils'

interface UpcomingMatchesProps {
    matches: Match[]
    player: Player
    players?: Player[]
    isLoading: boolean
}

export const UpcomingMatches: React.FC<UpcomingMatchesProps> = ({
    matches,
    player,
    players,
    isLoading,
}) => {
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('md'))

    const getPlayerName = (id: number) => {
        const p = players?.find((pl) => pl.player_id === id)

        return p ? `${p.first_name} ${p.last_name}` : `Player #${id}`
    }

    if (isLoading) {
        return <CircularProgress size={24} />
    }

    if (matches.length === 0) {
        return (
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                No upcoming matches.
            </Typography>
        )
    }

    if (isMobile) {
        return (
            <Box sx={{ mb: 4 }}>
                {matches.map((match) => {
                    const isPlayer1 = match.player1_id === player.player_id
                    const opponentId = isPlayer1 ? match.player2_id : match.player1_id
                    const myRating = isPlayer1 ? match.player1_rating : match.player2_rating
                    const oppRating = isPlayer1 ? match.player2_rating : match.player1_rating
                    const date = new Date(match.scheduled_date)
                    const datePart = date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                    })
                    const timePart = date.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                    })
                    const formattedDate = `${datePart} at ${timePart}`
                    const opponentName = getPlayerName(opponentId)
                    const [myWeight, oppWeight] = getMatchWeight(myRating, oppRating)
                    const weight = `${myWeight}:${oppWeight}`

                    return (
                        <Card key={match.match_id} sx={{ mb: 2 }}>
                            <CardContent>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    {formattedDate}
                                </Typography>
                                <Typography variant="h6" sx={{ mb: 1 }}>
                                    vs. {opponentName} ({oppRating})
                                </Typography>
                                <Typography variant="body1" color="primary">
                                    Weight: {weight}
                                </Typography>
                            </CardContent>
                        </Card>
                    )
                })}
            </Box>
        )
    }

    return (
        <TableContainer component={Card} sx={{ mb: 4 }}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Opponent</TableCell>
                        <TableCell>Weight</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {matches.map((match) => {
                        const isPlayer1 = match.player1_id === player.player_id
                        const opponentId = isPlayer1 ? match.player2_id : match.player1_id
                        const myRating = isPlayer1 ? match.player1_rating : match.player2_rating
                        const oppRating = isPlayer1 ? match.player2_rating : match.player1_rating
                        const date = new Date(match.scheduled_date)
                        const datePart = date.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                        })
                        const timePart = date.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                        })
                        const formattedDate = `${datePart} at ${timePart}`
                        const opponentName = getPlayerName(opponentId)
                        const [myWeight, oppWeight] = getMatchWeight(myRating, oppRating)
                        const weight = `${myWeight}:${oppWeight}`

                        return (
                            <TableRow key={match.match_id}>
                                <TableCell>{formattedDate}</TableCell>
                                <TableCell>
                                    vs. {opponentName} ({oppRating})
                                </TableCell>
                                <TableCell>{weight}</TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    )
}
