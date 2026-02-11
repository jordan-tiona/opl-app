import { Box, Card, CardContent, Typography } from '@mui/material'
import { LineChart } from '@mui/x-charts/LineChart'

interface RatingHistoryCardProps {
    ratingHistory: { gameNumber: number; rating: number }[]
}

export const RatingHistoryCard: React.FC<RatingHistoryCardProps> = ({ ratingHistory }) => {
    return (
        <Card sx={{ mb: 4 }}>
            <CardContent>
                <Typography sx={{ mb: 2 }} variant="h6">
                    Rating History
                </Typography>
                {ratingHistory.length > 0 ? (
                    <LineChart
                        dataset={ratingHistory}
                        height={250}
                        margin={{ top: 10, right: 20, bottom: 20, left: 50 }}
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
