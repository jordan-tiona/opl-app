import { Box, Typography } from '@mui/material'

import type { Match, Player } from '~/lib/types'
import { getMatchWeight } from '~/lib/utils'

interface ScoreSheetProps {
    match: Match
    players: Player[]
}

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })
}

const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse' as const,
    border: '2px solid #888',
}

const cellStyle = {
    border: '1px solid #aaa',
    padding: '8px 12px',
    textAlign: 'center' as const,
}

const headerCellStyle = {
    ...cellStyle,
    fontWeight: 'bold',
    backgroundColor: '#d0d0d0',
    WebkitPrintColorAdjust: 'exact' as const,
    printColorAdjust: 'exact' as const,
}

export const ScoreSheet: React.FC<ScoreSheetProps> = ({ match, players }) => {
    const player1 = players.find((p) => p.player_id === match.player1_id)
    const player2 = players.find((p) => p.player_id === match.player2_id)
    const p1Name = player1 ? `${player1.first_name} ${player1.last_name}` : 'Unknown'
    const p2Name = player2 ? `${player2.first_name} ${player2.last_name}` : 'Unknown'
    const p1Rating = player1?.rating ?? match.player1_rating
    const p2Rating = player2?.rating ?? match.player2_rating
    const [p1Weight, p2Weight] = getMatchWeight(p1Rating, p2Rating)

    return (
        <Box
            sx={{
                pageBreakAfter: 'always',
                padding: '20px',
                fontFamily: 'serif',
                color: '#000',
                maxWidth: '700px',
                margin: '0 auto',
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact',
                '@media print': {
                    padding: '0',
                    maxWidth: 'none',
                },
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    mb: 3,
                    backgroundColor: '#adadad',
                    padding: '12px 16px',
                    borderRadius: '4px',
                    WebkitPrintColorAdjust: 'exact',
                    printColorAdjust: 'exact',
                }}
            >
                <img
                    alt="CSOPL Logo"
                    src="/img/csopl-logo-transparent.svg"
                    style={{ width: 60, height: 60 }}
                />
                <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 'bold', fontSize: '1.5rem', color: '#000' }}>
                        CSOPL Score Sheet
                    </Typography>
                    <Typography sx={{ color: '#000' }}>
                        {formatDate(match.scheduled_date)}
                    </Typography>
                </Box>
            </Box>

            {/* Player Info */}
            <table style={{ ...tableStyle, marginBottom: 20 }}>
                <thead>
                    <tr>
                        <th style={headerCellStyle}>Player</th>
                        <th style={headerCellStyle}>Rating</th>
                        <th style={headerCellStyle}>Weight (Race To)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style={cellStyle}>{p1Name}</td>
                        <td style={cellStyle}>{p1Rating}</td>
                        <td style={cellStyle}>{p1Weight}</td>
                    </tr>
                    <tr>
                        <td style={cellStyle}>{p2Name}</td>
                        <td style={cellStyle}>{p2Rating}</td>
                        <td style={cellStyle}>{p2Weight}</td>
                    </tr>
                </tbody>
            </table>

            {/* Game Score Table */}
            <Typography sx={{ fontWeight: 'bold', mb: 1, color: '#000' }}>Game Scores</Typography>
            <table style={{ ...tableStyle, marginBottom: 20 }}>
                <thead>
                    <tr>
                        <th style={headerCellStyle}>Player</th>
                        {[1, 2, 3, 4, 5].map((n) => (
                            <th key={n} style={headerCellStyle}>
                                Game {n}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style={cellStyle}>{p1Name}</td>
                        {[1, 2, 3, 4, 5].map((n) => (
                            <td key={n} style={{
                                        ...cellStyle,
                                        height: 40,
                                        border: '1px solid #555',
                                    }}>
                                &nbsp;
                            </td>
                        ))}
                    </tr>
                    <tr>
                        <td style={cellStyle}>{p2Name}</td>
                        {[1, 2, 3, 4, 5].map((n) => (
                            <td key={n} style={{
                                        ...cellStyle,
                                        height: 40,
                                        border: '1px solid #555',
                                    }}>
                                &nbsp;
                            </td>
                        ))}
                    </tr>
                </tbody>
            </table>

            {/* Lag/Flip Winner */}
            <Typography sx={{ fontWeight: 'bold', mb: 1, color: '#000' }}>
                Lag / Flip Winner
            </Typography>
            <table style={{ ...tableStyle, marginBottom: 20 }}>
                <tbody>
                    <tr>
                        <td style={{ ...cellStyle, width: '50%' }}>☐ {p1Name}</td>
                        <td style={{ ...cellStyle, width: '50%' }}>☐ {p2Name}</td>
                    </tr>
                </tbody>
            </table>

            {/* Match Winner */}
            <Typography sx={{ fontWeight: 'bold', mb: 1, color: '#000' }}>
                Match Winner (circle one)
            </Typography>
            <table style={{ ...tableStyle, marginBottom: 30 }}>
                <tbody>
                    <tr>
                        <td style={{ ...cellStyle, width: '50%', height: 40 }}>{p1Name}</td>
                        <td style={{ ...cellStyle, width: '50%', height: 40 }}>{p2Name}</td>
                    </tr>
                </tbody>
            </table>

            {/* Signatures */}
            <Typography sx={{ fontWeight: 'bold', mb: 2, color: '#000' }}>Signatures</Typography>
            <Box sx={{ display: 'flex', gap: 4 }}>
                <Box sx={{ flex: 1 }}>
                    <Typography sx={{ mb: 0.5, color: '#000', fontSize: '0.85rem' }}>
                        {p1Name}
                    </Typography>
                    <Box sx={{ borderBottom: '2px solid #888', mb: 0.5, mt: 4 }} />
                    <Typography sx={{ color: '#666', fontSize: '0.75rem' }}>Signature</Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                    <Typography sx={{ mb: 0.5, color: '#000', fontSize: '0.85rem' }}>
                        {p2Name}
                    </Typography>
                    <Box sx={{ borderBottom: '2px solid #888', mb: 0.5, mt: 4 }} />
                    <Typography sx={{ color: '#666', fontSize: '0.75rem' }}>Signature</Typography>
                </Box>
            </Box>
        </Box>
    )
}
