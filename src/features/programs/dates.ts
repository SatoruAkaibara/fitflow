import { getLocalDateKey } from '../attendance/dates.ts';
import type { PlannedProgramDay, TrainingProgram } from './types';

const DAY_MILLISECONDS = 86400000;

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function parseLocalDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

function calendarDayNumber(date: Date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MILLISECONDS;
}

function positiveModulo(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor;
}

export function getProgramSlotIndex(program: TrainingProgram, date: Date) {
  if (program.scheduleType === 'weekly') {
    return (date.getDay() + 6) % 7;
  }

  const anchor = parseLocalDateKey(program.anchorLocalDate);
  const daysFromAnchor = calendarDayNumber(date) - calendarDayNumber(anchor);
  return positiveModulo(daysFromAnchor, program.days.length);
}

export function getPlannedProgramDay(
  program: TrainingProgram,
  date: Date,
): PlannedProgramDay {
  const slotIndex = getProgramSlotIndex(program, date);
  const day = program.days.find((candidate) => candidate.slotIndex === slotIndex);
  if (!day) {
    throw new Error('The active program has an incomplete schedule.');
  }

  return {
    dateKey: getLocalDateKey(date),
    day,
    isToday: getLocalDateKey(date) === getLocalDateKey(new Date()),
    weekdayLabel: WEEKDAY_LABELS[(date.getDay() + 6) % 7],
  };
}

export function getUpcomingProgramDays(
  program: TrainingProgram,
  referenceDate = new Date(),
  totalDays = 8,
) {
  return Array.from({ length: totalDays }, (_, offset) => {
    const date = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      referenceDate.getDate() + offset,
      12,
    );
    return getPlannedProgramDay(program, date);
  });
}

export function isValidLocalDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return getLocalDateKey(parseLocalDateKey(value)) === value;
}
