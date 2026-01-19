import React, { useState, useEffect } from 'react';
import { Grid, Card, CardContent, Typography, Box, Chip, Button, Drawer, Avatar, TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { Event, People, LocalHospital, AccessTime, Close, CheckCircle, Cancel, Add, Remove } from '@mui/icons-material';
import axios from 'axios';

function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [appointmentDetailsLoading, setAppointmentDetailsLoading] = useState(false);
  const [appointmentDetailsError, setAppointmentDetailsError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, upcoming, today, completed
  const [medicalRecordForm, setMedicalRecordForm] = useState({
    diagnosis: '',
    treatment: '',
    notes: ''
  });
  const [prescriptions, setPrescriptions] = useState([]);
  const [availableMedicines, setAvailableMedicines] = useState([]);
  const [showMedicalRecordForm, setShowMedicalRecordForm] = useState(false);
  const [savingMedicalRecord, setSavingMedicalRecord] = useState(false);
  const [newPrescription, setNewPrescription] = useState({
    medicine: '',
    quantity: '',
    dosage: '',
    duration: '',
    instructions: ''
  });

  useEffect(() => {
    fetchMyAppointments();
  }, []);

  const fetchMyAppointments = async () => {
    try {
      setLoading(true);
      const appointmentsResponse = await axios.get('http://localhost:8000/api/appointments/');
      const userData = JSON.parse(localStorage.getItem('user'));
      const doctorName = `${userData.first_name} ${userData.last_name}`;

      // Filter appointments for this doctor (exclude 'requested' status as they need staff approval first)
      const doctorAppointments = appointmentsResponse.data.filter(
        apt => apt.doctor_name === doctorName && apt.status !== 'requested'
      );

      // Sort by date (most recent first)
      doctorAppointments.sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date));

      setAppointments(doctorAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointmentDetails = async (appointmentId) => {
    try {
      const appointmentResponse = await axios.get(`http://localhost:8000/api/appointments/${appointmentId}/`);

      const appointment = appointmentResponse.data;
      const patient = appointment.patient_details;

      return {
        appointment,
        patient
      };
    } catch (error) {
      console.error('Error fetching appointment details:', error);
      return null;
    }
  };

  const handleViewAppointmentDetails = async (appointment) => {
    setSelectedAppointment(null);
    setAppointmentDetailsError(null);
    setAppointmentDetailsLoading(true);
    setShowAppointmentDetails(true);

    try {
      const details = await fetchAppointmentDetails(appointment.id);
      if (details) {
        setSelectedAppointment({
          ...details.appointment,
          patient: details.patient
        });
      } else {
        setAppointmentDetailsError('Failed to load appointment details. Please try again.');
      }
    } catch (error) {
      console.error('Error in handleViewAppointmentDetails:', error);
      setAppointmentDetailsError('An error occurred while loading appointment details.');
    } finally {
      setAppointmentDetailsLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setShowAppointmentDetails(false);
    setSelectedAppointment(null);
    setAppointmentDetailsError(null);
    setAppointmentDetailsLoading(false);
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      await axios.patch(`http://localhost:8000/api/appointments/${appointmentId}/`, {
        status: newStatus
      });

      // Refresh appointments
      await fetchMyAppointments();

      // Close dialog if open
      if (selectedAppointment && selectedAppointment.id === appointmentId) {
        setShowAppointmentDetails(false);
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
      alert('Failed to update appointment status');
    }
  };

  const handleMedicalRecordFormChange = (field, value) => {
    setMedicalRecordForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveMedicalRecord = async () => {
    if (!medicalRecordForm.diagnosis.trim() || !medicalRecordForm.treatment.trim()) {
      alert('Diagnosis and Treatment are required');
      return;
    }

    setSavingMedicalRecord(true);
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      const medicalRecordData = {
        patient: selectedAppointment.patient,
        doctor: userData.id,
        appointment: selectedAppointment.id,
        diagnosis: medicalRecordForm.diagnosis,
        treatment: medicalRecordForm.treatment,
        notes: medicalRecordForm.notes
      };

      // Create medical record
      const medicalRecordResponse = await axios.post('http://localhost:8000/api/medical-records/', medicalRecordData);
      const medicalRecord = medicalRecordResponse.data;

      // Create prescriptions if any
      if (prescriptions.length > 0) {
        const prescriptionPromises = prescriptions.map(prescription => {
          const prescriptionData = {
            medical_record: medicalRecord.id,
            medicine: prescription.medicine,
            quantity: parseInt(prescription.quantity),
            dosage: prescription.dosage,
            duration: prescription.duration,
            instructions: prescription.instructions || ''
          };
          return axios.post('http://localhost:8000/api/prescriptions/', prescriptionData);
        });

        await Promise.all(prescriptionPromises);
      }

      // Reset form
      setMedicalRecordForm({
        diagnosis: '',
        treatment: '',
        notes: ''
      });
      setPrescriptions([]);
      setShowMedicalRecordForm(false);

      alert('Medical record and prescriptions saved successfully!');
    } catch (error) {
      console.error('Error saving medical record:', error);
      alert('Failed to save medical record. Please try again.');
    } finally {
      setSavingMedicalRecord(false);
    }
  };

  const fetchAvailableMedicines = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/medicines/');
      setAvailableMedicines(response.data);
    } catch (error) {
      console.error('Error fetching medicines:', error);
    }
  };

  const handleAddPrescription = () => {
    if (!newPrescription.medicine || !newPrescription.quantity || !newPrescription.dosage || !newPrescription.duration) {
      alert('Please fill in all required fields for the prescription');
      return;
    }

    setPrescriptions([...prescriptions, { ...newPrescription }]);
    setNewPrescription({
      medicine: '',
      quantity: '',
      dosage: '',
      duration: '',
      instructions: ''
    });
  };

  const handleRemovePrescription = (index) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  const handleStartConsultation = async () => {
    await handleStatusChange(selectedAppointment.id, 'in_progress');
    await fetchAvailableMedicines();
    setShowMedicalRecordForm(true);
  };

  const handleCompleteAppointment = async () => {
    if (showMedicalRecordForm && (!medicalRecordForm.diagnosis.trim() || !medicalRecordForm.treatment.trim())) {
      alert('Please complete the medical record before marking the appointment as completed.');
      return;
    }

    if (showMedicalRecordForm) {
      await handleSaveMedicalRecord();
    }

    await handleStatusChange(selectedAppointment.id, 'completed');
  };

  const getFilteredAppointments = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (filter) {
      case 'upcoming':
        return appointments.filter(apt => new Date(apt.appointment_date) >= now);
      case 'today':
        return appointments.filter(apt => {
          const aptDate = new Date(apt.appointment_date);
          return aptDate.toDateString() === today.toDateString();
        });
      case 'completed':
        return appointments.filter(apt => apt.status === 'completed');
      case 'pending':
        return appointments.filter(apt => apt.status === 'scheduled' || apt.status === 'confirmed');
      default:
        return appointments;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'primary';
      case 'confirmed': return 'success';
      case 'in_progress': return 'warning';
      case 'completed': return 'default';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled': return <AccessTime />;
      case 'confirmed': return <CheckCircle />;
      case 'in_progress': return <LocalHospital />;
      case 'completed': return <CheckCircle />;
      case 'cancelled': return <Cancel />;
      default: return <Event />;
    }
  };

  const isUpcoming = (appointmentDate) => {
    return new Date(appointmentDate) > new Date();
  };

  const isToday = (appointmentDate) => {
    const today = new Date();
    const aptDate = new Date(appointmentDate);
    return aptDate.toDateString() === today.toDateString();
  };

  const filteredAppointments = getFilteredAppointments();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Typography variant="h6">Loading appointments...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
          My Appointments
        </Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {[
            { key: 'all', label: 'All' },
            { key: 'upcoming', label: 'Upcoming' },
            { key: 'today', label: 'Today' },
            { key: 'pending', label: 'Pending' },
            { key: 'completed', label: 'Completed' }
          ].map(({ key, label }) => (
            <Button
              key={key}
              variant={filter === key ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setFilter(key)}
            >
              {label}
            </Button>
          ))}
        </Box>
      </Box>

      <Typography variant="h6" sx={{ mb: 3, color: '#666' }}>
        {filter === 'all' ? 'All Appointments' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Appointments`}: {filteredAppointments.length}
      </Typography>

      {filteredAppointments.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <CardContent>
            <Event sx={{ fontSize: 60, color: '#1976d2', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Appointments Found
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {filter === 'all'
                ? "You don't have any appointments scheduled yet."
                : `No ${filter} appointments found.`
              }
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredAppointments.map((appointment) => (
            <Grid item xs={12} sm={6} md={4} key={appointment.id}>
              <Card
                sx={{
                  borderRadius: 2,
                  boxShadow: 2,
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease-in-out',
                  border: isToday(appointment.appointment_date) ? '2px solid #1976d2' : 'none',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 4,
                  }
                }}
                onClick={() => handleViewAppointmentDetails(appointment)}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ bgcolor: '#1976d2', mr: 2 }}>
                        <People />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {appointment.patient_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(appointment.appointment_date).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                    {getStatusIcon(appointment.status)}
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Chip
                      label={appointment.status}
                      color={getStatusColor(appointment.status)}
                      size="small"
                    />
                    {isToday(appointment.appointment_date) && (
                      <Chip
                        label="Today"
                        color="primary"
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {isUpcoming(appointment.appointment_date) && (
                      <Chip
                        label="Upcoming"
                        color="success"
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Time: {new Date(appointment.appointment_date).toLocaleTimeString()}
                  </Typography>

                  {appointment.notes && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Notes: {appointment.notes.length > 50 ? `${appointment.notes.substring(0, 50)}...` : appointment.notes}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      sx={{ flex: 1 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewAppointmentDetails(appointment);
                      }}
                    >
                      View Details
                    </Button>

                    {appointment.status === 'scheduled' && (
                      <Button
                        variant="contained"
                        size="small"
                        color="success"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(appointment.id, 'confirmed');
                        }}
                      >
                        Confirm
                      </Button>
                    )}

                    {appointment.status === 'confirmed' && (
                      <Button
                        variant="contained"
                        size="small"
                        color="warning"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(appointment.id, 'in_progress');
                        }}
                      >
                        Start
                      </Button>
                    )}

                    {(appointment.status === 'confirmed' || appointment.status === 'in_progress') && (
                      <Button
                        variant="contained"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(appointment.id, 'completed');
                        }}
                      >
                        Complete
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Appointment Details Drawer */}
      <Drawer
        anchor="right"
        open={showAppointmentDetails}
        onClose={handleCloseDialog}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '100%', sm: '600px' },
            p: 3,
          },
        }}
      >
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Appointment Details
          </Typography>
          <Button onClick={handleCloseDialog} sx={{ minWidth: 'auto', p: 1 }}>
            <Close />
          </Button>
        </Box>

        {appointmentDetailsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <Typography variant="h6">Loading appointment details...</Typography>
          </Box>
        ) : appointmentDetailsError ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', flexDirection: 'column' }}>
            <Typography variant="h6" color="error" sx={{ mb: 2 }}>
              {appointmentDetailsError}
            </Typography>
            <Button variant="contained" onClick={() => setShowAppointmentDetails(false)}>
              Close
            </Button>
          </Box>
        ) : selectedAppointment ? (
          <Box sx={{ overflowY: 'auto', flex: 1 }}>
            {/* Appointment Info */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Appointment Information
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Date & Time:</strong> {new Date(selectedAppointment.appointment_date).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Status:</strong>
                    <Chip
                      label={selectedAppointment.status}
                      color={getStatusColor(selectedAppointment.status)}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                  {selectedAppointment.notes && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Notes:</strong> {selectedAppointment.notes}
                    </Typography>
                  )}
                  <Typography variant="body2">
                    <strong>Created:</strong> {selectedAppointment.created_at ? new Date(selectedAppointment.created_at).toLocaleDateString() : 'Not available'}
                  </Typography>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card sx={{ p: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Patient Information
                  </Typography>
                  {selectedAppointment.patient ? (
                    <>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Name:</strong> {selectedAppointment.patient.user ? `${selectedAppointment.patient.user.first_name || ''} ${selectedAppointment.patient.user.last_name || ''}`.trim() || 'Not available' : 'Not available'}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Medical ID:</strong> {selectedAppointment.patient.medical_id || 'Not available'}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Blood Group:</strong> {selectedAppointment.patient.blood_group || 'Not specified'}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Phone:</strong> {selectedAppointment.patient.user?.phone || 'Not specified'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Emergency Contact:</strong> {selectedAppointment.patient.emergency_contact || 'Not specified'}
                      </Typography>
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Patient information not available
                    </Typography>
                  )}
                </Card>
              </Grid>
            </Grid>

            {/* Status Update Actions */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Update Appointment Status
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {selectedAppointment.status === 'scheduled' && (
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircle />}
                      onClick={() => handleStatusChange(selectedAppointment.id, 'confirmed')}
                    >
                      Confirm Appointment
                    </Button>
                  )}

                  {selectedAppointment.status === 'confirmed' && (
                    <Button
                      variant="contained"
                      color="warning"
                      startIcon={<LocalHospital />}
                      onClick={handleStartConsultation}
                    >
                      Start Consultation
                    </Button>
                  )}

                  {selectedAppointment.status === 'in_progress' && showMedicalRecordForm && (
                    <Button
                      variant="contained"
                      startIcon={<CheckCircle />}
                      onClick={handleCompleteAppointment}
                      disabled={savingMedicalRecord}
                    >
                      {savingMedicalRecord ? 'Saving...' : 'Complete Session'}
                    </Button>
                  )}

                  {selectedAppointment.status === 'in_progress' && !showMedicalRecordForm && (
                    <Button
                      variant="outlined"
                      onClick={() => setShowMedicalRecordForm(true)}
                    >
                      Add Medical Record
                    </Button>
                  )}

                  {selectedAppointment.status !== 'cancelled' && selectedAppointment.status !== 'completed' && (
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<Cancel />}
                      onClick={() => handleStatusChange(selectedAppointment.id, 'cancelled')}
                    >
                      Cancel Appointment
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Medical Record Form */}
            {selectedAppointment.status === 'in_progress' && showMedicalRecordForm && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Medical Record & Prescription
                  </Typography>
                  <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      label="Diagnosis"
                      multiline
                      rows={2}
                      value={medicalRecordForm.diagnosis}
                      onChange={(e) => handleMedicalRecordFormChange('diagnosis', e.target.value)}
                      required
                      placeholder="Enter diagnosis details"
                    />
                    <TextField
                      label="Treatment"
                      multiline
                      rows={3}
                      value={medicalRecordForm.treatment}
                      onChange={(e) => handleMedicalRecordFormChange('treatment', e.target.value)}
                      required
                      placeholder="Describe the treatment provided"
                    />

                    {/* Prescription Section */}
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1976d2', mt: 2 }}>
                      Prescriptions
                    </Typography>

                    {/* Add Prescription Form */}
                    <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                        Add Prescription
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Select Medicine</InputLabel>
                            <Select
                              value={newPrescription.medicine}
                              onChange={(e) => setNewPrescription({...newPrescription, medicine: e.target.value})}
                            >
                              {availableMedicines.map(medicine => (
                                <MenuItem key={medicine.id} value={medicine.id}>
                                  {medicine.name} - ₹{medicine.unit_price}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Quantity"
                            type="number"
                            value={newPrescription.quantity}
                            onChange={(e) => setNewPrescription({...newPrescription, quantity: e.target.value})}
                            placeholder="e.g., 10"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Dosage"
                            value={newPrescription.dosage}
                            onChange={(e) => setNewPrescription({...newPrescription, dosage: e.target.value})}
                            placeholder="e.g., 1 tablet twice daily"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Duration"
                            value={newPrescription.duration}
                            onChange={(e) => setNewPrescription({...newPrescription, duration: e.target.value})}
                            placeholder="e.g., 7 days"
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Instructions"
                            multiline
                            rows={2}
                            value={newPrescription.instructions}
                            onChange={(e) => setNewPrescription({...newPrescription, instructions: e.target.value})}
                            placeholder="Special instructions (optional)"
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Add />}
                            onClick={handleAddPrescription}
                            disabled={!newPrescription.medicine || !newPrescription.quantity || !newPrescription.dosage || !newPrescription.duration}
                          >
                            Add Prescription
                          </Button>
                        </Grid>
                      </Grid>
                    </Card>

                    {/* Current Prescriptions */}
                    {prescriptions.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                          Current Prescriptions:
                        </Typography>
                        {prescriptions.map((prescription, index) => {
                          const medicine = availableMedicines.find(m => m.id === prescription.medicine);
                          return (
                            <Card key={index} variant="outlined" sx={{ p: 2, mb: 1 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    {medicine?.name}
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
                                <Button
                                  size="small"
                                  color="error"
                                  startIcon={<Remove />}
                                  onClick={() => handleRemovePrescription(index)}
                                >
                                  Remove
                                </Button>
                              </Box>
                            </Card>
                          );
                        })}
                      </Box>
                    )}

                    <TextField
                      label="Additional Notes"
                      multiline
                      rows={2}
                      value={medicalRecordForm.notes}
                      onChange={(e) => handleMedicalRecordFormChange('notes', e.target.value)}
                      placeholder="Any additional notes or observations"
                    />

                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                      <Button
                        variant="outlined"
                        onClick={() => setShowMedicalRecordForm(false)}
                        disabled={savingMedicalRecord}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleSaveMedicalRecord}
                        disabled={savingMedicalRecord || !medicalRecordForm.diagnosis.trim() || !medicalRecordForm.treatment.trim()}
                      >
                        {savingMedicalRecord ? 'Saving...' : 'Save Medical Record'}
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Patient Medical History Summary */}
            {selectedAppointment.patient && (
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Patient Medical Summary
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                        Allergies
                      </Typography>
                      <Typography variant="body2">
                        {selectedAppointment.patient.allergies || 'None specified'}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                        Current Admission Status
                      </Typography>
                      <Chip
                        label={selectedAppointment.patient.admitted ? 'Currently Admitted' : 'Not Admitted'}
                        color={selectedAppointment.patient.admitted ? 'error' : 'success'}
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <Typography variant="h6">No appointment selected</Typography>
          </Box>
        )}
      </Drawer>
    </Box>
  );
}

export default MyAppointments;
