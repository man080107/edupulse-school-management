# REST API Reference Documentation
## EduPulse - School Management System API

**Base URL**: `http://localhost:5000/api`  
**Authentication Header**: `Authorization: Bearer <JWT_TOKEN>`

---

### 1. Authentication Endpoints

#### `POST /auth/login`
Authenticates a user and issues a JWT token.
- **Access**: Public (Rate-limited to 20 requests / 15 mins)
- **Request Body**:
```json
{
  "email": "admin@school.com",
  "password": "admin123"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Login successful.",
  "token": "eyJhbGciOi...",
  "user": {
    "id": 1,
    "email": "admin@school.com",
    "fullName": "Dr. Robert Harrison",
    "role": "admin",
    "teacherId": null
  }
}
```

#### `GET /auth/profile`
Retrieves authenticated user details.
- **Access**: Authenticated (`admin`, `teacher`)

#### `POST /auth/change-password`
Changes current user password.
- **Access**: Authenticated

---

### 2. Dashboard Endpoints

#### `GET /dashboard/stats`
Returns aggregated live metrics from MySQL.
- **Access**: Authenticated
- **Response**:
```json
{
  "success": true,
  "stats": {
    "totalStudents": 12,
    "totalTeachers": 3,
    "totalClasses": 5,
    "todayAttendancePercent": 88,
    "pendingFeeAmount": 1950.00,
    "totalFeesObligated": 9900.00,
    "totalFeesCollected": 4050.00
  },
  "classDistribution": [...],
  "attendanceTrend": [...],
  "recentAdmissions": [...],
  "recentActivities": [...]
}
```

---

### 3. Student Management Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/students` | Admin, Teacher | List students with search, class filter, pagination |
| `GET` | `/students/:id` | Admin, Teacher | Student dossier with attendance & fee summary |
| `POST` | `/students` | Admin | Admit a new student |
| `PUT` | `/students/:id` | Admin | Update student details |
| `DELETE` | `/students/:id` | Admin | Delete student record |

---

### 4. Faculty & Teacher Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/teachers` | Admin, Teacher | List faculty teachers |
| `GET` | `/teachers/:id` | Admin, Teacher | Teacher profile with assigned classes & subjects |
| `POST` | `/teachers` | Admin | Register new teacher & create user account |
| `PUT` | `/teachers/:id` | Admin | Update teacher record |
| `DELETE` | `/teachers/:id` | Admin | Delete teacher and user login |

---

### 5. Classes & Curriculum Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/classes` | Admin, Teacher | List classes with occupancy & room |
| `GET` | `/classes/:id/students` | Admin, Teacher | Enrolled students roster |
| `POST` | `/classes` | Admin | Create class section |
| `PUT` | `/classes/:id` | Admin | Update class details |
| `DELETE` | `/classes/:id` | Admin | Delete class (prevented if students enrolled) |
| `GET` | `/subjects` | Admin, Teacher | List subjects catalog |
| `POST` | `/subjects` | Admin | Add new subject |
| `GET` | `/assignments` | Admin, Teacher | List faculty class-subject assignments |
| `POST` | `/assignments` | Admin | Assign teacher to class & subject |
| `DELETE` | `/assignments/:id` | Admin | Remove faculty assignment |

---

### 6. Attendance Endpoints

#### `GET /attendance`
Fetches class attendance sheet for a specific date.
- **Query Params**: `classId`, `date`
- **Access**: Admin, Teacher (Teacher restricted to assigned classes)

#### `POST /attendance`
Saves or batch-updates daily attendance records.
- **Request Body**:
```json
{
  "classId": 3,
  "date": "2026-10-13",
  "records": [
    { "student_id": 1, "status": "Present", "remarks": "On time" },
    { "student_id": 2, "status": "Absent", "remarks": "Medical leave" }
  ]
}
```

#### `GET /attendance/summary/daily`
School-wide attendance breakdown by class.

---

### 7. Examinations & Marks Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/exams` | Admin, Teacher | List scheduled examinations |
| `POST` | `/exams` | Admin | Schedule new examination |
| `GET` | `/exams/:examId/marks` | Admin, Teacher | Get marks evaluation sheet |
| `POST` | `/exams/:examId/marks` | Admin, Teacher | Save student exam marks |
| `GET` | `/exams/student/:studentId/report-card` | Admin, Teacher | Official printable student report card |
| `DELETE` | `/exams/:examId` | Admin | Delete examination |

---

### 8. Fee Management Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/fees` | Admin | List fee obligations with payment summary |
| `POST` | `/fees/allocate` | Admin | Allocate fee invoice to student or class |
| `POST` | `/fees/pay` | Admin | Record payment with transaction & receipt |
| `GET` | `/fees/receipt/:receiptNo` | Admin | Printable official payment receipt |
| `GET` | `/fees/student/:studentId` | Admin | Student fee invoice and payment history |

---

### 9. Reports & Exports Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/reports/enrollment` | Admin, Teacher | Enrollment and capacity report |
| `GET` | `/reports/attendance` | Admin, Teacher | Attendance rate report with date filter |
| `GET` | `/reports/exams` | Admin, Teacher | Pass percentage and score breakdown |
| `GET` | `/reports/fees` | Admin | Outstanding fees and defaulter ledger |
| `GET` | `/reports/export-csv` | Admin, Teacher | Real database CSV download (`type=students/attendance/fees`) |
