import type { SQLiteDatabase } from 'expo-sqlite';

import {
  ATTENDANCE_SCHEMA_V1,
  TRAINING_PROGRAM_SCHEMA_V3,
  WORKOUT_SCHEMA_V2,
} from './schema';

const DATABASE_VERSION = 3;

export async function migrateDatabase(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

  const result = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version',
  );
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) {
    return;
  }

  if (currentVersion === 0) {
    await db.execAsync(ATTENDANCE_SCHEMA_V1);
  }

  if (currentVersion < 2) {
    await db.execAsync(WORKOUT_SCHEMA_V2);
  }

  if (currentVersion < 3) {
    await db.execAsync(TRAINING_PROGRAM_SCHEMA_V3);
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
