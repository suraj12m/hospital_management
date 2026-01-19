# Smart Hospital Management System

A comprehensive full-stack web application for managing hospital operations with a stunning modern frontend and robust backend.

## Features

- **Patient Lifecycle Management**: Complete patient journey from registration to discharge
- **Appointment Scheduling & Queue Management**: Book and manage appointments with real-time queue tracking
- **Digital Medical Records (EHR)**: Secure electronic health records management
- **Real-Time Bed & Resource Tracking**: Monitor bed availability and medical resources
- **Billing & Payment Management**: Automated billing with online payment support
- **Emergency Response Coordination**: Quick resource allocation for emergencies
- **Predictive Patient Flow Analysis**: Analytics for optimizing staff and resources
- **Health Record Security & Privacy**: HIPAA-compliant data protection
- **Multi-Lingual Patient Interface**: Support for diverse patient backgrounds
- **Inventory Management**: Automated tracking of medical supplies

## Tech Stack

### Backend
- **Django** (Python web framework)
- **Django REST Framework** (API development)
- **PostgreSQL** (Database) - configured for production, SQLite for development
- **Token Authentication** with role-based access control

### Frontend
- **React.js** with modern hooks
- **Material-UI** for stunning, responsive design
- **Axios** for API communication
- **React Router** for navigation

## Quick Start

To run the Smart Hospital Management System locally:

1. **Clone the repository** (if not already done)
2. **Backend Setup**:
   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate  # On Windows
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py runserver
   ```
3. **Frontend Setup** (in a new terminal):
   ```bash
   cd frontend
   npm install
   npm start
   ```
4. **Access the application** at `http://localhost:3000`

### Detailed Installation & Setup

#### Prerequisites
- Python 3.8+
- Node.js 14+
- PostgreSQL (for production)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run migrations:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

5. Create a superuser:
   ```bash
   python manage.py createsuperuser
   ```

6. Run the development server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## Usage

1. Access the application at `http://localhost:3000`
2. Login with demo credentials:
   - Admin: admin/admin123
   - Doctor: doctor/doctor123
   - Patient: patient/patient123

## API Documentation

The backend provides RESTful APIs for all hospital operations:

- `/api/users/` - User management
- `/api/patients/` - Patient records
- `/api/doctors/` - Doctor profiles
- `/api/appointments/` - Appointment scheduling
- `/api/medical-records/` - Electronic health records
- `/api/beds/` - Bed management
- `/api/billings/` - Billing and payments
- `/api/inventory/` - Medical supplies
- `/api/emergencies/` - Emergency response
- `/api/dashboard/` - System statistics

## Security Features

- JWT token-based authentication
- Role-based access control (Admin, Doctor, Patient, Staff)
- CORS protection
- Data encryption for sensitive information
- Audit logging

## Production Deployment

1. Configure PostgreSQL database in `settings.py`
2. Set `DEBUG = False`
3. Configure static files serving
4. Set up proper CORS origins
5. Use a production WSGI server (e.g., Gunicorn)
6. Configure HTTPS

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue on GitHub.
