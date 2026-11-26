USE `db.ubb_space`;

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
