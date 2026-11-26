import { Router } from 'express';
import pool from '../db.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireAdmin);

router.get('/overview', async (req, res, next) => {
  try {
    const [[{ pendingReservations }]] = await pool.query(
      `SELECT COUNT(*) AS pendingReservations FROM room_reservations
       WHERE approval_status = 'PENDING'`,
    );
    const [[{ pendingUsers }]] = await pool.query(
      `SELECT COUNT(*) AS pendingUsers FROM users
       WHERE verification_status = 'PENDING'`,
    );
    const [[{ activeRooms }]] = await pool.query(
      'SELECT COUNT(*) AS activeRooms FROM rooms WHERE is_active = 1',
    );
    res.json({ pendingReservations, pendingUsers, activeRooms });
  } catch (error) {
    return next(error);
  }
});

router.get('/reservations', async (req, res, next) => {
  const status = req.query.status || 'PENDING';
  if (!['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'ALL'].includes(status)) {
    return res.status(400).json({ message: 'Filter status tidak valid.' });
  }
  try {
    const params = status === 'ALL' ? [] : [status];
    const [reservations] = await pool.query(
      `SELECT rr.reservation_id AS id, rr.event_name AS eventName,
              rr.event_description AS eventDescription,
              rr.expected_attendees AS expectedAttendees,
              rr.start_time AS startTime, rr.end_time AS endTime,
              rr.approval_status AS status, rr.created_at AS createdAt,
              u.full_name AS requesterName, u.nim_nip AS requesterNimNip,
              u.role AS requesterRole, u.phone_number AS requesterPhone,
              r.room_name AS roomName, r.room_code AS roomCode,
              b.building_name AS buildingName
       FROM room_reservations rr
       JOIN users u ON u.user_id = rr.user_id
       JOIN rooms r ON r.room_id = rr.room_id
       JOIN buildings b ON b.building_id = r.building_id
       ${status === 'ALL' ? '' : 'WHERE rr.approval_status = ?'}
       ORDER BY rr.created_at DESC LIMIT 200`,
      params,
    );
    res.json({ reservations });
  } catch (error) {
    return next(error);
  }
});

router.patch('/reservations/:id/decision', async (req, res, next) => {
  const { decision, reason = '' } = req.body;
  if (!['APPROVED', 'REJECTED'].includes(decision)) {
    return res.status(400).json({ message: 'Keputusan harus disetujui atau ditolak.' });
  }
  if (decision === 'REJECTED' && !reason.trim()) {
    return res.status(400).json({ message: 'Alasan penolakan wajib diisi.' });
  }
  if (reason.length > 500) {
    return res.status(400).json({ message: 'Alasan maksimal 500 karakter.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [firstRead] = await connection.query(
      'SELECT room_id FROM room_reservations WHERE reservation_id = ?',
      [req.params.id],
    );
    if (!firstRead[0]) {
      await connection.rollback();
      return res.status(404).json({ message: 'Permohonan tidak ditemukan.' });
    }
    const [lockedRooms] = await connection.query(
      'SELECT room_id FROM rooms WHERE room_id = ? FOR UPDATE',
      [firstRead[0].room_id],
    );
    if (!lockedRooms[0]) {
      await connection.rollback();
      return res.status(409).json({ message: 'Ruang untuk permohonan ini sudah tidak tersedia.' });
    }
    const [rows] = await connection.query(
      `SELECT reservation_id, room_id, start_time, end_time, approval_status
       FROM room_reservations WHERE reservation_id = ? FOR UPDATE`,
      [req.params.id],
    );
    const reservation = rows[0];
    if (!reservation || reservation.approval_status !== 'PENDING') {
      await connection.rollback();
      return res.status(409).json({ message: 'Permohonan ini sudah diproses atau tidak ditemukan.' });
    }
    if (decision === 'APPROVED') {
      const [conflicts] = await connection.query(
        `SELECT reservation_id FROM room_reservations
         WHERE room_id = ? AND reservation_id <> ?
           AND approval_status IN ('PENDING', 'APPROVED')
           AND start_time < ? AND end_time > ?
         LIMIT 1 FOR UPDATE`,
        [reservation.room_id, reservation.reservation_id, reservation.end_time, reservation.start_time],
      );
      if (conflicts.length) {
        await connection.rollback();
        return res.status(409).json({
          message: 'Tidak dapat menyetujui: ada permohonan lain yang masih aktif pada waktu tersebut.',
        });
      }
    }
    await connection.query(
      'UPDATE room_reservations SET approval_status = ? WHERE reservation_id = ?',
      [decision, reservation.reservation_id],
    );
    await connection.query(
      `INSERT INTO reservation_status_history
        (reservation_id, changed_by_user_id, previous_status, new_status, reason)
       VALUES (?, ?, 'PENDING', ?, ?)`,
      [reservation.reservation_id, req.user.user_id, decision, reason.trim() || null],
    );
    await connection.commit();
    res.json({ message: decision === 'APPROVED' ? 'Peminjaman disetujui.' : 'Peminjaman ditolak.' });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
});

router.get('/users', async (req, res, next) => {
  const status = req.query.status || 'PENDING';
  if (!['PENDING', 'VERIFIED', 'REJECTED', 'ALL'].includes(status)) {
    return res.status(400).json({ message: 'Filter verifikasi tidak valid.' });
  }
  try {
    const params = status === 'ALL' ? [] : [status];
    const [users] = await pool.query(
      `SELECT user_id AS id, full_name AS fullName, nim_nip AS nimNip,
              phone_number AS phoneNumber, role, verification_status AS verificationStatus,
              created_at AS createdAt
       FROM users ${status === 'ALL' ? '' : 'WHERE verification_status = ?'}
       ORDER BY created_at DESC LIMIT 200`,
      params,
    );
    res.json({ users });
  } catch (error) {
    return next(error);
  }
});

router.patch('/users/:id/verification', async (req, res, next) => {
  const { status, note = '' } = req.body;
  if (!['VERIFIED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ message: 'Status verifikasi tidak valid.' });
  }
  if (note.length > 500) {
    return res.status(400).json({ message: 'Catatan maksimal 500 karakter.' });
  }
  try {
    const [result] = await pool.query(
      `UPDATE users
       SET verification_status = ?, verification_note = ?,
           verified_by_user_id = ?, verified_at = UTC_TIMESTAMP()
       WHERE user_id = ? AND verification_status = 'PENDING'`,
      [status, note.trim() || null, req.user.user_id, req.params.id],
    );
    if (!result.affectedRows) {
      return res.status(409).json({ message: 'Akun sudah diproses atau tidak ditemukan.' });
    }
    res.json({ message: status === 'VERIFIED' ? 'Akun staff telah diaktifkan.' : 'Pendaftaran akun ditolak.' });
  } catch (error) {
    return next(error);
  }
});

router.get('/rooms', async (req, res, next) => {
  try {
    const [rooms] = await pool.query(
      `SELECT r.room_id AS id, r.room_code AS code, r.room_name AS name,
              r.floor, r.capacity, r.facilities, r.is_active AS isActive,
              b.building_id AS buildingId, b.building_name AS buildingName
       FROM rooms r JOIN buildings b ON b.building_id = r.building_id
       ORDER BY b.building_name, r.room_name`,
    );
    res.json({ rooms });
  } catch (error) {
    return next(error);
  }
});

router.post('/rooms', async (req, res, next) => {
  const { buildingId, code, name, floor = 1, capacity, facilities = '' } = req.body;
  if (!buildingId || !code?.trim() || !name?.trim() || !Number.isInteger(Number(capacity)) || Number(capacity) < 1) {
    return res.status(400).json({ message: 'Gedung, kode, nama ruang, dan kapasitas wajib diisi.' });
  }
  try {
    const [result] = await pool.query(
      `INSERT INTO rooms (building_id, room_code, room_name, floor, capacity, facilities, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [buildingId, code.trim(), name.trim(), floor, capacity, facilities.trim()],
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Kode ruang sudah digunakan.' });
    }
    return next(error);
  }
});

router.patch('/rooms/:id', async (req, res, next) => {
  const { buildingId, code, name, floor = 1, capacity, facilities = '', isActive = true } = req.body;
  if (!buildingId || !code?.trim() || !name?.trim() || !Number.isInteger(Number(capacity)) || Number(capacity) < 1) {
    return res.status(400).json({ message: 'Gedung, kode, nama ruang, dan kapasitas wajib diisi.' });
  }
  try {
    const [result] = await pool.query(
      `UPDATE rooms
       SET building_id = ?, room_code = ?, room_name = ?, floor = ?,
           capacity = ?, facilities = ?, is_active = ?
       WHERE room_id = ?`,
      [buildingId, code.trim(), name.trim(), floor, capacity, facilities.trim(), isActive ? 1 : 0, req.params.id],
    );
    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Ruang tidak ditemukan.' });
    }
    res.json({ message: 'Data ruang diperbarui.' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Kode ruang sudah digunakan.' });
    }
    return next(error);
  }
});

router.get('/buildings', async (req, res, next) => {
  try {
    const [buildings] = await pool.query(
      'SELECT building_id AS id, building_name AS name FROM buildings ORDER BY building_name',
    );
    res.json({ buildings });
  } catch (error) {
    return next(error);
  }
});

export default router;
