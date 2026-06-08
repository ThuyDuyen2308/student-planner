-- =======================================================
-- STUDENT PLANNER DATABASE EXPORT & INITIALIZATION SCRIPT
-- =======================================================
-- Hướng dẫn nhập (Import) vào MySQL / phpMyAdmin:
-- 1. Mở phpMyAdmin (thường là http://localhost/phpmyadmin)
-- 2. Tạo cơ sở dữ liệu mới tên là `student_planner` (hoặc để script tự tạo)
-- 3. Chọn tab "Import" (Nhập) -> Chọn file `database.sql` này -> Bấm "Go" (Thực hiện)
-- =======================================================

CREATE DATABASE IF NOT EXISTS `student_planner` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `student_planner`;

-- -------------------------------------------------------
-- 1. BẢNG NGƯỜI DÙNG (users)
-- Lưu trữ thông tin tài khoản đăng nhập của sinh viên
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- 2. BẢNG MÔN HỌC (subjects)
-- Lưu trữ danh sách các môn học, số tín chỉ và điểm số GPA
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `subjects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `credit` INT NOT NULL DEFAULT 3,
  `score` DECIMAL(4,2) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- 3. BẢNG LỊCH HỌC / THỜI KHÓA BIỂU (schedules)
-- Lưu trữ thông tin ngày học, giờ học và phòng học
-- Có ràng buộc kiểm tra trùng lịch được quản lý tại tầng API backend
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `schedules` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `subject_id` INT NOT NULL,
  `day_of_week` ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `room` VARCHAR(100) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =======================================================
-- MẪU DỮ LIỆU THỬ NGHIỆM (SAMPLE DATA)
-- Bạn có thể bỏ comment phần này nếu muốn chèn sẵn dữ liệu mẫu
-- =======================================================

/*
-- Chèn tài khoản mẫu (mật khẩu đã được mã hóa bcrypt của '123456')
INSERT INTO `users` (`id`, `username`, `password`) VALUES
(1, 'sinhvien_demo', '$2b$10$wE16L3TjYd1aVvpxoFwDKe79N03N6zU5oA4YtD9kC2h1t1eQO8sC6');

-- Chèn các môn học mẫu cho sinh viên demo (id: 1)
INSERT INTO `subjects` (`id`, `user_id`, `name`, `credit`, `score`) VALUES
(1, 1, 'Toán Rời Rạc', 3, 9.0),
(2, 1, 'Cấu Trúc Dữ Liệu & Giải Thuật', 4, 8.5),
(3, 1, 'Lập Trình Web', 3, 9.5);

-- Chèn lịch học mẫu tương ứng
INSERT INTO `schedules` (`user_id`, `subject_id`, `day_of_week`, `start_time`, `end_time`, `room`) VALUES
(1, 1, 'Monday', '08:00:00', '10:00:00', 'A101'),
(1, 2, 'Wednesday', '13:30:00', '16:30:00', 'B202'),
(1, 3, 'Friday', '09:00:00', '11:30:00', 'Lab 4');
*/
