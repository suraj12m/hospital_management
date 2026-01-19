import React, { useState, useEffect } from 'react';
import { Typography, Box, Card, CardContent, TextField, Button, FormControl, InputLabel, Select, MenuItem, Checkbox, FormControlLabel, Grid, List, ListItem, ListItemText, Chip } from '@mui/material';
import { Event, Person, LocalHospital } from '@mui/icons-material';
import axios from 'axios';

function Appointments() {
  const [user, setUser] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [beds, setBeds] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [formData, setFormData] = useState({
    doctor: '',
    appointment_date: '',
    notes: '',
    request_bed: false,
    selected_bed: '',
    phone: '',
    address: '',
    blood_group: '',
    allergies: '',
    emergency_contact: '',
    emergency_phone: '',
    current_medications: '',
    age: ''
  });
  const [staffFormData, setStaffFormData] = useState({
    patient: '',
    doctor: '',
    appointment_date: '',
    notes: '',
    selected_bed: '',
    is_new_patient: false,
    new_patient: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      address: '',
      date_of_birth: '',
      blood_group: '',
      allergies: '',
      emergency_contact: '',
      emergency_phone: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [showStaffBooking, setShowStaffBooking] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchDoctors();
    fetchAvailableBeds();
  }, []);

  useEffect(() => {
    if (user && user.role !== 'patient') {
      fetchPatients();
      fetchAppointments();
    }
  }, [user]);

  const fetchDoctors = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/doctors/');
      setDoctors(response.data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
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

  const fetchAvailableBeds = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/beds/');
      const availableBeds = response.data.filter(bed => bed.status === 'available');
      setBeds(availableBeds);
    } catch (error) {
      console.error('Error fetching beds:', error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/appointments/');
      console.log('Appointments fetched:', response.data);
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      alert('Error fetching appointments: ' + error.message);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleStaffChange = (e) => {
    const { name, value, type, checked } = e.target;
    setStaffFormData({
      ...staffFormData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleNewPatientChange = (e) => {
    const { name, value } = e.target;
    setStaffFormData({
      ...staffFormData,
      new_patient: {
        ...staffFormData.new_patient,
        [name]: value
      }
    });
  };

  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let patientId;

      if (staffFormData.is_new_patient) {
        // Create new patient
        const userData = {
          first_name: staffFormData.new_patient.first_name,
          last_name: staffFormData.new_patient.last_name,
          email: staffFormData.new_patient.email,
          username: staffFormData.new_patient.email,
          phone: staffFormData.new_patient.phone,
          address: staffFormData.new_patient.address,
          date_of_birth: staffFormData.new_patient.date_of_birth,
          role: 'patient'
        };

        const userResponse = await axios.post('http://localhost:8000/api/users/', userData);
        const newUser = userResponse.data;

        const patientData = {
          user: newUser.id,
          medical_id: `P${newUser.id.toString().padStart(4, '0')}`,
          blood_group: staffFormData.new_patient.blood_group,
          allergies: staffFormData.new_patient.allergies,
          emergency_contact: staffFormData.new_patient.emergency_contact,
          emergency_phone: staffFormData.new_patient.emergency_phone
        };

        const patientResponse = await axios.post('http://localhost:8000/api/patients/', patientData);
        patientId = patientResponse.data.id;

        // Refresh patients list
        fetchPatients();
      } else {
        patientId = staffFormData.patient;
      }

      const appointmentData = {
        patient: patientId,
        doctor: staffFormData.doctor,
        appointment_date: staffFormData.appointment_date,
        notes: staffFormData.notes,
        status: 'scheduled'
      };

      await axios.post('http://localhost:8000/api/appointments/', appointmentData);

      alert('Appointment request submitted successfully! It will be reviewed by our staff before being assigned to a doctor.');
      setStaffFormData({
        patient: '',
        doctor: '',
        appointment_date: '',
        notes: '',
        is_new_patient: false,
        new_patient: {
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          address: '',
          date_of_birth: '',
          blood_group: '',
          allergies: '',
          emergency_contact: '',
          emergency_phone: ''
        }
      });
      setShowStaffBooking(false);
      fetchAppointments();
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('Failed to book appointment. Please try again.');
    }
    setLoading(false);
  };

  const handleAssignBedToAppointmentDirect = async (appointmentId, patientId, bedId) => {
    if (!bedId) return; // No bed selected

    console.log('Assigning bed:', { appointmentId, patientId, bedId, typeof: { appointmentId, patientId, bedId } });

    try {
      // Find the selected bed
      const selectedBed = beds.find(bed => bed.id == bedId);
      if (!selectedBed) {
        alert('Selected bed not found. Please refresh the page.');
        return;
      }

      console.log('Selected bed:', selectedBed);

      // Check if patient already has a bed
      const allBedsResponse = await axios.get('http://localhost:8000/api/beds/');
      const patientCurrentBed = allBedsResponse.data.find(bed => bed.patient == patientId && bed.status === 'occupied');

      if (patientCurrentBed) {
        alert(`Patient is already assigned to bed ${patientCurrentBed.bed_number} in ${patientCurrentBed.ward}. Please release that bed first.`);
        return;
      }

      // Assign bed to patient using the assign_patient action
      const bedResponse = await axios.post(`http://localhost:8000/api/beds/${bedId}/assign_patient/`, {
        patient_id: parseInt(patientId)
      });

      console.log('Bed assignment response:', bedResponse);

      // Update appointment notes to indicate bed was assigned
      const appointmentResponse = await axios.get(`http://localhost:8000/api/appointments/${appointmentId}/`);
      const currentNotes = appointmentResponse.data.notes || '';
      const updatedNotes = currentNotes + `\n(Bed assigned: ${selectedBed.bed_number} - ${selectedBed.ward})`;

      console.log('Updating appointment notes:', updatedNotes);

      await axios.patch(`http://localhost:8000/api/appointments/${appointmentId}/`, {
        notes: updatedNotes
      });

      // Refresh data
      fetchAppointments();
      fetchAvailableBeds();

      alert(`Bed ${selectedBed.bed_number} has been assigned to the patient!`);
    } catch (error) {
      console.error('Error assigning bed:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);

      if (error.response?.status === 400) {
        alert(`Cannot assign bed: ${error.response.data.error || 'Bad request'}`);
      } else {
        alert(`Failed to assign bed: ${error.response?.data?.detail || error.message}`);
      }
    }
  };

  const handleApproveAppointment = async (appointmentId) => {
    try {
      // First get the appointment details to check for bed request
      const appointment = appointments.find(apt => apt.id === appointmentId);
      let bedAssigned = false;

      if (appointment && appointment.notes && appointment.notes.includes('Bed requested')) {
        // Check for available beds
        const bedsResponse = await axios.get('http://localhost:8000/api/beds/');
        const availableBed = bedsResponse.data.find(bed => bed.status === 'available');

        if (availableBed) {
          // Assign bed to patient
          await axios.patch(`http://localhost:8000/api/beds/${availableBed.id}/`, {
            patient: appointment.patient,
            status: 'occupied'
          });
          bedAssigned = true;
          alert(`Appointment approved! Bed ${availableBed.bed_number} has been assigned to the patient.`);
        } else {
          alert('Appointment approved, but no beds are currently available. Patient will be placed on waitlist.');
        }
      }

      // Update appointment status
      await axios.patch(`http://localhost:8000/api/appointments/${appointmentId}/`, {
        status: 'confirmed'
      });

      // Refresh appointments and beds
      fetchAppointments();
      if (!bedAssigned) {
        alert('Appointment approved successfully!');
      }
    } catch (error) {
      console.error('Error approving appointment:', error);
      alert('Failed to approve appointment.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // For patient booking, we need to get the patient profile
      const patientResponse = await axios.get('http://localhost:8000/api/patients/');
      const patient = patientResponse.data.find(p => p.user.id === user.id);

      if (!patient) {
        alert('Patient profile not found. Please contact administrator.');
        setLoading(false);
        return;
      }

      // Compile comprehensive medical information
      let medicalInfo = formData.notes;
      if (formData.age) medicalInfo += `\nAge: ${formData.age}`;
      if (formData.phone) medicalInfo += `\nPhone: ${formData.phone}`;
      if (formData.address) medicalInfo += `\nAddress: ${formData.address}`;
      if (formData.blood_group) medicalInfo += `\nBlood Group: ${formData.blood_group}`;
      if (formData.allergies) medicalInfo += `\nAllergies: ${formData.allergies}`;
      if (formData.emergency_contact) medicalInfo += `\nEmergency Contact: ${formData.emergency_contact}`;
      if (formData.emergency_phone) medicalInfo += `\nEmergency Phone: ${formData.emergency_phone}`;
      if (formData.current_medications) medicalInfo += `\nCurrent Medications: ${formData.current_medications}`;
      if (formData.request_bed) medicalInfo += '\n(Bed requested)';

      const appointmentData = {
        patient: patient.id,
        doctor: formData.doctor,
        appointment_date: formData.appointment_date,
        notes: medicalInfo,
        status: 'requested'
      };

      const appointmentResponse = await axios.post('http://localhost:8000/api/appointments/', appointmentData);
      const newAppointment = appointmentResponse.data;

      // If a specific bed was selected and bed is requested, assign it
      if (formData.request_bed && formData.selected_bed) {
        try {
          await axios.patch(`http://localhost:8000/api/beds/${formData.selected_bed}/`, {
            patient: patient.id,
            status: 'occupied'
          });

          // Update appointment notes with bed assignment
          const selectedBed = beds.find(bed => bed.id == formData.selected_bed);
          if (selectedBed) {
            const updatedNotes = medicalInfo + `\n(Bed assigned: ${selectedBed.bed_number} - ${selectedBed.ward})`;
            await axios.patch(`http://localhost:8000/api/appointments/${newAppointment.id}/`, {
              notes: updatedNotes
            });
          }
        } catch (bedError) {
          console.error('Error assigning bed:', bedError);
          // Don't fail the appointment booking if bed assignment fails
        }
      }

      alert('Appointment booked successfully!');
      setFormData({
        doctor: '',
        appointment_date: '',
        notes: '',
        request_bed: false,
        selected_bed: '',
        phone: '',
        address: '',
        blood_group: '',
        allergies: '',
        emergency_contact: '',
        emergency_phone: '',
        current_medications: '',
        age: ''
      });
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('Failed to book appointment. Please try again.');
    }
    setLoading(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'requested': return 'warning';
      case 'scheduled': return 'primary';
      case 'confirmed': return 'success';
      case 'in_progress': return 'warning';
      case 'completed': return 'default';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 3 }}>
        {user.role === 'patient' ? 'Book Appointment' : 'Appointment Management'}
      </Typography>

      {user.role === 'patient' ? (
        <Card sx={{ p: 3, borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Event sx={{ mr: 1, color: '#f57c00' }} />
              Book New Appointment
            </Typography>
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Patient Name"
                    value={`${user.first_name} ${user.last_name}`}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Doctor</InputLabel>
                    <Select
                      name="doctor"
                      value={formData.doctor}
                      onChange={handleChange}
                      required
                    >
                      {doctors.map(doctor => (
                        <MenuItem key={doctor.id} value={doctor.id}>
                          Dr. {doctor.user.first_name} {doctor.user.last_name} - {doctor.specialty}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Appointment Date & Time"
                    type="datetime-local"
                    name="appointment_date"
                    value={formData.appointment_date}
                    onChange={handleChange}
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Age"
                    name="age"
                    type="number"
                    value={formData.age || (user.date_of_birth ? new Date().getFullYear() - new Date(user.date_of_birth).getFullYear() : '')}
                    onChange={handleChange}
                    placeholder="Enter your age"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Blood Group"
                    name="blood_group"
                    value={formData.blood_group}
                    onChange={handleChange}
                    placeholder="e.g., A+, B-, O+"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    multiline
                    rows={2}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Allergies"
                    name="allergies"
                    value={formData.allergies}
                    onChange={handleChange}
                    placeholder="List any known allergies (leave blank if none)"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Emergency Contact Name"
                    name="emergency_contact"
                    value={formData.emergency_contact}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Emergency Contact Phone"
                    name="emergency_phone"
                    value={formData.emergency_phone}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Current Medications"
                    name="current_medications"
                    value={formData.current_medications}
                    onChange={handleChange}
                    placeholder="List any medications you're currently taking"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Symptoms/Notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    multiline
                    rows={3}
                    placeholder="Describe your symptoms or reason for visit"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="request_bed"
                        checked={formData.request_bed}
                        onChange={handleChange}
                      />
                    }
                    label="Request hospital bed admission"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{ py: 1.5, fontSize: '1.1rem' }}
                  >
                    {loading ? 'Booking...' : 'Book Appointment'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Box>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
              Appointment Management
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setShowStaffBooking(!showStaffBooking)}
              sx={{ fontWeight: 'bold' }}
            >
              {showStaffBooking ? 'Cancel Booking' : '+ Book Appointment'}
            </Button>
          </Box>

          {showStaffBooking && (
            <Card sx={{ p: 3, borderRadius: 2, mb: 3 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Event sx={{ mr: 1, color: '#f57c00' }} />
                  Book Appointment for Patient
                </Typography>
                <Box component="form" onSubmit={handleStaffSubmit} sx={{ mt: 2 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            name="is_new_patient"
                            checked={staffFormData.is_new_patient}
                            onChange={handleStaffChange}
                          />
                        }
                        label="This is a new patient"
                      />
                    </Grid>

                    {!staffFormData.is_new_patient ? (
                      <Grid item xs={12}>
                        <FormControl fullWidth>
                          <InputLabel>Select Patient</InputLabel>
                          <Select
                            name="patient"
                            value={staffFormData.patient}
                            onChange={handleStaffChange}
                            required
                          >
                            {patients.map(patient => (
                              <MenuItem key={patient.id} value={patient.id}>
                                {patient.user.first_name} {patient.user.last_name} (ID: {patient.medical_id})
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    ) : (
                      <>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="First Name"
                            name="first_name"
                            value={staffFormData.new_patient.first_name}
                            onChange={handleNewPatientChange}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Last Name"
                            name="last_name"
                            value={staffFormData.new_patient.last_name}
                            onChange={handleNewPatientChange}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Email"
                            name="email"
                            type="email"
                            value={staffFormData.new_patient.email}
                            onChange={handleNewPatientChange}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Phone"
                            name="phone"
                            value={staffFormData.new_patient.phone}
                            onChange={handleNewPatientChange}
                            required
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Address"
                            name="address"
                            value={staffFormData.new_patient.address}
                            onChange={handleNewPatientChange}
                            multiline
                            rows={2}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Date of Birth"
                            name="date_of_birth"
                            type="date"
                            value={staffFormData.new_patient.date_of_birth}
                            onChange={handleNewPatientChange}
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Blood Group"
                            name="blood_group"
                            value={staffFormData.new_patient.blood_group}
                            onChange={handleNewPatientChange}
                            placeholder="e.g., A+, B-, O+"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Allergies"
                            name="allergies"
                            value={staffFormData.new_patient.allergies}
                            onChange={handleNewPatientChange}
                            placeholder="List any known allergies"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Emergency Contact"
                            name="emergency_contact"
                            value={staffFormData.new_patient.emergency_contact}
                            onChange={handleNewPatientChange}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Emergency Phone"
                            name="emergency_phone"
                            value={staffFormData.new_patient.emergency_phone}
                            onChange={handleNewPatientChange}
                          />
                        </Grid>
                      </>
                    )}

                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Doctor</InputLabel>
                        <Select
                          name="doctor"
                          value={staffFormData.doctor}
                          onChange={handleStaffChange}
                          required
                        >
                          {doctors.map(doctor => (
                            <MenuItem key={doctor.id} value={doctor.id}>
                              Dr. {doctor.user.first_name} {doctor.user.last_name} - {doctor.specialty}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Appointment Date & Time"
                        type="datetime-local"
                        name="appointment_date"
                        value={staffFormData.appointment_date}
                        onChange={handleStaffChange}
                        required
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Bed Selection (Optional)</InputLabel>
                        <Select
                          name="selected_bed"
                          value={staffFormData.selected_bed}
                          onChange={handleStaffChange}
                        >
                          <MenuItem value="">
                            <em>No bed selected</em>
                          </MenuItem>
                          {beds.map(bed => (
                            <MenuItem key={bed.id} value={bed.id}>
                              Bed {bed.bed_number} - {bed.ward}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Notes/Symptoms"
                        name="notes"
                        value={staffFormData.notes}
                        onChange={handleStaffChange}
                        multiline
                        rows={3}
                        placeholder="Appointment reason or symptoms"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={loading}
                        sx={{ py: 1.5, fontSize: '1.1rem' }}
                      >
                        {loading ? 'Booking...' : 'Book Appointment'}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          )}

          <Card sx={{ p: 3, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                All Appointments
              </Typography>
              <List>
                {appointments.map(appointment => (
                  <ListItem key={appointment.id} divider>
                    <Box sx={{ width: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Person />
                        <Typography variant="subtitle1">
                          {appointment.patient_name}
                        </Typography>
                        <LocalHospital />
                        <Typography variant="body2">
                          {appointment.doctor_name}
                        </Typography>
                        <Chip
                          label={appointment.status}
                          color={getStatusColor(appointment.status)}
                          size="small"
                        />
                        {appointment.status === 'requested' && user.role === 'staff' && (
                          <Button
                            variant="contained"
                            size="small"
                            color="success"
                            onClick={() => handleApproveAppointment(appointment.id)}
                            sx={{ ml: 1 }}
                          >
                            Approve
                          </Button>
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Date: {new Date(appointment.appointment_date).toLocaleString()}
                          </Typography>
                          {appointment.notes && (
                            <Typography variant="body2" color="text.secondary">
                              Notes: {appointment.notes}
                            </Typography>
                          )}
                        </Box>

                        {user.role === 'staff' && (
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <FormControl size="small" sx={{ minWidth: 150 }}>
                              <InputLabel>Assign Bed</InputLabel>
                              <Select
                                value=""
                                onChange={(e) => handleAssignBedToAppointmentDirect(appointment.id, appointment.patient, e.target.value)}
                                label="Assign Bed"
                              >
                                <MenuItem value="">
                                  <em>Select Bed</em>
                                </MenuItem>
                                {beds.map(bed => (
                                  <MenuItem key={bed.id} value={bed.id}>
                                    Bed {bed.bed_number} - {bed.ward}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
}

export default Appointments;
