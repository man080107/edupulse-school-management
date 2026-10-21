-- Sample Seed Data
-- Test logins: admin@school.com / admin123, teacher@school.com / teacher123

USE school_management_db;

-- Clear existing data
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE activity_logs;
TRUNCATE TABLE fee_payments;
TRUNCATE TABLE student_fees;
TRUNCATE TABLE examination_marks;
TRUNCATE TABLE examinations;
TRUNCATE TABLE attendance;
TRUNCATE TABLE students;
TRUNCATE TABLE teacher_class_subject_assignments;
TRUNCATE TABLE teachers;
TRUNCATE TABLE subjects;
TRUNCATE TABLE classes;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- Users
INSERT INTO users (id, email, password_hash, full_name, role, phone, status) VALUES
(1, 'admin@school.com', '$2a$10$YaBYrUzABPv7K8Kr66Y2IOl3XgaKSlDQvh.e3wPSjvnCJYFW/boby', 'Dr. Robert Harrison', 'admin', '+1-555-0100', 'active'),
(2, 'teacher@school.com', '$2a$10$uEF7ZiVED9.DCbWBkgq3z.5bzjPN0gdsWwgbLVMlsMpmJjED2wOvy', 'Prof. Alexander Clark', 'teacher', '+1-555-0101', 'active'),
(3, 'sarah.smith@school.com', '$2a$10$uEF7ZiVED9.DCbWBkgq3z.5bzjPN0gdsWwgbLVMlsMpmJjED2wOvy', 'Ms. Sarah Smith', 'teacher', '+1-555-0102', 'active'),
(4, 'david.wilson@school.com', '$2a$10$uEF7ZiVED9.DCbWBkgq3z.5bzjPN0gdsWwgbLVMlsMpmJjED2wOvy', 'Mr. David Wilson', 'teacher', '+1-555-0103', 'active');

-- Classes
INSERT INTO classes (id, class_name, section, room_number, capacity) VALUES
(1, 'Grade 9', 'A', 'Room 101', 35),
(2, 'Grade 9', 'B', 'Room 102', 35),
(3, 'Grade 10', 'A', 'Room 201', 40),
(4, 'Grade 10', 'B', 'Room 202', 40),
(5, 'Grade 11', 'A', 'Room 301', 30);

-- Subjects
INSERT INTO subjects (id, subject_code, subject_name, description) VALUES
(1, 'MATH-10', 'Advanced Mathematics', 'Algebra, Geometry, Trigonometry and introductory Calculus.'),
(2, 'SCI-10', 'Physical Sciences', 'Physics fundamentals, Chemistry principles and lab work.'),
(3, 'ENG-10', 'English Language & Lit', 'Critical reading, essay composition, and literary analysis.'),
(4, 'CS-10', 'Computer Science & Coding', 'Algorithms, Data Structures, and Web Development basics.'),
(5, 'HIST-10', 'World History', 'Global civilizations, revolutions, and modern geopolitics.');

-- Teachers
INSERT INTO teachers (id, user_id, employee_id, qualification, specialization, hire_date, status) VALUES
(1, 2, 'TCH-1001', 'M.Sc. Mathematics, B.Ed', 'Pure Mathematics & Statistics', '2021-08-15', 'active'),
(2, 3, 'TCH-1002', 'M.Sc. Physics, Ph.D', 'Applied Physics & Quantum Optics', '2022-01-10', 'active'),
(3, 4, 'TCH-1003', 'M.Tech Computer Science', 'Software Engineering & Databases', '2023-06-01', 'active');

-- Teacher assignments
INSERT INTO teacher_class_subject_assignments (id, teacher_id, class_id, subject_id, academic_year) VALUES
(1, 1, 3, 1, '2025-2026'),
(2, 1, 4, 1, '2025-2026'),
(3, 1, 1, 1, '2025-2026'),
(4, 2, 3, 2, '2025-2026'),
(5, 2, 1, 2, '2025-2026'),
(6, 3, 3, 4, '2025-2026'),
(7, 3, 5, 4, '2025-2026');

