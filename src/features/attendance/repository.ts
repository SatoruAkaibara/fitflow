import * as Crypto from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import {
  getDeviceTimeZone,
  getLocalDateKey,
  getRollingHeatmapDateRange,
} from './dates';

export type AttendanceRecord = {
  id: string;
  localDate: string;
  checkedInAtUtc: string;
  timezone: string;
  source: 'manual' | 'workout';
  createdAtUtc: string;
};

type AttendanceRow = {
  id: string;
  local_date: string;
  checked_in_at_utc: string;
  timezone: string;
  source: AttendanceRecord['source'];
  created_at_utc: string;
};

const mapRow = (row: AttendanceRow): AttendanceRecord => ({
  id: row.id,
  localDate: row.local_date,
  checkedInAtUtc: row.checked_in_at_utc,
  timezone: row.timezone,
  source: row.source,
  createdAtUtc: row.created_at_utc,
});

export async function listAttendanceForHeatmap(
  db: SQLiteDatabase,
  referenceDate: Date,
) {
  const { startDateKey, endDateKey } = getRollingHeatmapDateRange(referenceDate);
  const rows = await db.getAllAsync<AttendanceRow>(
    `SELECT id, local_date, checked_in_at_utc, timezone, source, created_at_utc
       FROM attendance_records
      WHERE local_date >= ? AND local_date < ?
      ORDER BY local_date ASC`,
    startDateKey,
    endDateKey,
  );

  return rows.map(mapRow);
}

export async function createManualAttendance(
  db: SQLiteDatabase,
  now = new Date(),
) {
  const isoTimestamp = now.toISOString();

  await db.runAsync(
    `INSERT OR IGNORE INTO attendance_records
      (id, local_date, checked_in_at_utc, timezone, source, created_at_utc)
     VALUES (?, ?, ?, ?, 'manual', ?)`,
    Crypto.randomUUID(),
    getLocalDateKey(now),
    isoTimestamp,
    getDeviceTimeZone(),
    isoTimestamp,
  );
}

export async function deleteManualAttendanceForDate(
  db: SQLiteDatabase,
  localDate: string,
) {
  await db.runAsync(
    `DELETE FROM attendance_records
      WHERE local_date = ? AND source = 'manual'`,
    localDate,
  );
}
