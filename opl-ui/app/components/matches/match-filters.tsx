import { CalendarToday as CalendarTodayIcon } from '@mui/icons-material'
import {
    Autocomplete,
    Box,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
} from '@mui/material'
import { useMemo } from 'react'

import { useDivisions } from '~/lib/react-query'
import type { Player } from '~/lib/types'

export type CompletionFilter = 'all' | 'completed' | 'scheduled'

interface MatchFiltersProps {
    dateRange: { start: string; end: string }
    onDateRangeChange: (dateRange: { start: string; end: string }) => void
    selectedPlayer: Player | null
    onPlayerChange: (player: Player | null) => void
    divisionId: number | null
    onDivisionIdChange: (divisionId: number | null) => void
    completionFilter: CompletionFilter
    onCompletionFilterChange: (filter: CompletionFilter) => void
    players: Player[]
}

export const MatchFilters: React.FC<MatchFiltersProps> = ({
    dateRange,
    onDateRangeChange,
    selectedPlayer,
    onPlayerChange,
    divisionId,
    onDivisionIdChange,
    completionFilter,
    onCompletionFilterChange,
    players,
}: MatchFiltersProps) => {
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
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, mb: 3 }}>
            <CalendarTodayIcon color="action" />
            <TextField
                label="From"
                type="date"
                value={dateRange.start}
                onChange={(e) => onDateRangeChange({ ...dateRange, start: e.target.value })}
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
            />
            <Typography color="text.secondary">to</Typography>
            <TextField
                label="To"
                type="date"
                value={dateRange.end}
                onChange={(e) => onDateRangeChange({ ...dateRange, end: e.target.value })}
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
            />

            <Autocomplete
                size="small"
                options={sortedPlayers}
                value={selectedPlayer}
                onChange={(_, value) => onPlayerChange(value)}
                getOptionLabel={(option) =>
                    `${option.first_name} ${option.last_name} (#${option.player_id})`
                }
                filterOptions={(options, { inputValue }) => {
                    const term = inputValue.toLowerCase()

                    return options.filter(
                        (p) =>
                            `${p.first_name} ${p.last_name}`.toLowerCase().includes(term) ||
                            String(p.player_id).includes(term),
                    )
                }}
                renderInput={(params) => <TextField {...params} label="Player" />}
                isOptionEqualToValue={(option, value) => option.player_id === value.player_id}
                sx={{ minWidth: 220 }}
            />

            <FormControl size="small" sx={{ minWidth: 130 }}>
                <InputLabel>Division</InputLabel>
                <Select
                    value={divisionId !== null ? String(divisionId) : ''}
                    label="Division"
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

            <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Status</InputLabel>
                <Select
                    value={completionFilter}
                    label="Status"
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
