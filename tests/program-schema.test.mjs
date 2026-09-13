import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

import {
  ATTENDANCE_SCHEMA_V1,
  TRAINING_PROGRAM_SCHEMA_V3,
  WORKOUT_SCHEMA_V2,
} from '../src/database/schema.ts';

function createDatabase() {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(ATTENDANCE_SCHEMA_V1);
  db.exec(WORKOUT_SCHEMA_V2);
  db.exec(TRAINING_PROGRAM_SCHEMA_V3);
  return db;
}

function insertProgram(db, id = 'program-one', status = 'active') {
  db.prepare(`
    INSERT INTO training_programs
      (id, name, schedule_type, anchor_local_date, status, created_at_utc, updated_at_utc)
    VALUES (?, 'Push Pull Legs', 'weekly', '2026-09-14', ?,
            '2026-09-14T00:00:00.000Z', '2026-09-14T00:00:00.000Z')
  `).run(id, status);
}

test('allows exactly one active program', () => {
  const db = createDatabase();
  insertProgram(db);
  assert.throws(() => insertProgram(db, 'program-two'));
  insertProgram(db, 'program-archived', 'archived');
  db.close();
});

test('enforces rest and training day labels', () => {
  const db = createDatabase();
  insertProgram(db);
  const insert = db.prepare(`
    INSERT INTO training_program_days
      (id, program_id, slot_index, workout_label, is_rest)
    VALUES (?, 'program-one', ?, ?, ?)
  `);

  insert.run('push-day', 0, 'Push', 0);
  insert.run('rest-day', 1, null, 1);
  assert.throws(() => insert.run('invalid-rest', 2, 'Rest', 1));
  assert.throws(() => insert.run('invalid-training', 3, null, 0));
  db.close();
});

test('keeps copied workout label when a linked program is deleted', () => {
  const db = createDatabase();
  insertProgram(db);
  db.prepare(`
    INSERT INTO training_program_days
      (id, program_id, slot_index, workout_label, is_rest)
    VALUES ('push-day', 'program-one', 0, 'Push', 0)
  `).run();
  db.prepare(`
    INSERT INTO workout_sessions
      (id, status, started_at_utc, completed_at_utc, created_at_utc,
       program_day_id, session_label)
    VALUES ('session-one', 'completed', '2026-09-14T01:00:00.000Z',
            '2026-09-14T02:00:00.000Z', '2026-09-14T01:00:00.000Z',
            'push-day', 'Push')
  `).run();

  db.prepare(`DELETE FROM training_programs WHERE id = 'program-one'`).run();
  const session = db
    .prepare(`SELECT program_day_id, session_label FROM workout_sessions`)
    .get();
  assert.equal(session.program_day_id, null);
  assert.equal(session.session_label, 'Push');
  db.close();
});