-- Students
INSERT INTO students (id, admission_no, full_name, date_of_birth, gender, class_id, guardian_name, guardian_phone, guardian_email, address, admission_date, status) VALUES
(1, 'ADM-2025-001', 'Liam James Anderson', '2010-04-12', 'Male', 3, 'Thomas Anderson', '+1-555-0201', 'thomas.anderson@example.com', '742 Evergreen Terrace, Springfield', '2025-06-01', 'active'),
(2, 'ADM-2025-002', 'Emma Sophia Martinez', '2010-08-23', 'Female', 3, 'Elena Martinez', '+1-555-0202', 'elena.martinez@example.com', '124 Conch Street, Pacifica', '2025-06-01', 'active'),
(3, 'ADM-2025-003', 'Noah Benjamin Taylor', '2010-01-15', 'Male', 3, 'Samuel Taylor', '+1-555-0203', 'samuel.taylor@example.com', '45 Elm Street, Riverdale', '2025-06-02', 'active'),
(4, 'ADM-2025-004', 'Olivia Grace Thomas', '2010-11-30', 'Female', 3, 'Rachel Thomas', '+1-555-0204', 'rachel.thomas@example.com', '88 Oak Avenue, Maplewood', '2025-06-02', 'active'),
(5, 'ADM-2025-005', 'Ethan Alexander White', '2010-06-18', 'Male', 3, 'Jonathan White', '+1-555-0205', 'j.white@example.com', '19 Pine Lane, Summit', '2025-06-03', 'active'),
(6, 'ADM-2025-006', 'Ava Elizabeth Brown', '2010-09-05', 'Female', 3, 'Laura Brown', '+1-555-0206', 'laura.brown@example.com', '302 Birch Blvd, Brookside', '2025-06-03', 'active'),
(7, 'ADM-2025-007', 'Lucas William Harris', '2011-03-22', 'Male', 1, 'Mark Harris', '+1-555-0207', 'mark.harris@example.com', '512 Cedar Way, Lakeside', '2025-06-05', 'active'),
(8, 'ADM-2025-008', 'Mia Isabella Davis', '2011-07-14', 'Female', 1, 'Grace Davis', '+1-555-0208', 'grace.davis@example.com', '62 Magnolia Dr, Greenview', '2025-06-05', 'active'),
(9, 'ADM-2025-009', 'Mason Daniel Miller', '2011-02-09', 'Male', 2, 'Daniel Miller', '+1-555-0209', 'd.miller@example.com', '78 Willow Court, Rosewood', '2025-06-06', 'active'),
(10, 'ADM-2025-010', 'Harper Evelyn Wilson', '2010-05-27', 'Female', 4, 'Sarah Wilson', '+1-555-0210', 'sarah.w@example.com', '91 Chestnut St, Fairmont', '2025-06-06', 'active'),
(11, 'ADM-2025-011', 'Benjamin Jack Moore', '2010-10-10', 'Male', 4, 'Jack Moore', '+1-555-0211', 'jack.moore@example.com', '104 Cypress Ave, Sunnyvale', '2025-06-07', 'active'),
(12, 'ADM-2025-012', 'Charlotte Rose Taylor', '2009-12-04', 'Female', 5, 'Paul Taylor', '+1-555-0212', 'paul.taylor@example.com', '215 Redwood Rd, Bayview', '2025-06-08', 'active');

-- Attendance records
INSERT INTO attendance (student_id, class_id, date, status, remarks, recorded_by) VALUES
(1, 3, CURRENT_DATE(), 'Present', 'On time', 2),
(2, 3, CURRENT_DATE(), 'Present', 'On time', 2),
(3, 3, CURRENT_DATE(), 'Late', 'Late by 15 mins (traffic)', 2),
(4, 3, CURRENT_DATE(), 'Present', 'On time', 2),
(5, 3, CURRENT_DATE(), 'Absent', 'Excused medical leave', 2),
(6, 3, CURRENT_DATE(), 'Present', 'On time', 2),
(7, 1, CURRENT_DATE(), 'Present', 'On time', 2),
(8, 1, CURRENT_DATE(), 'Present', 'On time', 2),
(1, 3, DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY), 'Present', NULL, 2),
(2, 3, DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY), 'Present', NULL, 2),
(3, 3, DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY), 'Present', NULL, 2),
(4, 3, DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY), 'Present', NULL, 2),
(5, 3, DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY), 'Present', NULL, 2),
(6, 3, DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY), 'Late', 'Late transit', 2),
(1, 3, DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY), 'Present', NULL, 2),
(2, 3, DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY), 'Absent', 'Family event', 2),
(3, 3, DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY), 'Present', NULL, 2),
(4, 3, DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY), 'Present', NULL, 2),
(5, 3, DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY), 'Present', NULL, 2),
(6, 3, DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY), 'Present', NULL, 2);

