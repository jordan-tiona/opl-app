import { FilterList as FilterListIcon } from '@mui/icons-material'
import {
    Alert,
    Badge,
    Box,
    Card,
    CardContent,
    CircularProgress,
    Drawer,
    IconButton,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { MatchAccordion, MatchCard, MatchFilters } from '~/components/matches'
import type { CompletionFilter } from '~/components/matches/match-filters'
import { useMatches, usePlayers } from '~/lib/react-query'
import type { Player } from '~/lib/types'

const MatchesPage: React.FC = () => {
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('md'))

    const today = new Date().toISOString().split('T')[0]
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const [dateRange, setDateRange] = useState({ start: today, end: nextWeek })
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
    const [sessionId, setSessionId] = useState<number | null>(null)
    const [divisionId, setDivisionId] = useState<number | null>(null)
    const [completionFilter, setCompletionFilter] = useState<CompletionFilter>('all')
    const [expandedMatch, setExpandedMatch] = useState<number | null>(null)
    const [hasExpandedDateRange, setHasExpandedDateRange] = useState(false)
    const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)

    // Count active filters (non-default values) for badge
    const activeFilterCount = useMemo(() => {
        let count = 0

        if (selectedPlayer) {count++}

        if (sessionId !== null) {count++}

        if (divisionId !== null) {count++}

        if (completionFilter !== 'all') {count++}

        return count
    }, [selectedPlayer, sessionId, divisionId, completionFilter])

    // Automatically expand date range to 1 year when a player is first selected
    useEffect(() => {
        if (selectedPlayer && !hasExpandedDateRange) {
            const oneYearAgo = new Date()

            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
            const oneYearFromNow = new Date()

            oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)

            setDateRange({
                start: oneYearAgo.toISOString().split('T')[0],
                end: oneYearFromNow.toISOString().split('T')[0],
            })
            setHasExpandedDateRange(true)
        } else if (!selectedPlayer && hasExpandedDateRange) {
            // Reset the flag when player filter is cleared
            setHasExpandedDateRange(false)
        }
    }, [selectedPlayer, hasExpandedDateRange])

    const handleToggle = useCallback((matchId: number) => {
        setExpandedMatch((prev) => (prev === matchId ? null : matchId))
    }, [])

    const matchParams = useMemo(() => {
        const params: {
            start_date?: string
            end_date?: string
            player_id?: number
            session_id?: number
            division_id?: number
            completed?: boolean
        } = {}

        if (dateRange.start) {
            params.start_date = dateRange.start
        }

        if (dateRange.end) {
            params.end_date = dateRange.end
        }

        if (selectedPlayer) {
            params.player_id = selectedPlayer.player_id
        }

        if (sessionId !== null) {
            params.session_id = sessionId
        }

        if (divisionId !== null) {
            params.division_id = divisionId
        }

        if (completionFilter === 'completed') {
            params.completed = true
        }

        if (completionFilter === 'scheduled') {
            params.completed = false
        }

        return params
    }, [dateRange, selectedPlayer, sessionId, divisionId, completionFilter])

    const {
        data: matches,
        isLoading: matchesLoading,
        error: matchesError,
    } = useMatches(matchParams)
    const { data: players, isLoading: playersLoading } = usePlayers()

    const isLoading = matchesLoading || playersLoading

    const sortedMatches = useMemo(() => {
        if (!matches) {
            return []
        }

        return [...matches].sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1
            }

            return new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
        })
    }, [matches])

    if (matchesError) {
        return <Alert severity="error">Failed to load matches: {matchesError.message}</Alert>
    }

    const filterProps = {
        dateRange,
        onDateRangeChange: setDateRange,
        selectedPlayer,
        onPlayerChange: setSelectedPlayer,
        sessionId,
        onSessionIdChange: setSessionId,
        divisionId,
        onDivisionIdChange: setDivisionId,
        completionFilter,
        onCompletionFilterChange: setCompletionFilter,
        players: players ?? [],
    }

    return (
        <Box>
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3,
                }}
            >
                <Typography variant="h3">Matches</Typography>
                {isMobile && (
                    <IconButton onClick={() => setFilterDrawerOpen(true)}>
                        <Badge badgeContent={activeFilterCount} color="primary">
                            <FilterListIcon />
                        </Badge>
                    </IconButton>
                )}
            </Box>

            {isMobile ? (
                <Drawer
                    anchor="right"
                    open={filterDrawerOpen}
                    onClose={() => setFilterDrawerOpen(false)}
                >
                    <Box sx={{ width: 320, p: 3 }}>
                        <Typography sx={{ mb: 2 }} variant="h6">
                            Filters
                        </Typography>
                        <MatchFilters {...filterProps} vertical />
                    </Box>
                </Drawer>
            ) : (
                <MatchFilters {...filterProps} />
            )}

            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            ) : sortedMatches.length === 0 ? (
                <Card>
                    <CardContent>
                        <Typography align="center" color="text.secondary">
                            No matches found for the selected filters
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <Box>
                    {sortedMatches.map((match) =>
                        isMobile ? (
                            <MatchCard
                                expanded={expandedMatch === match.match_id}
                                key={match.match_id}
                                match={match}
                                players={players ?? []}
                                onToggle={handleToggle}
                            />
                        ) : (
                            <MatchAccordion
                                expanded={expandedMatch === match.match_id}
                                key={match.match_id}
                                match={match}
                                players={players ?? []}
                                onToggle={handleToggle}
                            />
                        ),
                    )}
                </Box>
            )}
        </Box>
    )
}

export default MatchesPage
