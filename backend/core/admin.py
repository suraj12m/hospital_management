from django.contrib import admin
from .models import User, Patient, Doctor, Appointment, MedicalRecord, Bed, Resource, Billing, Inventory, EmergencyResponse

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'first_name', 'last_name', 'email', 'role', 'phone')
    list_filter = ('role', 'is_active', 'date_joined')
    search_fields = ('username', 'first_name', 'last_name', 'email')
    ordering = ('username',)

@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('user', 'medical_id', 'blood_group', 'admitted', 'admission_date')
    list_filter = ('admitted', 'blood_group', 'admission_date')
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'medical_id')
    raw_id_fields = ('user',)

@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ('user', 'license_number', 'specialty', 'department', 'available')
    list_filter = ('specialty', 'department', 'available')
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'license_number')
    raw_id_fields = ('user',)

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('patient', 'doctor', 'appointment_date', 'status')
    list_filter = ('status', 'appointment_date', 'created_at')
    search_fields = ('patient__user__first_name', 'patient__user__last_name', 'doctor__user__first_name', 'doctor__user__last_name')
    raw_id_fields = ('patient', 'doctor')
    date_hierarchy = 'appointment_date'

@admin.register(MedicalRecord)
class MedicalRecordAdmin(admin.ModelAdmin):
    list_display = ('patient', 'doctor', 'diagnosis', 'record_date')
    list_filter = ('record_date', 'created_at')
    search_fields = ('patient__user__first_name', 'patient__user__last_name', 'diagnosis', 'treatment')
    raw_id_fields = ('patient', 'doctor')
    date_hierarchy = 'record_date'

@admin.register(Bed)
class BedAdmin(admin.ModelAdmin):
    list_display = ('bed_number', 'ward', 'status', 'patient')
    list_filter = ('status', 'ward')
    search_fields = ('bed_number', 'ward', 'patient__user__first_name', 'patient__user__last_name')
    raw_id_fields = ('patient',)

@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'available_quantity', 'total_quantity', 'location')
    list_filter = ('category', 'location')
    search_fields = ('name', 'category')

@admin.register(Billing)
class BillingAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'patient', 'total_amount', 'status', 'due_date', 'bill_type')
    list_filter = ('status', 'due_date', 'bill_type', 'created_at')
    search_fields = ('invoice_number', 'patient__user__first_name', 'patient__user__last_name', 'description')
    raw_id_fields = ('patient', 'appointment')
    date_hierarchy = 'due_date'
    readonly_fields = ('invoice_number', 'subtotal', 'tax_amount', 'total_amount', 'paid_amount', 'pending_amount')

@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'quantity', 'minimum_threshold', 'expiry_date')
    list_filter = ('category', 'expiry_date')
    search_fields = ('name', 'category', 'supplier')

@admin.register(EmergencyResponse)
class EmergencyResponseAdmin(admin.ModelAdmin):
    list_display = ('patient', 'description', 'status', 'priority', 'created_at')
    list_filter = ('status', 'priority', 'created_at')
    search_fields = ('patient__user__first_name', 'patient__user__last_name', 'description')
    raw_id_fields = ('patient',)
    date_hierarchy = 'created_at'
