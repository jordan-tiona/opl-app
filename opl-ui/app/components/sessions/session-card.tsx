import {
    AttachMoney as AttachMoneyIcon,
    CalendarMonth as CalendarMonthIcon,
    Delete as DeleteIcon,
    Launch as LaunchIcon,
    Schedule as ScheduleIcon,
    SportsScore as SportsScoreIcon,
} from '@mui/icons-material'
import {
    Box,
    Card,
    CardContent,
    Chip,
    IconButton,
    Typography,
} from '@mui/material'
import { useNavigate } from 'react-router'

import { useMatches } from '~/lib/react-query'
import type { Session } from '~/lib/types'

interface SessionCardProps {
    session: Session
    divisionName?: string
    onDelete?: () => void
}

export const SessionCard: React.FC<SessionCardProps> = ({ session, divisionName, onDelete }: SessionCardProps) => {
    const navigate = useNavigate()
    const { data: matches } = useMatches({ session_id: session.session_id })

    const completedCount = matches?.filter((m) => m.completed).length ?? 0
    const scheduledCount = matches?.filter((m) => !m.completed).length ?? 0

    return (
        <Card>
            <CardContent>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                    }}
                >
                    <Box>
                        <Typography fontWeight={600} variant="h5">
                            {session.name}
                        </Typography>
                        {divisionName && (
                            <Typography color="text.secondary" variant="body2">
                                {divisionName}
                            </Typography>
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                            color={session.active ? 'success' : 'default'}
                            label={session.active ? 'Active' : 'Inactive'}
                            size="small"
                        />
                        {onDelete && (
                            <IconButton
                                color="error"
                                size="small"
                                onClick={(e) => { e.stopPropagation(); onDelete() }}
                            >
                                <DeleteIcon />
                            </IconButton>
                        )}
                        <IconButton
                            size="small"
                            onClick={() => navigate(`/sessions/${session.session_id}`)}
                        >
                            <LaunchIcon />
                        </IconButton>
                    </Box>
                </Box>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mt: 2,
                        color: 'text.secondary',
                    }}
                >
                    <CalendarMonthIcon fontSize="small" />
                    <Typography variant="body2">
                        {session.start_date && session.end_date
                            ? `${session.start_date} — ${session.end_date}`
                            : 'No matches scheduled'}
                    </Typography>
                </Box>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mt: 1,
                        color: 'text.secondary',
                    }}
                >
                    <ScheduleIcon fontSize="small" />
                    <Typography variant="body2">
                        {session.match_time ? `Match time: ${session.match_time}` : 'No specific match time'}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, color: 'text.secondary' }}>
                    <AttachMoneyIcon fontSize="small" />
                    <Typography variant="body2">
                        Dues: ${session.dues}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, color: 'text.secondary' }}>
                    <SportsScoreIcon fontSize="small" />
                    <Typography variant="body2">
                        {completedCount} completed, {scheduledCount} scheduled
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    )
}
