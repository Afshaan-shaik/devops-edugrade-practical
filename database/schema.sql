-- =========================================================================
-- EduGrade DevOps - MySQL Database Schema & Seed Data
-- =========================================================================

-- 1. Create Database if it doesn't already exist
CREATE DATABASE IF NOT EXISTS edugrade_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE edugrade_db;

-- 2. Drop existing tables if recreating (order respects foreign keys)
DROP TABLE IF EXISTS evaluation_subjects;
DROP TABLE IF EXISTS evaluations;
DROP TABLE IF EXISTS students;

-- 3. Students Master Table
CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  roll_no VARCHAR(50) NOT NULL UNIQUE,
  course VARCHAR(100) DEFAULT 'MCA',
  semester VARCHAR(50) DEFAULT 'Semester 4',
  academic_year VARCHAR(50) DEFAULT '2025-2026',
  institution VARCHAR(255) DEFAULT 'KLE Society\'s P. C. Jabin Science College',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_roll_no (roll_no)
) ENGINE=InnoDB;

-- 4. Evaluations Table
CREATE TABLE evaluations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  total_marks INT NOT NULL,
  max_marks INT NOT NULL,
  percentage DECIMAL(5, 2) NOT NULL,
  sgpa DECIMAL(4, 2) NOT NULL,
  grade VARCHAR(5) NOT NULL,
  result_status ENUM('PASSED', 'FAILED') NOT NULL,
  total_credits INT NOT NULL DEFAULT 0,
  evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  INDEX idx_student_eval (student_id)
) ENGINE=InnoDB;

-- 5. Evaluation Subjects Breakdown Table
CREATE TABLE evaluation_subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  evaluation_id INT NOT NULL,
  subject_name VARCHAR(150) NOT NULL,
  subject_code VARCHAR(50) DEFAULT 'SUB-01',
  marks INT NOT NULL,
  max_marks INT NOT NULL DEFAULT 100,
  credits INT NOT NULL DEFAULT 4,
  grade VARCHAR(5) NOT NULL,
  grade_point INT NOT NULL,
  FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE,
  INDEX idx_eval_sub (evaluation_id)
) ENGINE=InnoDB;

-- 6. Comprehensive Student Report View
CREATE OR REPLACE VIEW v_student_report_card AS
SELECT 
  s.id AS student_id,
  s.full_name,
  s.roll_no,
  s.course,
  s.semester,
  s.academic_year,
  s.institution,
  e.id AS evaluation_id,
  e.total_marks,
  e.max_marks,
  e.percentage,
  e.sgpa,
  e.grade,
  e.result_status,
  e.total_credits,
  e.evaluated_at
FROM students s
JOIN evaluations e ON s.id = e.student_id
ORDER BY e.evaluated_at DESC;

-- 7. Sample Demonstration Seed Data
INSERT INTO students (full_name, roll_no, course, semester, academic_year, institution) VALUES
('Afshaan Shaik', 'MCA202401', 'MCA', 'Semester 4', '2025-2026', 'KLE Society\'s P. C. Jabin Science College'),
('Rahul Verma', 'MCA202402', 'MCA', 'Semester 4', '2025-2026', 'KLE Society\'s P. C. Jabin Science College'),
('Priya Sharma', 'MCA202403', 'MCA', 'Semester 4', '2025-2026', 'KLE Society\'s P. C. Jabin Science College');

-- Insert Evaluations for Sample Students
INSERT INTO evaluations (student_id, total_marks, max_marks, percentage, sgpa, grade, result_status, total_credits) VALUES
(1, 460, 500, 92.00, 10.00, 'O', 'PASSED', 20),
(2, 410, 500, 82.00, 9.00, 'A+', 'PASSED', 20),
(3, 355, 500, 71.00, 8.00, 'A', 'PASSED', 20);

-- Insert Subject Breakdown for Afshaan Shaik (Evaluation ID 1)
INSERT INTO evaluation_subjects (evaluation_id, subject_name, subject_code, marks, max_marks, credits, grade, grade_point) VALUES
(1, 'Cloud Computing & DevOps', 'MCA-401', 95, 100, 4, 'O', 10),
(1, 'Enterprise Software Architecture', 'MCA-402', 90, 100, 4, 'O', 10),
(1, 'Machine Learning & Big Data', 'MCA-403', 92, 100, 4, 'O', 10),
(1, 'Information & Cyber Security', 'MCA-404', 88, 100, 4, 'A+', 9),
(1, 'Major Project & Viva', 'MCA-405', 95, 100, 4, 'O', 10);

-- =========================================================================
-- USEFUL QUERIES TO RUN TO VERIFY:
-- 1. Show all evaluated students:
--    SELECT * FROM v_student_report_card;
--
-- 2. Show subject marks breakdown for student:
--    SELECT s.full_name, sub.subject_name, sub.marks, sub.max_marks, sub.grade, sub.grade_point
--    FROM students s
--    JOIN evaluations e ON s.id = e.student_id
--    JOIN evaluation_subjects sub ON e.id = sub.evaluation_id
--    WHERE s.roll_no = 'MCA202401';
-- =========================================================================
