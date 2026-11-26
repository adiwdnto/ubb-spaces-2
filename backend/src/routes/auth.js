import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const allowedRoles = new Set(['STUDENT', 'ORMAWA', 'MANAGEMENT', 'ADMIN']);

function publicUser(user) {
  return {
    id: user.user_id,
    name: user.full_name,
    nimNip: user.nim_nip,
    role: user.role,
    verificationStatus: user.verification_status,
  };
}

function setSessionCookie(res, user) {
  const token = jwt.sign(
    { sub: String(user.user_id) },
    process.env.JWT_SECRET,
    { expiresIn: '8h' },
  );
  res.cookie('ubb_space_session', token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000,
    path: '/',
  });
}

router.post('/register', async (req, res, next) => {
  const { fullName, nimNip, phoneNumber = '', password, role = 'STUDENT' } = req.body;
  if (!fullName?.trim() || !nimNip?.trim() || !password) {
    return res.status(400).json({ message: 'Nama lengkap, NIM/NIP, dan kata sandi wajib diisi.' });
  }
  if (fullName.trim().length > 100 || nimNip.trim().length > 30 || phoneNumber.length > 15) {
    return res.status(400).json({ message: 'Ada data yang melebihi panjang maksimal.' });
  }
  if (!allowedRoles.has(role)) {
    return res.status(400).json({ message: 'Jenis akun tidak valid.' });
  }
  if (password.length < 10) {
    return res.status(400).json({ message: 'Kata sandi harus memiliki minimal 10 karakter.' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const verificationStatus = role === 'STUDENT' || role === 'ORMAWA' ? 'VERIFIED' : 'PENDING';
    const [result] = await pool.query(
      `INSERT INTO users
        (full_name, nim_nip, phone_number, password_hash, role, verification_status,
         verified_at)
       VALUES (?, ?, ?, ?, ?, ?, IF(? = 'VERIFIED', UTC_TIMESTAMP(), NULL))`,
      [fullName.trim(), nimNip.trim(), phoneNumber.trim(), passwordHash, role, verificationStatus, verificationStatus],
    );
    if (verificationStatus === 'PENDING') {
      return res.status(201).json({
        message: 'Pendaftaran staff diterima dan menunggu verifikasi administrator kampus.',
        verificationStatus,
      });
    }
    const user = {
      user_id: result.insertId,
      full_name: fullName.trim(),
      nim_nip: nimNip.trim(),
      role,
      verification_status: verificationStatus,
    };
    setSessionCookie(res, user);
    return res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'NIM/NIP tersebut sudah terdaftar.' });
    }
    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  const { nimNip, password } = req.body;
  if (!nimNip || !password) {
    return res.status(400).json({ message: 'NIM/NIP dan kata sandi wajib diisi.' });
  }
  try {
    const [users] = await pool.query(
      `SELECT user_id, full_name, nim_nip, role, password_hash, verification_status
       FROM users WHERE nim_nip = ?`,
      [nimNip.trim()],
    );
    const user = users[0];
    if (!user?.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: 'NIM/NIP atau kata sandi tidak sesuai.' });
    }
    if (user.verification_status !== 'VERIFIED') {
      const message = user.verification_status === 'REJECTED'
        ? 'Pendaftaran akun ditolak. Silakan hubungi administrator kampus.'
        : 'Akun staff masih menunggu verifikasi administrator kampus.';
      return res.status(403).json({ message });
    }
    setSessionCookie(res, user);
    return res.json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

router.post('/logout', (req, res) => {
  res.clearCookie('ubb_space_session', {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    path: '/',
  });
  res.json({ message: 'Anda telah keluar.' });
});

export default router;
