import React, { useState, useEffect } from 'react';
import { Typography, Box, Card, CardContent, Grid, Chip, Avatar, Button, Dialog, DialogTitle, DialogContent, TextField, FormControl, InputLabel, Select, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton } from '@mui/material';
import { LocalHospital, Person, Phone, Email, Add, Edit, Delete } from '@mui/icons-material';
import axios from 'axios';

function Doctors() {
  const [user, setUser] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newDoctor, setNewDoctor] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    specialty: '',
    department: '',
    license_number: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/doctors/');
      setDoctors(response.data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const handleAddDoctor = async () => {
    setLoading(true);
    try {
      // Create user account first
      const userData = {
        first_name: newDoctor.first_name,
        last_name: newDoctor.last_name,
        email: newDoctor.email,
        username: newDoctor.email,
        phone: newDoctor.phone,
        role: 'doctor'
      };

      const userResponse = await axios.post('http://localhost:8000/api/users/', userData);
      const newUser = userResponse.data;

      // Create doctor profile
      const doctorData = {
        user: newUser.id,
        license_number: newDoctor.license_number,
        specialty: newDoctor.specialty,
        department: newDoctor.department,
        available: true
      };

      await axios.post('http://localhost:8000/api/doctors/', doctorData);

      // Reset form and close dialog
      setNewDoctor({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        specialty: '',
        department: '',
        license_number: ''
      });
      setOpenDialog(false);
      fetchDoctors();
      alert('Doctor added successfully!');
    } catch (error) {
      console.error('Error adding doctor:', error);
      alert('Failed to add doctor. Please try again.');
    }
    setLoading(false);
  };

  const handleInputChange = (field, value) => {
    setNewDoctor(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!user) return <div>Loading...</div>;

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 3 }}>
        {user.role === 'patient' ? 'Our Doctors' : 'Doctor Management'}
      </Typography>

      {user.role === 'patient' ? (
        <Grid container spacing={3}>
          {doctors.map(doctor => (
            <Grid item xs={12} sm={6} md={4} key={doctor.id}>
              <Card sx={{ height: '100%', borderRadius: 2, boxShadow: 2 }}>
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Avatar sx={{ width: 80, height: 80, bgcolor: '#1976d2', mx: 'auto', mb: 2 }}>
                    <LocalHospital sx={{ fontSize: 40 }} />
                  </Avatar>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Dr. {doctor.user.first_name} {doctor.user.last_name}
                  </Typography>
                  <Typography variant="subtitle1" color="primary" sx={{ mb: 1 }}>
                    {doctor.specialty}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Department: {doctor.department}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                    <Chip
                      label={doctor.available ? 'Available' : 'Unavailable'}
                      color={doctor.available ? 'success' : 'error'}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    License: {doctor.license_number}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
              Doctor Management
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={() => setOpenDialog(true)}
              sx={{ fontWeight: 'bold' }}
            >
              Add New Doctor
            </Button>
          </Box>

          <Card sx={{ borderRadius: 2 }}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Specialty</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Department</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>License Number</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Contact</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {doctors.map(doctor => (
                    <TableRow key={doctor.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: '#1976d2', mr: 2 }}>
                            <LocalHospital sx={{ fontSize: 16 }} />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              Dr. {doctor.user.first_name} {doctor.user.last_name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {doctor.user.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {doctor.specialty}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {doctor.department}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {doctor.license_number}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {doctor.user.phone || 'Not provided'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={doctor.available ? 'Available' : 'Unavailable'}
                          color={doctor.available ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" color="primary">
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error">
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

          {/* Add New Doctor Dialog */}
          <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
            <DialogTitle sx={{ fontWeight: 'bold' }}>
              Add New Doctor
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={newDoctor.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={newDoctor.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={newDoctor.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={newDoctor.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Specialty</InputLabel>
                    <Select
                      value={newDoctor.specialty}
                      onChange={(e) => handleInputChange('specialty', e.target.value)}
                      required
                    >
                      <MenuItem value="General Medicine">General Medicine</MenuItem>
                      <MenuItem value="Cardiology">Cardiology</MenuItem>
                      <MenuItem value="Neurology">Neurology</MenuItem>
                      <MenuItem value="Orthopedics">Orthopedics</MenuItem>
                      <MenuItem value="Pediatrics">Pediatrics</MenuItem>
                      <MenuItem value="Gynecology">Gynecology</MenuItem>
                      <MenuItem value="Dermatology">Dermatology</MenuItem>
                      <MenuItem value="Ophthalmology">Ophthalmology</MenuItem>
                      <MenuItem value="ENT">ENT</MenuItem>
                      <MenuItem value="Dentistry">Dentistry</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Department</InputLabel>
                    <Select
                      value={newDoctor.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      required
                    >
                      <MenuItem value="General">General</MenuItem>
                      <MenuItem value="Cardiology">Cardiology</MenuItem>
                      <MenuItem value="Neurology">Neurology</MenuItem>
                      <MenuItem value="Orthopedics">Orthopedics</MenuItem>
                      <MenuItem value="Pediatrics">Pediatrics</MenuItem>
                      <MenuItem value="Gynecology">Gynecology</MenuItem>
                      <MenuItem value="Dermatology">Dermatology</MenuItem>
                      <MenuItem value="Ophthalmology">Ophthalmology</MenuItem>
                      <MenuItem value="ENT">ENT</MenuItem>
                      <MenuItem value="Dentistry">Dentistry</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="License Number"
                    value={newDoctor.license_number}
                    onChange={(e) => handleInputChange('license_number', e.target.value)}
                    placeholder="e.g., D0001"
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button onClick={() => setOpenDialog(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleAddDoctor}
                      disabled={loading}
                    >
                      {loading ? 'Adding...' : 'Add Doctor'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
          </Dialog>
        </Box>
      )}
    </Box>
  );
}

export default Doctors;
