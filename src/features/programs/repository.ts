import * as Crypto from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import type {
  ScheduleType,
  TrainingProgram,
  TrainingProgramInput,
} from './types';

type ProgramRow = {
  anchor_local_date: string;
  id: string;
  name: string;
  schedule_type: ScheduleType;
};

type ProgramDayRow = {
  id: string;
  is_rest: number;
  slot_index: number;
  workout_label: string | null;
};

export async function loadActiveTrainingProgram(
  db: SQLiteDatabase,
): Promise<TrainingProgram | null> {
  const program = await db.getFirstAsync<ProgramRow>(
    `SELECT id, name, schedule_type, anchor_local_date
       FROM training_programs
      WHERE status = 'active'
      LIMIT 1`,
  );
  if (!program) return null;

  const days = await db.getAllAsync<ProgramDayRow>(
    `SELECT id, slot_index, workout_label, is_rest
       FROM training_program_days
      WHERE program_id = ?
      ORDER BY slot_index ASC`,
    program.id,
  );

  return {
    anchorLocalDate: program.anchor_local_date,
    days: days.map((day) => ({
      id: day.id,
      isRest: day.is_rest === 1,
      label: day.workout_label,
      slotIndex: day.slot_index,
    })),
    id: program.id,
    name: program.name,
    scheduleType: program.schedule_type,
  };
}

export async function saveTrainingProgram(
  db: SQLiteDatabase,
  input: TrainingProgramInput,
) {
  await db.withExclusiveTransactionAsync(async (transaction) => {
    const timestamp = new Date().toISOString();
    const programId = Crypto.randomUUID();

    await transaction.runAsync(
      `UPDATE training_programs
          SET status = 'archived', updated_at_utc = ?
        WHERE status = 'active'`,
      timestamp,
    );
    await transaction.runAsync(
      `INSERT INTO training_programs
        (id, name, schedule_type, anchor_local_date, status, created_at_utc, updated_at_utc)
       VALUES (?, ?, ?, ?, 'active', ?, ?)`,
      programId,
      input.name,
      input.scheduleType,
      input.anchorLocalDate,
      timestamp,
      timestamp,
    );

    for (const day of input.days) {
      await transaction.runAsync(
        `INSERT INTO training_program_days
          (id, program_id, slot_index, workout_label, is_rest)
         VALUES (?, ?, ?, ?, ?)`,
        Crypto.randomUUID(),
        programId,
        day.slotIndex,
        day.label,
        day.isRest ? 1 : 0,
      );
    }
  });
}

export async function archiveActiveTrainingProgram(db: SQLiteDatabase) {
  await db.runAsync(
    `UPDATE training_programs
        SET status = 'archived', updated_at_utc = ?
      WHERE status = 'active'`,
    new Date().toISOString(),
  );
}
