# UBB Space

Prototipe aplikasi peminjaman ruang kegiatan Universitas Bangka Belitung. Frontend dan backend adalah aplikasi terpisah serta dijalankan dari terminal masing-masing.

## Prasyarat

- Node.js 20 atau lebih baru dan npm
- MySQL 8.0.16 atau lebih baru (dump spasial disiapkan untuk MySQL 8.4)

## Siapkan database

1. Buat database MySQL `db.ubb_space`.
2. Impor dump awal yang disediakan (`database/000_base.sql`) ke database tersebut.
3. Jalankan migrasi `database/001_mvp.sql` setelah dump awal berhasil diimpor.

Migrasi menambahkan hash kata sandi dan status verifikasi, rincian kegiatan, riwayat persetujuan, indeks pencarian spasial/jadwal, dan validasi rentang waktu. Data pengguna lama tetap dapat dibaca, tetapi akun harus memiliki kata sandi yang diatur sebelum bisa login.

## Jalankan backend

Di terminal pertama:

```powershell
cd backend
Copy-Item .env.example .env
npm install
```

Isi konfigurasi MySQL dan ganti `JWT_SECRET` di `backend/.env` dengan secret acak minimal 32 karakter. Untuk menyiapkan akun admin kampus pertama, isi `ADMIN_NIM`, `ADMIN_NAME`, dan `ADMIN_PASSWORD`, lalu jalankan:

```powershell
npm run seed:admin
npm run dev
```

API tersedia di `http://localhost:4000`; pemeriksaan kesehatan di `/api/health`.

## Jalankan frontend

Di terminal kedua:

```powershell
cd frontend
npm install
npm run dev
```

Buka URL yang ditampilkan Vite (default `http://localhost:5173`). Untuk endpoint API non-default, buat `frontend/.env` dan atur `VITE_API_URL`.

## Kebijakan prototipe

- Mahasiswa dan ormawa dapat mendaftar dan langsung menggunakan akun setelah pendaftaran.
- Staff fakultas (`MANAGEMENT`) dan staff admin kampus (`ADMIN`) harus diverifikasi admin kampus. Akun admin pertama disiapkan melalui `npm run seed:admin`.
- Staff admin kampus memverifikasi akun staff dan menyetujui atau menolak seluruh permohonan. Staff fakultas dapat mengakses katalog dan mengajukan peminjaman.
- Slot dengan permohonan `PENDING` atau peminjaman `APPROVED` tidak ditampilkan sebagai tersedia; API memeriksa bentrok kembali di dalam transaksi.
- Peminjam dapat membatalkan permohonan yang masih `PENDING`.
- Peta menggunakan tile OpenStreetMap; penggunaan tile memerlukan akses internet dan tunduk pada kebijakan layanan OpenStreetMap.

## Pemeriksaan

```powershell
cd backend
npm test
```

```powershell
cd frontend
npm run build
```
