import { useCallback, useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Polygon, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Compass,
  DoorOpen,
  Filter,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { api, jsonBody } from './api.js';

const roleLabels = {
  STUDENT: 'Mahasiswa',
  ORMAWA: 'Organisasi mahasiswa',
  MANAGEMENT: 'Staff fakultas',
  ADMIN: 'Admin kampus',
};

const statusLabels = {
  PENDING: 'Menunggu',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak',
  CANCELLED: 'Dibatalkan',
};

const markerIcon = L.divIcon({
  className: 'map-pin',
  html: '<span></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function MapBounds({ rooms }) {
  const map = useMap();
  useEffect(() => {
    const points = rooms
      .filter((room) => Number.isFinite(Number(room.latitude)) && Number.isFinite(Number(room.longitude)))
      .map((room) => [Number(room.latitude), Number(room.longitude)]);
    if (points.length > 1) map.fitBounds(points, { padding: [28, 28], maxZoom: 16 });
    else if (points.length === 1) map.setView(points[0], 16);
  }, [map, rooms]);
  return null;
}

function RoomMap({ rooms }) {
  const zones = useMemo(() => {
    const unique = new Map();
    rooms.forEach((room) => {
      if (room.zoneId && room.zoneBoundary?.coordinates?.[0]) {
        unique.set(room.zoneId, room.zoneBoundary.coordinates[0].map(([lng, lat]) => [lat, lng]));
      }
    });
    return [...unique.entries()];
  }, [rooms]);

  return (
    <div className="map-frame">
      <MapContainer center={[-2.08, 106.13]} zoom={14} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {zones.map(([zoneId, positions]) => (
          <Polygon key={zoneId} positions={positions} pathOptions={{ color: '#91a4c7', fillColor: '#cad6ea', fillOpacity: 0.16, weight: 1 }} />
        ))}
        {rooms.map((room) => (
          Number.isFinite(Number(room.latitude)) && Number.isFinite(Number(room.longitude)) && (
            <Marker key={room.id} position={[Number(room.latitude), Number(room.longitude)]} icon={markerIcon}>
              <Popup>
                <strong>{room.name}</strong><br />
                {room.buildingName} · kapasitas {room.capacity}
              </Popup>
            </Marker>
          )
        ))}
        <MapBounds rooms={rooms} />
      </MapContainer>
      <div className="map-label"><MapPin size={14} /> Kampus Terpadu UBB</div>
    </div>
  );
}

function StatusBadge({ status }) {
  return <span className={`status-badge status-${status?.toLowerCase()}`}>{statusLabels[status] || status}</span>;
}

function Toast({ toast, onClose }) {
  if (!toast) return null;
  return (
    <div className={`toast toast-${toast.type}`} role="status">
      <span>{toast.message}</span>
      <button className="icon-button" onClick={onClose} aria-label="Tutup notifikasi"><X size={16} /></button>
    </div>
  );
}

function AuthScreen({ onLogin, onRegister, busy, onBack, error }) {
  const [mode, setMode] = useState('login');
  const [role, setRole] = useState('STUDENT');
  const [form, setForm] = useState({ fullName: '', nimNip: '', phoneNumber: '', password: '' });
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const submit = (event) => {
    event.preventDefault();
    if (mode === 'login') onLogin({ nimNip: form.nimNip, password: form.password });
    else onRegister({ ...form, role });
  };

  return (
    <main className="auth-page">
      <div className="auth-photo">
        <div className="auth-photo-overlay" />
        <a className="brand brand-light" href="#" onClick={onBack}>
          <span className="brand-mark">U</span><span>UBB <b>SPACE</b></span>
        </a>
        <div className="auth-photo-copy">
          <span className="eyebrow eyebrow-light">UNIVERSITAS BANGKA BELITUNG</span>
          <h1>Ruang baik<br />untuk ide besar.</h1>
          <p>Temukan ruang yang tepat. Fokus pada kegiatan yang bermakna.</p>
        </div>
        <span className="auth-photo-caption">Kampus Terpadu · Balunijuk, Bangka</span>
      </div>
      <div className="auth-panel">
        <button className="text-button auth-back" onClick={onBack}><ArrowRight className="rotate-left" size={16} /> Kembali ke beranda</button>
        <div className="auth-form-wrap">
          <span className="eyebrow">UBB SPACE</span>
          <h2>{mode === 'login' ? 'Selamat datang' : 'Buat akun UBB Space'}</h2>
          <p className="muted">{mode === 'login' ? 'Masuk untuk mengajukan dan memantau peminjaman ruang.' : 'Gunakan data identitas kampus Anda untuk mendaftar.'}</p>
          <div className="auth-tabs">
            <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Masuk</button>
            <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Daftar akun</button>
          </div>
          <form onSubmit={submit} className="form-stack">
            {mode === 'register' && (
              <>
                <label>Nama lengkap<input required maxLength="100" value={form.fullName} onChange={update('fullName')} placeholder="Nama sesuai identitas" /></label>
                <label>Jenis akun
                  <select value={role} onChange={(event) => setRole(event.target.value)}>
                    <option value="STUDENT">Mahasiswa</option>
                    <option value="ORMAWA">Organisasi mahasiswa</option>
                    <option value="MANAGEMENT">Staff fakultas</option>
                    <option value="ADMIN">Staff admin kampus</option>
                  </select>
                </label>
              </>
            )}
            <label>NIM / NIP<input required maxLength="30" value={form.nimNip} onChange={update('nimNip')} placeholder="Masukkan NIM atau NIP" autoComplete="username" /></label>
            {mode === 'register' && <label>Nomor telepon <span className="optional">(opsional)</span><input maxLength="15" value={form.phoneNumber} onChange={update('phoneNumber')} placeholder="08xx xxxx xxxx" /></label>}
            <label>Kata sandi<input required minLength="10" type="password" value={form.password} onChange={update('password')} placeholder="Minimal 10 karakter" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>
            {error && <div className="form-error">{error}</div>}
            <button className="button button-primary button-wide" disabled={busy}>{busy ? 'Memproses…' : mode === 'login' ? 'Masuk ke akun' : 'Kirim pendaftaran'}<ArrowRight size={17} /></button>
          </form>
          {mode === 'register' && <p className="fine-print">Akun staff perlu diverifikasi oleh admin kampus sebelum dapat digunakan.</p>}
        </div>
      </div>
    </main>
  );
}

function BookingModal({ room, initialStart, initialEnd, onClose, onSubmit, busy }) {
  const [eventName, setEventName] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [expectedAttendees, setExpectedAttendees] = useState('');
  const [startTime, setStartTime] = useState(initialStart || '');
  const [endTime, setEndTime] = useState(initialEnd || '');
  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="modal-card" onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ roomId: room.id, eventName, eventDescription, expectedAttendees: expectedAttendees || null, startTime, endTime });
      }}>
        <div className="modal-heading">
          <div><span className="eyebrow">AJUKAN PEMINJAMAN</span><h2>{room.name}</h2><p>{room.buildingName} · Kapasitas {room.capacity} orang</p></div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Tutup"><X /></button>
        </div>
        <label>Nama kegiatan<input required maxLength="150" value={eventName} onChange={(event) => setEventName(event.target.value)} placeholder="Contoh: Rapat kerja organisasi" /></label>
        <div className="form-row">
          <label>Mulai<input required type="datetime-local" value={startTime} onChange={(event) => setStartTime(event.target.value)} /></label>
          <label>Selesai<input required type="datetime-local" value={endTime} onChange={(event) => setEndTime(event.target.value)} /></label>
        </div>
        <label>Perkiraan peserta<input type="number" min="1" max={room.capacity} value={expectedAttendees} onChange={(event) => setExpectedAttendees(event.target.value)} placeholder={`Maks. ${room.capacity} orang`} /></label>
        <label>Catatan kegiatan <span className="optional">(opsional)</span><textarea rows="3" maxLength="5000" value={eventDescription} onChange={(event) => setEventDescription(event.target.value)} placeholder="Jelaskan kebutuhan ruang atau kegiatan Anda" /></label>
        <div className="modal-actions"><button type="button" className="button button-quiet" onClick={onClose}>Batal</button><button className="button button-primary" disabled={busy}>{busy ? 'Mengirim…' : 'Kirim permohonan'}<ArrowRight size={16} /></button></div>
      </form>
    </div>
  );
}

