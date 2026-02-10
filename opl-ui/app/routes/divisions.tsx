import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  Typography,
} from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import { useDivisions, usePlayers } from '~/lib/react-query'
import { AddDivisionDialog, DivisionCard } from '~/components/divisions'

export const DivisionsPage = () => {
  const { data: divisions, isLoading, error } = useDivisions();
  const { data: allPlayers } = usePlayers();

  const [dialogOpen, setDialogOpen] = useState(false);

  if (error) {
    return <Alert severity="error">Failed to load divisions: {error.message}</Alert>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h3">Divisions</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          New Division
        </Button>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {divisions?.map((division) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={division.division_id}>
              <DivisionCard division={division} players={allPlayers ?? []} />
            </Grid>
          ))}
          {divisions?.length === 0 && (
            <Grid size={{ xs: 12 }}>
              <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                No divisions yet. Create one to get started.
              </Typography>
            </Grid>
          )}
        </Grid>
      )}

      <AddDivisionDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </Box>
  );
}

export default DivisionsPage;
