import React from 'react';
import { Typography, Box, Card, CardContent } from '@mui/material';
import { Inventory } from '@mui/icons-material';

function InventoryPage() {
  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 3 }}>
        Medical Inventory
      </Typography>
      <Card sx={{ p: 3, borderRadius: 2 }}>
        <CardContent>
          <Inventory sx={{ fontSize: 60, color: '#f57c00', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Supply Chain Management
          </Typography>
          <Typography variant="body1">
            Track medical supplies, monitor stock levels, and automate reorder alerts.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

export default InventoryPage;
