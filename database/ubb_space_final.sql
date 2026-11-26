-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Final database dump for one-time setup
--
-- Host: localhost:3306
-- Generation Time: Nov 03, 2026 at 03:24 PM
-- Server version: 8.4.3
-- PHP Version: 8.3.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db.ubb_space`
--

-- --------------------------------------------------------

--
-- Table structure for table `buildings`
--

CREATE TABLE `buildings` (
  `building_id` int NOT NULL,
  `zone_id` int DEFAULT NULL,
  `building_name` varchar(100) NOT NULL,
  `location` point NOT NULL SRID 4326,
  `description` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `buildings`
--

INSERT INTO `buildings` (`building_id`, `zone_id`, `building_name`, `location`, `description`) VALUES
(1, 1, 'Gedung De Universitaria', 0xe61000000101000000f1f44a5986885a40f4fdd478e9a600c0, 'Gedung Rektorat dan Balai Utama UBB Balunijuk'),
(2, 2, 'Gedung Bangka Barat (BB)', 0xe61000000101000000386744696f885a405eba490c02ab00c0, 'Gedung perkuliahan blok Bangka Barat'),
(3, 2, 'Gedung Bangka Central (BC)', 0xe6100000010100000014ae47e17a885a4079e9263108ac00c0, 'Gedung perkuliahan dan laboratorium terpadu'),
(4, 2, 'Gedung Timah', 0xe61000000101000000aaf1d24d62885a40d3dee00b93a900c0, 'Gedung serbaguna & perkuliahan Timah'),
(5, 2, 'Gedung Babel', 0xe610000001010000003108ac1c5a885a407fd93d7958a800c0, 'Gedung aula dan sarana perkuliahan Babel');

-- --------------------------------------------------------

--
-- Table structure for table `campus_zones`
--

CREATE TABLE `campus_zones` (
  `zone_id` int NOT NULL,
  `zone_name` varchar(100) NOT NULL,
  `boundary` polygon NOT NULL SRID 4326,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `campus_zones`
--

INSERT INTO `campus_zones` (`zone_id`, `zone_name`, `boundary`, `created_at`) VALUES
(1, 'Zona Rektorat & Gedung Utama UBB', 0xe6100000010300000001000000050000002a3a92cb7f885a40d9cef753e3a500c07f6abc7493885a40d9cef753e3a500c07f6abc7493885a40295c8fc2f5a800c02a3a92cb7f885a40295c8fc2f5a800c02a3a92cb7f885a40d9cef753e3a500c0, '2026-11-03 15:18:03'),
(2, 'Zona Fakultas Teknik & Eksakta', 0xe610000001030000000100000005000000b81e85eb51885a400e2db29defa700c014ae47e17a885a400e2db29defa700c014ae47e17a885a40931804560ead00c0b81e85eb51885a40931804560ead00c0b81e85eb51885a400e2db29defa700c0, '2026-11-03 15:18:03');

-- --------------------------------------------------------

--
-- Table structure for table `rooms`
--

CREATE TABLE `rooms` (
  `room_id` int NOT NULL,
  `building_id` int NOT NULL,
  `room_code` varchar(20) NOT NULL,
  `room_name` varchar(100) NOT NULL,
  `floor` int DEFAULT '1',
  `capacity` int NOT NULL,
  `facilities` text,
  `is_active` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `rooms`
--

INSERT INTO `rooms` (`room_id`, `building_id`, `room_code`, `room_name`, `floor`, `capacity`, `facilities`, `is_active`) VALUES
(1, 1, 'DU-AKS', 'Ruang Akustik', 1, 80, 'AC, Sound System Akustik, Microphones, Stage, tv, Set Meja Diskusi', 1),
(2, 2, 'BB-BBP', 'Ruang BBP', 1, 50, 'AC, tv, Microphones, Podium, Set Meja Diskusi', 1),
(3, 2, 'BB-BBK', 'Ruang BBK', 2, 40, 'AC, Microphones, Stage, tv, Set Meja Diskusi', 1),
(4, 3, 'BC-BCK', 'Ruang BCK', 2, 45, 'AC, tv, kursi tamu, set meja diskusi', 1),
(5, 4, 'TMH-A2', 'Aula Timah 2', 2, 150, 'AC, Sound System, tv, Microphones, Podium, Set Meja Diskusi', 1),
(6, 5, 'BBL-A3', 'Aula Babel 3', 3, 200, 'AC, Sound System, Microphones, Proyektor', 1);

-- --------------------------------------------------------

--
-- Table structure for table `room_reservations`
--

CREATE TABLE `room_reservations` (
  `reservation_id` int NOT NULL,
  `user_id` int NOT NULL,
  `room_id` int NOT NULL,
  `event_name` varchar(150) NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `approval_status` enum('PENDING','APPROVED','REJECTED','CANCELLED') DEFAULT 'PENDING',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `nim_nip` varchar(30) NOT NULL,
  `phone_number` varchar(15) DEFAULT NULL,
  `role` enum('STUDENT','ORMAWA','ADMIN','MANAGEMENT') DEFAULT 'STUDENT',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `full_name`, `nim_nip`, `phone_number`, `role`, `created_at`) VALUES
(1, 'Budi Pratama (BEM UBB)', '1012111001', '081234567890', 'ORMAWA', '2026-11-03 15:18:03'),
(2, 'Siti Rahmawati', '1012111045', '089876543210', 'STUDENT', '2026-11-03 15:18:03'),
(3, 'Admin Kemahasiswaan UBB', '198501012015041001', '081122334455', 'ADMIN', '2026-11-03 15:18:03');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `buildings`
--
ALTER TABLE `buildings`
  ADD PRIMARY KEY (`building_id`),
  ADD KEY `zone_id` (`zone_id`);

--
-- Indexes for table `campus_zones`
--
ALTER TABLE `campus_zones`
  ADD PRIMARY KEY (`zone_id`);

--
-- Indexes for table `rooms`
--
ALTER TABLE `rooms`
  ADD PRIMARY KEY (`room_id`),
  ADD UNIQUE KEY `room_code` (`room_code`),
  ADD KEY `building_id` (`building_id`);

--
-- Indexes for table `room_reservations`
--
ALTER TABLE `room_reservations`
  ADD PRIMARY KEY (`reservation_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `room_id` (`room_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `nim_nip` (`nim_nip`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `buildings`
--
ALTER TABLE `buildings`
  MODIFY `building_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `campus_zones`
--
ALTER TABLE `campus_zones`
  MODIFY `zone_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `rooms`
--
ALTER TABLE `rooms`
  MODIFY `room_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `room_reservations`
--
ALTER TABLE `room_reservations`
  MODIFY `reservation_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `buildings`
--
ALTER TABLE `buildings`
  ADD CONSTRAINT `buildings_ibfk_1` FOREIGN KEY (`zone_id`) REFERENCES `campus_zones` (`zone_id`) ON DELETE SET NULL;

--
-- Constraints for table `rooms`
--
ALTER TABLE `rooms`
  ADD CONSTRAINT `rooms_ibfk_1` FOREIGN KEY (`building_id`) REFERENCES `buildings` (`building_id`) ON DELETE CASCADE;

--
-- Constraints for table `room_reservations`
--
ALTER TABLE `room_reservations`
  ADD CONSTRAINT `room_reservations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `room_reservations_ibfk_2` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`room_id`) ON DELETE CASCADE;

