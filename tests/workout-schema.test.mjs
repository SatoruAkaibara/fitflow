import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

import {
  ATTENDANCE_SCHEMA_V1,
  WORKOUT_SCHEMA_V2,
} from '../src/database/schema.ts';

function createDatabase() {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(ATTENDANCE_SCHEMA_V1);
  db.exec(WORKOUT_SCHEMA_V2);
  return db;
}

function insertSession(db, id = 'session-one', status = 'active') {
  db.prepare(`
    INSERT INTO workout_sessions
      (id, status, started_at_utc, completed_at_utc, created_at_utc)
    VALUES (?, ?, '2026-09-13T10:00:00.000Z', NULL, '2026-09-13T10:00:00.000Z')
  `).run(id, status);
}

function insertExercise(db, id = 'exercise-one') {
  db.prepare(`
    INSERT INTO workout_exercises
      (id, session_id, exercise_name, order_index, created_at_utc)
    VALUES (?, 'session-one', 'Back squat', 0, '2026-09-13T10:01:00.000Z')
  `).run(id);
}

test('allows only one active workout', () => {
  const db = createDatabase();
  insertSession(db);

  assert.throws(() => insertSession(db, 'session-two'));
  insertSession(db, 'session-complete', 'completed');
  db.close();
});

test('requires valid values before a set is completed', () => {
  const db = createDatabase();
  insertSession(db);
  insertExercise(db);
  const insert = db.prepare(`
    INSERT INTO exercise_sets
      (id, exercise_id, set_number, weight_kg, reps, is_completed, created_at_utc)
    VALUES (?, 'exercise-one', 1, ?, ?, ?, '2026-09-13T10:02:00.000Z')
  `);

  assert.throws(() => insert.run('invalid-empty', null, null, 1));
  assert.throws(() => insert.run('invalid-weight', 1000, 10, 1));
  assert.throws(() => insert.run('invalid-reps', 20, 0, 1));
  insert.run('valid-set', 0, 12, 1);
  db.close();
});

test('cascades discarded workouts through exercises and sets', () => {
  const db = createDatabase();
  insertSession(db);
  insertExercise(db);
  db.prepare(`
    INSERT INTO exercise_sets
      (id, exercise_id, set_number, weight_kg, reps, is_completed, created_at_utc)
    VALUES ('set-one', 'exercise-one', 1, 50, 8, 1, '2026-09-13T10:02:00.000Z')
  `).run();

  db.prepare(`DELETE FROM workout_sessions WHERE id = 'session-one'`).run();

  assert.equal(db.prepare('SELECT COUNT(*) AS total FROM workout_exercises').get().total, 0);
  assert.equal(db.prepare('SELECT COUNT(*) AS total FROM exercise_sets').get().total, 0);
  db.close();
});
