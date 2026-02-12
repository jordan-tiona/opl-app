import {
    CalendarMonth as CalendarMonthIcon,
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
}

export const SessionCard: React.FC<SessionCardProps> = ({ session, divisionName }: SessionCardProps) => {
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
                        {session.start_date} &mdash; {session.end_date}
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
                    <Typography variant="body2">Match time: {session.match_time}</Typography>
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
