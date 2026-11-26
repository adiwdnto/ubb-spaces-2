import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/', async (req, res, next) => {
  const { search, buildingId, zoneId, minCapacity, facility, startTime, endTime } = req.query;
  if ((startTime && !endTime) || (!startTime && endTime)) {
    return res.status(400).json({ message: 'Waktu mulai dan selesai harus diisi bersama-sama.' });
  }
  const conditions = ['r.is_active = 1'];
  const params = [];
  if (search?.trim()) {
    conditions.push('(r.room_name LIKE ? OR r.room_code LIKE ? OR b.building_name LIKE ?)');
    const searchTerm = `%${search.trim()}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }
  if (buildingId) {
    conditions.push('b.building_id = ?');
    params.push(buildingId);
  }
  if (zoneId) {
    conditions.push('cz.zone_id = ?');
    params.push(zoneId);
  }
  if (minCapacity) {
    if (!Number.isInteger(Number(minCapacity)) || Number(minCapacity) < 1) {
      return res.status(400).json({ message: 'Kapasitas minimal tidak valid.' });
    }
    conditions.push('r.capacity >= ?');
    params.push(Number(minCapacity));
  }
  if (facility?.trim()) {
    conditions.push('r.facilities LIKE ?');
    params.push(`%${facility.trim()}%`);
  }
  if (startTime && endTime) {
    conditions.push(`NOT EXISTS (
      SELECT 1 FROM room_reservations rr
      WHERE rr.room_id = r.room_id
        AND rr.approval_status IN ('PENDING', 'APPROVED')
        AND rr.start_time < ? AND rr.end_time > ?
    )`);
    params.push(endTime, startTime);
  }

  try {
    const [rooms] = await pool.query(
      `SELECT r.room_id AS id, r.room_code AS code, r.room_name AS name, r.floor,
              r.capacity, r.facilities, b.building_id AS buildingId,
              b.building_name AS buildingName, b.description AS buildingDescription,
              ST_Latitude(b.location) AS latitude, ST_Longitude(b.location) AS longitude,
              cz.zone_id AS zoneId, cz.zone_name AS zoneName,
              ST_AsGeoJSON(cz.boundary) AS zoneBoundary
       FROM rooms r
       JOIN buildings b ON b.building_id = r.building_id
       LEFT JOIN campus_zones cz ON cz.zone_id = b.zone_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY r.capacity, b.building_name, r.room_name`,
      params,
    );
    res.json({
      rooms: rooms.map((room) => ({
        ...room,
        facilities: room.facilities?.split(/[,;]+/).map((item) => item.trim()).filter(Boolean) || [],
        zoneBoundary: typeof room.zoneBoundary === 'string'
          ? JSON.parse(room.zoneBoundary)
          : room.zoneBoundary || null,
      })),
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/filters', async (req, res, next) => {
  try {
    const [buildings] = await pool.query(
      `SELECT building_id AS id, building_name AS name, zone_id AS zoneId
       FROM buildings ORDER BY building_name`,
    );
    const [zones] = await pool.query(
      `SELECT zone_id AS id, zone_name AS name FROM campus_zones ORDER BY zone_name`,
    );
    res.json({ buildings, zones });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const [rooms] = await pool.query(
      `SELECT r.room_id AS id, r.room_code AS code, r.room_name AS name, r.floor,
              r.capacity, r.facilities, b.building_name AS buildingName,
              ST_Latitude(b.location) AS latitude, ST_Longitude(b.location) AS longitude,
              cz.zone_name AS zoneName
       FROM rooms r
       JOIN buildings b ON b.building_id = r.building_id
       LEFT JOIN campus_zones cz ON cz.zone_id = b.zone_id
       WHERE r.room_id = ? AND r.is_active = 1`,
      [req.params.id],
    );
    if (!rooms[0]) {
      return res.status(404).json({ message: 'Ruang tidak ditemukan.' });
    }
    res.json({
      room: {
        ...rooms[0],
        facilities: rooms[0].facilities?.split(/[,;]+/).map((item) => item.trim()).filter(Boolean) || [],
      },
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
