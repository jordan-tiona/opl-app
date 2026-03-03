import { Add as AddIcon, Delete as DeleteIcon, Search as SearchIcon } from '@mui/icons-material'
import {
    Alert,
    Box,
    Button,
    Card,
    CardActionArea,
    CardContent,
    Chip,
    CircularProgress,
    FormControl,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'

import { DeleteConfirmDialog } from '~/components/common'
import { AddPlayerDialog } from '~/components/players/add-player-dialog'
import { useAuth } from '~/lib/auth'
import { useDeletePlayer, useDivisionPlayers, useDivisions, usePlayers } from '~/lib/react-query'

export const PlayersPage: React.FC = () => {
    const navigate = useNavigate()
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('md'))
    const { user } = useAuth()
    const { data: players, isLoading, error } = usePlayers()
    const { data: divisions } = useDivisions()
    const deletePlayer = useDeletePlayer()

    const [search, setSearch] = useState('')
    const [divisionFilter, setDivisionFilter] = useState<number | ''>('')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)

    const { data: divisionPlayersList } = useDivisionPlayers(
        typeof divisionFilter === 'number' ? divisionFilter : 0,
    )

    const divisionPlayerIds = useMemo(
        () =>
            divisionFilter !== '' && divisionPlayersList
                ? new Set(divisionPlayersList.map((p) => p.player_id))
                : null,
        [divisionFilter, divisionPlayersList],
    )

    const filteredPlayers = players
        ?.filter((player) => {
            const fullName = `${player.first_name} ${player.last_name}`.toLowerCase()

            if (!fullName.includes(search.toLowerCase())) {
                return false
            }

            if (divisionPlayerIds && !divisionPlayerIds.has(player.player_id)) {
                return false
            }

            return true
        })
        .sort((a, b) => {
            return a.last_name.localeCompare(b.last_name)
        })

    if (error) {
        return <Alert severity="error">Failed to load players: {error.message}</Alert>
    }

    const deleteTarget = players?.find((p) => p.player_id === deleteTargetId)

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
                <Typography variant="h3">Players</Typography>
                <Button
                    startIcon={<AddIcon />}
                    variant="contained"
                    onClick={() => setDialogOpen(true)}
                >
                    Add Player
                </Button>
            </Box>

            <Box
                sx={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: 2,
                    mb: 3,
                }}
            >
                <TextField
                    fullWidth
                    placeholder="Search players..."
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        },
                    }}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Division</InputLabel>
                    <Select
                        label="Division"
                        value={divisionFilter}
                        onChange={(e) => setDivisionFilter(e.target.value as number | '')}
                    >
                        <MenuItem value="">All</MenuItem>
                        {divisions?.map((d) => (
                            <MenuItem key={d.division_id} value={d.division_id}>
                                {d.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            ) : filteredPlayers?.length === 0 ? (
                <Card>
                    <CardContent>
                        <Typography align="center" color="text.secondary">
                            No players found
                        </Typography>
                    </CardContent>
                </Card>
            ) : isMobile ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {filteredPlayers?.map((player) => (
                        <Card key={player.player_id}>
                            <CardActionArea
                                onClick={() => navigate(`/players/${player.player_id}`)}
                            >
                                <CardContent>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            mb: 1,
                                        }}
                                    >
                                        <Typography variant="h6">
                                            {player.first_name} {player.last_name}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Chip
                                                color="primary"
                                                label={`Rating: ${player.rating}`}
                                                size="small"
                                            />
                                            {user?.is_admin && (
                                                <IconButton
                                                    color="error"
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setDeleteTargetId(player.player_id)
                                                    }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            )}
                                        </Box>
                                    </Box>
                                    {player.email && (
                                        <Typography color="text.secondary" variant="body2">
                                            {player.email}
                                        </Typography>
                                    )}
                                    {player.phone && (
                                        <Typography color="text.secondary" variant="body2">
                                            {player.phone}
                                        </Typography>
                                    )}
                                    <Typography
                                        color="text.secondary"
                                        sx={{ mt: 0.5 }}
                                        variant="body2"
                                    >
                                        Games played: {player.games_played}
                                    </Typography>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    ))}
                </Box>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Phone</TableCell>
                                <TableCell align="right">Rating</TableCell>
                                <TableCell align="right">Games Played</TableCell>
                                {user?.is_admin && <TableCell align="right">Actions</TableCell>}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredPlayers?.map((player) => (
                                <TableRow
                                    hover
                                    key={player.player_id}
                                    sx={{ cursor: 'pointer' }}
                                    onClick={() => navigate(`/players/${player.player_id}`)}
                                >
                                    <TableCell>
                                        {player.first_name} {player.last_name}
                                    </TableCell>
                                    <TableCell>{player.email}</TableCell>
                                    <TableCell>{player.phone}</TableCell>
                                    <TableCell align="right">{player.rating}</TableCell>
                                    <TableCell align="right">{player.games_played}</TableCell>
                                    {user?.is_admin && (
                                        <TableCell align="right">
                                            <IconButton
                                                color="error"
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setDeleteTargetId(player.player_id)
                                                }}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <AddPlayerDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />

            <DeleteConfirmDialog
                description={deleteTarget ? `Are you sure you want to delete ${deleteTarget.first_name} ${deleteTarget.last_name}? Their match history will be preserved.` : ''}
                isPending={deletePlayer.isPending}
                open={deleteTargetId !== null}
                title="Delete Player"
                onClose={() => setDeleteTargetId(null)}
                onConfirm={async () => {
                    if (deleteTargetId !== null) {
                        await deletePlayer.mutateAsync(deleteTargetId)
                        setDeleteTargetId(null)
                    }
                }}
            />
        </Box>
    )
}

export default PlayersPage
