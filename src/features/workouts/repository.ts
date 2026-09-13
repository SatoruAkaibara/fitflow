import * as Crypto from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import {
  getDeviceTimeZone,
  getLocalDateKey,
} from '../attendance/dates';

export type WorkoutSet = {
  id: string;
  isCompleted: boolean;
  reps: number | null;
  setNumber: number;
  weightKg: number | null;
};

export type WorkoutExercise = {
  id: string;
  name: string;
  orderIndex: number;
  sets: WorkoutSet[];
};

export type WorkoutSession = {
  exercises: WorkoutExercise[];
  id: string;
  sessionLabel: string | null;
  startedAtUtc: string;
  status: 'active';
};

export type PlannedWorkout = {
  programDayId: string;
  sessionLabel: string;
};

type SessionRow = {
  id: string;
  session_label: string | null;
  started_at_utc: string;
};

type ExerciseRow = {
  exercise_name: string;
  id: string;
  order_index: number;
};

type SetRow = {
  exercise_id: string;
  id: string;
  is_completed: number;
  reps: number | null;
  set_number: number;
  weight_kg: number | null;
};

export class WorkoutRepositoryError extends Error {}

export async function loadActiveWorkout(
  db: SQLiteDatabase,
): Promise<WorkoutSession | null> {
  const session = await db.getFirstAsync<SessionRow>(
    `SELECT id, started_at_utc, session_label
       FROM workout_sessions
      WHERE status = 'active'
      LIMIT 1`,
  );

  if (!session) return null;

  const exercises = await db.getAllAsync<ExerciseRow>(
    `SELECT id, exercise_name, order_index
       FROM workout_exercises
      WHERE session_id = ?
      ORDER BY order_index ASC`,
    session.id,
  );

  const sets = await db.getAllAsync<SetRow>(
    `SELECT exercise_sets.id,
            exercise_sets.exercise_id,
            exercise_sets.set_number,
            exercise_sets.weight_kg,
            exercise_sets.reps,
            exercise_sets.is_completed
       FROM exercise_sets
       JOIN workout_exercises
         ON workout_exercises.id = exercise_sets.exercise_id
      WHERE workout_exercises.session_id = ?
      ORDER BY workout_exercises.order_index ASC, exercise_sets.set_number ASC`,
    session.id,
  );

  return {
    exercises: exercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.exercise_name,
      orderIndex: exercise.order_index,
      sets: sets
        .filter((set) => set.exercise_id === exercise.id)
        .map((set) => ({
          id: set.id,
          isCompleted: set.is_completed === 1,
          reps: set.reps,
          setNumber: set.set_number,
          weightKg: set.weight_kg,
        })),
    })),
    id: session.id,
    sessionLabel: session.session_label,
    startedAtUtc: session.started_at_utc,
    status: 'active',
  };
}

export async function startWorkout(
  db: SQLiteDatabase,
  plannedWorkout?: PlannedWorkout,
  now = new Date(),
) {
  const timestamp = now.toISOString();

  await db.withExclusiveTransactionAsync(async (transaction) => {
    await transaction.runAsync(
      `INSERT OR IGNORE INTO workout_sessions
        (id, status, started_at_utc, completed_at_utc, created_at_utc,
         program_day_id, session_label)
       VALUES (?, 'active', ?, NULL, ?, ?, ?)`,
      Crypto.randomUUID(),
      timestamp,
      timestamp,
      plannedWorkout?.programDayId ?? null,
      plannedWorkout?.sessionLabel ?? null,
    );
  });
}

