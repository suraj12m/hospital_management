from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from rest_framework.views import APIView
from django.db import models
from django.utils import timezone
from decimal import Decimal
from .models import User, Patient, Doctor, Appointment, MedicalRecord, Prescription, Bed, Resource, Billing, BillMedicine, Inventory, EmergencyResponse
from .serializers import (
    UserSerializer, PatientSerializer, DoctorSerializer, AppointmentSerializer,
    MedicalRecordSerializer, PrescriptionSerializer, BedSerializer, ResourceSerializer, BillingSerializer,
    InventorySerializer, EmergencyResponseSerializer
)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    @action(detail=False, methods=['post'], permission_classes=[])
    def register(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = serializer.save()
                # Create profile based on role
                if user.role == 'patient':
                    # Generate unique medical_id
                    medical_id = f"P{user.id:04d}"
                    counter = 1
                    while Patient.objects.filter(medical_id=medical_id).exists():
                        medical_id = f"P{user.id:04d}_{counter}"
                        counter += 1
                    Patient.objects.create(
                        user=user,
                        medical_id=medical_id
                    )
                elif user.role == 'doctor':
                    # Generate unique license_number
                    license_number = f"D{user.id:04d}"
                    counter = 1
                    while Doctor.objects.filter(license_number=license_number).exists():
                        license_number = f"D{user.id:04d}_{counter}"
                        counter += 1
                    Doctor.objects.create(
                        user=user,
                        license_number=license_number,
                        specialty='General Medicine',
                        department='General'
                    )
                # Staff doesn't need a special profile, just the User model
                token, created = Token.objects.get_or_create(user=user)
                return Response({'token': token.key, 'user': serializer.data}, status=status.HTTP_201_CREATED)
            except Exception as e:
                # If profile creation fails, delete the user and return error
                user.delete()
                return Response({'error': f'Failed to create user profile: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]

class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    permission_classes = [IsAuthenticated]

class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        appointment = self.get_object()
        appointment.status = 'confirmed'
        appointment.save()
        return Response({'status': 'Appointment confirmed'})

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        appointment = self.get_object()
        appointment.status = 'completed'
        appointment.save()
        return Response({'status': 'Appointment completed'})

class MedicalRecordViewSet(viewsets.ModelViewSet):
    queryset = MedicalRecord.objects.all()
    serializer_class = MedicalRecordSerializer
    permission_classes = [IsAuthenticated]

class PrescriptionViewSet(viewsets.ModelViewSet):
    queryset = Prescription.objects.all()
    serializer_class = PrescriptionSerializer
    permission_classes = [IsAuthenticated]

class BedViewSet(viewsets.ModelViewSet):
    queryset = Bed.objects.all()
    serializer_class = BedSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'])
    def assign_patient(self, request, pk=None):
        bed = self.get_object()
        patient_id = request.data.get('patient_id')
        try:
            patient = Patient.objects.get(id=patient_id)

            # Check if patient is already assigned to another bed
            existing_bed = Bed.objects.filter(patient=patient, status='occupied').exclude(id=bed.id).first()
            if existing_bed:
                return Response({
                    'error': f'Patient is already assigned to bed {existing_bed.bed_number} in {existing_bed.ward}. Please release that bed first.'
                }, status=status.HTTP_400_BAD_REQUEST)

            bed.patient = patient
            bed.status = 'occupied'
            bed.admission_date = timezone.now()
            bed.save()
            return Response({'status': 'Patient assigned to bed'})
        except Patient.DoesNotExist:
            return Response({'error': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def release_bed(self, request, pk=None):
        bed = self.get_object()

        # Update any appointment notes that reference this bed
        if bed.patient:
            from .models import Appointment
            appointments = Appointment.objects.filter(
                patient=bed.patient,
                notes__contains=f'Bed assigned: {bed.bed_number}'
            )
            for appointment in appointments:
                appointment.notes = appointment.notes.replace(
                    f'\n(Bed assigned: {bed.bed_number} - {bed.ward})',
                    f'\n(Bed released: {bed.bed_number} - {bed.ward})'
                )
                appointment.save()

        bed.patient = None
        bed.status = 'available'
        bed.admission_date = None
        bed.save()
        return Response({'status': 'Bed released'})

class ResourceViewSet(viewsets.ModelViewSet):
    queryset = Resource.objects.all()
    serializer_class = ResourceSerializer
    permission_classes = [IsAuthenticated]

class BillingViewSet(viewsets.ModelViewSet):
    queryset = Billing.objects.all()
    serializer_class = BillingSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        data = request.data.copy()

        # Extract medicine data
        medicines = data.pop('medicines', [])

        # Set default values for new fields
        data.setdefault('doctor_fee', 0)
        data.setdefault('room_charge', 0)
        data.setdefault('medicine_total', 0)
        data.setdefault('bill_type', 'consultation')
        data.setdefault('tax_rate', 18.00)
        data.setdefault('insurance_applicable', False)
        data.setdefault('insurance_amount', 0)
        data.setdefault('discount_amount', 0)

        try:
            # Create the bill
            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            bill = serializer.save()

            # Create medicine records
            medicine_total = Decimal('0.00')
            for medicine in medicines:
                if medicine.get('name') and medicine.get('quantity') and medicine.get('unit_price'):
                    quantity = Decimal(str(medicine['quantity']))
                    unit_price = Decimal(str(medicine['unit_price']))
                    med_total = quantity * unit_price
                    BillMedicine.objects.create(
                        bill=bill,
                        medicine_name=medicine['name'],
                        quantity=int(medicine['quantity']),
                        unit_price=unit_price,
                        total_price=med_total
                    )
                    medicine_total += med_total

            # Update bill with correct medicine total
            bill.medicine_total = medicine_total
            bill.save()

            return Response(BillingSerializer(bill).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            print(f"Error creating bill: {e}")
            print(f"Request data: {data}")
            print(f"Medicines data: {medicines}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        bill = self.get_object()
        bill.status = 'paid'
        bill.paid_date = timezone.now()
        bill.save()
        return Response({'status': 'Bill marked as paid'})

class InventoryViewSet(viewsets.ModelViewSet):
    queryset = Inventory.objects.all()
    serializer_class = InventorySerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False)
    def low_stock(self, request):
        low_stock_items = Inventory.objects.filter(quantity__lte=models.F('minimum_threshold'))
        serializer = self.get_serializer(low_stock_items, many=True)
        return Response(serializer.data)

class EmergencyResponseViewSet(viewsets.ModelViewSet):
    queryset = EmergencyResponse.objects.all()
    serializer_class = EmergencyResponseSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        emergency = self.get_object()
        emergency.status = 'resolved'
        emergency.resolved_at = timezone.now()
        emergency.save()
        return Response({'status': 'Emergency resolved'})

class LoginView(APIView):
    permission_classes = []  # No authentication required for login

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user:
            token, created = Token.objects.get_or_create(user=user)
            return Response({'token': token.key, 'user': UserSerializer(user).data})
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.role == 'admin':
            # Admin sees all data
            data = {
                'role': 'admin',
                'total_patients': Patient.objects.count(),
                'total_doctors': Doctor.objects.count(),
                'total_staff': User.objects.filter(role='staff').count(),
                'total_appointments': Appointment.objects.count(),
                'available_beds': Bed.objects.filter(status='available').count(),
                'occupied_beds': Bed.objects.filter(status='occupied').count(),
                'active_emergencies': EmergencyResponse.objects.filter(status='active').count(),
                'low_stock_items': Inventory.objects.filter(quantity__lte=models.F('minimum_threshold')).count(),
                'pending_bills': Billing.objects.filter(status='pending').count(),
                'total_inventory_value': Inventory.objects.count(),
            }
        elif user.role == 'patient':
            # Patient sees personal data
            try:
                patient_profile = user.patient_profile
                data = {
                    'role': 'patient',
                    'welcome_message': f'Welcome back, {user.get_full_name()}',
                    'my_appointments': Appointment.objects.filter(patient=patient_profile).count(),
                    'upcoming_appointments': Appointment.objects.filter(
                        patient=patient_profile,
                        appointment_date__gte=timezone.now(),
                        status__in=['scheduled', 'confirmed']
                    ).count(),
                    'my_bills': Billing.objects.filter(patient=patient_profile).count(),
                    'pending_bills': Billing.objects.filter(patient=patient_profile, status='pending').count(),
                    'my_medical_records': MedicalRecord.objects.filter(patient=patient_profile).count(),
                    'current_bed': Bed.objects.filter(patient=patient_profile).first(),
                }
            except:
                # If profile doesn't exist, return basic data
                data = {
                    'role': 'patient',
                    'welcome_message': f'Welcome back, {user.get_full_name()}',
                    'error': 'Profile not found. Please contact administrator.',
                    'my_appointments': 0,
                    'upcoming_appointments': 0,
                    'my_bills': 0,
                    'pending_bills': 0,
                    'my_medical_records': 0,
                    'current_bed': None,
                }
            else:
                # Profile exists, get current bed
                current_bed = Bed.objects.filter(patient=patient_profile).first()
                if current_bed:
                    current_bed_data = BedSerializer(current_bed).data
                else:
                    current_bed_data = None

                data = {
                    'role': 'patient',
                    'welcome_message': f'Welcome back, {user.get_full_name()}',
                    'my_appointments': Appointment.objects.filter(patient=patient_profile).count(),
                    'upcoming_appointments': Appointment.objects.filter(
                        patient=patient_profile,
                        appointment_date__gte=timezone.now(),
                        status__in=['scheduled', 'confirmed']
                    ).count(),
                    'my_bills': Billing.objects.filter(patient=patient_profile).count(),
                    'pending_bills': Billing.objects.filter(patient=patient_profile, status='pending').count(),
                    'my_medical_records': MedicalRecord.objects.filter(patient=patient_profile).count(),
                    'current_bed': current_bed_data,
                }
        elif user.role == 'doctor':
            # Doctor sees their appointments and patients
            try:
                doctor_profile = user.doctor_profile
                data = {
                    'role': 'doctor',
                    'welcome_message': f'Welcome back, Dr. {user.get_full_name()}',
                    'my_appointments': Appointment.objects.filter(doctor=doctor_profile).count(),
                    'today_appointments': Appointment.objects.filter(
                        doctor=doctor_profile,
                        appointment_date__date=timezone.now().date()
                    ).count(),
                    'pending_appointments': Appointment.objects.filter(
                        doctor=doctor_profile,
                        status='scheduled'
                    ).count(),
                    'my_patients': Appointment.objects.filter(doctor=doctor_profile).values('patient').distinct().count(),
                    'completed_appointments': Appointment.objects.filter(
                        doctor=doctor_profile,
                        status='completed'
                    ).count(),
                }
            except:
                # If profile doesn't exist, return basic data
                data = {
                    'role': 'doctor',
                    'welcome_message': f'Welcome back, Dr. {user.get_full_name()}',
                    'error': 'Profile not found. Please contact administrator.',
                    'my_appointments': 0,
                    'today_appointments': 0,
                    'pending_appointments': 0,
                    'my_patients': 0,
                    'completed_appointments': 0,
                }
        else:  # staff
            # Staff sees operational data
            data = {
                'role': 'staff',
                'welcome_message': f'Welcome back, {user.get_full_name()}',
                'total_appointments': Appointment.objects.count(),
                'available_beds': Bed.objects.filter(status='available').count(),
                'active_emergencies': EmergencyResponse.objects.filter(status='active').count(),
                'low_stock_items': Inventory.objects.filter(quantity__lte=models.F('minimum_threshold')).count(),
                'pending_bills': Billing.objects.filter(status='pending').count(),
            }

        return Response(data)
