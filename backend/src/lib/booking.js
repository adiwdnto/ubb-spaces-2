const LOCAL_UTC_OFFSET = '+07:00';

export function parseCampusDateTime(value) {
  if (typeof value !== 'string') {
    throw new Error('Tanggal dan waktu harus menggunakan format yang valid.');
  }
  const match = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::(\d{2}))?$/);
  if (!match) {
    throw new Error('Tanggal dan waktu harus menggunakan format lokal kampus.');
  }
  const [, date, time, seconds = '00'] = match;
  const localValue = `${date}T${time}:${seconds}`;
  const instant = new Date(`${localValue}${LOCAL_UTC_OFFSET}`);
  if (Number.isNaN(instant.getTime())) {
    throw new Error('Tanggal dan waktu tidak valid.');
  }
  const roundTrip = new Date(instant.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 19);
  if (roundTrip !== localValue) {
    throw new Error('Tanggal dan waktu tidak valid.');
  }
  return { instant, sql: `${date} ${time}:${seconds}` };
}

export function validateBookingWindow(startTime, endTime, now = new Date()) {
  if (!startTime || !endTime) {
    throw new Error('Tanggal dan waktu mulai serta selesai wajib diisi.');
  }
  const start = parseCampusDateTime(startTime);
  const end = parseCampusDateTime(endTime);
  if (start.instant >= end.instant) {
    throw new Error('Waktu selesai harus setelah waktu mulai.');
  }
  if (start.instant < now) {
    throw new Error('Waktu mulai tidak boleh berada di masa lalu.');
  }
  return { start: start.sql, end: end.sql };
}

export function hasTimeConflict(start, end, existingStart, existingEnd) {
  return new Date(existingStart) < new Date(end) && new Date(existingEnd) > new Date(start);
}
