# EduPulse - School Management System

EduPulse is a full-stack web application designed for school administration and academic management. The system helps manage student admissions, teacher allocations, daily attendance, examination grading, and fee payments with role-based access control for administrators and teachers.

---

## Features

- **Authentication & Roles**:
  - Secure login with bcrypt password hashing and JWT authentication.
  - Role-Based Access Control (Admin and Teacher).

- **Dashboard**:
  - Overview metrics for students, teachers, classes, attendance, and fee status.
  - Visual charts for attendance trends and student class distribution.
  - Recent admissions list and activity logs.

- **Student Management**:
  - Student admission registration with auto-generated admission numbers.
  - Search, filter by class and status, and view detailed student profiles.

- **Teacher Management**:
  - Faculty directory with employee IDs, qualifications, and contact details.
  - Class and subject assignments mapping.

- **Classes & Curriculum**:
  - Class and section management with seating capacity tracking.
  - Subject catalog with subject codes.

- **Attendance Tracking**:
  - Daily class attendance marking (Present, Absent, Late).
  - Quick actions (Mark All Present / Mark All Absent).
  - Daily school-wide attendance summary.

- **Examinations & Grades**:
  - Schedule exams with maximum marks and passing marks.
  - Marks entry with automatic grade calculation (A+, A, B, C, D, F).
  - Printable student report card generator.

- **Fee Management**:
  - Fee invoice allocation by student or class.
  - Payment collection (Cash, Bank Transfer, Cheque, UPI) with balance tracking.
  - Printable payment receipts.

- **Reports & Export**:
  - Academic and financial summary reports.
  - Export reports to CSV.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React, Vite |
| **Styling** | Vanilla CSS (CSS Variables) |
| **Icons & Charts** | Lucide React, Recharts |
| **Backend** | Node.js, Express.js |
| **Database** | MySQL 8.0 (`mysql2/promise`) |
| **Authentication** | JSON Web Tokens (JWT), bcryptjs |

---

## Project Structure

```
FSD 2026/
├── client/                     # Frontend React application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── context/            # AuthContext and ToastContext
│   │   ├── pages/              # Page views (Dashboard, Students, etc.)
│   │   ├── services/           # Axios API service
│   │   ├── styles/             # CSS stylesheets
│   │   ├── App.jsx             # Root layout and navigation
│   │   └── main.jsx            # Entry point
│   ├── package.json
│   └── vite.config.js
├── server/                     # Backend Express REST API
│   ├── src/
│   │   ├── config/             # Database connection pool (db.js)
│   │   ├── controllers/        # Route controllers
│   │   ├── middleware/         # Auth, RBAC, error handling
│   │   ├── routes/             # API route endpoints
│   │   ├── app.js              # Express app configuration
│   │   └── server.js           # Server entry point
│   ├── .env                    # Environment configuration
│   ├── .env.example
│   └── package.json
├── database/                   # SQL scripts and setup utilities
│   ├── schema.sql              # Database table definitions
│   ├── seed.sql                # Sample initial data
│   ├── init.js                 # Database setup script
│   └── seed.js                 # Database seed script
├── docs/                       # Project documentation
│   ├── requirements.md         # Software Requirements Specification (SRS)
│   ├── er-diagram.md           # Database ER diagram
│   └── api-documentation.md    # API endpoints reference
└── README.md
```

---

## Setup and Installation

### 1. Prerequisites
- Node.js (v18+)
- MySQL Server 8.0 running on port 3306

### 2. Configure Environment Variables
In `server/.env`, set your MySQL credentials:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=school_management_db

JWT_SECRET=super_secret_jwt_key_school_management_2026_secure
JWT_EXPIRES_IN=24h
CLIENT_URL=http://localhost:5173
```

### 3. Setup Database
Run the following commands from the `server` directory:

```bash
cd server
npm run db:init   # Creates database and tables
npm run db:seed   # Inserts sample records
```

### 4. Run the Backend Server
```bash
cd server
npm start
# Server runs on http://localhost:5000
```

### 5. Run the Frontend Client
In a separate terminal:

```bash
cd client
npm run dev
# Application opens at http://localhost:5173
```

---

## Default Login Accounts

| Role | Email | Password | Access |
|---|---|---|---|
| **Admin** | `admin@school.com` | `admin123` | Full administrative control |
| **Teacher** | `teacher@school.com` | `teacher123` | Assigned classes, attendance, marks |

---

## Project Documentation

Detailed documentation is available in the `docs/` folder:
- [Requirements (SRS)](docs/requirements.md)
- [Database ER Diagram](docs/er-diagram.md)
- [API Documentation](docs/api-documentation.md)

---

## Deployment on Vercel

1. Import this repository into [Vercel](https://vercel.com/new).
2. The root `vercel.json` automatically configures Vite build and output directory (`client/dist`).
3. (Optional) In your Vercel Project Settings > Environment Variables, add:
   - `VITE_API_URL`: Your live backend API URL (e.g., `https://your-backend.railway.app/api`).

