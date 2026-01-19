import React, { useState, useEffect } from 'react';
import { Grid, Card, CardContent, Typography, Box, Chip, Button, Dialog, DialogTitle, DialogContent, List, ListItem, ListItemText, Divider, Avatar } from '@mui/material';
import { People, LocalHospital, Event, MedicalServices, Close } from '@mui/icons-material';
import axios from 'axios';

function MyPatients() {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientDetails, setShowPatientDetails] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyPatients();
  }, []);

  const fetchMyPatients = async () => {
    try {
      setLoading(true);
      // Get doctor's profile to find their appointments
      const appointmentsResponse = await axios.get('http://localhost:8000/api/appointments/');
      const userData = JSON.parse(localStorage.getItem('user'));
      const doctorName = `${userData.first_name} ${userData.last_name}`;

      // Filter appointments for this doctor and get unique patients
      const doctorAppointments = appointmentsResponse.data.filter(
        apt => apt.doctor_name === doctorName
      );

      // Get unique patient IDs
      const patientIds = [...new Set(doctorAppointments.map(apt => apt.patient))];

      // Fetch patient details
      const patientsResponse = await axios.get('http://localhost:8000/api/patients/');
      const doctorPatients = patientsResponse.data.filter(
        patient => patientIds.includes(patient.id)
      );

      setPatients(doctorPatients);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientDetails = async (patientId) => {
    try {
      const [patientResponse, appointmentsResponse, medicalRecordsResponse, billsResponse] = await Promise.all([
        axios.get(`http://localhost:8000/api/patients/${patientId}/`),
        axios.get('http://localhost:8000/api/appointments/'),
        axios.get('http://localhost:8000/api/medical-records/'),
        axios.get('http://localhost:8000/api/billings/')
      ]);

      const userData = JSON.parse(localStorage.getItem('user'));
      const doctorName = `${userData.first_name} ${userData.last_name}`;

      // Filter data for this patient and doctor
      const patientAppointments = appointmentsResponse.data.filter(
        apt => apt.patient === patientId && apt.doctor_name === doctorName
      );

      const patientRecords = medicalRecordsResponse.data.filter(
        record => record.patient === patientId && record.doctor_name === doctorName
      );

      const patientBills = billsResponse.data.filter(
        bill => bill.patient === patientId
      );

      return {
        patient: patientResponse.data,
        appointments: patientAppointments,
        medicalRecords: patientRecords,
        bills: patientBills
      };
    } catch (error) {
      console.error('Error fetching patient details:', error);
      return null;
    }
  };

  const handleViewPatientDetails = async (patient) => {
    setSelectedPatient(null);
    setShowPatientDetails(true);

    const details = await fetchPatientDetails(patient.id);
    if (details) {
      setSelectedPatient({
        ...patient,
        ...details
      });
    }
  };

  const handleCloseDialog = () => {
    setShowPatientDetails(false);
    setSelectedPatient(null);
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Typography variant="h6">Loading patients...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 3 }}>
        My Patients
      </Typography>

      {patients.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <CardContent>
            <People sx={{ fontSize: 60, color: '#9c27b0', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Patients Yet
            </Typography>
            <Typography variant="body1" color="text.secondary">
              You haven't been assigned any patients yet. Appointments will appear here once scheduled.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          <Typography variant="h6" sx={{ mb: 3, color: '#666' }}>
            Total Patients: {patients.length}
          </Typography>

          <Grid container spacing={3}>
            {patients.map((patient) => (
              <Grid item xs={12} sm={6} md={4} key={patient.id}>
                <Card
                  sx={{
                    borderRadius: 2,
                    boxShadow: 2,
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 4,
                    }
                  }}
                  onClick={() => handleViewPatientDetails(patient)}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: '#1976d2', mr: 2 }}>
                        <People />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {patient.user.first_name} {patient.user.last_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ID: {patient.medical_id}
                        </Typography>
                      </Box>
                    </Box>

                    {patient.blood_group && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Blood Group: {patient.blood_group}
                      </Typography>
                    )}

                    {patient.admitted && (
                      <Chip
                        label="Currently Admitted"
                        color="error"
                        size="small"
                        sx={{ mb: 1 }}
                      />
                    )}

                    <Typography variant="body2" color="text.secondary">
                      Age: {patient.user.date_of_birth ?
                        new Date().getFullYear() - new Date(patient.user.date_of_birth).getFullYear() :
                        'Not specified'}
                    </Typography>

                    <Button
                      variant="outlined"
                      size="small"
                      sx={{ mt: 2, width: '100%' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewPatientDetails(patient);
                      }}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* Patient Details Dialog */}
      <Dialog open={showPatientDetails} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Patient Details - {selectedPatient?.user?.first_name} {selectedPatient?.user?.last_name}
          </Typography>
          <Button onClick={handleCloseDialog} sx={{ minWidth: 'auto', p: 1 }}>
            <Close />
          </Button>
        </DialogTitle>
        <DialogContent>
          {selectedPatient && (
            <Box>
              {/* Patient Basic Info */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                      Basic Information
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Name:</strong> {selectedPatient.user.first_name} {selectedPatient.user.last_name}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Medical ID:</strong> {selectedPatient.medical_id}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Blood Group:</strong> {selectedPatient.blood_group || 'Not specified'}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Date of Birth:</strong> {selectedPatient.user.date_of_birth ?
                        new Date(selectedPatient.user.date_of_birth).toLocaleDateString() :
                        'Not specified'}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Phone:</strong> {selectedPatient.user.phone || 'Not specified'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Address:</strong> {selectedPatient.user.address || 'Not specified'}
                    </Typography>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                      Medical Information
                    </Typography>
                    {selectedPatient.admitted ? (
                      <Chip label="Currently Admitted" color="error" sx={{ mb: 2 }} />
                    ) : (
                      <Chip label="Not Admitted" color="success" sx={{ mb: 2 }} />
                    )}

                    {selectedPatient.allergies && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Allergies:</strong> {selectedPatient.allergies}
                      </Typography>
                    )}

                    {selectedPatient.emergency_contact && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Emergency Contact:</strong> {selectedPatient.emergency_contact}
                      </Typography>
                    )}

                    {selectedPatient.emergency_phone && (
                      <Typography variant="body2">
                        <strong>Emergency Phone:</strong> {selectedPatient.emergency_phone}
                      </Typography>
                    )}
                  </Card>
                </Grid>
              </Grid>

              {/* Appointments */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center' }}>
                    <Event sx={{ mr: 1 }} />
                    Appointments with Me ({selectedPatient.appointments?.length || 0})
                  </Typography>

                  {selectedPatient.appointments?.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No appointments scheduled with this patient.
                    </Typography>
                  ) : (
                    <List>
                      {selectedPatient.appointments.map((appointment, index) => (
                        <React.Fragment key={appointment.id}>
                          <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                {new Date(appointment.appointment_date).toLocaleString()}
                              </Typography>
                              <Chip
                                label={appointment.status}
                                color={getStatusColor(appointment.status)}
                                size="small"
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {appointment.notes || 'No additional notes'}
                            </Typography>
                          </ListItem>
                          {index < selectedPatient.appointments.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>

              {/* Medical Records */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center' }}>
                    <MedicalServices sx={{ mr: 1 }} />
                    Medical Records ({selectedPatient.medicalRecords?.length || 0})
                  </Typography>

                  {selectedPatient.medicalRecords?.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No medical records for this patient.
                    </Typography>
                  ) : (
                    <List>
                      {selectedPatient.medicalRecords.map((record, index) => (
                        <React.Fragment key={record.id}>
                          <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                            <Box sx={{ width: '100%', mb: 1 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                {new Date(record.record_date).toLocaleDateString()}
                              </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>Diagnosis:</strong> {record.diagnosis}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>Treatment:</strong> {record.treatment}
                            </Typography>

                            {/* Prescriptions Section */}
                            {record.prescriptions && record.prescriptions.length > 0 && (
                              <Box sx={{ width: '100%', mb: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 1 }}>
                                  Prescriptions:
                                </Typography>
                                {record.prescriptions.map((prescription, idx) => (
                                  <Box key={idx} sx={{ ml: 2, mb: 1, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                      {prescription.medicine_name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      Quantity: {prescription.quantity} | Dosage: {prescription.dosage} | Duration: {prescription.duration}
                                    </Typography>
                                    {prescription.instructions && (
                                      <Typography variant="body2" color="text.secondary">
                                        Instructions: {prescription.instructions}
                                      </Typography>
                                    )}
                                  </Box>
                                ))}
                              </Box>
                            )}

                            {record.notes && (
                              <Typography variant="body2">
                                <strong>Notes:</strong> {record.notes}
                              </Typography>
                            )}
                          </ListItem>
                          {index < selectedPatient.medicalRecords.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>

              {/* Bills */}
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Billing History ({selectedPatient.bills?.length || 0})
                  </Typography>

                  {selectedPatient.bills?.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No bills for this patient.
                    </Typography>
                  ) : (
                    <List>
                      {selectedPatient.bills.map((bill, index) => (
                        <React.Fragment key={bill.id}>
                          <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                {bill.description}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <Chip
                                  label={bill.status}
                                  color={getStatusColor(bill.status)}
                                  size="small"
                                />
                                <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                                  ₹{bill.total_amount}
                                </Typography>
                              </Box>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              Due Date: {new Date(bill.due_date).toLocaleDateString()}
                            </Typography>
                          </ListItem>
                          {index < selectedPatient.bills.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default MyPatients;
