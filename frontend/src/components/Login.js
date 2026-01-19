import React, { useState } from 'react';
import { Container, Paper, TextField, Button, Typography, Box, Alert, Grid } from '@mui/material';
import { LocalHospital } from '@mui/icons-material';
import axios from 'axios';

function Login({ onLogin, onSwitchToSignup }) {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8000/api/login/', formData);
      onLogin(response.data.token, response.data.user);
    } catch (err) {
      setError('Invalid credentials');
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
            Please sign in to access the hospital management system
          </Typography>
        </Box>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            name="username"
            autoComplete="username"
            autoFocus
            value={formData.username}
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
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
            sx={{ mb: 3 }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2, py: 1.5, fontSize: '1.1rem', fontWeight: 'bold' }}
          >
            Sign In
          </Button>
        </Box>
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Demo credentials: admin/admin123, doctor/doctor123, patient/patient123, staff/staff
          </Typography>
          <Button
            variant="text"
            onClick={onSwitchToSignup}
            sx={{ textTransform: 'none' }}
          >
            Don't have an account? Sign up
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default Login;
