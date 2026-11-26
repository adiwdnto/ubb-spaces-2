import test from 'node:test';
import assert from 'node:assert/strict';
import { hasTimeConflict, validateBookingWindow } from '../src/lib/booking.js';

test('booking window requires an increasing future time range', () => {
  const now = new Date('2030-01-01T01:00:00Z');
  assert.doesNotThrow(() => validateBookingWindow(
    '2030-01-01T09:00',
    '2030-01-01T10:00',
    now,
  ));
  assert.throws(() => validateBookingWindow(
    '2030-01-01T10:00',
    '2030-01-01T09:00',
    now,
  ), /setelah waktu mulai/);
  assert.throws(() => validateBookingWindow(
    '2030-01-01T07:00',
    '2030-01-01T09:00',
    now,
  ), /masa lalu/);
  assert.equal(validateBookingWindow('2030-01-01T09:00', '2030-01-01T10:00', now).start, '2030-01-01 09:00:00');
  assert.throws(() => validateBookingWindow('2030-02-30T09:00', '2030-02-30T10:00', now), /Tanggal dan waktu tidak valid/);
});

test('adjacent bookings do not overlap, intersecting bookings do', () => {
  const firstStart = '2030-01-01T09:00:00Z';
  const firstEnd = '2030-01-01T10:00:00Z';
  assert.equal(hasTimeConflict(firstStart, firstEnd, '2030-01-01T10:00:00Z', '2030-01-01T11:00:00Z'), false);
  assert.equal(hasTimeConflict(firstStart, firstEnd, '2030-01-01T09:30:00Z', '2030-01-01T10:30:00Z'), true);
});
