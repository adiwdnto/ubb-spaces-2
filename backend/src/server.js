import 'dotenv/config';
import app from './app.js';
import pool from './db.js';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET harus diatur dengan nilai acak minimal 32 karakter.');
}

const port = Number(process.env.PORT || 4000);
const server = app.listen(port, async () => {
  try {
    await pool.query('SELECT 1');
    console.log(`UBB Space API berjalan di http://localhost:${port}`);
  } catch (error) {
    console.error('Koneksi MySQL gagal:', error.message);
    server.close(() => process.exit(1));
  }
});

async function shutdown() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
