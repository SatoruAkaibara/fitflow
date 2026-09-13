import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

import { ATTENDANCE_SCHEMA_V1 } from '../src/database/schema.ts';

const validRecord = [
  'record-one',
  '2026-09-13',
  '2026-09-13T10:30:00.000Z',
  'Asia/Singapore',
  'manual',
  '2026-09-13T10:30:00.000Z',
];

function createDatabase() {
  const db = new DatabaseSync(':memory:');
  db.exec(ATTENDANCE_SCHEMA_V1);
  return db;
}

test('stores one valid attendance record', () => {
  const db = createDatabase();
  const insert = db.prepare(`
    INSERT INTO attendance_records
      (id, local_date, checked_in_at_utc, timezone, source, created_at_utc)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insert.run(...validRecord);

  const row = db.prepare('SELECT * FROM attendance_records').get();
  assert.equal(row.local_date, '2026-09-13');
  assert.equal(row.timezone, 'Asia/Singapore');
  db.close();
});

test('rejects a duplicate local calendar date', () => {
  const db = createDatabase();
  const insert = db.prepare(`
    INSERT INTO attendance_records
      (id, local_date, checked_in_at_utc, timezone, source, created_at_utc)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insert.run(...validRecord);
  assert.throws(() => insert.run('record-two', ...validRecord.slice(1)));
  db.close();
});

test('rejects an unsupported attendance source', () => {
  const db = createDatabase();
  const insert = db.prepare(`
    INSERT INTO attendance_records
      (id, local_date, checked_in_at_utc, timezone, source, created_at_utc)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  assert.throws(() =>
    insert.run(
      'record-invalid',
      '2026-09-14',
      '2026-09-14T10:30:00.000Z',
      'Asia/Singapore',
      'location',
      '2026-09-14T10:30:00.000Z',
    ),
  );
  db.close();
});