export async function addExercise(
  db: SQLiteDatabase,
  sessionId: string,
  name: string,
) {
  await db.withExclusiveTransactionAsync(async (transaction) => {
    const session = await transaction.getFirstAsync<{ id: string }>(
      `SELECT id FROM workout_sessions WHERE id = ? AND status = 'active'`,
      sessionId,
    );
    if (!session) throw new WorkoutRepositoryError('This workout is no longer active.');

    const order = await transaction.getFirstAsync<{ next_order: number }>(
      `SELECT COALESCE(MAX(order_index), -1) + 1 AS next_order
         FROM workout_exercises
        WHERE session_id = ?`,
      sessionId,
    );
    const exerciseId = Crypto.randomUUID();
    const timestamp = new Date().toISOString();

    await transaction.runAsync(
      `INSERT INTO workout_exercises
        (id, session_id, exercise_name, order_index, created_at_utc)
       VALUES (?, ?, ?, ?, ?)`,
      exerciseId,
      sessionId,
      name,
      order?.next_order ?? 0,
      timestamp,
    );
    await transaction.runAsync(
      `INSERT INTO exercise_sets
        (id, exercise_id, set_number, weight_kg, reps, is_completed, created_at_utc)
       VALUES (?, ?, 1, NULL, NULL, 0, ?)`,
      Crypto.randomUUID(),
      exerciseId,
      timestamp,
    );
  });
}

export async function renameExercise(
  db: SQLiteDatabase,
  exerciseId: string,
  name: string,
) {
  await db.runAsync(
    `UPDATE workout_exercises
        SET exercise_name = ?
      WHERE id = ?
        AND session_id IN (SELECT id FROM workout_sessions WHERE status = 'active')`,
    name,
    exerciseId,
  );
}

export async function moveExercise(
  db: SQLiteDatabase,
  sessionId: string,
  exerciseId: string,
  direction: -1 | 1,
) {
  await db.withExclusiveTransactionAsync(async (transaction) => {
    const current = await transaction.getFirstAsync<{ order_index: number }>(
      `SELECT order_index FROM workout_exercises WHERE id = ? AND session_id = ?`,
      exerciseId,
      sessionId,
    );
    if (!current) return;

    const targetIndex = current.order_index + direction;
    const target = await transaction.getFirstAsync<{ id: string }>(
      `SELECT id FROM workout_exercises WHERE session_id = ? AND order_index = ?`,
      sessionId,
      targetIndex,
    );
    if (!target) return;

    await transaction.runAsync(
      `UPDATE workout_exercises SET order_index = 2147483647 WHERE id = ?`,
      exerciseId,
    );
    await transaction.runAsync(
      `UPDATE workout_exercises SET order_index = ? WHERE id = ?`,
      current.order_index,
      target.id,
    );
    await transaction.runAsync(
      `UPDATE workout_exercises SET order_index = ? WHERE id = ?`,
      targetIndex,
      exerciseId,
    );
  });
}

export async function removeExercise(
  db: SQLiteDatabase,
  sessionId: string,
  exerciseId: string,
) {
  await db.withExclusiveTransactionAsync(async (transaction) => {
    const exercise = await transaction.getFirstAsync<{ order_index: number }>(
      `SELECT order_index FROM workout_exercises WHERE id = ? AND session_id = ?`,
      exerciseId,
      sessionId,
    );
    if (!exercise) return;

    await transaction.runAsync(`DELETE FROM workout_exercises WHERE id = ?`, exerciseId);
    await transaction.runAsync(
      `UPDATE workout_exercises
          SET order_index = order_index + 1000000
        WHERE session_id = ? AND order_index > ?`,
      sessionId,
      exercise.order_index,
    );
    await transaction.runAsync(
      `UPDATE workout_exercises
          SET order_index = order_index - 1000001
        WHERE session_id = ? AND order_index >= 1000000`,
      sessionId,
    );
  });
}

export async function addSet(db: SQLiteDatabase, exerciseId: string) {
  await db.withExclusiveTransactionAsync(async (transaction) => {
    const next = await transaction.getFirstAsync<{ next_number: number }>(
      `SELECT COALESCE(MAX(set_number), 0) + 1 AS next_number
         FROM exercise_sets
        WHERE exercise_id = ?`,
      exerciseId,
    );
    await transaction.runAsync(
      `INSERT INTO exercise_sets
        (id, exercise_id, set_number, weight_kg, reps, is_completed, created_at_utc)
       VALUES (?, ?, ?, NULL, NULL, 0, ?)`,
      Crypto.randomUUID(),
      exerciseId,
      next?.next_number ?? 1,
      new Date().toISOString(),
    );
  });
}

