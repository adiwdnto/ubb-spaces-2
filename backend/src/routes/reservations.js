import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { parseCampusDateTime, validateBookingWindow } from '../lib/booking.js';

const router = Router();
const blockedStatuses = ['PENDING', 'APPROVED'];

router.use(requireAuth);

router.get('/mine', async (req, res, next) => {
  try {
    const [reservations] = await pool.query(
      `SELECT rr.reservation_id AS id, rr.event_name AS eventName,
              rr.event_description AS eventDescription,
              rr.expected_attendees AS expectedAttendees,
              rr.start_time AS startTime, rr.end_time AS endTime,
              rr.approval_status AS status, rr.created_at AS createdAt,
              r.room_name AS roomName,
              r.room_code AS roomCode, b.building_name AS buildingName
       FROM room_reservations rr
       JOIN rooms r ON r.room_id = rr.room_id
       JOIN buildings b ON b.building_id = r.building_id
       WHERE rr.user_id = ?
       ORDER BY rr.start_time DESC`,
      [req.user.user_id],
    );
    res.json({ reservations });
  } catch (error) {
    return next(error);
  }
});

router.get('/schedule', async (req, res, next) => {
  if (!['MANAGEMENT', 'ADMIN'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Jadwal seluruh ruang hanya tersedia untuk staff kampus.' });
  }
  let start;
  let end;
  try {
    start = parseCampusDateTime(req.query.startTime);
    end = parseCampusDateTime(req.query.endTime);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
  if (start.instant >= end.instant) {
    return res.status(400).json({ message: 'Rentang jadwal tidak valid.' });
  }
  try {
    const [schedule] = await pool.query(
      `SELECT rr.reservation_id AS id, rr.event_name AS eventName,
              rr.start_time AS startTime, rr.end_time AS endTime,
              rr.approval_status AS status, r.room_name AS roomName,
              r.room_code AS roomCode, b.building_name AS buildingName
       FROM room_reservations rr
       JOIN rooms r ON r.room_id = rr.room_id
       JOIN buildings b ON b.building_id = r.building_id
       WHERE rr.approval_status IN ('PENDING', 'APPROVED')
         AND rr.start_time < ? AND rr.end_time > ?
       ORDER BY rr.start_time, b.building_name, r.room_name`,
      [end.sql, start.sql],
    );
    res.json({ schedule });
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (req, res, next) => {
  const { roomId, eventName, eventDescription = '', expectedAttendees, startTime, endTime } = req.body;
  if (!roomId || typeof eventName !== 'string' || !eventName.trim() || eventName.trim().length > 150) {
    return res.status(400).json({ message: 'Ruang dan nama kegiatan (maksimal 150 karakter) wajib diisi.' });
  }
  if (typeof eventDescription !== 'string' || eventDescription.length > 5000) {
    return res.status(400).json({ message: 'Deskripsi kegiatan maksimal 5.000 karakter.' });
  }
  if (expectedAttendees != null && (!Number.isInteger(Number(expectedAttendees)) || Number(expectedAttendees) < 1)) {
    return res.status(400).json({ message: 'Perkiraan jumlah peserta tidak valid.' });
  }

  let window;
  try {
    window = validateBookingWindow(startTime, endTime);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rooms] = await connection.query(
      'SELECT room_id, capacity FROM rooms WHERE room_id = ? AND is_active = 1 FOR UPDATE',
      [roomId],
    );
    if (!rooms[0]) {
      await connection.rollback();
      return res.status(404).json({ message: 'Ruang tidak ditemukan atau sedang tidak aktif.' });
    }
    if (expectedAttendees && Number(expectedAttendees) > rooms[0].capacity) {
      await connection.rollback();
      return res.status(400).json({ message: `Jumlah peserta melebihi kapasitas ruang (${rooms[0].capacity}).` });
    }
    const [conflicts] = await connection.query(
      `SELECT reservation_id FROM room_reservations
       WHERE room_id = ? AND approval_status IN (?, ?)
         AND start_time < ? AND end_time > ?
       LIMIT 1`,
      [roomId, ...blockedStatuses, endTime, startTime],
    );
    if (conflicts.length) {
      await connection.rollback();
      return res.status(409).json({ message: 'Ruang sudah diminta atau dipesan pada waktu tersebut.' });
    }
    const [result] = await connection.query(
      `INSERT INTO room_reservations
        (user_id, room_id, event_name, event_description, expected_attendees,
         start_time, end_time, approval_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
      [
        req.user.user_id,
        roomId,
        eventName.trim(),
        eventDescription.trim() || null,
        expectedAttendees || null,
        window.start,
        window.end,
      ],
    );
    await connection.query(
      `INSERT INTO reservation_status_history
        (reservation_id, changed_by_user_id, previous_status, new_status, reason)
       VALUES (?, ?, NULL, 'PENDING', 'Permohonan dibuat')`,
      [result.insertId, req.user.user_id],
    );
    await connection.commit();
    res.status(201).json({ id: result.insertId, status: 'PENDING' });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
});

router.patch('/:id/cancel', async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query(
      `SELECT reservation_id, approval_status FROM room_reservations
       WHERE reservation_id = ? AND user_id = ? FOR UPDATE`,
      [req.params.id, req.user.user_id],
    );
    const reservation = rows[0];
    if (!reservation) {
      await connection.rollback();
      return res.status(404).json({ message: 'Permohonan tidak ditemukan.' });
    }
    if (reservation.approval_status !== 'PENDING') {
      await connection.rollback();
      return res.status(409).json({ message: 'Hanya permohonan yang masih menunggu yang dapat dibatalkan.' });
    }
    await connection.query(
      `UPDATE room_reservations SET approval_status = 'CANCELLED' WHERE reservation_id = ?`,
      [reservation.reservation_id],
    );
    await connection.query(
      `INSERT INTO reservation_status_history
        (reservation_id, changed_by_user_id, previous_status, new_status, reason)
       VALUES (?, ?, 'PENDING', 'CANCELLED', 'Dibatalkan oleh pemohon')`,
      [reservation.reservation_id, req.user.user_id],
    );
    await connection.commit();
    res.json({ message: 'Permohonan berhasil dibatalkan.' });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
});

export default router;
