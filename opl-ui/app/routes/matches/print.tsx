import { Alert, Box, CircularProgress, GlobalStyles, Typography } from '@mui/material'
import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router'

import { ScoreSheet } from '~/components/matches/score-sheet'
import { useMatch, useMatches } from '~/lib/react-query'
import { usePlayers } from '~/lib/react-query'

const PrintMatchesPage: React.FC = () => {
    const [searchParams] = useSearchParams()
    const matchId = searchParams.get('match_id')
    const date = searchParams.get('date')
    const divisionId = searchParams.get('division_id')
    const hasPrinted = useRef(false)

    // Single match mode
    const { data: singleMatch, isLoading: singleLoading, error: singleError } = useMatch(
        matchId ? Number(matchId) : 0,
    )

    // Bulk mode: all matches for a date/division
    const bulkParams = !matchId && date ? {
        start_date: date,
        end_date: date,
        ...(divisionId ? { division_id: Number(divisionId) } : {}),
        completed: false,
    } : { start_date: undefined }

    const { data: bulkMatches, isLoading: bulkLoading, error: bulkError } = useMatches(bulkParams)

    const { data: players, isLoading: playersLoading } = usePlayers()

    const matches = matchId && singleMatch ? [singleMatch] : (!matchId && date ? bulkMatches ?? [] : [])
    const isLoading = (matchId ? singleLoading : bulkLoading) || playersLoading
    const error = singleError ?? bulkError

    // Set document title for PDF filename and auto-trigger print
    useEffect(() => {
        if (!isLoading && matches.length > 0 && players && !hasPrinted.current) {
            hasPrinted.current = true
            const d = new Date(matches[0].scheduled_date)
            const dateStr = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}-${d.getFullYear()}`
            if (matchId && players) {
                const m = matches[0]
                const p1 = players.find((p) => p.player_id === m.player1_id)
                const p2 = players.find((p) => p.player_id === m.player2_id)
                const p1Name = p1 ? `${p1.first_name} ${p1.last_name}` : 'Unknown'
                const p2Name = p2 ? `${p2.first_name} ${p2.last_name}` : 'Unknown'
                document.title = `${p1Name} vs ${p2Name} - ${dateStr}`
            } else {
                document.title = `Score Sheets - ${dateStr}`
            }
            const timer = setTimeout(() => window.print(), 500)
            return () => clearTimeout(timer)
        }
    }, [isLoading, matches.length, players, matchId])

    if (error) {
        return <Alert severity="error">Failed to load matches: {error.message}</Alert>
    }

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <CircularProgress />
            </Box>
        )
    }

    if (matches.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">No matches found to print.</Typography>
            </Box>
        )
    }

    return (
        <>
        <GlobalStyles styles="@media print { @page { margin: 0.5in; } }" />
        <Box
            sx={{
                backgroundColor: '#fff',
                minHeight: '100vh',
                '@media print': {
                    '& .no-print': { display: 'none' },
                },
            }}
        >
            <Typography className="no-print" sx={{ textAlign: 'center', mb: 2, color: 'text.secondary' }}>
                {matches.length} score sheet{matches.length !== 1 ? 's' : ''} ready — print dialog should open automatically.
            </Typography>
            {matches.map((match) => (
                <ScoreSheet key={match.match_id} match={match} players={players ?? []} />
            ))}
        </Box>
        </>
    )
}

export default PrintMatchesPage
