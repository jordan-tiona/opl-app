import { Add as AddIcon, Delete as DeleteIcon, Save as SaveIcon } from '@mui/icons-material'
import {
    Autocomplete,
    Box,
    Button,
    IconButton,
    TextField,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material'
import { useEffect, useRef, useState } from 'react'

import { useCompleteMatch } from '~/lib/react-query'
import { useSnackbar } from '~/lib/snackbar'
import type { GameInput, Player } from '~/lib/types'
import { getMatchWeight } from '~/lib/utils'

interface GameScore {
    player1Score: number
    player2Score: number
}

interface GameRecorderProps {
    matchId: number
    player1: Player
    player2: Player
}

export const GameRecorder: React.FC<GameRecorderProps> = ({
    matchId,
    player1,
    player2,
}: GameRecorderProps) => {
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('md'))
    const completeMatch = useCompleteMatch()
    const { showSnackbar } = useSnackbar()
    const [games, setGames] = useState<GameScore[]>([])
    const [p1Weight, p2Weight] = getMatchWeight(player1.rating, player2.rating)
    const p1Options = Array.from({ length: p1Weight + 1 }, (_, i) => String(i))
    const p2Options = Array.from({ length: p2Weight + 1 }, (_, i) => String(i))
    const lastGameRef = useRef<HTMLInputElement>(null)
    const [focusLastGame, setFocusLastGame] = useState(false)

    useEffect(() => {
        if (focusLastGame && lastGameRef.current) {
            lastGameRef.current.focus()
            lastGameRef.current.select()
            setFocusLastGame(false)
        }
    }, [focusLastGame, games.length])

    const addGame = () => {
        setGames((prev) => [...prev, { player1Score: 0, player2Score: 0 }])
        setFocusLastGame(true)
    }

    const removeGame = (index: number) => {
        setGames((prev) => prev.filter((_, i) => i !== index))
    }

    const updateScore = (
        index: number,
        player: 'player1Score' | 'player2Score',
        value: string | number,
    ) => {
        const numValue = Math.max(0, Number(value) || 0)

        setGames((prev) =>
            prev.map((game, i) => (i === index ? { ...game, [player]: numValue } : game)),
        )
    }

    const isValidGame = (game: GameScore): boolean => {
        const p1AtWeight = game.player1Score === p1Weight && game.player2Score < p2Weight
        const p2AtWeight = game.player2Score === p2Weight && game.player1Score < p1Weight

        return p1AtWeight || p2AtWeight
    }

    const convertToGameInput = (game: GameScore): GameInput => {
        if (game.player1Score === p1Weight) {
            return {
                winner_id: player1.player_id,
                loser_id: player2.player_id,
                balls_remaining: p2Weight - game.player2Score,
            }
        } else {
            return {
                winner_id: player2.player_id,
                loser_id: player1.player_id,
                balls_remaining: p1Weight - game.player1Score,
            }
        }
    }

    const handleSubmit = async () => {
        if (games.length === 0) {
            return
        }

        const gameInputs = games.map(convertToGameInput)

        try {
            await completeMatch.mutateAsync({ id: matchId, games: gameInputs })
            showSnackbar('Match completed', 'success')
            setGames([])
        } catch (err) {
            showSnackbar(err instanceof Error ? err.message : 'Failed to complete match', 'error')
        }
    }

    const allGamesValid = games.length > 0 && games.every(isValidGame)

    return (
        <Box>
            <Typography fontWeight={600} sx={{ mb: 2 }} variant="subtitle1">
                Record Games
            </Typography>

            {games.length === 0 ? (
                <Typography align="center" color="text.secondary" sx={{ py: 2 }}>
                    Click "Add Game" to start recording game results
                </Typography>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {games.map((game, index) => {
                        const valid = isValidGame(game)

                        return isMobile ? (
                            <Box
                                key={index}
                                sx={{
                                    border: 1,
                                    borderColor: 'divider',
                                    borderRadius: 1,
                                    p: 1.5,
                                }}
                            >
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        mb: 1.5,
                                    }}
                                >
                                    <Typography color="text.secondary" variant="body2">
                                        Game {index + 1}
                                    </Typography>
                                    <IconButton
                                        color="error"
                                        size="small"
                                        tabIndex={-1}
                                        onClick={() => removeGame(index)}
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        mb: 1,
                                    }}
                                >
                                    <Typography sx={{ flex: 1 }} variant="body2">
                                        {player1.first_name} {player1.last_name}
                                    </Typography>
                                    <Autocomplete
                                        autoSelect
                                        disableClearable
                                        freeSolo
                                        options={p1Options}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                error={!valid && game.player1Score > 0}
                                                inputRef={
                                                    index === games.length - 1
                                                        ? lastGameRef
                                                        : undefined
                                                }
                                            />
                                        )}
                                        size="small"
                                        sx={{ width: 80 }}
                                        value={String(game.player1Score)}
                                        onChange={(_, value) =>
                                            updateScore(index, 'player1Score', value ?? 0)
                                        }
                                        onInputChange={(_, value, reason) => {
                                            if (reason === 'input') {
                                                updateScore(index, 'player1Score', value)
                                            }
                                        }}
                                    />
                                </Box>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                    }}
                                >
                                    <Typography sx={{ flex: 1 }} variant="body2">
                                        {player2.first_name} {player2.last_name}
                                    </Typography>
                                    <Autocomplete
                                        autoSelect
                                        disableClearable
                                        freeSolo
                                        options={p2Options}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                error={!valid && game.player2Score > 0}
                                            />
                                        )}
                                        size="small"
                                        sx={{ width: 80 }}
                                        value={String(game.player2Score)}
                                        onChange={(_, value) =>
                                            updateScore(index, 'player2Score', value ?? 0)
                                        }
                                        onInputChange={(_, value, reason) => {
                                            if (reason === 'input') {
                                                updateScore(index, 'player2Score', value)
                                            }
                                        }}
                                    />
                                </Box>
                            </Box>
                        ) : (
                            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography color="text.secondary" sx={{ minWidth: 60 }}>
                                    Game {index + 1}:
                                </Typography>
                                <Typography sx={{ minWidth: 120 }}>
                                    {player1.first_name} {player1.last_name}
                                </Typography>
                                <Autocomplete
                                    autoSelect
                                    disableClearable
                                    freeSolo
                                    options={p1Options}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            error={!valid && game.player1Score > 0}
                                            inputRef={
                                                index === games.length - 1 ? lastGameRef : undefined
                                            }
                                        />
                                    )}
                                    size="small"
                                    sx={{ width: 80 }}
                                    value={String(game.player1Score)}
                                    onChange={(_, value) =>
                                        updateScore(index, 'player1Score', value ?? 0)
                                    }
                                    onInputChange={(_, value, reason) => {
                                        if (reason === 'input') {
                                            updateScore(index, 'player1Score', value)
                                        }
                                    }}
                                />
                                <Typography fontWeight={600}>:</Typography>
                                <Autocomplete
                                    autoSelect
                                    disableClearable
                                    freeSolo
                                    options={p2Options}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            error={!valid && game.player2Score > 0}
                                        />
                                    )}
                                    size="small"
                                    sx={{ width: 80 }}
                                    value={String(game.player2Score)}
                                    onChange={(_, value) =>
                                        updateScore(index, 'player2Score', value ?? 0)
                                    }
                                    onInputChange={(_, value, reason) => {
                                        if (reason === 'input') {
                                            updateScore(index, 'player2Score', value)
                                        }
                                    }}
                                />
                                <Typography sx={{ minWidth: 120 }}>
                                    {player2.first_name} {player2.last_name}
                                </Typography>
                                <IconButton
                                    color="error"
                                    size="small"
                                    tabIndex={-1}
                                    onClick={() => removeGame(index)}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </Box>
                        )
                    })}
                </Box>
            )}

            <Box
                sx={{
                    mt: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <Button color="secondary" size="small" startIcon={<AddIcon />} onClick={addGame}>
                    Add Game
                </Button>
                {games.length > 0 && (
                    <Button
                        disabled={completeMatch.isPending || !allGamesValid}
                        size="small"
                        startIcon={<SaveIcon />}
                        variant="contained"
                        onClick={handleSubmit}
                    >
                        {completeMatch.isPending ? 'Saving...' : 'Complete Match'}
                    </Button>
                )}
            </Box>
        </Box>
    )
}
