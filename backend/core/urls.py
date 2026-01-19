from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, PatientViewSet, DoctorViewSet, AppointmentViewSet,
    MedicalRecordViewSet, PrescriptionViewSet, BedViewSet, ResourceViewSet, BillingViewSet,
    InventoryViewSet, EmergencyResponseViewSet, LoginView, DashboardView
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'patients', PatientViewSet)
router.register(r'doctors', DoctorViewSet)
router.register(r'appointments', AppointmentViewSet)
router.register(r'medical-records', MedicalRecordViewSet)
router.register(r'prescriptions', PrescriptionViewSet)
router.register(r'beds', BedViewSet)
router.register(r'resources', ResourceViewSet)
router.register(r'billings', BillingViewSet)
router.register(r'inventory', InventoryViewSet)
router.register(r'emergencies', EmergencyResponseViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/login/', LoginView.as_view(), name='login'),
    path('api/dashboard/', DashboardView.as_view(), name='dashboard'),
]
