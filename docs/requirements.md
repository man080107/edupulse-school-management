# Software Requirements Specification (SRS)
## EduPulse - School Management System

### 1. Introduction
The **EduPulse School Management System** is a full-stack academic administration platform developed for secondary schools and educational institutions. It streamlines daily administrative routines, faculty course assignments, student enrollment dossiers, daily class attendance registry, examination performance evaluations, and fee payment tracking.

---

### 2. User Roles and Personas

#### 2.1 Administrator (System & Academic Admin)
- Full system authority over academic entities.
- Enrolls, edits, and manages student records.
- Registers faculty teachers and provisions user accounts.
- Defines classes, sections, and curriculum subjects.
- Assigns faculty teachers to specific class sections and subjects.
- Allocates student fee invoices, records payments, and issues receipts.
- Views school-wide statistics, audit trails, and exports analytical reports (CSV/print).

#### 2.2 Teacher (Faculty Instructor)
- Authorized access to assigned classes and students.
- Marks and updates daily attendance for assigned class sections.
- Enters and evaluates examination marks for assigned subjects.
- Views student academic dossiers and performance reports.
- Restricted from financial fee ledgers, user provisioning, or curriculum restructuring.

---

### 3. Functional Requirements

#### FR-1: Authentication & RBAC
- **FR-1.1**: Secure user login using institutional email and password.
- **FR-1.2**: Passwords hashed using `bcrypt` with salt rounds = 10.
- **FR-1.3**: Stateless session tokens issued via JSON Web Tokens (JWT) signed with HMAC-SHA256.
- **FR-1.4**: Role-based access control middleware enforcing administrative and faculty boundaries.
- **FR-1.5**: Password change workflow verifying current password.

#### FR-2: Student Administration
- **FR-2.1**: Student enrollment with unique admission numbers (`ADM-YYYY-XXX`).
- **FR-2.2**: Record student full name, DOB, gender, guardian contact information, and residential address.
- **FR-2.3**: Filter students by class section and enrollment status (`active`, `inactive`, `graduated`).
- **FR-2.4**: Student profile dossier combining attendance statistics and outstanding fee balances.

#### FR-3: Faculty & Teacher Management
- **FR-3.1**: Faculty appointment with unique employee ID (`TCH-XXXX`).
- **FR-3.2**: Automatic user account generation for teachers.
- **FR-3.3**: Portfolio view displaying all active class sections and subjects taught by each teacher.

#### FR-4: Classes & Subjects
- **FR-4.1**: Multi-section class creation with classroom assignment and seating capacity limits.
- **FR-4.2**: Subject definitions with unique codes (`MATH-10`, `CS-10`, etc.).
- **FR-4.3**: Relational junction preventing duplicate teacher-class-subject allocations.

#### FR-5: Daily Attendance Registry
- **FR-5.1**: Daily class roster attendance marking (`Present`, `Late`, `Absent`).
- **FR-5.2**: Unique constraint on `(student_id, date)` preventing duplicate entries.
- **FR-5.3**: Helper controls for 1-click batch marking ("Mark All Present", "Mark All Absent").
- **FR-5.4**: Daily school-wide percentage calculation and visual trend charts.

#### FR-6: Examinations & Evaluation
- **FR-6.1**: Schedule exams with maximum marks and passing threshold.
- **FR-6.2**: Marks entry with boundary validation ($0 \le \text{marks} \le \text{max\_marks}$).
- **FR-6.3**: Documented standard grading scale ($A+, A, B, C, D, F$).
- **FR-6.4**: Printable academic performance dossier / report card.

#### FR-7: Fee Management
- **FR-7.1**: Fee invoice allocation to an individual student or batch class.
- **FR-7.2**: Transaction-safe payment collection recording date, payment mode, and receipt number.
- **FR-7.3**: Real-time balance derivation ($\text{balance} = \text{obligation} - \sum \text{payments}$).
- **FR-7.4**: Printable official payment receipt with cashier authorization line.

#### FR-8: Analytical Reports & Data Export
- **FR-8.1**: Enrollment occupancy and gender distribution report.
- **FR-8.2**: Attendance percentage report with date range filters.
- **FR-8.3**: Examination pass rate and average score breakdown.
- **FR-8.4**: Fee collection vs. defaulter balance report.
- **FR-8.5**: Export actual database records to CSV format.

---

### 4. Non-Functional Requirements

- **Security**: SQL injection prevention via parameterized queries, JWT expiration, password hashing, and CORS origin restriction.
- **Performance**: MySQL connection pooling, database indexes on `admission_no`, `employee_id`, `(student_id, date)`, and `(exam_id, student_id)`.
- **Reliability**: Atomic MySQL transactions for financial payment logging and multi-record bulk inserts.
- **Usability**: Responsive light SaaS design system with accessible contrast, Lucide icons, and print media stylesheets (`@media print`).
