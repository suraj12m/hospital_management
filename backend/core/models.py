from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('doctor', 'Doctor'),
        ('patient', 'Patient'),
        ('staff', 'Staff'),
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='patient')
    phone = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)
    date_of_birth = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.role})"

class Patient(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='patient_profile')
    medical_id = models.CharField(max_length=20, unique=True)
    blood_group = models.CharField(max_length=5, blank=True)
    allergies = models.TextField(blank=True)
    emergency_contact = models.CharField(max_length=100, blank=True)
    emergency_phone = models.CharField(max_length=15, blank=True)
    admitted = models.BooleanField(default=False)
    admission_date = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.first_name} {self.user.last_name}"

class Doctor(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='doctor_profile')
    license_number = models.CharField(max_length=20, unique=True)
    specialty = models.CharField(max_length=100)
    department = models.CharField(max_length=100)
    available = models.BooleanField(default=True)

    def __str__(self):
        return f"Dr. {self.user.first_name} {self.user.last_name} - {self.specialty}"

class Appointment(models.Model):
    STATUS_CHOICES = [
        ('requested', 'Requested'),
        ('scheduled', 'Scheduled'),
        ('confirmed', 'Confirmed'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='appointments')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='appointments')
    appointment_date = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Appointment: {self.patient} with {self.doctor} on {self.appointment_date}"

class MedicalRecord(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='medical_records')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE)
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, related_name='medical_records', null=True, blank=True)
    diagnosis = models.TextField()
    treatment = models.TextField()
    notes = models.TextField(blank=True)
    record_date = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Record for {self.patient} - {self.diagnosis}"

class Bed(models.Model):
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('occupied', 'Occupied'),
        ('maintenance', 'Under Maintenance'),
    ]
    bed_number = models.CharField(max_length=10, unique=True)
    ward = models.CharField(max_length=50)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    patient = models.OneToOneField(Patient, on_delete=models.SET_NULL, null=True, blank=True, related_name='bed')

    def __str__(self):
        return f"Bed {self.bed_number} - {self.ward}"

class Resource(models.Model):
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=50)
    total_quantity = models.PositiveIntegerField()
    available_quantity = models.PositiveIntegerField()
    location = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.name} ({self.available_quantity}/{self.total_quantity})"

class Medicine(models.Model):
    name = models.CharField(max_length=100)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.name} - ₹{self.unit_price}"

class Prescription(models.Model):
    medical_record = models.ForeignKey(MedicalRecord, on_delete=models.CASCADE, related_name='prescriptions')
    medicine = models.ForeignKey(Medicine, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    dosage = models.CharField(max_length=100, help_text="e.g., 1 tablet twice daily")
    duration = models.CharField(max_length=100, help_text="e.g., 7 days")
    instructions = models.TextField(blank=True)

    def __str__(self):
        return f"{self.medicine.name} - {self.quantity} units for {self.medical_record.patient}"

class BillMedicine(models.Model):
    bill = models.ForeignKey('Billing', on_delete=models.CASCADE, related_name='medicines')
    medicine_name = models.CharField(max_length=100)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.medicine_name} x{self.quantity} - ₹{self.total_price}"

class Payment(models.Model):
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('card', 'Credit/Debit Card'),
        ('upi', 'UPI'),
        ('bank_transfer', 'Bank Transfer'),
        ('insurance', 'Insurance'),
    ]

    bill = models.ForeignKey('Billing', on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='cash')
    transaction_id = models.CharField(max_length=100, blank=True)
    payment_date = models.DateTimeField(default=timezone.now)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Billing(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('partially_paid', 'Partially Paid'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
    ]

    BILL_TYPE_CHOICES = [
        ('consultation', 'Consultation'),
        ('treatment', 'Treatment'),
        ('medicine', 'Medicine'),
        ('room', 'Room Charges'),
        ('surgery', 'Surgery'),
        ('emergency', 'Emergency'),
        ('other', 'Other'),
    ]

    # Invoice numbering
    invoice_number = models.CharField(max_length=20, unique=True, blank=True)

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='bills')
    appointment = models.ForeignKey(Appointment, on_delete=models.SET_NULL, null=True, blank=True, related_name='bills')

    # Billing details
    bill_type = models.CharField(max_length=20, choices=BILL_TYPE_CHOICES, default='consultation')
    doctor_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    room_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    medicine_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Tax calculations
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=18.00)  # GST rate
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Totals
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    pending_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    due_date = models.DateField()
    paid_date = models.DateTimeField(null=True, blank=True)

    # Additional fields
    insurance_applicable = models.BooleanField(default=False)
    insurance_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Auto-generate invoice number
        if not self.invoice_number:
            last_bill = Billing.objects.order_by('-id').first()
            next_number = (last_bill.id + 1) if last_bill else 1
            self.invoice_number = f"INV-{next_number:06d}"

        # Calculate totals
        self.subtotal = self.doctor_fee + self.room_charge + self.medicine_total
        self.tax_amount = (self.subtotal * self.tax_rate) / 100
        self.total_amount = self.subtotal + self.tax_amount - self.discount_amount
        self.pending_amount = self.total_amount - self.paid_amount

        # Update status based on payments
        if self.pending_amount <= 0:
            self.status = 'paid'
            if not self.paid_date:
                self.paid_date = timezone.now()
        elif self.paid_amount > 0:
            self.status = 'partially_paid'
        elif self.due_date < timezone.now().date():
            self.status = 'overdue'

        super().save(*args, **kwargs)

    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.patient} - ₹{self.total_amount}"

class Inventory(models.Model):
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=50)
    quantity = models.PositiveIntegerField()
    minimum_threshold = models.PositiveIntegerField(default=10)
    supplier = models.CharField(max_length=100, blank=True)
    expiry_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.name} - Qty: {self.quantity}"

    @property
    def is_low_stock(self):
        return self.quantity <= self.minimum_threshold

class EmergencyResponse(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('resolved', 'Resolved'),
    ]
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='emergencies')
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    priority = models.CharField(max_length=20, choices=[
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ], default='medium')
    resources_allocated = models.ManyToManyField(Resource, blank=True)
    staff_assigned = models.ManyToManyField(User, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Emergency: {self.patient} - {self.priority}"
