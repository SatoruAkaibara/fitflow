import { isValidLocalDateKey } from './dates.ts';
import type { TrainingProgramInput } from './types';

export type ProgramValidationResult =
  | { ok: true; value: TrainingProgramInput }
  | { error: string; ok: false };

export function validateTrainingProgram(
  input: TrainingProgramInput,
): ProgramValidationResult {
  const name = input.name.trim().replace(/\s+/g, ' ');
  if (!name || name.length > 60) {
    return { error: 'Program name must be 1–60 characters.', ok: false };
  }

  if (!isValidLocalDateKey(input.anchorLocalDate)) {
    return { error: 'Start date must use YYYY-MM-DD.', ok: false };
  }

  const requiredDays = input.scheduleType === 'weekly' ? 7 : 2;
  if (
    input.days.length !== requiredDays ||
    input.days.some((day, index) => day.slotIndex !== index)
  ) {
    return { error: 'The program schedule is incomplete.', ok: false };
  }

  const days = input.days.map((day) => {
    const label = day.label?.trim().replace(/\s+/g, ' ') ?? null;
    return { ...day, label: day.isRest ? null : label };
  });
  const invalidTrainingDay = days.find(
    (day) => !day.isRest && (!day.label || day.label.length > 40),
  );
  if (invalidTrainingDay) {
    return { error: 'Every training day needs a label up to 40 characters.', ok: false };
  }

  if (days.every((day) => day.isRest)) {
    return { error: 'Choose at least one training day.', ok: false };
  }

  return {
    ok: true,
    value: { ...input, days, name },
  };
}