function RoomCard({ room, onBook, signedIn }) {
  return (
    <article className="room-card">
      <div className="room-card-top">
        <div className="room-icon"><DoorOpen size={19} /></div>
        <span className="room-code">{room.code}</span>
        <button className="room-arrow" aria-label={`Pilih ${room.name}`} onClick={() => onBook(room)}><ArrowUpRight size={17} /></button>
      </div>
      <h3>{room.name}</h3>
      <p className="room-building"><MapPin size={14} />{room.buildingName}</p>
      <div className="room-meta">
        <span><Users size={15} />{room.capacity} orang</span>
        <span><Compass size={15} />Lantai {room.floor}</span>
      </div>
      <div className="facility-list">{room.facilities.slice(0, 3).map((facility) => <span key={facility}>{facility}</span>)}</div>
      <button className="room-book-link" onClick={() => onBook(room)}>{signedIn ? 'Ajukan peminjaman' : 'Masuk untuk meminjam'}<ArrowRight size={15} /></button>
    </article>
  );
}

function AdminPanel({ onToast }) {
  const [tab, setTab] = useState('requests');
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [busy, setBusy] = useState(false);
  const [roomForm, setRoomForm] = useState({ buildingId: '', code: '', name: '', floor: 1, capacity: '', facilities: '' });

  const load = useCallback(async () => {
    try {
      if (tab === 'requests') {
        const [requestData, userData] = await Promise.all([api('/admin/reservations?status=PENDING'), api('/admin/users?status=PENDING')]);
        setRequests(requestData.reservations);
        setUsers(userData.users);
      } else {
        const [roomData, buildingData] = await Promise.all([api('/admin/rooms'), api('/admin/buildings')]);
        setRooms(roomData.rooms);
        setBuildings(buildingData.buildings);
      }
    } catch (error) {
      onToast(error.message, 'error');
    }
  }, [onToast, tab]);

  useEffect(() => { load(); }, [load]);

  const decide = async (id, decision) => {
    let reason = '';
    if (decision === 'REJECTED') {
      reason = window.prompt('Tuliskan alasan penolakan:') || '';
      if (!reason.trim()) return;
    }
    setBusy(true);
    try {
      await api(`/admin/reservations/${id}/decision`, { method: 'PATCH', body: jsonBody({ decision, reason }) });
      onToast(decision === 'APPROVED' ? 'Peminjaman disetujui.' : 'Peminjaman ditolak.');
      await load();
    } catch (error) {
      onToast(error.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const verify = async (id, status) => {
    setBusy(true);
    try {
      await api(`/admin/users/${id}/verification`, { method: 'PATCH', body: jsonBody({ status }) });
      onToast(status === 'VERIFIED' ? 'Akun staff diaktifkan.' : 'Pendaftaran staff ditolak.');
      await load();
    } catch (error) {
      onToast(error.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const saveRoom = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await api('/admin/rooms', { method: 'POST', body: jsonBody(roomForm) });
      setRoomForm({ buildingId: '', code: '', name: '', floor: 1, capacity: '', facilities: '' });
      onToast('Ruang berhasil ditambahkan.');
      await load();
    } catch (error) {
      onToast(error.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const toggleRoom = async (room) => {
    setBusy(true);
    try {
      await api(`/admin/rooms/${room.id}`, {
        method: 'PATCH',
        body: jsonBody({ buildingId: room.buildingId, code: room.code, name: room.name, floor: room.floor, capacity: room.capacity, facilities: room.facilities, isActive: !room.isActive }),
      });
      onToast(room.isActive ? 'Ruang dinonaktifkan.' : 'Ruang diaktifkan.');
      await load();
    } catch (error) {
      onToast(error.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="admin-section">
      <div className="section-heading">
        <div><span className="eyebrow">RUANG KERJA ADMIN</span><h2>Kelola operasional</h2><p>Kelola permohonan, akun staff, dan ketersediaan ruang.</p></div>
      </div>
      <div className="admin-tabs">
        <button className={tab === 'requests' ? 'selected' : ''} onClick={() => setTab('requests')}><Check size={16} />Persetujuan & akun</button>
        <button className={tab === 'rooms' ? 'selected' : ''} onClick={() => setTab('rooms')}><DoorOpen size={16} />Kelola ruang</button>
      </div>
      {tab === 'requests' ? (
        <div className="admin-grid">
          <div className="admin-card">
            <div className="admin-card-heading"><div><h3>Permohonan menunggu</h3><p>Periksa jadwal dan kebutuhan kegiatan.</p></div><span className="count-pill">{requests.length}</span></div>
            {requests.length ? requests.map((item) => (
              <div className="admin-list-item" key={item.id}>
                <div className="admin-item-main"><div className="admin-item-title">{item.eventName}<StatusBadge status={item.status} /></div>
                  <p>{item.requesterName} · {item.requesterNimNip} · {roleLabels[item.requesterRole]}</p>
                  <p><DoorOpen size={14} />{item.roomName}, {item.buildingName}</p>
                  <p><CalendarDays size={14} />{formatRange(item.startTime, item.endTime)} · {item.expectedAttendees || '—'} peserta</p>
                  {item.eventDescription && <p className="description-line">{item.eventDescription}</p>}
                </div>
                <div className="item-actions"><button className="button button-small button-primary" disabled={busy} onClick={() => decide(item.id, 'APPROVED')}>Setujui</button><button className="button button-small button-outline" disabled={busy} onClick={() => decide(item.id, 'REJECTED')}>Tolak</button></div>
              </div>
            )) : <EmptyState title="Semua sudah ditangani" text="Belum ada permohonan baru untuk ditinjau." />}
          </div>
          <div className="admin-card">
            <div className="admin-card-heading"><div><h3>Verifikasi staff</h3><p>Pastikan identitas sebelum mengaktifkan akses.</p></div><span className="count-pill">{users.length}</span></div>
            {users.length ? users.map((user) => (
              <div className="admin-list-item compact" key={user.id}>
                <div className="admin-item-main"><div className="admin-item-title">{user.fullName}</div><p>{user.nimNip} · {roleLabels[user.role]}</p><p>{user.phoneNumber || 'Nomor telepon belum dicantumkan'}</p></div>
                <div className="item-actions vertical"><button className="button button-small button-primary" disabled={busy} onClick={() => verify(user.id, 'VERIFIED')}>Verifikasi</button><button className="text-button danger-text" disabled={busy} onClick={() => verify(user.id, 'REJECTED')}>Tolak akun</button></div>
              </div>
            )) : <EmptyState title="Tidak ada verifikasi tertunda" text="Pendaftaran staff yang baru akan muncul di sini." />}
          </div>
        </div>
      ) : (
        <div className="admin-grid room-admin-grid">
          <div className="admin-card">
            <div className="admin-card-heading"><div><h3>Daftar ruang</h3><p>Nonaktifkan ruang sementara tanpa menghapus riwayat.</p></div><span className="count-pill">{rooms.length}</span></div>
            {rooms.map((room) => (
              <div className="admin-list-item compact" key={room.id}>
                <div className="admin-item-main"><div className="admin-item-title">{room.name}<span className={`active-dot ${room.isActive ? 'on' : ''}`} /></div><p>{room.code} · {room.buildingName}</p><p>Kapasitas {room.capacity} orang</p></div>
                <button className="button button-small button-outline" disabled={busy} onClick={() => toggleRoom(room)}>{room.isActive ? 'Nonaktifkan' : 'Aktifkan'}</button>
              </div>
            ))}
          </div>
          <div className="admin-card">
            <div className="admin-card-heading"><div><h3>Tambah ruang</h3><p>Pastikan kode ruang unik dan kapasitas sesuai.</p></div><Plus size={19} /></div>
            <form className="form-stack room-form" onSubmit={saveRoom}>
              <label>Gedung<select required value={roomForm.buildingId} onChange={(event) => setRoomForm({ ...roomForm, buildingId: event.target.value })}><option value="">Pilih gedung</option>{buildings.map((building) => <option key={building.id} value={building.id}>{building.name}</option>)}</select></label>
              <div className="form-row"><label>Kode ruang<input required maxLength="20" value={roomForm.code} onChange={(event) => setRoomForm({ ...roomForm, code: event.target.value })} /></label><label>Lantai<input type="number" min="0" value={roomForm.floor} onChange={(event) => setRoomForm({ ...roomForm, floor: event.target.value })} /></label></div>
              <label>Nama ruang<input required maxLength="100" value={roomForm.name} onChange={(event) => setRoomForm({ ...roomForm, name: event.target.value })} /></label>
              <label>Kapasitas<input required type="number" min="1" value={roomForm.capacity} onChange={(event) => setRoomForm({ ...roomForm, capacity: event.target.value })} /></label>
              <label>Fasilitas <span className="optional">(pisahkan dengan koma)</span><input value={roomForm.facilities} onChange={(event) => setRoomForm({ ...roomForm, facilities: event.target.value })} /></label>
              <button className="button button-primary" disabled={busy}>Simpan ruang<Plus size={16} /></button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

function EmptyState({ title, text }) {
  return <div className="empty-state"><div className="empty-icon"><CalendarDays size={19} /></div><strong>{title}</strong><p>{text}</p></div>;
}

function formatRange(start, end) {
  const date = new Date(start);
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  const timeOptions = { hour: '2-digit', minute: '2-digit' };
  return `${date.toLocaleDateString('id-ID', options)}, ${date.toLocaleTimeString('id-ID', timeOptions)}–${new Date(end).toLocaleTimeString('id-ID', timeOptions)}`;
}

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function App() {
  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [filters, setFilters] = useState({ buildings: [], zones: [] });
  const [reservations, setReservations] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [scheduleDate, setScheduleDate] = useState(() => formatLocalDate(new Date()));
  const [overview, setOverview] = useState({ pendingReservations: 0, pendingUsers: 0, activeRooms: 0 });
  const [tab, setTab] = useState('discover');
  const [search, setSearch] = useState('');
  const [buildingId, setBuildingId] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [minCapacity, setMinCapacity] = useState('');
  const [facility, setFacility] = useState('');
  const [dateFilter, setDateFilter] = useState({ startTime: '', endTime: '' });
  const [bookingRoom, setBookingRoom] = useState(null);
  const [bookingBusy, setBookingBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const notify = useCallback((message, type = 'success') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 4200);
  }, []);

  const loadRooms = useCallback(async () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (buildingId) params.set('buildingId', buildingId);
    if (zoneId) params.set('zoneId', zoneId);
    if (minCapacity) params.set('minCapacity', minCapacity);
    if (facility.trim()) params.set('facility', facility.trim());
    if (dateFilter.startTime && dateFilter.endTime) {
      params.set('startTime', dateFilter.startTime);
      params.set('endTime', dateFilter.endTime);
    }
    try {
      const { rooms: result } = await api(`/rooms?${params}`);
      setRooms(result);
    } catch (error) {
      notify(error.message, 'error');
    }
  }, [search, buildingId, zoneId, minCapacity, facility, dateFilter, notify]);

  const loadReservations = useCallback(async () => {
    if (!user) return;
    try {
      const results = await Promise.all([
        api('/reservations/mine'),
        ...(user.role === 'ADMIN' ? [api('/admin/overview')] : []),
      ]);
      setReservations(results[0].reservations);
      if (user.role === 'ADMIN') setOverview(results[1]);
    } catch (error) {
      notify(error.message, 'error');
    }
  }, [user, notify]);

  const loadSchedule = useCallback(async () => {
    if (!user || !['MANAGEMENT', 'ADMIN'].includes(user.role)) return;
    const start = new Date(`${scheduleDate}T00:00:00`);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    try {
      const params = new URLSearchParams({
        startTime: `${scheduleDate}T00:00`,
        endTime: `${formatLocalDate(end)}T00:00`,
      });
      const result = await api(`/reservations/schedule?${params}`);
      setSchedule(result.schedule);
    } catch (error) {
      notify(error.message, 'error');
    }
  }, [user, scheduleDate, notify]);

  useEffect(() => {
    api('/auth/me').then(({ user: currentUser }) => setUser(currentUser)).catch(() => {});
    api('/rooms/filters').then(setFilters).catch((error) => notify(error.message, 'error'));
  }, [notify]);

  useEffect(() => { loadRooms(); }, [loadRooms]);
  useEffect(() => { loadReservations(); }, [loadReservations]);
  useEffect(() => { if (tab === 'schedule') loadSchedule(); }, [tab, loadSchedule]);

  const login = async (data, register = false) => {
    setAuthBusy(true);
    setAuthError('');
    try {
      const response = await api(register ? '/auth/register' : '/auth/login', {
        method: 'POST',
        body: jsonBody(data),
      });
      if (response.user) {
        setUser(response.user);
        setAuthOpen(false);
        setTab('discover');
        notify(register ? 'Akun berhasil dibuat. Selamat datang!' : 'Anda berhasil masuk.');
      } else {
        setAuthError('');
        setAuthOpen(false);
        notify(response.message);
      }
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthBusy(false);
    }
  };

  const submitBooking = async (data) => {
    setBookingBusy(true);
    try {
      await api('/reservations', { method: 'POST', body: jsonBody(data) });
      setBookingRoom(null);
      setTab('reservations');
      notify('Permohonan terkirim. Admin kampus akan meninjau jadwal Anda.');
      await Promise.all([loadRooms(), loadReservations()]);
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setBookingBusy(false);
    }
  };

  const cancelReservation = async (id) => {
    try {
      await api(`/reservations/${id}/cancel`, { method: 'PATCH' });
      notify('Permohonan berhasil dibatalkan.');
      await Promise.all([loadRooms(), loadReservations()]);
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  const signOut = async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
      setUser(null);
      setTab('discover');
      notify('Anda telah keluar.');
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  if (authOpen) {
    return (
      <>
        <AuthScreen
          onLogin={(data) => login(data)}
          onRegister={(data) => login(data, true)}
          busy={authBusy}
          error={authError}
          onBack={() => { setAuthOpen(false); setAuthError(''); }}
        />
        <Toast toast={toast} onClose={() => setToast(null)} />
      </>
    );
  }

  const userName = user?.name?.split(' ')[0];
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="#" onClick={() => setTab('discover')}>
            <span className="brand-mark">U</span><span>UBB <b>SPACE</b></span>
          </a>
          <nav className="main-nav" aria-label="Navigasi utama">
            <button className={tab === 'discover' ? 'active' : ''} onClick={() => setTab('discover')}><Compass size={16} />Cari ruang</button>
            {user && <button className={tab === 'reservations' ? 'active' : ''} onClick={() => setTab('reservations')}><CalendarDays size={16} />Peminjaman</button>}
            {['MANAGEMENT', 'ADMIN'].includes(user?.role) && <button className={tab === 'schedule' ? 'active' : ''} onClick={() => setTab('schedule')}><Clock3 size={16} />Jadwal ruang</button>}
            {user?.role === 'ADMIN' && <button className={tab === 'admin' ? 'active' : ''} onClick={() => setTab('admin')}><LayoutDashboard size={16} />Panel admin{overview.pendingReservations + overview.pendingUsers > 0 && <span className="nav-count">{overview.pendingReservations + overview.pendingUsers}</span>}</button>}
          </nav>
          <div className="topbar-actions">
            {user ? (
              <>
                <div className="user-chip"><span className="avatar">{userName?.[0]?.toUpperCase()}</span><span className="user-chip-copy"><strong>{userName}</strong><small>{roleLabels[user.role]}</small></span><ChevronDown size={14} /></div>
                <button className="icon-button signout-button" onClick={signOut} title="Keluar"><LogOut size={17} /></button>
              </>
            ) : <button className="button button-primary sign-in-button" onClick={() => setAuthOpen(true)}>Masuk / Daftar<ArrowRight size={15} /></button>}
          </div>
          <button className="mobile-menu" onClick={() => setTab('discover')} aria-label="Menu"><Menu /></button>
        </div>
      </header>

      <main>
        {tab === 'discover' && (
          <>
            <section className="hero-section">
              <div className="hero-content">
                <span className="eyebrow eyebrow-light"><span className="pulse-dot" />SISTEM PEMINJAMAN RUANG UBB</span>
                <h1>Temukan ruang.<br /><em>Wujudkan kegiatan.</em></h1>
                <p>Satu tempat untuk mencari ketersediaan ruang, melihat lokasi, dan mengajukan peminjaman di Kampus Terpadu UBB.</p>
                <div className="hero-proof"><span><BadgeCheck size={16} />Data ruang terpusat</span><span><MapPin size={16} />Lokasi terpetakan</span></div>
              </div>
              <div className="hero-side-card">
                <div className="hero-stat-icon"><DoorOpen size={21} /></div>
                <span>RUANG TERSEDIA</span>
                <strong>{rooms.length.toString().padStart(2, '0')}<small> ruang</small></strong>
                <p>Jelajahi ruang kegiatan di area kampus.</p>
                <button onClick={() => document.getElementById('room-discovery')?.scrollIntoView({ behavior: 'smooth' })}>Lihat semua ruang<ArrowDownRight size={16} /></button>
              </div>
              <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
            </section>

            <section className="intro-strip">
              <div><span className="intro-number">01</span><strong>Cari dengan mudah</strong><p>Filter berdasarkan lokasi, kapasitas, dan fasilitas.</p></div>
              <div><span className="intro-number">02</span><strong>Cek sebelum meminjam</strong><p>Lihat ketersediaan dan lokasi ruang di peta.</p></div>
              <div><span className="intro-number">03</span><strong>Pantau pengajuan</strong><p>Ketahui status permohonan di satu dashboard.</p></div>
            </section>

            <section className="discovery-section content-width" id="room-discovery">
              <div className="section-heading discover-heading">
                <div><span className="eyebrow">KATALOG RUANG</span><h2>Ruang untuk setiap rencana.</h2><p>Temukan ruang kampus yang sesuai kebutuhan kegiatan Anda.</p></div>
                <span className="room-count"><strong>{rooms.length}</strong> ruang ditampilkan</span>
              </div>
              <div className="search-panel">
                <label className="search-field"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama ruang atau gedung" /></label>
                <label><span>Gedung</span><select value={buildingId} onChange={(event) => setBuildingId(event.target.value)}><option value="">Semua gedung</option>{filters.buildings.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
                <label><span>Kapasitas</span><select value={minCapacity} onChange={(event) => setMinCapacity(event.target.value)}><option value="">Berapa saja</option><option value="30">30+ orang</option><option value="50">50+ orang</option><option value="100">100+ orang</option></select></label>
                <button className="filter-toggle" onClick={() => document.getElementById('advanced-filters')?.classList.toggle('is-open')}><Filter size={17} /><span>Filter</span></button>
                <div className="advanced-filters" id="advanced-filters">
                  <label><span>Zona</span><select value={zoneId} onChange={(event) => setZoneId(event.target.value)}><option value="">Semua zona</option>{filters.zones.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
                  <label><span>Fasilitas</span><input value={facility} onChange={(event) => setFacility(event.target.value)} placeholder="Contoh: proyektor" /></label>
                  <label><span>Waktu mulai</span><input type="datetime-local" value={dateFilter.startTime} onChange={(event) => setDateFilter({ ...dateFilter, startTime: event.target.value })} /></label>
                  <label><span>Waktu selesai</span><input type="datetime-local" value={dateFilter.endTime} onChange={(event) => setDateFilter({ ...dateFilter, endTime: event.target.value })} /></label>
                </div>
              </div>
              <div className="discovery-layout">
                <div className="room-grid">
                  {rooms.length ? rooms.map((room) => <RoomCard key={room.id} room={room} onBook={(selected) => user ? setBookingRoom(selected) : setAuthOpen(true)} signedIn={Boolean(user)} />) : (
                    <div className="no-results"><Search size={22} /><strong>Belum ada ruang yang cocok</strong><p>Coba ubah filter atau waktu pencarian Anda.</p><button className="text-button" onClick={() => { setSearch(''); setBuildingId(''); setZoneId(''); setMinCapacity(''); setFacility(''); setDateFilter({ startTime: '', endTime: '' }); }}>Hapus semua filter</button></div>
                  )}
                </div>
                <aside className="map-card">
                  <div className="map-card-heading"><div><span className="eyebrow">LIHAT DI PETA</span><h3>Lokasi ruang</h3></div><span className="map-live-dot" /></div>
                  <RoomMap rooms={rooms} />
                  <p className="map-caption"><span><i className="legend-dot" />Gedung dengan ruang terdaftar</span><span>{new Set(rooms.map((room) => room.buildingId)).size} gedung</span></p>
                </aside>
              </div>
            </section>
          </>
        )}

        {tab === 'reservations' && user && (
          <section className="page-section content-width">
            <div className="section-heading"><div><span className="eyebrow">DASHBOARD PEMINJAM</span><h2>Peminjaman saya.</h2><p>Periksa perkembangan permohonan dan jadwal kegiatan Anda.</p></div><button className="button button-primary" onClick={() => { setTab('discover'); document.getElementById('room-discovery')?.scrollIntoView({ behavior: 'smooth' }); }}>Cari ruang<ArrowRight size={16} /></button></div>
            <div className="summary-row">
              <div className="summary-card"><span>Total permohonan</span><strong>{reservations.length}</strong><small>Semua pengajuan Anda</small></div>
              <div className="summary-card"><span>Menunggu keputusan</span><strong>{reservations.filter((item) => item.status === 'PENDING').length}</strong><small>Dalam tinjauan admin</small></div>
              <div className="summary-card"><span>Disetujui</span><strong>{reservations.filter((item) => item.status === 'APPROVED').length}</strong><small>Siap digunakan</small></div>
            </div>
            <div className="reservation-list">
              {reservations.length ? reservations.map((item) => (
                <article className="reservation-card" key={item.id}>
                  <div className="reservation-date"><span>{new Date(item.startTime).toLocaleDateString('id-ID', { month: 'short' }).toUpperCase()}</span><strong>{new Date(item.startTime).getDate()}</strong><small>{new Date(item.startTime).toLocaleDateString('id-ID', { weekday: 'long' })}</small></div>
                  <div className="reservation-main"><div className="reservation-title"><h3>{item.eventName}</h3><StatusBadge status={item.status} /></div><p><DoorOpen size={15} />{item.roomName} · {item.buildingName}</p><p><Clock3 size={15} />{formatRange(item.startTime, item.endTime)}</p>{item.eventDescription && <p className="reservation-description">{item.eventDescription}</p>}</div>
                  {item.status === 'PENDING' && <button className="button button-small button-outline cancel-button" onClick={() => cancelReservation(item.id)}>Batalkan</button>}
                </article>
              )) : <EmptyState title="Belum ada permohonan" text="Pengajuan ruang yang Anda kirim akan tercatat di halaman ini." />}
            </div>
          </section>
        )}

        {tab === 'schedule' && ['MANAGEMENT', 'ADMIN'].includes(user?.role) && (
          <section className="page-section content-width">
            <div className="section-heading">
              <div><span className="eyebrow">JADWAL FASILITAS</span><h2>Jadwal ruang kampus.</h2><p>Lihat slot yang sedang diminta atau sudah disetujui di semua ruang.</p></div>
              <label className="schedule-date">Pilih tanggal<input type="date" value={scheduleDate} onChange={(event) => setScheduleDate(event.target.value)} /></label>
            </div>
            <div className="reservation-list">
              {schedule.length ? schedule.map((item) => (
                <article className="reservation-card" key={item.id}>
                  <div className="reservation-date"><span>{new Date(item.startTime).toLocaleDateString('id-ID', { month: 'short' }).toUpperCase()}</span><strong>{new Date(item.startTime).getDate()}</strong><small>{new Date(item.startTime).toLocaleDateString('id-ID', { weekday: 'long' })}</small></div>
                  <div className="reservation-main">
                    <div className="reservation-title"><h3>{item.eventName}</h3><StatusBadge status={item.status} /></div>
                    <p><DoorOpen size={15} />{item.roomName} ({item.roomCode}) · {item.buildingName}</p>
                    <p><Clock3 size={15} />{new Date(item.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}–{new Date(item.endTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </article>
              )) : <EmptyState title="Belum ada jadwal pada tanggal ini" text="Slot yang diajukan atau telah disetujui akan tampil di sini." />}
            </div>
          </section>
        )}

        {tab === 'admin' && user?.role === 'ADMIN' && (
          <section className="page-section content-width">
            <div className="admin-welcome">
              <div><span className="eyebrow eyebrow-light">ADMINISTRASI KAMPUS</span><h1>Selamat datang, {userName}.</h1><p>Berikut ringkasan operasional UBB Space hari ini.</p></div>
              <div className="admin-shield"><ShieldCheck size={30} /><span>ADMIN KAMPUS</span></div>
            </div>
            <div className="summary-row admin-summary">
              <div className="summary-card"><span>Permohonan menunggu</span><strong>{overview.pendingReservations}</strong><small>Tinjau dan beri keputusan</small></div>
              <div className="summary-card"><span>Akun staff menunggu</span><strong>{overview.pendingUsers}</strong><small>Verifikasi identitas staff</small></div>
              <div className="summary-card"><span>Ruang aktif</span><strong>{overview.activeRooms}</strong><small>Tersedia di katalog</small></div>
            </div>
            <AdminPanel onToast={notify} />
          </section>
        )}
      </main>

      <footer className="site-footer">
        <div className="footer-main content-width"><a className="brand brand-light" href="#" onClick={() => setTab('discover')}><span className="brand-mark">U</span><span>UBB <b>SPACE</b></span></a><p>Satu ruang untuk setiap langkah baik di kampus.</p><span className="footer-university">UNIVERSITAS BANGKA BELITUNG</span></div>
        <div className="footer-bottom content-width"><span>© {new Date().getFullYear()} UBB Space · Prototipe layanan peminjaman ruang</span><span>Balunijuk, Kepulauan Bangka Belitung</span></div>
      </footer>
      {bookingRoom && <BookingModal room={bookingRoom} initialStart={dateFilter.startTime} initialEnd={dateFilter.endTime} onClose={() => setBookingRoom(null)} onSubmit={submitBooking} busy={bookingBusy} />}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export default App;
