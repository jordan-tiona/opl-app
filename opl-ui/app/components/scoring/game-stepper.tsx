import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material'
import { Box, IconButton, Stack, Typography } from '@mui/material'

interface PlayerStepperProps {
    label: string
    value: number
    min: number
    max: number
    onChange: (value: number) => void
    highlight?: boolean
}

const PlayerStepper: React.FC<PlayerStepperProps> = ({ label, value, min, max, onChange, highlight }) => (
    <Stack alignItems="center" direction="row" spacing={1} sx={{ flex: 1 }}>
        <Typography
            sx={{
                flex: 1,
                fontWeight: highlight ? 700 : 400,
                color: highlight ? 'text.primary' : 'text.secondary',
            }}
            variant="body1"
        >
            {label}
        </Typography>
        <IconButton
            disabled={value <= min}
            size="large"
            sx={{ p: 1.5 }}
            onClick={() => { if (value > min) onChange(value - 1) }}
        >
            <RemoveIcon />
        </IconButton>
        <Typography
            sx={{
                minWidth: 36,
                textAlign: 'center',
                fontWeight: 700,
                fontSize: '1.25rem',
                color: highlight ? 'primary.main' : 'text.primary',
            }}
        >
            {value}
        </Typography>
        <IconButton
            disabled={value >= max}
            size="large"
            sx={{ p: 1.5 }}
            onClick={() => { if (value < max) onChange(value + 1) }}
        >
            <AddIcon />
        </IconButton>
    </Stack>
)

export interface GameScore {
    player1Score: number
    player2Score: number
}

interface GameStepperProps {
    index: number
    game: GameScore
    player1Name: string
    player2Name: string
    p1Weight: number
    p2Weight: number
    onChange: (game: GameScore) => void
    onDelete: () => void
}

export const GameStepper: React.FC<GameStepperProps> = ({
    index,
    game,
    player1Name,
    player2Name,
    p1Weight,
    p2Weight,
    onChange,
    onDelete,
}) => {
    const p1Won = game.player1Score === p1Weight && game.player2Score < p2Weight
    const p2Won = game.player2Score === p2Weight && game.player1Score < p1Weight
    const isValid = p1Won || p2Won

    return (
        <Box
            sx={{
                border: 1,
                borderColor: isValid ? 'success.main' : 'divider',
                borderRadius: 2,
                p: 2,
                transition: 'border-color 0.2s',
            }}
        >
            <Stack alignItems="center" direction="row" justifyContent="space-between" sx={{ mb: 1.5 }}>
                <Typography color="text.secondary" variant="body2">
                    Game {index + 1}
                </Typography>
                <Typography
                    component="button"
                    onClick={onDelete}
                    sx={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'error.main',
                        fontSize: '0.75rem',
                        p: 0,
                        '&:hover': { textDecoration: 'underline' },
                    }}
                >
                    Remove
                </Typography>
            </Stack>

            <Stack spacing={1}>
                <PlayerStepper
                    highlight={p1Won}
                    label={player1Name}
                    max={p1Weight}
                    min={-3}
                    value={game.player1Score}
                    onChange={(v) => onChange({ ...game, player1Score: v })}
                />
                <PlayerStepper
                    highlight={p2Won}
                    label={player2Name}
                    max={p2Weight}
                    min={-3}
                    value={game.player2Score}
                    onChange={(v) => onChange({ ...game, player2Score: v })}
                />
            </Stack>
        </Box>
    )
}
