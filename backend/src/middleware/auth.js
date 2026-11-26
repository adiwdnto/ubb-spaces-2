import jwt from 'jsonwebtoken';
import pool from '../db.js';

export async function requireAuth(req, res, next) {
  const token = req.cookies?.ubb_space_session;
  if (!token) {
    return res.status(401).json({ message: 'Silakan masuk untuk melanjutkan.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const [users] = await pool.query(
      `SELECT user_id, full_name, nim_nip, role, verification_status
       FROM users WHERE user_id = ?`,
      [payload.sub],
    );
    const user = users[0];
    if (!user || user.verification_status !== 'VERIFIED') {
      res.clearCookie('ubb_space_session');
      return res.status(403).json({ message: 'Akun belum aktif. Hubungi administrator kampus.' });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      res.clearCookie('ubb_space_session');
      return res.status(401).json({ message: 'Sesi telah berakhir. Silakan masuk kembali.' });
    }
    return next(error);
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Akses ini hanya tersedia untuk staff admin kampus.' });
  }
  return next();
}
