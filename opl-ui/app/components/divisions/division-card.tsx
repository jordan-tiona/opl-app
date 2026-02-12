import {
    CalendarMonth as CalendarMonthIcon,
    Launch as LaunchIcon,
    Groups as GroupsIcon,
} from '@mui/icons-material'
import {
    Box,
    Card,
    CardContent,
    Chip,
    Divider,
    IconButton,
    Typography,
} from '@mui/material'
import { useNavigate } from 'react-router'

import { useDivisionPlayers, useSessions } from '~/lib/react-query'
import type { Division } from '~/lib/types'

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

interface DivisionCardProps {
    division: Division
}

export const DivisionCard: React.FC<DivisionCardProps> = ({ division }: DivisionCardProps) => {
    const navigate = useNavigate()
    const { data: divisionPlayers } = useDivisionPlayers(division.division_id)
    const { data: sessions } = useSessions({ division_id: division.division_id })

    const activeSessions = sessions?.filter((s) => s.active) ?? []

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
                    <Typography fontWeight={600} variant="h5">
                        {division.name}
                    </Typography>
                    <IconButton
                        size="small"
                        onClick={() => navigate(`/divisions/${division.division_id}`)}
                    >
                        <LaunchIcon />
                    </IconButton>
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
                        {DAYS_OF_WEEK[division.day_of_week]}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, color: 'text.secondary' }}>
                    <GroupsIcon fontSize="small" />
                    <Typography variant="body2">
                        {divisionPlayers?.length ?? 0} player{(divisionPlayers?.length ?? 0) !== 1 ? 's' : ''}
                    </Typography>
                </Box>

                {activeSessions.length > 0 && (
                    <>
                        <Divider sx={{ my: 2 }} />
                        <Typography color="text.secondary" sx={{ mb: 1 }} variant="body2">
                            Active Sessions
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {activeSessions.map((s) => (
                                <Chip
                                    clickable
                                    color="primary"
                                    key={s.session_id}
                                    label={s.name}
                                    size="small"
                                    variant="filled"
                                    onClick={() => navigate(`/sessions/${s.session_id}`)}
                                />
                            ))}
                        </Box>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
