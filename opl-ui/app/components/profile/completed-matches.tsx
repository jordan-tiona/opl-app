import {
    Box,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Collapse,
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
import { useState } from 'react'


import { useGames } from '~/lib/react-query'
import type { Match, Player } from '~/lib/types'
import { getMatchWeight } from '~/lib/utils'

import { MatchGamesDetail } from './'

interface CompletedMatchesProps {
    matches: Match[]
    player: Player
    players?: Player[]
    isLoading: boolean
}

export const CompletedMatches: React.FC<CompletedMatchesProps> = ({
    matches,
    player,
    players,
    isLoading,
}) => {
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('md'))
    const [expandedMatch, setExpandedMatch] = useState<number | null>(null)
    const { data: allGames } = useGames({ player_id: player.player_id })

    const getMatchRecord = (matchId: number, playerId: number) => {
        const matchGames = allGames?.filter((g) => g.match_id === matchId) ?? []
        const wins = matchGames.filter((g) => g.winner_id === playerId).length
        const losses = matchGames.filter((g) => g.loser_id === playerId).length
        const totalRatingChange = matchGames.reduce((sum, g) => {
            return sum + (g.winner_id === playerId ? g.winner_rating_change : g.loser_rating_change)
        }, 0)

        return { wins, losses, totalRatingChange, games: matchGames }
    }

    const getPlayerName = (id: number) => {
        const p = players?.find((pl) => pl.player_id === id)

        return p ? `${p.first_name} ${p.last_name}` : `Player #${id}`
    }

    if (isLoading) {
        return <CircularProgress size={24} />
    }

    if (matches.length === 0) {
        return (
            <Typography color="text.secondary" variant="body1">
                No completed matches yet.
            </Typography>
        )
    }

    if (isMobile) {
        return (
            <Box>
                {matches.map((match) => {
                    const isPlayer1 = match.player1_id === player.player_id
                    const opponentId = isPlayer1 ? match.player2_id : match.player1_id
                    const myRating = isPlayer1 ? match.player1_rating : match.player2_rating
                    const oppRating = isPlayer1 ? match.player2_rating : match.player1_rating
                    const won = match.winner_id === player.player_id
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
                    const [myWeight, oppWeight] = getMatchWeight(myRating, oppRating)
                    const weight = `${myWeight}:${oppWeight}`
                    const isExpanded = expandedMatch === match.match_id
                    const { wins, losses, totalRatingChange, games } = getMatchRecord(
                        match.match_id,
                        player.player_id,
                    )

                    return (
                        <Card key={match.match_id} sx={{ mb: 2 }}>
                            <CardContent
                                sx={{ cursor: 'pointer', pb: isExpanded ? 2 : undefined }}
                                onClick={() => setExpandedMatch(isExpanded ? null : match.match_id)}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Chip
                                        color={won ? 'success' : 'error'}
                                        label={won ? 'Won' : 'Lost'}
                                        size="small"
                                        variant="outlined"
                                    />
                                    {games.length > 0 && (
                                        <Typography sx={{ fontWeight: 600 }} variant="body2">
                                            {wins}-{losses}
                                        </Typography>
                                    )}
                                    {games.length > 0 && (
                                        <Typography
                                            color={
                                                totalRatingChange > 0
                                                    ? 'success.main'
                                                    : 'error.main'
                                            }
                                            sx={{ fontWeight: 600 }}
                                            variant="body2"
                                        >
                                            {totalRatingChange > 0 ? '+' : ''}
                                            {totalRatingChange}
                                        </Typography>
                                    )}
                                </Box>
                                <Typography gutterBottom color="text.secondary" variant="body2">
                                    {formattedDate}
                                </Typography>
                                <Typography sx={{ mb: 1 }} variant="h6">
                                    vs. {getPlayerName(opponentId)} ({oppRating})
                                </Typography>
                                <Typography color="primary" variant="body1">
                                    Weight: {weight}
                                </Typography>
                            </CardContent>
                            <Collapse unmountOnExit in={isExpanded} timeout="auto">
                                <CardContent sx={{ pt: 0 }}>
                                    {games.map((game, index) => (
                                        <Typography key={game.game_id} variant="body2">
                                            Game {index + 1}:{' '}
                                            <Typography
                                                component="span"
                                                sx={{ fontWeight: 600 }}
                                                variant="body2"
                                            >
                                                {getPlayerName(game.winner_id)}
                                            </Typography>{' '}
                                            wins 8-{8 - game.balls_remaining}
                                        </Typography>
                                    ))}
                                    {games.length === 0 && (
                                        <Typography color="text.secondary" variant="body2">
                                            No games recorded.
                                        </Typography>
                                    )}
                                </CardContent>
                            </Collapse>
                        </Card>
                    )
                })}
            </Box>
        )
    }

    return (
        <TableContainer component={Card}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Result</TableCell>
                        <TableCell>Score</TableCell>
                        <TableCell>Rating</TableCell>
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
                        const won = match.winner_id === player.player_id
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
                        const [myWeight, oppWeight] = getMatchWeight(myRating, oppRating)
                        const weight = `${myWeight}:${oppWeight}`
                        const isExpanded = expandedMatch === match.match_id
                        const { wins, losses, totalRatingChange, games } = getMatchRecord(
                            match.match_id,
                            player.player_id,
                        )

                        return (
                            <>
                                <TableRow
                                    hover
                                    key={match.match_id}
                                    sx={{
                                        cursor: 'pointer',
                                        '& > *': { borderBottom: isExpanded ? 0 : undefined },
                                    }}
                                    onClick={() =>
                                        setExpandedMatch(isExpanded ? null : match.match_id)
                                    }
                                >
                                    <TableCell>
                                        <Chip
                                            color={won ? 'success' : 'error'}
                                            label={won ? 'Won' : 'Lost'}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {games.length > 0 ? `${wins}-${losses}` : '—'}
                                    </TableCell>
                                    <TableCell>
                                        {games.length > 0 ? (
                                            <Typography
                                                color={
                                                    totalRatingChange > 0
                                                        ? 'success.main'
                                                        : 'error.main'
                                                }
                                                sx={{ fontWeight: 600 }}
                                            >
                                                {totalRatingChange > 0 ? '+' : ''}
                                                {totalRatingChange}
                                            </Typography>
                                        ) : (
                                            '—'
                                        )}
                                    </TableCell>
                                    <TableCell>{formattedDate}</TableCell>
                                    <TableCell>
                                        vs. {getPlayerName(opponentId)} ({oppRating})
                                    </TableCell>
                                    <TableCell>{weight}</TableCell>
                                </TableRow>
                                <TableRow key={`${match.match_id}-detail`}>
                                    <TableCell
                                        colSpan={6}
                                        sx={{ py: 0, borderBottom: isExpanded ? undefined : 0 }}
                                    >
                                        <Collapse unmountOnExit in={isExpanded} timeout="auto">
                                            <Box sx={{ py: 2 }}>
                                                <MatchGamesDetail
                                                    matchId={match.match_id}
                                                    playerId={player.player_id}
                                                    players={players}
                                                />
                                            </Box>
                                        </Collapse>
                                    </TableCell>
                                </TableRow>
                            </>
                        )
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    )
}
