-- =======================================================
-- STUDENT PLANNER - SUBJECT SYNCHRONIZATION MODULE
-- =======================================================

USE `student_planner`;

CREATE TABLE IF NOT EXISTS `subjects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `subject_code` VARCHAR(50) NOT NULL UNIQUE,
  `subject_name` VARCHAR(255) NOT NULL,
  `credits` INT NOT NULL DEFAULT 3,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample data (optional)
INSERT IGNORE INTO `subjects` (`subject_code`, `subject_name`, `credits`) VALUES
  ('CS101', 'Introduction to Programming', 3),
  ('CS201', 'Data Structures and Algorithms', 4),
  ('CS301', 'Database Systems', 3),
  ('CS302', 'Software Engineering', 3),
  ('MATH101', 'Calculus I', 4),
  ('ENG101', 'Academic English', 2);
