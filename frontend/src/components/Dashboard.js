import React, { useState, useEffect } from 'react';
import { Grid, Card, CardContent, Typography, Box, LinearProgress, Chip, Dialog, DialogTitle, DialogContent, List, ListItem, ListItemText, Button, Divider } from '@mui/material';
import { People, LocalHospital, Event, Hotel, Payment, Inventory, Warning, Close } from '@mui/icons-material';
import axios from 'axios';

function DashboardPage() {
  const [stats, setStats] = useState({});
  const [detailDialog, setDetailDialog] = useState({ open: false, type: '', data: [] });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/dashboard/');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const fetchDetailData = async (type) => {
    try {
      let data = [];
      const userData = JSON.parse(localStorage.getItem('user'));

      if (type === 'my_appointments') {
        const response = await axios.get('http://localhost:8000/api/appointments/');
        data = response.data.filter(apt => apt.patient_name === `${userData.first_name} ${userData.last_name}`);
      } else if (type === 'upcoming_appointments') {
        const response = await axios.get('http://localhost:8000/api/appointments/');
        const now = new Date();
        data = response.data.filter(apt =>
          apt.patient_name === `${userData.first_name} ${userData.last_name}` &&
          new Date(apt.appointment_date) > now
        );
      } else if (type === 'my_bills') {
        const response = await axios.get('http://localhost:8000/api/billings/');
        data = response.data.filter(bill => bill.patient_name === `${userData.first_name} ${userData.last_name}`);
      } else if (type === 'pending_bills') {
        const response = await axios.get('http://localhost:8000/api/billings/');
        data = response.data.filter(bill =>
          bill.patient_name === `${userData.first_name} ${userData.last_name}` &&
          bill.status === 'pending'
        );
      } else if (type === 'medical_records') {
        const response = await axios.get('http://localhost:8000/api/medical-records/');
        data = response.data.filter(record => record.patient_name === `${userData.first_name} ${userData.last_name}`);
      } else if (type === 'current_bed') {
        const response = await axios.get('http://localhost:8000/api/beds/');
        const assignedBed = response.data.find(bed => bed.patient_name === `${userData.first_name} ${userData.last_name}`);
        data = assignedBed ? [assignedBed] : [];
      }
      return data;
    } catch (error) {
      console.error('Error fetching detail data:', error);
      return [];
    }
  };

  const handleCardClick = async (cardType) => {
    if (stats.role === 'patient') {
      const data = await fetchDetailData(cardType);
      setDetailDialog({ open: true, type: cardType, data });
    } else if (stats.role === 'staff') {
      // Handle staff card clicks - show detailed views
      switch (cardType) {
        case 'total_appointments':
          const appointmentsData = await fetchAppointmentsDetail();
          setDetailDialog({ open: true, type: 'staff_appointments', data: appointmentsData });
          break;
        case 'available_beds':
          const bedsData = await fetchBedsDetail();
          setDetailDialog({ open: true, type: 'staff_beds', data: bedsData });
          break;
        case 'active_emergencies':
          // Handle emergency management
          alert('Emergency management functionality would be implemented here');
          break;
        case 'low_stock_items':
          window.location.href = '#/inventory';
          break;
        case 'pending_bills':
          window.location.href = '#/billing';
          break;
        default:
          break;
      }
    }
  };

  const handleCloseDialog = () => {
    setDetailDialog({ open: false, type: '', data: [] });
  };

  const fetchAppointmentsDetail = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/appointments/');
      const appointments = response.data;

      // Group appointments by date
      const groupedByDate = {};
      const now = new Date();

      appointments.forEach(apt => {
        const date = new Date(apt.appointment_date).toDateString();
        if (!groupedByDate[date]) {
          groupedByDate[date] = {
            date: date,
            upcoming: [],
            history: []
          };
        }

        const aptDate = new Date(apt.appointment_date);
        if (aptDate >= now) {
          groupedByDate[date].upcoming.push(apt);
        } else {
          groupedByDate[date].history.push(apt);
        }
      });

      return Object.values(groupedByDate);
    } catch (error) {
      console.error('Error fetching appointments detail:', error);
      return [];
    }
  };

  const fetchBedsDetail = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/beds/');
      return response.data;
    } catch (error) {
      console.error('Error fetching beds detail:', error);
      return [];
    }
  };

  const handleReleaseBed = async (bedId) => {
    try {
      const bedResponse = await axios.post(`http://localhost:8000/api/beds/${bedId}/release_bed/`);
      console.log('Bed release response:', bedResponse);

      // Refresh beds data and stats
      const bedsData = await fetchBedsDetail();
      setDetailDialog(prev => ({ ...prev, data: bedsData }));
      await fetchStats(); // Refresh dashboard stats
      alert('Bed has been released successfully!');
    } catch (error) {
      console.error('Error releasing bed:', error);
      console.error('Release error details:', error.response?.data);
      alert(`Failed to release bed: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleAssignBedToAppointment = async (appointmentId, patientId) => {
    try {
      // Check if patient already has a bed
      const allBedsResponse = await axios.get('http://localhost:8000/api/beds/');
      const patientCurrentBed = allBedsResponse.data.find(bed => bed.patient == patientId && bed.status === 'occupied');

      if (patientCurrentBed) {
        alert(`Patient is already assigned to bed ${patientCurrentBed.bed_number} in ${patientCurrentBed.ward}. Please release that bed first.`);
        return;
      }

      // Check for available beds
      const availableBed = allBedsResponse.data.find(bed => bed.status === 'available');

      if (availableBed) {
        // Assign bed to patient using the assign_patient action
        await axios.post(`http://localhost:8000/api/beds/${availableBed.id}/assign_patient/`, {
          patient_id: parseInt(patientId)
        });

        // Update appointment notes to indicate bed was assigned
        const appointmentResponse = await axios.get(`http://localhost:8000/api/appointments/${appointmentId}/`);
        const currentNotes = appointmentResponse.data.notes || '';
        const updatedNotes = currentNotes + `\n(Bed assigned: ${availableBed.bed_number} - ${availableBed.ward})`;

        await axios.patch(`http://localhost:8000/api/appointments/${appointmentId}/`, {
          notes: updatedNotes
        });

        // Refresh appointments data
        const appointmentsData = await fetchAppointmentsDetail();
        setDetailDialog(prev => ({ ...prev, data: appointmentsData }));
        await fetchStats(); // Refresh dashboard stats

        alert(`Bed ${availableBed.bed_number} has been assigned to the patient!`);
      } else {
        alert('No beds are currently available.');
      }
    } catch (error) {
      console.error('Error assigning bed to appointment:', error);
      console.error('Error details:', error.response?.data);
      alert(`Failed to assign bed: ${error.response?.data?.error || error.message}`);
    }
  };

  const getDialogTitle = (type) => {
    switch (type) {
      case 'my_appointments': return 'My Appointments';
      case 'upcoming_appointments': return 'Upcoming Appointments';
      case 'my_bills': return 'My Bills';
      case 'pending_bills': return 'Pending Bills';
      case 'medical_records': return 'My Medical Records';
      case 'current_bed': return 'Current Bed Assignment';
      case 'staff_appointments': return 'All Appointments by Date';
      case 'staff_beds': return 'Bed Management';
      default: return '';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'primary';
      case 'confirmed': return 'success';
      case 'in_progress': return 'warning';
      case 'completed': return 'default';
      case 'cancelled': return 'error';
      case 'pending': return 'warning';
      case 'paid': return 'success';
      case 'overdue': return 'error';
      default: return 'default';
    }
  };

  const getStatCards = () => {
    if (stats.role === 'admin') {
      return [
        {
          title: 'Total Patients',
          value: stats.total_patients,
          icon: <People sx={{ fontSize: 40, color: '#1976d2' }} />,
          color: '#e3f2fd'
        },
        {
          title: 'Total Doctors',
          value: stats.total_doctors,
          icon: <LocalHospital sx={{ fontSize: 40, color: '#388e3c' }} />,
          color: '#e8f5e8'
        },
        {
          title: 'Total Staff',
          value: stats.total_staff,
          icon: <People sx={{ fontSize: 40, color: '#9c27b0' }} />,
          color: '#f3e5f5'
        },
        {
          title: 'Available Beds',
          value: stats.available_beds,
          icon: <Hotel sx={{ fontSize: 40, color: '#7b1fa2' }} />,
          color: '#f3e5f5'
        },
        {
          title: 'Active Emergencies',
          value: stats.active_emergencies,
          icon: <Warning sx={{ fontSize: 40, color: '#d32f2f' }} />,
          color: '#ffebee'
        },
        {
          title: 'Pending Bills',
          value: stats.pending_bills,
          icon: <Payment sx={{ fontSize: 40, color: '#f57c00' }} />,
          color: '#fff3e0'
        }
      ];
    } else if (stats.role === 'patient') {
      return [
        {
          title: 'My Appointments',
          value: stats.my_appointments,
          icon: <Event sx={{ fontSize: 40, color: '#1976d2' }} />,
          color: '#e3f2fd',
          type: 'my_appointments',
          clickable: true
        },
        {
          title: 'Upcoming Appointments',
          value: stats.upcoming_appointments,
          icon: <Event sx={{ fontSize: 40, color: '#388e3c' }} />,
          color: '#e8f5e8',
          type: 'upcoming_appointments',
          clickable: true
        },
        {
          title: 'My Bills',
          value: stats.my_bills,
          icon: <Payment sx={{ fontSize: 40, color: '#f57c00' }} />,
          color: '#fff3e0',
          type: 'my_bills',
          clickable: true
        },
        {
          title: 'Pending Bills',
          value: stats.pending_bills,
          icon: <Payment sx={{ fontSize: 40, color: '#d32f2f' }} />,
          color: '#ffebee',
          type: 'pending_bills',
          clickable: true
        },
        {
          title: 'Medical Records',
          value: stats.my_medical_records,
          icon: <LocalHospital sx={{ fontSize: 40, color: '#9c27b0' }} />,
          color: '#f3e5f5',
          type: 'medical_records',
          clickable: true
        },
        {
          title: 'Current Bed',
          value: stats.current_bed ? 'Assigned' : 'Not Assigned',
          icon: <Hotel sx={{ fontSize: 40, color: '#7b1fa2' }} />,
          color: '#f3e5f5',
          type: 'current_bed',
          clickable: true
        }
      ];
    } else if (stats.role === 'doctor') {
      return [
        {
          title: 'My Appointments',
          value: stats.my_appointments,
          icon: <Event sx={{ fontSize: 40, color: '#1976d2' }} />,
          color: '#e3f2fd'
        },
        {
          title: 'Today\'s Appointments',
          value: stats.today_appointments,
          icon: <Event sx={{ fontSize: 40, color: '#388e3c' }} />,
          color: '#e8f5e8'
        },
        {
          title: 'Pending Appointments',
          value: stats.pending_appointments,
          icon: <Event sx={{ fontSize: 40, color: '#f57c00' }} />,
          color: '#fff3e0'
        },
        {
          title: 'My Patients',
          value: stats.my_patients,
          icon: <People sx={{ fontSize: 40, color: '#9c27b0' }} />,
          color: '#f3e5f5'
        },
        {
          title: 'Completed Appointments',
          value: stats.completed_appointments,
          icon: <LocalHospital sx={{ fontSize: 40, color: '#4caf50' }} />,
          color: '#e8f5e8'
        }
      ];
    } else { // staff
      return [
        {
          title: 'Total Appointments',
          value: stats.total_appointments,
          icon: <Event sx={{ fontSize: 40, color: '#1976d2' }} />,
          color: '#e3f2fd',
          type: 'total_appointments',
          clickable: true
        },
        {
          title: 'Available Beds',
          value: stats.available_beds,
          icon: <Hotel sx={{ fontSize: 40, color: '#7b1fa2' }} />,
          color: '#f3e5f5',
          type: 'available_beds',
          clickable: true
        },
        {
          title: 'Active Emergencies',
          value: stats.active_emergencies,
          icon: <Warning sx={{ fontSize: 40, color: '#d32f2f' }} />,
          color: '#ffebee',
          type: 'active_emergencies',
          clickable: true
        },
        {
          title: 'Low Stock Items',
          value: stats.low_stock_items,
          icon: <Inventory sx={{ fontSize: 40, color: '#f57c00' }} />,
          color: '#fff3e0',
          type: 'low_stock_items',
          clickable: true
        },
        {
          title: 'Pending Bills',
          value: stats.pending_bills,
          icon: <Payment sx={{ fontSize: 40, color: '#f57c00' }} />,
          color: '#fff3e0',
          type: 'pending_bills',
          clickable: true
        }
      ];
    }
  };

  const statCards = getStatCards();

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 'bold', color: '#1976d2' }}>
        Hospital Dashboard
      </Typography>

      <Grid container spacing={3}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card
              sx={{
                height: '100%',
                background: `linear-gradient(135deg, ${card.color} 0%, #ffffff 100%)`,
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                borderRadius: 3,
                transition: 'transform 0.3s ease-in-out',
                cursor: card.clickable ? 'pointer' : 'default',
                '&:hover': {
                  transform: card.clickable ? 'translateY(-5px)' : 'none',
                  boxShadow: card.clickable ? '0 12px 40px rgba(0,0,0,0.15)' : '0 8px 32px rgba(0,0,0,0.1)',
                }
              }}
              onClick={() => card.clickable && handleCardClick(card.type)}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {card.icon}
                  <Typography variant="h6" sx={{ ml: 2, fontWeight: 'bold' }}>
                    {card.title}
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#333' }}>
                  {card.value}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.min((card.value / 100) * 100, 100)}
                  sx={{
                    mt: 2,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                    }
                  }}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
          System Status
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Bed Occupancy Rate
              </Typography>
              <LinearProgress
                variant="determinate"
                value={75}
                sx={{ height: 10, borderRadius: 5 }}
              />
              <Typography variant="body2" sx={{ mt: 1 }}>
                75% occupied (30/40 beds)
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Emergency Response Time
              </Typography>
              <Chip
                label="Average: 8.5 minutes"
                color="success"
                sx={{ mt: 1 }}
              />
              <Typography variant="body2" sx={{ mt: 1 }}>
                Within acceptable range
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Detail Dialog */}
      <Dialog
        open={detailDialog.open}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {getDialogTitle(detailDialog.type)}
          </Typography>
          <Button onClick={handleCloseDialog} sx={{ minWidth: 'auto', p: 1 }}>
            <Close />
          </Button>
        </DialogTitle>
        <DialogContent>
          {detailDialog.type === 'staff_appointments' ? (
            detailDialog.data.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  No Appointments Found
                </Typography>
              </Box>
            ) : (
              <Box>
                {detailDialog.data.map((dateGroup, dateIndex) => (
                  <Box key={dateIndex} sx={{ mb: 4 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 2 }}>
                      {new Date(dateGroup.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Typography>

                    {dateGroup.upcoming.length > 0 && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#388e3c', mb: 1 }}>
                          Upcoming Appointments ({dateGroup.upcoming.length})
                        </Typography>
                        <List>
                          {dateGroup.upcoming.map((appointment, aptIndex) => (
                            <ListItem key={appointment.id} sx={{ py: 1 }}>
                              <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <ListItemText
                                  primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                      <Typography variant="subtitle2">
                                        {appointment.patient_name}
                                      </Typography>
                                      <LocalHospital sx={{ fontSize: 16 }} />
                                      <Typography variant="body2">
                                        {appointment.doctor_name}
                                      </Typography>
                                      <Chip
                                        label={appointment.status}
                                        color={getStatusColor(appointment.status)}
                                        size="small"
                                      />
                                    </Box>
                                  }
                                  secondary={
                                    <Typography variant="body2" color="text.secondary">
                                      Time: {new Date(appointment.appointment_date).toLocaleTimeString()}
                                      {appointment.notes && ` • ${appointment.notes}`}
                                    </Typography>
                                  }
                                />
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                  onClick={() => handleAssignBedToAppointment(appointment.id, appointment.patient)}
                                  sx={{ ml: 2, minWidth: 'auto' }}
                                >
                                  Get Bed
                                </Button>
                              </Box>
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}

                    {dateGroup.history.length > 0 && (
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#f57c00', mb: 1 }}>
                          Past Appointments ({dateGroup.history.length})
                        </Typography>
                        <List>
                          {dateGroup.history.map((appointment, aptIndex) => (
                            <ListItem key={appointment.id} sx={{ py: 1 }}>
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Typography variant="subtitle2">
                                      {appointment.patient_name}
                                    </Typography>
                                    <LocalHospital sx={{ fontSize: 16 }} />
                                    <Typography variant="body2">
                                      {appointment.doctor_name}
                                    </Typography>
                                    <Chip
                                      label={appointment.status}
                                      color={getStatusColor(appointment.status)}
                                      size="small"
                                    />
                                  </Box>
                                }
                                secondary={
                                  <Typography variant="body2" color="text.secondary">
                                    Time: {new Date(appointment.appointment_date).toLocaleTimeString()}
                                    {appointment.notes && ` • ${appointment.notes}`}
                                  </Typography>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            )
          ) : detailDialog.type === 'staff_beds' ? (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 3 }}>
                Available Beds
              </Typography>
              <Grid container spacing={2} sx={{ mb: 4 }}>
                {detailDialog.data.filter(bed => bed.status === 'available').map((bed) => (
                  <Grid item xs={12} sm={6} md={4} key={bed.id}>
                    <Card sx={{ bgcolor: '#e8f5e8', border: '1px solid #4caf50' }}>
                      <CardContent sx={{ p: 2 }}>
                        <Typography variant="h6" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
                          Bed {bed.bed_number}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Ward: {bed.ward}
                        </Typography>
                        <Chip label="Available" color="success" size="small" sx={{ mt: 1 }} />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 3 }}>
                Occupied Beds
              </Typography>
              <Grid container spacing={2}>
                {detailDialog.data.filter(bed => bed.status === 'occupied').map((bed) => (
                  <Grid item xs={12} sm={6} md={4} key={bed.id}>
                    <Card sx={{ bgcolor: '#ffebee', border: '1px solid #f44336' }}>
                      <CardContent sx={{ p: 2 }}>
                        <Typography variant="h6" sx={{ color: '#c62828', fontWeight: 'bold' }}>
                          Bed {bed.bed_number}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Ward: {bed.ward}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          Patient: {bed.patient_name || 'Unknown'}
                        </Typography>
                        <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                          <Chip label="Occupied" color="error" size="small" />
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            onClick={() => handleReleaseBed(bed.id)}
                          >
                            Release Bed
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ) : (
            detailDialog.data.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  {detailDialog.type === 'medical_records' ? 'No Medical Records' :
                   detailDialog.type === 'current_bed' ? 'No Bed Assigned' :
                   detailDialog.type.includes('appointments') ? 'No Appointments' : 'No Bills'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {detailDialog.type === 'medical_records' ? 'You have no medical records.' :
                   detailDialog.type === 'current_bed' ? 'You are not currently assigned to a bed.' :
                   detailDialog.type.includes('appointments') ? 'You have no appointments scheduled.' : 'You have no bills in this category.'}
                </Typography>
              </Box>
            ) : (
              <List>
                {detailDialog.data.map((item, index) => (
                  <React.Fragment key={item.id || index}>
                    <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 2 }}>
                      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {detailDialog.type === 'medical_records' ? `Medical Record - ${new Date(item.record_date).toLocaleDateString()}` :
                           detailDialog.type === 'current_bed' ? `Bed ${item.bed_number}` :
                           detailDialog.type.includes('bill') ? item.description : `Appointment with ${item.doctor_name}`}
                        </Typography>
                        {item.status && (
                          <Chip
                            label={item.status}
                            color={getStatusColor(item.status)}
                            size="small"
                          />
                        )}
                      </Box>

                      <Box sx={{ width: '100%', pl: 2 }}>
                        {detailDialog.type === 'medical_records' ? (
                          <>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Diagnosis:</strong> {item.diagnosis}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Treatment:</strong> {item.treatment}
                            </Typography>
                            {item.prescription && (
                              <Typography variant="body2" color="text.secondary">
                                <strong>Prescription:</strong> {item.prescription}
                              </Typography>
                            )}
                            {item.notes && (
                              <Typography variant="body2" color="text.secondary">
                                <strong>Notes:</strong> {item.notes}
                              </Typography>
                            )}
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              <strong>Doctor:</strong> {item.doctor_name}
                            </Typography>
                          </>
                        ) : detailDialog.type === 'current_bed' ? (
                          <>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Bed Number:</strong> {item.bed_number}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Ward:</strong> {item.ward}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Status:</strong> {item.status}
                            </Typography>
                            {item.admission_date && (
                              <Typography variant="body2" color="text.secondary">
                                <strong>Admission Date:</strong> {new Date(item.admission_date).toLocaleDateString()}
                              </Typography>
                            )}
                          </>
                        ) : detailDialog.type.includes('bill') ? (
                          <>
                            <Typography variant="body2" color="text.secondary">
                              Amount: <strong>${item.amount}</strong>
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Due Date: {new Date(item.due_date).toLocaleDateString()}
                            </Typography>
                            {item.status === 'pending' && (
                              <Button
                                variant="contained"
                                size="small"
                                sx={{ mt: 1 }}
                                onClick={() => alert('Payment functionality would be implemented here')}
                              >
                                Pay Now
                              </Button>
                            )}
                          </>
                        ) : (
                          <>
                            <Typography variant="body2" color="text.secondary">
                              Date: {new Date(item.appointment_date).toLocaleString()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Doctor: {item.doctor_name}
                            </Typography>
                            {item.notes && (
                              <Typography variant="body2" color="text.secondary">
                                Notes: {item.notes}
                              </Typography>
                            )}
                          </>
                        )}
                      </Box>
                    </ListItem>
                    {index < detailDialog.data.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default DashboardPage;
