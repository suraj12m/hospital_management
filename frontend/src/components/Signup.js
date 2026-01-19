import React, { useState } from 'react';
import { Container, Paper, TextField, Button, Typography, Box, Alert, Grid, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { LocalHospital } from '@mui/icons-material';
import axios from 'axios';

function Signup({ onSignup, onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    first_name: '',
    last_name: '',
    role: 'patient',
    phone: '',
    address: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8000/api/users/register/', formData);
      setSuccess('Account created successfully! Please login.');
      setError('');
      // Reset form
      setFormData({
        username: '',
        password: '',
        email: '',
        first_name: '',
        last_name: '',
        role: 'patient',
        phone: '',
        address: ''
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
      setSuccess('');
    }
  };

  return (
    <Container component="main" maxWidth="sm" sx={{ display: 'flex', alignItems: 'center', minHeight: '100vh' }}>
      <Paper elevation={6} sx={{ padding: 4, width: '100%', borderRadius: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <LocalHospital sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography component="h1" variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
            Smart Hospital Management
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center">
            Create your account to access the hospital management system
          </Typography>
        </Box>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="first_name"
                label="First Name"
                name="first_name"
                autoComplete="given-name"
                value={formData.first_name}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="last_name"
                label="Last Name"
                name="last_name"
                autoComplete="family-name"
                value={formData.last_name}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            name="username"
            autoComplete="username"
            value={formData.username}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
            <InputLabel id="role-label">Role</InputLabel>
            <Select
              labelId="role-label"
              id="role"
              name="role"
              value={formData.role}
              label="Role"
              onChange={handleChange}
            >
              <MenuItem value="patient">Patient</MenuItem>
              <MenuItem value="doctor">Doctor</MenuItem>
              <MenuItem value="staff">Staff</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="normal"
            fullWidth
            id="phone"
            label="Phone Number"
            name="phone"
            autoComplete="tel"
            value={formData.phone}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="normal"
            fullWidth
            id="address"
            label="Address"
            name="address"
            autoComplete="street-address"
            multiline
            rows={3}
            value={formData.address}
            onChange={handleChange}
            sx={{ mb: 3 }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2, py: 1.5, fontSize: '1.1rem', fontWeight: 'bold' }}
          >
            Create Account
          </Button>
        </Box>
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button
            variant="text"
            onClick={onSwitchToLogin}
            sx={{ textTransform: 'none' }}
          >
            Already have an account? Sign in
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default Signup;
