import 'dotenv/config';
import bcrypt from 'bcryptjs';
import pool from '../db.js';

const { ADMIN_NIM, ADMIN_NAME, ADMIN_PASSWORD, ADMIN_PHONE = '' } = process.env;

if (!ADMIN_NIM || !ADMIN_NAME || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 10) {
  throw new Error('Atur ADMIN_NIM, ADMIN_NAME, dan ADMIN_PASSWORD (minimal 10 karakter) di backend/.env.');
}

try {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await pool.query(
    `INSERT INTO users
      (full_name, nim_nip, phone_number, password_hash, role, verification_status, verified_at)
     VALUES (?, ?, ?, ?, 'ADMIN', 'VERIFIED', UTC_TIMESTAMP())
     ON DUPLICATE KEY UPDATE
       full_name = VALUES(full_name),
       phone_number = VALUES(phone_number),
       password_hash = VALUES(password_hash),
       role = 'ADMIN',
       verification_status = 'VERIFIED',
       verified_at = UTC_TIMESTAMP()`,
    [ADMIN_NAME.trim(), ADMIN_NIM.trim(), ADMIN_PHONE.trim(), passwordHash],
  );
  console.log(`Akun admin siap untuk NIM/NIP ${ADMIN_NIM}.`);
} finally {
  await pool.end();
}
