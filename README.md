# UBB Space

Prototipe aplikasi peminjaman ruang kegiatan Universitas Bangka Belitung. Frontend dan backend adalah aplikasi terpisah serta dijalankan dari terminal masing-masing.

## Prasyarat

- Node.js 20 atau lebih baru dan npm
- MySQL 8.0.16 atau lebih baru (dump spasial disiapkan untuk MySQL 8.4)

## Siapkan database

1. Buat database MySQL `db.ubb_space`.
2. Impor `database/ubb_space_final.sql` satu kali ke database tersebut. Dump ini sudah berisi skema final, data ruang, dan akun demo; tidak perlu menjalankan file migrasi terpisah.

Semua akun demo menggunakan password `DemoUBB2026!`:

| Akun | NIM/NIP | Peran |
| --- | --- | --- |
| Budi Pratama (BEM UBB) | `1012111001` | ORMAWA |
| Siti Rahmawati | `1012111045` | STUDENT |
| Admin Kemahasiswaan UBB | `198501012015041001` | ADMIN |

Kredensial tersebut hanya untuk demo lokal. Ganti atau hapus akun/password demo sebelum database digunakan di lingkungan lain.

## Jalankan backend

Di terminal pertama:

```powershell
cd backend
Copy-Item .env.example .env
npm install
```

Isi konfigurasi MySQL dan ganti `JWT_SECRET` di `backend/.env` dengan secret acak minimal 32 karakter. Jika memakai dump final, akun admin demo sudah tersedia dan seeder tidak perlu dijalankan. Untuk instalasi non-demo atau membuat akun admin berbeda, isi `ADMIN_NIM`, `ADMIN_NAME`, dan `ADMIN_PASSWORD` di `backend/.env`, lalu jalankan:

```powershell
npm run seed:admin
```

Jalankan backend:

```powershell
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
- Staff fakultas (`MANAGEMENT`) harus diverifikasi admin kampus. Dump demo menyediakan akun admin; untuk instalasi non-demo, siapkan akun admin pertama melalui `npm run seed:admin`.
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
