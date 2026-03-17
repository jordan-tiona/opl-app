import {
    Autocomplete,
    Box,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
} from '@mui/material'
import { useMemo } from 'react'
import DatePicker from 'react-datepicker'

import { useDivisions, useSessions } from '~/lib/react-query'
import type { Player } from '~/lib/types'
import { toLocalDateString } from '~/lib/utils'

export type CompletionFilter = 'all' | 'completed' | 'scheduled'

interface MatchFiltersProps {
    dateRange: { start: string; end: string }
    onDateRangeChange: (dateRange: { start: string; end: string }) => void
    selectedPlayer: Player | null
    onPlayerChange: (player: Player | null) => void
    sessionId: number | null
    onSessionIdChange: (sessionId: number | null) => void
    divisionId: number | null
    onDivisionIdChange: (divisionId: number | null) => void
    completionFilter: CompletionFilter
    onCompletionFilterChange: (filter: CompletionFilter) => void
    players: Player[]
    vertical?: boolean
}

export const MatchFilters: React.FC<MatchFiltersProps> = ({
    dateRange,
    onDateRangeChange,
    selectedPlayer,
    onPlayerChange,
    sessionId,
    onSessionIdChange,
    divisionId,
    onDivisionIdChange,
    completionFilter,
    onCompletionFilterChange,
    players,
    vertical = false,
}: MatchFiltersProps) => {
    const { data: sessions } = useSessions()
    const { data: divisions } = useDivisions()

    const sortedPlayers = useMemo(() => {
        return [...players].sort((a, b) => {
            const lastNameCompare = a.last_name.localeCompare(b.last_name)

            if (lastNameCompare !== 0) {
                return lastNameCompare
            }

            return a.first_name.localeCompare(b.first_name)
        })
    }, [players])

    return (
        <Box
            sx={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 2,
                mb: 3,
                ...(vertical && { flexDirection: 'column', alignItems: 'stretch' }),
            }}
        >
            <DatePicker
                selectsRange
                customInput={
                    <input
                        className={
                            vertical
                                ? 'date-range-picker-input date-range-picker-input--full'
                                : 'date-range-picker-input'
                        }
                    />
                }
                dateFormat="MMM d, yyyy"
                endDate={dateRange.end ? new Date(dateRange.end + 'T00:00:00') : null}
                placeholderText="Date range"
                startDate={dateRange.start ? new Date(dateRange.start + 'T00:00:00') : null}
                onChange={([start, end]) => {
                    onDateRangeChange({
                        start: start ? toLocalDateString(start) : '',
                        end: end ? toLocalDateString(end) : '',
                    })
                }}
            />

            <Autocomplete
                fullWidth
                filterOptions={(options, { inputValue }) => {
                    const term = inputValue.toLowerCase()

                    return options.filter(
                        (p) =>
                            `${p.first_name} ${p.last_name}`.toLowerCase().includes(term) ||
                            String(p.player_id).includes(term),
                    )
                }}
                getOptionLabel={(option) =>
                    `${option.first_name} ${option.last_name} (#${option.player_id})`
                }
                isOptionEqualToValue={(option, value) => option.player_id === value.player_id}
                options={sortedPlayers}
                renderInput={(params) => <TextField {...params} label="Player" />}
                size="small"
                sx={{ width: vertical ? '100%' : 220 }}
                value={selectedPlayer}
                onChange={(_, value) => onPlayerChange(value)}
            />

            <FormControl fullWidth={vertical} size="small" sx={{ minWidth: vertical ? undefined : 130 }}>
                <InputLabel>Session</InputLabel>
                <Select
                    label="Session"
                    value={sessionId !== null ? String(sessionId) : ''}
                    onChange={(e) =>
                        onSessionIdChange(e.target.value === '' ? null : Number(e.target.value))
                    }
                >
                    <MenuItem value="">All</MenuItem>
                    {sessions?.map((s) => (
                        <MenuItem key={s.session_id} value={String(s.session_id)}>
                            {s.name}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl fullWidth={vertical} size="small" sx={{ minWidth: vertical ? undefined : 150 }}>
                <InputLabel>Division</InputLabel>
                <Select
                    label="Division"
                    value={divisionId !== null ? String(divisionId) : ''}
                    onChange={(e) =>
                        onDivisionIdChange(e.target.value === '' ? null : Number(e.target.value))
                    }
                >
                    <MenuItem value="">All</MenuItem>
                    {divisions?.map((d) => (
                        <MenuItem key={d.division_id} value={String(d.division_id)}>
                            {d.name}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl fullWidth={vertical} size="small" sx={{ minWidth: vertical ? undefined : 140 }}>
                <InputLabel>Status</InputLabel>
                <Select
                    label="Status"
                    value={completionFilter}
                    onChange={(e) => onCompletionFilterChange(e.target.value as CompletionFilter)}
                >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="scheduled">Scheduled</MenuItem>
                </Select>
            </FormControl>
        </Box>
    )
}
