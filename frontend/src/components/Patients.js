import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Typography, Box, Chip
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import axios from 'axios';

function Patients() {
  const [patients, setPatients] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [formData, setFormData] = useState({
    medical_id: '',
    blood_group: '',
    allergies: '',
    emergency_contact: '',
    emergency_phone: '',
    admitted: false
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/patients/');
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const handleOpen = (patient = null) => {
    if (patient) {
      setEditingPatient(patient);
      setFormData({
        medical_id: patient.medical_id,
        blood_group: patient.blood_group,
        allergies: patient.allergies,
        emergency_contact: patient.emergency_contact,
        emergency_phone: patient.emergency_phone,
        admitted: patient.admitted
      });
    } else {
      setEditingPatient(null);
      setFormData({
        medical_id: '',
        blood_group: '',
        allergies: '',
        emergency_contact: '',
        emergency_phone: '',
        admitted: false
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingPatient(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingPatient) {
        await axios.put(`http://localhost:8000/api/patients/${editingPatient.id}/`, formData);
      } else {
        await axios.post('http://localhost:8000/api/patients/', formData);
      }
      fetchPatients();
      handleClose();
    } catch (error) {
      console.error('Error saving patient:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      try {
        await axios.delete(`http://localhost:8000/api/patients/${id}/`);
        fetchPatients();
      } catch (error) {
        console.error('Error deleting patient:', error);
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
          Patient Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpen()}
          sx={{ borderRadius: 2 }}
        >
          Add Patient
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Medical ID</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Blood Group</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {patients.map((patient) => (
              <TableRow key={patient.id} hover>
                <TableCell>{patient.medical_id}</TableCell>
                <TableCell>{patient.user?.first_name} {patient.user?.last_name}</TableCell>
                <TableCell>{patient.blood_group}</TableCell>
                <TableCell>
                  <Chip
                    label={patient.admitted ? 'Admitted' : 'Outpatient'}
                    color={patient.admitted ? 'error' : 'success'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    onClick={() => handleOpen(patient)}
                    sx={{ mr: 1 }}
                  >
                    <Edit />
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleDelete(patient.id)}
                  >
                    <Delete />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{editingPatient ? 'Edit Patient' : 'Add Patient'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Medical ID"
            value={formData.medical_id}
            onChange={(e) => setFormData({...formData, medical_id: e.target.value})}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Blood Group"
            value={formData.blood_group}
            onChange={(e) => setFormData({...formData, blood_group: e.target.value})}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Allergies"
            value={formData.allergies}
            onChange={(e) => setFormData({...formData, allergies: e.target.value})}
            margin="normal"
            multiline
            rows={2}
          />
          <TextField
            fullWidth
            label="Emergency Contact"
            value={formData.emergency_contact}
            onChange={(e) => setFormData({...formData, emergency_contact: e.target.value})}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Emergency Phone"
            value={formData.emergency_phone}
            onChange={(e) => setFormData({...formData, emergency_phone: e.target.value})}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingPatient ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Patients;