export async function saveSetDraft(
  db: SQLiteDatabase,
  setId: string,
  weightKg: number | null,
  reps: number | null,
) {
  await db.runAsync(
    `UPDATE exercise_sets
        SET weight_kg = ?, reps = ?
      WHERE id = ? AND is_completed = 0`,
    weightKg,
    reps,
    setId,
  );
}

export async function completeSet(
  db: SQLiteDatabase,
  setId: string,
  weightKg: number,
  reps: number,
) {
  await db.runAsync(
    `UPDATE exercise_sets
        SET weight_kg = ?, reps = ?, is_completed = 1
      WHERE id = ?`,
    weightKg,
    reps,
    setId,
  );
}

export async function uncompleteSet(db: SQLiteDatabase, setId: string) {
  await db.runAsync(`UPDATE exercise_sets SET is_completed = 0 WHERE id = ?`, setId);
}

export async function removeSet(
  db: SQLiteDatabase,
  exerciseId: string,
  setId: string,
) {
  await db.withExclusiveTransactionAsync(async (transaction) => {
    const set = await transaction.getFirstAsync<{ set_number: number }>(
      `SELECT set_number FROM exercise_sets WHERE id = ? AND exercise_id = ?`,
      setId,
      exerciseId,
    );
    if (!set) return;

    await transaction.runAsync(`DELETE FROM exercise_sets WHERE id = ?`, setId);
    await transaction.runAsync(
      `UPDATE exercise_sets
          SET set_number = set_number + 1000
        WHERE exercise_id = ? AND set_number > ?`,
      exerciseId,
      set.set_number,
    );
    await transaction.runAsync(
      `UPDATE exercise_sets
          SET set_number = set_number - 1001
        WHERE exercise_id = ? AND set_number >= 1000`,
      exerciseId,
    );
  });
}

export async function finishWorkout(
  db: SQLiteDatabase,
  sessionId: string,
  now = new Date(),
) {
  await db.withExclusiveTransactionAsync(async (transaction) => {
    const completed = await transaction.getFirstAsync<{ total: number }>(
      `SELECT COUNT(*) AS total
         FROM exercise_sets
         JOIN workout_exercises ON workout_exercises.id = exercise_sets.exercise_id
        WHERE workout_exercises.session_id = ? AND exercise_sets.is_completed = 1`,
      sessionId,
    );
    if (!completed?.total) {
      throw new WorkoutRepositoryError('Complete at least one set before finishing.');
    }

    await transaction.runAsync(
      `DELETE FROM exercise_sets
        WHERE weight_kg IS NULL AND reps IS NULL AND is_completed = 0
          AND exercise_id IN (SELECT id FROM workout_exercises WHERE session_id = ?)`,
      sessionId,
    );

    const timestamp = now.toISOString();
    const result = await transaction.runAsync(
      `UPDATE workout_sessions
          SET status = 'completed', completed_at_utc = ?
        WHERE id = ? AND status = 'active'`,
      timestamp,
      sessionId,
    );
    if (result.changes !== 1) {
      throw new WorkoutRepositoryError('This workout is no longer active.');
    }

    await transaction.runAsync(
      `INSERT INTO attendance_records
        (id, local_date, checked_in_at_utc, timezone, source, created_at_utc)
       VALUES (?, ?, ?, ?, 'workout', ?)
       ON CONFLICT(local_date) DO UPDATE SET source = 'workout'`,
      Crypto.randomUUID(),
      getLocalDateKey(now),
      timestamp,
      getDeviceTimeZone(),
      timestamp,
    );
  });
}

export async function discardWorkout(db: SQLiteDatabase, sessionId: string) {
  await db.runAsync(
    `DELETE FROM workout_sessions WHERE id = ? AND status = 'active'`,
    sessionId,
  );
}
