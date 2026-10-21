# Entity Relationship Diagram (ERD)
## EduPulse - School Management System

This document outlines the normalized relational database architecture for the School Management System implemented in MySQL 8.0.

### 1. Mermaid Entity-Relationship Diagram

```mermaid
erDiagram
    USERS ||--o| TEACHERS : "has profile"
    USERS ||--o{ ATTENDANCE : "records"
    USERS ||--o{ EXAMINATION_MARKS : "records"
    USERS ||--o{ FEE_PAYMENTS : "collects"
    USERS ||--o{ ACTIVITY_LOGS : "triggers"

    CLASSES ||--o{ STUDENTS : "contains"
    CLASSES ||--o{ TEACHER_CLASS_SUBJECT_ASSIGNMENTS : "assigned to"
    CLASSES ||--o{ ATTENDANCE : "registers"
    CLASSES ||--o{ EXAMINATIONS : "hosts"

    SUBJECTS ||--o{ TEACHER_CLASS_SUBJECT_ASSIGNMENTS : "assigned to"
    SUBJECTS ||--o{ EXAMINATIONS : "tested in"

    TEACHERS ||--o{ TEACHER_CLASS_SUBJECT_ASSIGNMENTS : "teaches"

    STUDENTS ||--o{ ATTENDANCE : "attends"
    STUDENTS ||--o{ EXAMINATION_MARKS : "scores"
    STUDENTS ||--o{ STUDENT_FEES : "billed"

    EXAMINATIONS ||--o{ EXAMINATION_MARKS : "evaluates"

    STUDENT_FEES ||--o{ FEE_PAYMENTS : "settles"

    USERS {
        int id PK
        varchar email UK
        varchar password_hash
        varchar full_name
        enum role "admin, teacher"
        varchar phone
        enum status "active, inactive"
        timestamp created_at
    }

    TEACHERS {
        int id PK
        int user_id FK, UK
        varchar employee_id UK
        varchar qualification
        varchar specialization
        date hire_date
        enum status "active, inactive"
    }

    CLASSES {
        int id PK
        varchar class_name
        varchar section
        varchar room_number
        int capacity
    }

    SUBJECTS {
        int id PK
        varchar subject_code UK
        varchar subject_name
        text description
    }

    TEACHER_CLASS_SUBJECT_ASSIGNMENTS {
        int id PK
        int teacher_id FK
        int class_id FK
        int subject_id FK
        varchar academic_year
    }

    STUDENTS {
        int id PK
        varchar admission_no UK
        varchar full_name
        date date_of_birth
        enum gender "Male, Female, Other"
        int class_id FK
        varchar guardian_name
        varchar guardian_phone
        varchar guardian_email
        text address
        date admission_date
        enum status "active, inactive, graduated"
    }

    ATTENDANCE {
        int id PK
        int student_id FK
        int class_id FK
        date date
        enum status "Present, Absent, Late"
        varchar remarks
        int recorded_by FK
    }

    EXAMINATIONS {
        int id PK
        varchar exam_name
        int class_id FK
        int subject_id FK
        date exam_date
        decimal max_marks
        decimal pass_marks
        varchar academic_term
    }

    EXAMINATION_MARKS {
        int id PK
        int exam_id FK
        int student_id FK
        decimal marks_obtained
        varchar grade
        varchar remarks
        int recorded_by FK
    }

    STUDENT_FEES {
        int id PK
        int student_id FK
        varchar title
        decimal amount
        date due_date
        enum status "pending, partial, paid"
        varchar academic_year
    }

    FEE_PAYMENTS {
        int id PK
        int fee_id FK
        decimal amount_paid
        date payment_date
        enum payment_method "Cash, Bank Transfer, Cheque, UPI"
        varchar receipt_no UK
        text notes
        int collected_by FK
    }

    ACTIVITY_LOGS {
        int id PK
        int user_id FK
        varchar action
        text details
        varchar ip_address
        timestamp created_at
    }
```

---

### 2. Normalization Verification
- **1NF (First Normal Form)**: All column values are atomic. No multi-valued sets or comma-separated lists of classes or subjects in single columns.
- **2NF (Second Normal Form)**: Every non-key attribute is fully functionally dependent on the entire primary key. Junction tables (`teacher_class_subject_assignments`, `examination_marks`) separate compound associations.
- **3NF (Third Normal Form)**: Non-key attributes depend only on the primary key, eliminating transitive dependencies. For example, student details are not duplicated inside fee payment records; instead, `fee_payments` references `student_fees` which references `students`.
