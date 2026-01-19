from rest_framework import serializers
from .models import User, Patient, Doctor, Appointment, MedicalRecord, Prescription, Bed, Resource, Medicine, BillMedicine, Payment, Billing, Inventory, EmergencyResponse

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone', 'address', 'date_of_birth', 'password']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

class PatientSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Patient
        fields = '__all__'

class DoctorSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Doctor
        fields = '__all__'

class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    doctor_name = serializers.SerializerMethodField()
    patient_details = PatientSerializer(source='patient', read_only=True)

    class Meta:
        model = Appointment
        fields = '__all__'

    def get_patient_name(self, obj):
        user = obj.patient.user
        full_name = user.get_full_name()
        if full_name.strip():
            return full_name
        return f"{user.first_name or ''} {user.last_name or ''}".strip() or user.username

    def get_doctor_name(self, obj):
        user = obj.doctor.user
        full_name = user.get_full_name()
        if full_name.strip():
            return full_name
        return f"{user.first_name or ''} {user.last_name or ''}".strip() or user.username

class PrescriptionSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(source='medicine.name', read_only=True)
    medicine_description = serializers.CharField(source='medicine.description', read_only=True)

    class Meta:
        model = Prescription
        fields = '__all__'

class MedicalRecordSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.user.get_full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.user.get_full_name', read_only=True)
    prescriptions = PrescriptionSerializer(many=True, read_only=True)

    class Meta:
        model = MedicalRecord
        fields = '__all__'

class BedSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.user.get_full_name', read_only=True, required=False)

    class Meta:
        model = Bed
        fields = '__all__'

class ResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resource
        fields = '__all__'

class BillMedicineSerializer(serializers.ModelSerializer):
    class Meta:
        model = BillMedicine
        fields = ['id', 'medicine_name', 'quantity', 'unit_price', 'total_price']

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'amount', 'payment_method', 'transaction_id', 'payment_date', 'notes', 'created_at']

class BillingSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.user.get_full_name', read_only=True)
    medicines = BillMedicineSerializer(many=True, read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)

    class Meta:
        model = Billing
        fields = '__all__'
        extra_kwargs = {
            'paid_date': {'required': False, 'allow_null': True},
            'total_amount': {'required': False},
        }

class InventorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Inventory
        fields = '__all__'

class EmergencyResponseSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.user.get_full_name', read_only=True)
    resources_allocated_names = serializers.SerializerMethodField()
    staff_assigned_names = serializers.SerializerMethodField()

    class Meta:
        model = EmergencyResponse
        fields = '__all__'

    def get_resources_allocated_names(self, obj):
        return [resource.name for resource in obj.resources_allocated.all()]

    def get_staff_assigned_names(self, obj):
        return [staff.get_full_name() for staff in obj.staff_assigned.all()]
