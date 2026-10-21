CREATE DATABASE IF NOT EXISTS school_management_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE school_management_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role ENUM('admin', 'teacher') NOT NULL DEFAULT 'teacher',
  phone VARCHAR(20) NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_role (role)
) ENGINE=InnoDB;

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  class_name VARCHAR(50) NOT NULL,
  section VARCHAR(10) NOT NULL,
  room_number VARCHAR(30) NULL,
  capacity INT NOT NULL DEFAULT 40,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_class_section (class_name, section)
) ENGINE=InnoDB;

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subject_code VARCHAR(30) NOT NULL UNIQUE,
  subject_name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_subjects_code (subject_code)
) ENGINE=InnoDB;

-- Teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  employee_id VARCHAR(50) NOT NULL UNIQUE,
  qualification VARCHAR(120) NOT NULL,
  specialization VARCHAR(100) NULL,
  hire_date DATE NOT NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_teachers_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_teachers_emp (employee_id)
) ENGINE=InnoDB;

-- Teacher assignments table
CREATE TABLE IF NOT EXISTS teacher_class_subject_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  class_id INT NOT NULL,
  subject_id INT NOT NULL,
  academic_year VARCHAR(20) NOT NULL DEFAULT '2025-2026',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tcsa_teacher FOREIGN KEY (teacher_id)
    REFERENCES teachers(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_tcsa_class FOREIGN KEY (class_id)
    REFERENCES classes(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_tcsa_subject FOREIGN KEY (subject_id)
    REFERENCES subjects(id) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY uq_teacher_assignment (teacher_id, class_id, subject_id, academic_year)
) ENGINE=InnoDB;

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admission_no VARCHAR(50) NOT NULL UNIQUE,
  full_name VARCHAR(100) NOT NULL,
  date_of_birth DATE NOT NULL,
  gender ENUM('Male', 'Female', 'Other') NOT NULL,
  class_id INT NOT NULL,
  guardian_name VARCHAR(100) NOT NULL,
  guardian_phone VARCHAR(20) NOT NULL,
  guardian_email VARCHAR(120) NULL,
  address TEXT NOT NULL,
  admission_date DATE NOT NULL,
  status ENUM('active', 'inactive', 'graduated') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_students_class FOREIGN KEY (class_id)
    REFERENCES classes(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_students_adm (admission_no),
  INDEX idx_students_class (class_id),
  INDEX idx_students_status (status)
) ENGINE=InnoDB;

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  class_id INT NOT NULL,
  date DATE NOT NULL,
  status ENUM('Present', 'Absent', 'Late') NOT NULL DEFAULT 'Present',
  remarks VARCHAR(255) NULL,
  recorded_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_attendance_student FOREIGN KEY (student_id)
    REFERENCES students(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_attendance_class FOREIGN KEY (class_id)
    REFERENCES classes(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_attendance_recorder FOREIGN KEY (recorded_by)
    REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  UNIQUE KEY uq_student_attendance_date (student_id, date),
  INDEX idx_attendance_date_class (date, class_id)
) ENGINE=InnoDB;

-- Examinations table
CREATE TABLE IF NOT EXISTS examinations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  exam_name VARCHAR(120) NOT NULL,
  class_id INT NOT NULL,
  subject_id INT NOT NULL,
  exam_date DATE NOT NULL,
  max_marks DECIMAL(5,2) NOT NULL DEFAULT 100.00,
  pass_marks DECIMAL(5,2) NOT NULL DEFAULT 40.00,
  academic_term VARCHAR(50) NOT NULL DEFAULT 'Term 1',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_exams_class FOREIGN KEY (class_id)
    REFERENCES classes(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_exams_subject FOREIGN KEY (subject_id)
    REFERENCES subjects(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_exams_class_date (class_id, exam_date)
) ENGINE=InnoDB;

-- Examination marks table
CREATE TABLE IF NOT EXISTS examination_marks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  exam_id INT NOT NULL,
  student_id INT NOT NULL,
  marks_obtained DECIMAL(5,2) NOT NULL,
  grade VARCHAR(5) NOT NULL,
  remarks VARCHAR(255) NULL,
  recorded_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_marks_exam FOREIGN KEY (exam_id)
    REFERENCES examinations(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_marks_student FOREIGN KEY (student_id)
    REFERENCES students(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_marks_recorder FOREIGN KEY (recorded_by)
    REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  UNIQUE KEY uq_exam_student (exam_id, student_id)
) ENGINE=InnoDB;

-- Student fees table
CREATE TABLE IF NOT EXISTS student_fees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  title VARCHAR(120) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  status ENUM('pending', 'partial', 'paid') NOT NULL DEFAULT 'pending',
  academic_year VARCHAR(20) NOT NULL DEFAULT '2025-2026',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_fees_student FOREIGN KEY (student_id)
    REFERENCES students(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_fees_status (status),
  INDEX idx_fees_due (due_date)
) ENGINE=InnoDB;

-- Fee payments table
CREATE TABLE IF NOT EXISTS fee_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fee_id INT NOT NULL,
  amount_paid DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method ENUM('Cash', 'Bank Transfer', 'Cheque', 'UPI') NOT NULL DEFAULT 'Cash',
  receipt_no VARCHAR(60) NOT NULL UNIQUE,
  notes TEXT NULL,
  collected_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_fee FOREIGN KEY (fee_id)
    REFERENCES student_fees(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_payments_collector FOREIGN KEY (collected_by)
    REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_payments_date (payment_date),
  INDEX idx_payments_receipt (receipt_no)
) ENGINE=InnoDB;

-- Activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  action VARCHAR(100) NOT NULL,
  details TEXT NULL,
  ip_address VARCHAR(45) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_activity_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_activity_created (created_at)
) ENGINE=InnoDB;