-- Examinations
INSERT INTO examinations (id, exam_name, class_id, subject_id, exam_date, max_marks, pass_marks, academic_term) VALUES
(1, 'Mid-Term Examination 2026', 3, 1, '2026-03-10', 100.00, 40.00, 'Term 1'),
(2, 'Mid-Term Examination 2026', 3, 4, '2026-03-12', 100.00, 40.00, 'Term 1'),
(3, 'First Unit Test 2026', 1, 1, '2026-02-15', 50.00, 20.00, 'Term 1');

-- Examination marks
INSERT INTO examination_marks (exam_id, student_id, marks_obtained, grade, remarks, recorded_by) VALUES
(1, 1, 94.50, 'A+', 'Good problem solving', 2),
(1, 2, 88.00, 'A', 'Strong performance', 2),
(1, 3, 76.50, 'B', 'Good effort', 2),
(1, 4, 91.00, 'A+', 'Excellent performance', 2),
(1, 5, 58.00, 'C', 'Needs improvement', 2),
(1, 6, 82.50, 'A', 'Good performance', 2),
(2, 1, 98.00, 'A+', 'Excellent understanding', 4),
(2, 2, 92.00, 'A+', 'Very good', 4),
(2, 3, 68.00, 'C', 'Satisfactory', 4),
(2, 4, 85.50, 'A', 'Good performance', 4),
(2, 5, 74.00, 'B', 'Good understanding', 4),
(2, 6, 89.00, 'A', 'Good practical work', 4);

-- Student fees
INSERT INTO student_fees (id, student_id, title, amount, due_date, status, academic_year) VALUES
(1, 1, 'Tuition Fee - Term 1', 1200.00, '2026-04-15', 'paid', '2025-2026'),
(2, 2, 'Tuition Fee - Term 1', 1200.00, '2026-04-15', 'partial', '2025-2026'),
(3, 3, 'Tuition Fee - Term 1', 1200.00, '2026-04-15', 'pending', '2025-2026'),
(4, 4, 'Tuition Fee - Term 1', 1200.00, '2026-04-15', 'paid', '2025-2026'),
(5, 5, 'Tuition Fee - Term 1', 1200.00, '2026-04-15', 'pending', '2025-2026'),
(6, 6, 'Tuition Fee - Term 1', 1200.00, '2026-04-15', 'partial', '2025-2026'),
(7, 1, 'Laboratory & Tech Fee', 350.00, '2026-05-01', 'paid', '2025-2026'),
(8, 2, 'Laboratory & Tech Fee', 350.00, '2026-05-01', 'pending', '2025-2026');

-- Fee payments
INSERT INTO fee_payments (id, fee_id, amount_paid, payment_date, payment_method, receipt_no, notes, collected_by) VALUES
(1, 1, 1200.00, '2026-02-10', 'Bank Transfer', 'REC-2026-0001', 'Full payment for Term 1 tuition', 1),
(2, 2, 700.00, '2026-02-15', 'Cash', 'REC-2026-0002', 'First installment received', 1),
(3, 4, 1200.00, '2026-02-18', 'UPI', 'REC-2026-0003', 'Online payment via UPI transfer', 1),
(4, 6, 600.00, '2026-03-01', 'Cheque', 'REC-2026-0004', 'Cheque #94821 cleared successfully', 1),
(5, 7, 350.00, '2026-03-05', 'Cash', 'REC-2026-0005', 'Annual lab subscription fee', 1);

-- Activity logs
INSERT INTO activity_logs (user_id, action, details, ip_address) VALUES
(1, 'DATABASE_INITIALIZATION', 'Initial school schema and tables established successfully.', '127.0.0.1'),
(1, 'USER_AUTHENTICATED', 'Administrator Dr. Robert Harrison logged into system.', '127.0.0.1'),
(2, 'ATTENDANCE_RECORDED', 'Attendance marked for Grade 10 - Section A (6 students recorded).', '127.0.0.1'),
(1, 'FEE_PAYMENT_COLLECTED', 'Collected $700.00 for Student Emma Sophia Martinez (REC-2026-0002).', '127.0.0.1'),
(4, 'EXAM_MARKS_SUBMITTED', 'Submitted marks for Mid-Term Examination 2026 - CS-10.', '127.0.0.1');
