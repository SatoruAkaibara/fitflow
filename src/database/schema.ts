export const ATTENDANCE_SCHEMA_V1 = `
  CREATE TABLE IF NOT EXISTS attendance_records (
    id TEXT PRIMARY KEY NOT NULL,
    local_date TEXT NOT NULL UNIQUE,
    checked_in_at_utc TEXT NOT NULL,
    timezone TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'manual'
      CHECK (source IN ('manual', 'workout')),
    created_at_utc TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS attendance_records_local_date_idx
    ON attendance_records (local_date);
`;

export const WORKOUT_SCHEMA_V2 = `
  CREATE TABLE IF NOT EXISTS workout_sessions (
    id TEXT PRIMARY KEY NOT NULL,
    status TEXT NOT NULL DEFAULT 'active'
      CHECK (status IN ('active', 'completed')),
    started_at_utc TEXT NOT NULL,
    completed_at_utc TEXT,
    created_at_utc TEXT NOT NULL
  );

  CREATE UNIQUE INDEX IF NOT EXISTS workout_sessions_single_active_idx
    ON workout_sessions (status)
    WHERE status = 'active';

  CREATE TABLE IF NOT EXISTS workout_exercises (
    id TEXT PRIMARY KEY NOT NULL,
    session_id TEXT NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
    exercise_name TEXT NOT NULL CHECK (length(trim(exercise_name)) BETWEEN 1 AND 80),
    order_index INTEGER NOT NULL CHECK (order_index >= 0),
    created_at_utc TEXT NOT NULL,
    UNIQUE (session_id, order_index)
  );

  CREATE INDEX IF NOT EXISTS workout_exercises_session_idx
    ON workout_exercises (session_id, order_index);

  CREATE TABLE IF NOT EXISTS exercise_sets (
    id TEXT PRIMARY KEY NOT NULL,
    exercise_id TEXT NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
    set_number INTEGER NOT NULL CHECK (set_number >= 1),
    weight_kg REAL CHECK (weight_kg IS NULL OR (weight_kg >= 0 AND weight_kg <= 999.99)),
    reps INTEGER CHECK (reps IS NULL OR (reps >= 1 AND reps <= 999)),
    is_completed INTEGER NOT NULL DEFAULT 0 CHECK (is_completed IN (0, 1)),
    created_at_utc TEXT NOT NULL,
    CHECK (is_completed = 0 OR (weight_kg IS NOT NULL AND reps IS NOT NULL)),
    UNIQUE (exercise_id, set_number)
  );

  CREATE INDEX IF NOT EXISTS exercise_sets_exercise_idx
    ON exercise_sets (exercise_id, set_number);
`;

export const TRAINING_PROGRAM_SCHEMA_V3 = `
  CREATE TABLE IF NOT EXISTS training_programs (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 60),
    schedule_type TEXT NOT NULL CHECK (schedule_type IN ('weekly', 'alternating')),
    anchor_local_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at_utc TEXT NOT NULL,
    updated_at_utc TEXT NOT NULL
  );

  CREATE UNIQUE INDEX IF NOT EXISTS training_programs_single_active_idx
    ON training_programs (status)
    WHERE status = 'active';

  CREATE TABLE IF NOT EXISTS training_program_days (
    id TEXT PRIMARY KEY NOT NULL,
    program_id TEXT NOT NULL REFERENCES training_programs(id) ON DELETE CASCADE,
    slot_index INTEGER NOT NULL CHECK (slot_index >= 0 AND slot_index <= 6),
    workout_label TEXT CHECK (workout_label IS NULL OR length(trim(workout_label)) BETWEEN 1 AND 40),
    is_rest INTEGER NOT NULL DEFAULT 0 CHECK (is_rest IN (0, 1)),
    CHECK (
      (is_rest = 1 AND workout_label IS NULL) OR
      (is_rest = 0 AND workout_label IS NOT NULL)
    ),
    UNIQUE (program_id, slot_index)
  );

  CREATE INDEX IF NOT EXISTS training_program_days_program_idx
    ON training_program_days (program_id, slot_index);

  ALTER TABLE workout_sessions ADD COLUMN program_day_id TEXT
    REFERENCES training_program_days(id) ON DELETE SET NULL;
  ALTER TABLE workout_sessions ADD COLUMN session_label TEXT
    CHECK (session_label IS NULL OR length(trim(session_label)) BETWEEN 1 AND 40);
`;
