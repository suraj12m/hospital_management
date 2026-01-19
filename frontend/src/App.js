import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, AppBar, Toolbar, Typography, Button, Container, Grid, Card, CardContent, IconButton, Drawer, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { Menu, Dashboard, People, Event, LocalHospital, Hotel, Payment, Inventory, Warning } from '@mui/icons-material';
import axios from 'axios';
import Login from './components/Login';
import Signup from './components/Signup';
import DashboardPage from './components/Dashboard';
import Patients from './components/Patients';
import Appointments from './components/Appointments';
import Doctors from './components/Doctors';
import Beds from './components/Beds';
import Billing from './components/Billing';
import InventoryPage from './components/Inventory';
import MyPatients from './components/MyPatients';
import MyAppointments from './components/MyAppointments';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [menuItems, setMenuItems] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Token ${token}`;
      setIsAuthenticated(true);
      if (userData) {
        setUser(JSON.parse(userData));
      }
    }
  }, []);

  useEffect(() => {
    const newMenuItems = getMenuItems();
    setMenuItems(newMenuItems);
  }, [user]);

  const handleLogin = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    axios.defaults.headers.common['Authorization'] = `Token ${token}`;
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
  };

  const handleSwitchToSignup = () => {
    setShowSignup(true);
  };

  const handleSwitchToLogin = () => {
    setShowSignup(false);
  };

  const handleSignup = () => {
    setShowSignup(false);
  };

  const getMenuItems = () => {
    if (!user || !user.role) return [];

    if (user.role === 'doctor') {
      return [
        { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
        { text: 'My Patients', icon: <People />, path: '/my-patients' },
        { text: 'My Appointments', icon: <Event />, path: '/my-appointments' },
      ];
    }

    const allItems = [
      { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
      { text: 'Patients', icon: <People />, path: '/patients', roles: ['admin', 'doctor', 'staff'] },
      { text: 'Doctors', icon: <LocalHospital />, path: '/doctors' },
      { text: 'Appointments', icon: <Event />, path: '/appointments' },
      { text: 'Beds', icon: <Hotel />, path: '/beds', roles: ['admin', 'doctor', 'staff'] },
      { text: 'Billing', icon: <Payment />, path: '/billing', roles: ['admin', 'staff'] },
      { text: 'Inventory', icon: <Inventory />, path: '/inventory', roles: ['admin', 'staff'] },
    ];

    return allItems.filter(item => !item.roles || item.roles.includes(user.role));
  };

  if (!isAuthenticated) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {showSignup ? (
          <Signup onSignup={handleSignup} onSwitchToLogin={handleSwitchToLogin} />
        ) : (
          <Login onLogin={handleLogin} onSwitchToSignup={handleSwitchToSignup} />
        )}
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ flexGrow: 1 }}>
          <AppBar position="static" sx={{ backgroundColor: '#1976d2' }}>
            <Toolbar>
              <IconButton
                size="large"
                edge="start"
                color="inherit"
                aria-label="menu"
                sx={{ mr: 2 }}
                onClick={() => setDrawerOpen(true)}
              >
                <Menu />
              </IconButton>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Smart Hospital Management
              </Typography>
              <Button color="inherit" onClick={handleLogout}>Logout</Button>
            </Toolbar>
          </AppBar>
          <Drawer
            anchor="left"
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
          >
            <List sx={{ width: 250 }}>
              {menuItems.map((item) => (
                <ListItem button key={item.text} component={Link} to={item.path} onClick={() => setDrawerOpen(false)}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItem>
              ))}
            </List>
          </Drawer>
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Routes>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/patients" element={<Patients />} />
              <Route path="/doctors" element={<Doctors />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/beds" element={<Beds />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/my-patients" element={<MyPatients />} />
              <Route path="/my-appointments" element={<MyAppointments />} />
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </Container>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
