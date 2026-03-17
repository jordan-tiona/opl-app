import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Stack,
    Typography,
} from '@mui/material'

import { useMatchPayments, useReportPayment } from '~/lib/react-query'
import { useSnackbar } from '~/lib/snackbar'
import type { Match, Player } from '~/lib/types'

const CASHAPP_HANDLE = import.meta.env.VITE_CASHAPP_HANDLE as string | undefined
const VENMO_HANDLE = import.meta.env.VITE_VENMO_HANDLE as string | undefined
const ZELLE_INFO = import.meta.env.VITE_ZELLE_INFO as string | undefined

const DUES_AMOUNT = 10

interface PaymentDialogProps {
    open: boolean
    onClose: () => void
    match: Match
    currentPlayer: Player
}

export const PaymentDialog: React.FC<PaymentDialogProps> = ({
    open,
    onClose,
    match,
    currentPlayer,
}) => {
    const { showSnackbar } = useSnackbar()
    const { data: payments, isLoading } = useMatchPayments(open ? match.match_id : 0)
    const reportPayment = useReportPayment()

    const myPayment = payments?.find((p) => p.player_id === currentPlayer.player_id)

    const handleReport = async (method: string) => {
        try {
            await reportPayment.mutateAsync({ matchId: match.match_id, paymentMethod: method })
            showSnackbar("Payment reported — the admin will confirm once received.", 'success')
        } catch (err) {
            showSnackbar(err instanceof Error ? err.message : 'Failed to report payment', 'error')
        }
    }

    const paymentStatusChip = () => {
        if (!myPayment || myPayment.status === 'unpaid') {return null}

        return (
            <Chip
                color={myPayment.status === 'confirmed' ? 'success' : 'warning'}
                label={myPayment.status === 'confirmed' ? 'Confirmed' : 'Pending Admin Confirmation'}
                size="small"
            />
        )
    }

    const renderPaymentOptions = () => {
        if (myPayment?.status === 'confirmed') {
            return (
                <Box sx={{ py: 2 }}>
                    <Typography color="success.main" fontWeight={600}>
                        ✓ Your $10 dues payment has been confirmed.
                    </Typography>
                </Box>
            )
        }

        if (myPayment?.status === 'player_pending') {
            return (
                <Box sx={{ py: 2 }}>
                    <Typography color="text.secondary">
                        Your payment via <strong>{myPayment.payment_method}</strong> has been reported
                        and is awaiting admin confirmation.
                    </Typography>
                </Box>
            )
        }

        return (
            <Box>
                <Typography sx={{ mb: 2 }} variant="body2">
                    Send <strong>${DUES_AMOUNT}</strong> for league dues, then tap the button for the
                    method you used to notify the admin.
                </Typography>

                <Stack spacing={2}>
                    {CASHAPP_HANDLE && (
                        <Box>
                            <Typography fontWeight={600} sx={{ mb: 1 }} variant="body2">
                                CashApp
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <Button
                                    href={`https://cash.app/${CASHAPP_HANDLE}/${DUES_AMOUNT}`}
                                    rel="noopener noreferrer"
                                    size="small"
                                    target="_blank"
                                    variant="outlined"
                                >
                                    Open CashApp
                                </Button>
                                <Button
                                    disabled={reportPayment.isPending}
                                    size="small"
                                    variant="contained"
                                    onClick={() => handleReport('cashapp')}
                                >
                                    I&apos;ve Paid via CashApp
                                </Button>
                            </Box>
                        </Box>
                    )}

                    {VENMO_HANDLE && (
                        <Box>
                            <Typography fontWeight={600} sx={{ mb: 1 }} variant="body2">
                                Venmo
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <Button
                                    href={`https://venmo.com/${VENMO_HANDLE}?txn=pay&amount=${DUES_AMOUNT}&note=OPL+Dues`}
                                    rel="noopener noreferrer"
                                    size="small"
                                    target="_blank"
                                    variant="outlined"
                                >
                                    Open Venmo
                                </Button>
                                <Button
                                    disabled={reportPayment.isPending}
                                    size="small"
                                    variant="contained"
                                    onClick={() => handleReport('venmo')}
                                >
                                    I&apos;ve Paid via Venmo
                                </Button>
                            </Box>
                        </Box>
                    )}

                    {ZELLE_INFO && (
                        <Box>
                            <Typography fontWeight={600} sx={{ mb: 1 }} variant="body2">
                                Zelle
                            </Typography>
                            <Typography color="text.secondary" sx={{ mb: 1 }} variant="body2">
                                Send to: <strong>{ZELLE_INFO}</strong>
                            </Typography>
                            <Button
                                disabled={reportPayment.isPending}
                                size="small"
                                variant="contained"
                                onClick={() => handleReport('zelle')}
                            >
                                I&apos;ve Paid via Zelle
                            </Button>
                        </Box>
                    )}

                    {!CASHAPP_HANDLE && !VENMO_HANDLE && !ZELLE_INFO && (
                        <Typography color="text.secondary" variant="body2">
                            Payment info not configured. Contact the admin.
                        </Typography>
                    )}
                </Stack>
            </Box>
        )
    }

    return (
        <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose}>
            <DialogTitle>
                Pay Dues — Match #{match.match_id}
                {myPayment && <Box component="span" sx={{ ml: 1 }}>{paymentStatusChip()}</Box>}
            </DialogTitle>
            <DialogContent>
                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Box>
                        {renderPaymentOptions()}
                        <Divider sx={{ my: 2 }} />
                        <Typography color="text.secondary" variant="caption">
                            Both players must pay and have their payments confirmed before the match
                            is officially scored and ratings update.
                        </Typography>
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    )
}
