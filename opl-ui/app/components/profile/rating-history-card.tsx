import { Box, Card, CardContent, Typography, useMediaQuery, useTheme } from '@mui/material'
import { LineChart } from '@mui/x-charts/LineChart'

interface RatingHistoryCardProps {
    ratingHistory: { gameNumber: number; rating: number }[]
}

export const RatingHistoryCard: React.FC<RatingHistoryCardProps> = ({ ratingHistory }) => {
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('md'))

    return (
        <Card sx={{ mb: 4 }}>
            <CardContent sx={isMobile ? { px: 1 } : undefined}>
                <Typography sx={{ mb: 2, px: isMobile ? 1 : 0 }} variant="h6">
                    Rating History
                </Typography>
                {ratingHistory.length > 0 ? (
                    <LineChart
                        dataset={ratingHistory}
                        height={250}
                        margin={
                            isMobile
                                ? { top: 5, right: 5, bottom: 15, left: 0 }
                                : { top: 10, right: 10, bottom: 20, left: 0 }
                        }
                        series={[
                            {
                                dataKey: 'rating',
                                label: 'Rating',
                                color: '#64b5f6',
                                showMark: false,
                                curve: 'linear',
                            },
                        ]}
                        xAxis={[
                            {
                                dataKey: 'gameNumber',
                                disableTicks: true,
                                valueFormatter: () => '',
                            },
                        ]}
                    />
                ) : (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                        <Typography color="text.secondary">
                            No rating history yet. Play some games!
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    )
}
