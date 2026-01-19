import React, { useState, useEffect } from 'react';
import { Typography, Box, Card, CardContent, Grid, Chip, Button, Dialog, DialogTitle, DialogContent, TextField, FormControl, InputLabel, Select, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Divider, List, ListItem, ListItemText, IconButton } from '@mui/material';
import { Payment, Receipt, History, Add, Person, LocalHospital, Healing, Delete, CurrencyRupee } from '@mui/icons-material';
import axios from 'axios';

function Billing() {
  const [user, setUser] = useState(null);
  const [bills, setBills] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [showBillDetails, setShowBillDetails] = useState(false);
  const [showNewPayment, setShowNewPayment] = useState(false);
  const [newBill, setNewBill] = useState({
    patient: '',
    description: '',
    due_date: '',
    doctor_fee: '',
    room_charge: '',
    medicines: [
      { name: '', quantity: 1, unit_price: '', total: 0 }
    ],
    total_amount: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchBills();
    fetchPatients();
    fetchDoctors();
  }, []);

  const fetchBills = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/billings/');
      setBills(response.data);
    } catch (error) {
      console.error('Error fetching bills:', error);
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

  const fetchDoctors = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/doctors/');
      setDoctors(response.data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const handleCreateBill = async () => {
    setLoading(true);
    try {
      const billData = {
        patient: newBill.patient,
        description: newBill.description,
        due_date: newBill.due_date,
        doctor_fee: parseFloat(newBill.doctor_fee) || 0,
        room_charge: parseFloat(newBill.room_charge) || 0,
        medicines: newBill.medicines.filter(med => med.name && med.quantity && med.unit_price)
      };

      await axios.post('http://localhost:8000/api/billings/', billData);

      // Reset form
      setNewBill({
        patient: '',
        description: '',
        due_date: '',
        doctor_fee: '',
        room_charge: '',
        medicines: [{ name: '', quantity: 1, unit_price: '', total: 0 }]
      });
      setShowNewPayment(false);
      fetchBills();
      alert('Bill created successfully!');
    } catch (error) {
      console.error('Error creating bill:', error);
      alert('Failed to create bill.');
    }
    setLoading(false);
  };

  const handleViewBillDetails = (bill) => {
    setSelectedBill(bill);
    setShowBillDetails(true);
  };

  const handleMarkAsPaid = async (billId) => {
    try {
      await axios.post(`http://localhost:8000/api/billings/${billId}/mark_paid/`);
      fetchBills();

      // Generate receipt after payment
      const updatedBill = bills.find(b => b.id === billId);
      if (updatedBill) {
        generateReceipt(updatedBill);
      }

      alert('Bill marked as paid! Receipt generated.');
    } catch (error) {
      console.error('Error marking bill as paid:', error);
      alert('Failed to mark bill as paid.');
    }
  };

  const generateReceipt = (bill) => {
    const receiptContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Receipt</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #1976d2;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .hospital-name {
            font-size: 24px;
            font-weight: bold;
            color: #1976d2;
            margin-bottom: 5px;
          }
          .receipt-title {
            font-size: 18px;
            color: #666;
          }
          .bill-details {
            margin-bottom: 30px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 5px 0;
          }
          .detail-label {
            font-weight: bold;
            color: #333;
          }
          .detail-value {
            color: #666;
          }
          .breakdown {
            margin-bottom: 30px;
          }
          .breakdown-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .breakdown-table th,
          .breakdown-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          .breakdown-table th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
          .total-row {
            background-color: #e3f2fd !important;
            font-weight: bold;
          }
          .total-amount {
            font-size: 18px;
            color: #1976d2;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 12px;
          }
          .payment-status {
            background-color: #e8f5e8;
            color: #2e7d32;
            padding: 10px;
            text-align: center;
            border-radius: 5px;
            margin-bottom: 20px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="hospital-name">Smart Hospital Management</div>
          <div class="receipt-title">PAYMENT RECEIPT</div>
        </div>

        <div class="payment-status">
          ✅ PAYMENT RECEIVED - BILL SETTLED
        </div>

        <div class="bill-details">
          <div class="detail-row">
            <span class="detail-label">Receipt Number:</span>
            <span class="detail-value">RCP-${bill.id}-${Date.now()}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Patient Name:</span>
            <span class="detail-value">${bill.patient_name}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Bill Description:</span>
            <span class="detail-value">${bill.description}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Payment Date:</span>
            <span class="detail-value">${new Date().toLocaleDateString()}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Due Date:</span>
            <span class="detail-value">${new Date(bill.due_date).toLocaleDateString()}</span>
          </div>
        </div>

        <div class="breakdown">
          <h3>Bill Breakdown</h3>
          <table class="breakdown-table">
            <thead>
              <tr>
                <th>Service/Item</th>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${bill.doctor_fee > 0 ? `
              <tr>
                <td>Doctor Consultation</td>
                <td>Medical consultation and examination</td>
                <td>₹${bill.doctor_fee}</td>
              </tr>
              ` : ''}
              ${bill.room_charge > 0 ? `
              <tr>
                <td>Room Charges</td>
                <td>Hospital room accommodation</td>
                <td>₹${bill.room_charge}</td>
              </tr>
              ` : ''}
              ${bill.medicines && bill.medicines.length > 0 ?
                bill.medicines.map(medicine => `
              <tr>
                <td>${medicine.medicine_name}</td>
                <td>Quantity: ${medicine.quantity} × ₹${medicine.unit_price}</td>
                <td>₹${medicine.total_price}</td>
              </tr>
              `).join('') :
                bill.medicine_total > 0 ? `
              <tr>
                <td>Medicine Charges</td>
                <td>Various medicines and treatment supplies</td>
                <td>₹${bill.medicine_total}</td>
              </tr>
              ` : ''}
              <tr class="total-row">
                <td><strong>Total Amount Paid</strong></td>
                <td><strong>${bill.description}</strong></td>
                <td class="total-amount"><strong>₹${bill.total_amount}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p>Thank you for choosing Smart Hospital Management</p>
          <p>This is a computer-generated receipt. No signature required.</p>
          <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([receiptContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt-${bill.patient_name.replace(' ', '-')}-${bill.id}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Also open print dialog
    const printWindow = window.open('', '_blank');
    printWindow.document.write(receiptContent);
    printWindow.document.close();
    printWindow.print();
  };

  const addMedicine = () => {
    setNewBill(prev => ({
      ...prev,
      medicines: [...prev.medicines, { name: '', quantity: 1, unit_price: '', total: 0 }]
    }));
  };

  const removeMedicine = (index) => {
    setNewBill(prev => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== index)
    }));
  };

  const updateMedicine = (index, field, value) => {
    setNewBill(prev => {
      const updatedMedicines = [...prev.medicines];
      updatedMedicines[index][field] = value;

      // Auto-calculate total for this medicine
      if (field === 'quantity' || field === 'unit_price') {
        const quantity = parseFloat(updatedMedicines[index].quantity) || 0;
        const unitPrice = parseFloat(updatedMedicines[index].unit_price) || 0;
        updatedMedicines[index].total = quantity * unitPrice;
      }

      return {
        ...prev,
        medicines: updatedMedicines
      };
    });
  };

  const calculateTotal = () => {
    const doctorFee = parseFloat(newBill.doctor_fee) || 0;
    const roomCharge = parseFloat(newBill.room_charge) || 0;
    const medicineTotal = newBill.medicines.reduce((sum, med) => sum + (parseFloat(med.total) || 0), 0);
    const subtotal = doctorFee + roomCharge + medicineTotal;
    const tax = subtotal * 0.18; // 18% GST
    return subtotal + tax;
  };

  // Auto-update total when doctor fee, room charge, or medicines change
  useEffect(() => {
    const total = calculateTotal();
    setNewBill(prev => ({
      ...prev,
      total_amount: total,
      amount: total.toString()
    }));
  }, [newBill.doctor_fee, newBill.room_charge, newBill.medicines]);

  const getFilteredBills = () => {
    if (!user) return [];
    if (user.role === 'patient') {
      // For patients, only show their own pending bills
      return bills.filter(bill => bill.patient_name === `${user.first_name} ${user.last_name}` && bill.status === 'pending');
    }
    return bills;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'paid': return 'success';
      case 'overdue': return 'error';
      default: return 'default';
    }
  };

  const filteredBills = getFilteredBills();

  if (!user) return <div>Loading...</div>;

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 3 }}>
        {user.role === 'patient' ? 'My Pending Bills' : 'Billing & Payments'}
      </Typography>

      {user.role === 'patient' ? (
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, color: '#1976d2' }}>
            Medicine History
          </Typography>

          {bills.filter(bill => bill.patient_name === `${user.first_name} ${user.last_name}` && bill.status === 'paid').length === 0 ? (
            <Card sx={{ p: 3, borderRadius: 2, textAlign: 'center', mb: 4 }}>
              <CardContent>
                <Healing sx={{ fontSize: 60, color: '#4caf50', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No Medicine History
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Your medicine history will appear here after bills are paid.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={2} sx={{ mb: 4 }}>
              {bills.filter(bill => bill.patient_name === `${user.first_name} ${user.last_name}` && bill.status === 'paid').map(bill => (
                <Grid item xs={12} key={bill.id}>
                  <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                          <Healing sx={{ mr: 1, color: '#388e3c' }} />
                          {bill.description}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label="Paid"
                            color="success"
                            size="small"
                          />
                          {bill.paid_date && (
                            <Typography variant="body2" color="text.secondary">
                              Paid: {new Date(bill.paid_date).toLocaleDateString()}
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      {bill.medicines && bill.medicines.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                            Prescribed Medicines:
                          </Typography>
                          <Grid container spacing={1}>
                            {bill.medicines.map((medicine, index) => (
                              <Grid item xs={12} sm={6} md={4} key={index}>
                                <Card sx={{ bgcolor: '#f5f5f5', border: '1px solid #e0e0e0' }}>
                                  <CardContent sx={{ p: 2 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                                      {medicine.medicine_name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      Quantity: {medicine.quantity}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      Cost: ₹{medicine.total_price}
                                    </Typography>
                                  </CardContent>
                                </Card>
                              </Grid>
                            ))}
                          </Grid>
                        </Box>
                      )}

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          Due Date: {new Date(bill.due_date).toLocaleDateString()}
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                          ₹{bill.total_amount}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            Pending Bills
          </Typography>

          {filteredBills.length === 0 ? (
            <Card sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
              <CardContent>
                <Receipt sx={{ fontSize: 60, color: '#4caf50', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No Pending Bills
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  You have no outstanding bills at this time.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <List>
              {filteredBills.map(bill => (
                <Card key={bill.id} sx={{ mb: 2, borderRadius: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        {bill.description}
                      </Typography>
                      <Chip
                        label={bill.status}
                        color={getStatusColor(bill.status)}
                        size="small"
                      />
                    </Box>
                    <Typography variant="h5" sx={{ color: '#1976d2', fontWeight: 'bold', mb: 1 }}>
                      ₹{bill.total_amount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Due Date: {new Date(bill.due_date).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Patient: {bill.patient_name}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Button variant="contained" color="primary" size="small">
                        Pay Now
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </List>
          )}
        </Box>
      ) : (
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 3 }}>
            Billing Management
          </Typography>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* New Payment Card */}
            <Grid item xs={12} sm={6}>
              <Card
                sx={{
                  height: '100%',
                  background: 'linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  borderRadius: 3,
                  cursor: 'pointer',
                  transition: 'transform 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                  }
                }}
                onClick={() => setShowNewPayment(true)}
              >
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <Add sx={{ fontSize: 60, color: '#1976d2', mb: 2 }} />
                  <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                    New Payment
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Create new bills and invoices for patients
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Payment History Card */}
            <Grid item xs={12} sm={6}>
              <Card
                sx={{
                  height: '100%',
                  background: 'linear-gradient(135deg, #e8f5e8 0%, #ffffff 100%)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  borderRadius: 3,
                  cursor: 'pointer',
                  transition: 'transform 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                  }
                }}
              >
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <History sx={{ fontSize: 60, color: '#388e3c', mb: 2 }} />
                  <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Payment History
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    View all patient payments and bill details
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 2, color: '#1976d2', fontWeight: 'bold' }}>
                    {bills.length} Total Bills
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Payment History Cards */}
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            All Patient Bills
          </Typography>
          <Grid container spacing={2}>
            {bills.map(bill => (
              <Grid item xs={12} sm={6} md={4} key={bill.id}>
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
                  onClick={() => handleViewBillDetails(bill)}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Person sx={{ color: '#1976d2' }} />
                      <Chip
                        label={bill.status}
                        color={getStatusColor(bill.status)}
                        size="small"
                      />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {bill.patient_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {bill.description}
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold', mb: 1 }}>
                      ₹{bill.total_amount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Due: {new Date(bill.due_date).toLocaleDateString()}
                    </Typography>
                    {bill.status === 'pending' && (
                      <Button
                        variant="outlined"
                        size="small"
                        color="success"
                        sx={{ mt: 1, width: '100%' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsPaid(bill.id);
                        }}
                      >
                        Mark as Paid
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* New Payment Dialog */}
          <Dialog open={showNewPayment} onClose={() => setShowNewPayment(false)} maxWidth="lg" fullWidth>
            <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
              <CurrencyRupee sx={{ mr: 1 }} />
              Create New Bill
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Patient</InputLabel>
                    <Select
                      value={newBill.patient}
                      onChange={(e) => setNewBill(prev => ({ ...prev, patient: e.target.value }))}
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
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Due Date"
                    type="date"
                    value={newBill.due_date}
                    onChange={(e) => setNewBill(prev => ({ ...prev, due_date: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center' }}>
                    <LocalHospital sx={{ mr: 1, color: '#1976d2' }} />
                    Doctor Fee
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Doctor Consultation Fee (₹)"
                    type="number"
                    value={newBill.doctor_fee}
                    onChange={(e) => setNewBill(prev => ({ ...prev, doctor_fee: e.target.value }))}
                    placeholder="Enter doctor fee"
                    InputProps={{
                      startAdornment: <CurrencyRupee sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Room Charges (₹)"
                    type="number"
                    value={newBill.room_charge}
                    onChange={(e) => setNewBill(prev => ({ ...prev, room_charge: e.target.value }))}
                    placeholder="Enter room charges"
                    InputProps={{
                      startAdornment: <CurrencyRupee sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                      <Healing sx={{ mr: 1, color: '#388e3c' }} />
                      Medicines
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Add />}
                      onClick={addMedicine}
                    >
                      Add Medicine
                    </Button>
                  </Box>
                </Grid>

                {newBill.medicines.map((medicine, index) => (
                  <Grid item xs={12} key={index}>
                    <Card sx={{ p: 2, borderRadius: 2, border: '1px solid #e0e0e0' }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            label="Medicine Name"
                            value={medicine.name}
                            onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                            placeholder="e.g., Paracetamol 500mg"
                          />
                        </Grid>
                        <Grid item xs={12} sm={2}>
                          <TextField
                            fullWidth
                            label="Quantity"
                            type="number"
                            value={medicine.quantity}
                            onChange={(e) => updateMedicine(index, 'quantity', e.target.value)}
                            inputProps={{ min: 1 }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <TextField
                            fullWidth
                            label="Unit Price (₹)"
                            type="number"
                            value={medicine.unit_price}
                            onChange={(e) => updateMedicine(index, 'unit_price', e.target.value)}
                            InputProps={{
                              startAdornment: <CurrencyRupee sx={{ mr: 1, color: 'text.secondary' }} />
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={2}>
                          <TextField
                            fullWidth
                            label="Total (₹)"
                            value={medicine.total ? `₹${medicine.total}` : '₹0'}
                            InputProps={{
                              readOnly: true,
                              startAdornment: <CurrencyRupee sx={{ mr: 1, color: 'text.secondary' }} />
                            }}
                            sx={{ bgcolor: '#f5f5f5' }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={1}>
                          {newBill.medicines.length > 1 && (
                            <IconButton
                              color="error"
                              onClick={() => removeMedicine(index)}
                              sx={{ mt: 1 }}
                            >
                              <Delete />
                            </IconButton>
                          )}
                        </Grid>
                      </Grid>
                    </Card>
                  </Grid>
                ))}

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Card sx={{ p: 3, bgcolor: '#e3f2fd', border: '2px solid #1976d2' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, textAlign: 'center' }}>
                      Bill Summary
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body1">
                          Doctor Fee: <strong>₹{parseFloat(newBill.doctor_fee) || 0}</strong>
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body1">
                          Room Charges: <strong>₹{parseFloat(newBill.room_charge) || 0}</strong>
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body1">
                          Medicine Total: <strong>₹{newBill.medicines.reduce((sum, med) => sum + (parseFloat(med.total) || 0), 0)}</strong>
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body1">
                          Tax (18% GST): <strong>₹{((parseFloat(newBill.doctor_fee) || 0) + (parseFloat(newBill.room_charge) || 0) + newBill.medicines.reduce((sum, med) => sum + (parseFloat(med.total) || 0), 0)) * 0.18}</strong>
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold', textAlign: 'center', mt: 2 }}>
                          Total Bill: ₹{newBill.total_amount}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Bill Description"
                    value={newBill.description}
                    onChange={(e) => setNewBill(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="e.g., Consultation and Medicine Charges"
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button onClick={() => setShowNewPayment(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={handleCreateBill}
                      disabled={loading}
                      startIcon={<CurrencyRupee />}
                      sx={{ px: 4 }}
                    >
                      {loading ? 'Creating...' : `Create Bill (₹${newBill.total_amount})`}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
          </Dialog>

          {/* Bill Details Dialog */}
          <Dialog open={showBillDetails} onClose={() => setShowBillDetails(false)} maxWidth="md" fullWidth>
            <DialogTitle sx={{ fontWeight: 'bold' }}>
              Bill Details - {selectedBill?.patient_name}
            </DialogTitle>
            <DialogContent>
              {selectedBill && (
                <Box>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Patient
                      </Typography>
                      <Typography variant="h6">
                        {selectedBill.patient_name}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Status
                      </Typography>
                      <Chip
                        label={selectedBill.status}
                        color={getStatusColor(selectedBill.status)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Total Amount
                      </Typography>
                      <Typography variant="h5" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                        ₹{selectedBill.total_amount}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Due Date
                      </Typography>
                      <Typography variant="body1">
                        {new Date(selectedBill.due_date).toLocaleDateString()}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Bill Breakdown
                  </Typography>

                  <TableContainer component={Paper} sx={{ mb: 2 }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Service/Item</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Details</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {/* Doctor Fee */}
                        {selectedBill.doctor_fee > 0 && (
                          <TableRow>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <LocalHospital sx={{ mr: 1, color: '#1976d2' }} />
                                Doctor Consultation
                              </Box>
                            </TableCell>
                            <TableCell>Medical consultation and examination</TableCell>
                            <TableCell>₹{selectedBill.doctor_fee}</TableCell>
                          </TableRow>
                        )}

                        {/* Room Charges */}
                        {selectedBill.room_charge > 0 && (
                          <TableRow>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Person sx={{ mr: 1, color: '#f57c00' }} />
                                Room Charges
                              </Box>
                            </TableCell>
                            <TableCell>Hospital room accommodation</TableCell>
                            <TableCell>₹{selectedBill.room_charge}</TableCell>
                          </TableRow>
                        )}

                        {/* Individual Medicines */}
                        {selectedBill.medicines && selectedBill.medicines.length > 0 ? (
                          selectedBill.medicines.map((medicine, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Healing sx={{ mr: 1, color: '#388e3c' }} />
                                  {medicine.medicine_name}
                                </Box>
                              </TableCell>
                              <TableCell>
                                Quantity: {medicine.quantity} × ₹{medicine.unit_price}
                              </TableCell>
                              <TableCell>₹{medicine.total_price}</TableCell>
                            </TableRow>
                          ))
                        ) : selectedBill.medicine_total > 0 ? (
                          <TableRow>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Healing sx={{ mr: 1, color: '#388e3c' }} />
                                Medicine Charges
                              </Box>
                            </TableCell>
                            <TableCell>Various medicines and treatment supplies</TableCell>
                            <TableCell>₹{selectedBill.medicine_total}</TableCell>
                          </TableRow>
                        ) : null}

                        {/* Total Row */}
                        <TableRow sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>
                          <TableCell sx={{ fontWeight: 'bold' }}>Total Amount</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>{selectedBill.description}</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>₹{selectedBill.total_amount}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>
                    * This is a simplified breakdown. Detailed itemization would be available with complete billing system integration.
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    {selectedBill.status === 'pending' && (
                      <Button
                        variant="contained"
                        color="success"
                        onClick={() => {
                          handleMarkAsPaid(selectedBill.id);
                          setShowBillDetails(false);
                        }}
                      >
                        Mark as Paid
                      </Button>
                    )}
                    <Button onClick={() => setShowBillDetails(false)}>
                      Close
                    </Button>
                  </Box>
                </Box>
              )}
            </DialogContent>
          </Dialog>
        </Box>
      )}
    </Box>
  );
}

export default Billing;
