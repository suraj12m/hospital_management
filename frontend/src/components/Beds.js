import React, { useState, useEffect } from 'react';
import { Typography, Box, Card, CardContent, Grid, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Hotel, Person } from '@mui/icons-material';
import axios from 'axios';

function Beds() {
  const [user, setUser] = useState(null);
  const [beds, setBeds] = useState([]);
  const [patients, setPatients] = useState([]);
  const [assignDialog, setAssignDialog] = useState({ open: false, bedId: null, patientId: '' });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchBeds();
    if (user && user.role === 'staff') {
      fetchPatients();
    }
  }, [user]);

  const fetchBeds = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/beds/');
      setBeds(response.data);
    } catch (error) {
      console.error('Error fetching beds:', error);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/patients/');
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'success';
      case 'occupied': return 'error';
      case 'maintenance': return 'warning';
      default: return 'default';
    }
  };

  const handleAssignBed = (bedId) => {
    setAssignDialog({ open: true, bedId, patientId: '' });
  };

  const handleAssignSubmit = async () => {
    try {
      const patient = patients.find(p => p.id === assignDialog.patientId);
      if (!patient) return;

      await axios.post(`http://localhost:8000/api/beds/${assignDialog.bedId}/assign_patient/`, {
        patient_id: assignDialog.patientId
      });

      setAssignDialog({ open: false, bedId: null, patientId: '' });
      fetchBeds();
      alert('Bed assigned successfully!');
    } catch (error) {
      console.error('Error assigning bed:', error);
      alert('Failed to assign bed.');
    }
  };

  const handleReleaseBed = async (bedId) => {
    try {
      await axios.post(`http://localhost:8000/api/beds/${bedId}/release_bed/`);
      fetchBeds();
      alert('Bed released successfully!');
    } catch (error) {
      console.error('Error releasing bed:', error);
      alert('Failed to release bed.');
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 3 }}>
        Bed Management
      </Typography>

      <Grid container spacing={3}>
        {beds.map(bed => (
          <Grid item xs={12} sm={6} md={4} key={bed.id}>
            <Card sx={{ height: '100%', borderRadius: 2, boxShadow: 2 }}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Hotel sx={{ fontSize: 48, color: '#7b1fa2', mb: 2 }} />
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Bed {bed.bed_number}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Ward: {bed.ward}
                </Typography>
                <Chip
                  label={bed.status}
                  color={getStatusColor(bed.status)}
                  size="small"
                  sx={{ mb: 2 }}
                />
                {bed.patient_name ? (
                  <Box>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                      <Person sx={{ mr: 1, fontSize: 16 }} />
                      {bed.patient_name}
                    </Typography>
                    {user.role === 'staff' && (
                      <Button
                        variant="outlined"
                        size="small"
                        color="secondary"
                        onClick={() => handleReleaseBed(bed.id)}
                      >
                        Release Bed
                      </Button>
                    )}
                  </Box>
                ) : (
                  user.role === 'staff' && bed.status === 'available' && (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleAssignBed(bed.id)}
                    >
                      Assign Patient
                    </Button>
                  )
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Assignment Dialog */}
      <Dialog open={assignDialog.open} onClose={() => setAssignDialog({ open: false, bedId: null, patientId: '' })}>
        <DialogTitle>Assign Patient to Bed</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Select Patient</InputLabel>
            <Select
              value={assignDialog.patientId}
              onChange={(e) => setAssignDialog({ ...assignDialog, patientId: e.target.value })}
            >
              {patients.map(patient => (
                <MenuItem key={patient.id} value={patient.id}>
                  {patient.user.first_name} {patient.user.last_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialog({ open: false, bedId: null, patientId: '' })}>
            Cancel
          </Button>
          <Button onClick={handleAssignSubmit} variant="contained" disabled={!assignDialog.patientId}>
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Beds;