--
-- Final schema additions previously applied by the MVP migration
--

ALTER TABLE users
  ADD COLUMN password_hash VARCHAR(255) NULL AFTER nim_nip,
  ADD COLUMN verification_status ENUM('PENDING', 'VERIFIED', 'REJECTED') NOT NULL DEFAULT 'VERIFIED' AFTER role,
  ADD COLUMN verification_note VARCHAR(500) NULL AFTER verification_status,
  ADD COLUMN verified_by_user_id INT NULL AFTER verification_note,
  ADD COLUMN verified_at DATETIME NULL AFTER verified_by_user_id,
  ADD KEY idx_users_role_verification (role, verification_status),
  ADD CONSTRAINT users_verified_by_fk
    FOREIGN KEY (verified_by_user_id) REFERENCES users (user_id) ON DELETE SET NULL;

ALTER TABLE room_reservations
  ADD COLUMN event_description TEXT NULL AFTER event_name,
  ADD COLUMN expected_attendees INT UNSIGNED NULL AFTER event_description,
  ADD KEY idx_reservations_room_time_status (room_id, approval_status, start_time, end_time),
  ADD KEY idx_reservations_user_created (user_id, created_at),
  ADD CONSTRAINT chk_reservation_time CHECK (start_time < end_time);

ALTER TABLE buildings
  ADD SPATIAL INDEX idx_buildings_location (location);

ALTER TABLE campus_zones
  ADD SPATIAL INDEX idx_campus_zones_boundary (boundary);

CREATE TABLE reservation_status_history (
  history_id INT NOT NULL AUTO_INCREMENT,
  reservation_id INT NOT NULL,
  changed_by_user_id INT NOT NULL,
  previous_status ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NULL,
  new_status ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL,
  reason VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (history_id),
  KEY idx_status_history_reservation_created (reservation_id, created_at),
  CONSTRAINT history_reservation_fk
    FOREIGN KEY (reservation_id) REFERENCES room_reservations (reservation_id) ON DELETE CASCADE,
  CONSTRAINT history_changed_by_fk
    FOREIGN KEY (changed_by_user_id) REFERENCES users (user_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

UPDATE users
SET password_hash = '$2a$12$S4.wBV0FJYsfRqa4DHzeD.2DuSFA4rI7W/yWU0MYYgrmRa2v5vXRm',
    verified_at = UTC_TIMESTAMP()
WHERE nim_nip IN ('1012111001', '1012111045', '198501012015041001');

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
