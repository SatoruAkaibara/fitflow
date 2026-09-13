import { getLocalDateKey } from '../attendance/dates.ts';
import type {
  ProgramDayDraft,
  ProgramPresetId,
  ScheduleType,
  TrainingProgramInput,
} from './types';

const restDay = (slotIndex: number): ProgramDayDraft => ({
  isRest: true,
  label: null,
  slotIndex,
});

const trainingDay = (slotIndex: number, label: string): ProgramDayDraft => ({
  isRest: false,
  label,
  slotIndex,
});

export const PROGRAM_PRESETS: {
  id: ProgramPresetId;
  label: string;
  name: string;
  scheduleType: ScheduleType;
}[] = [
  { id: 'ppl', label: 'PPL', name: 'Push Pull Legs', scheduleType: 'weekly' },
  {
    id: 'upper_lower',
    label: 'Upper / Lower',
    name: 'Upper Lower',
    scheduleType: 'weekly',
  },
  {
    id: 'fbeod',
    label: 'FBEOD',
    name: 'Full Body Every Other Day',
    scheduleType: 'alternating',
  },
  { id: 'custom', label: 'Custom', name: 'My Program', scheduleType: 'weekly' },
];

export function createPresetProgram(
  presetId: ProgramPresetId,
  referenceDate = new Date(),
): TrainingProgramInput {
  const anchorLocalDate = getLocalDateKey(referenceDate);

  if (presetId === 'ppl') {
    return {
      anchorLocalDate,
      days: [
        trainingDay(0, 'Push'),
        trainingDay(1, 'Pull'),
        trainingDay(2, 'Legs'),
        trainingDay(3, 'Push'),
        trainingDay(4, 'Pull'),
        trainingDay(5, 'Legs'),
        restDay(6),
      ],
      name: 'Push Pull Legs',
      scheduleType: 'weekly',
    };
  }

  if (presetId === 'upper_lower') {
    return {
      anchorLocalDate,
      days: [
        trainingDay(0, 'Upper'),
        trainingDay(1, 'Lower'),
        restDay(2),
        trainingDay(3, 'Upper'),
        trainingDay(4, 'Lower'),
        restDay(5),
        restDay(6),
      ],
      name: 'Upper Lower',
      scheduleType: 'weekly',
    };
  }

  if (presetId === 'fbeod') {
    return {
      anchorLocalDate,
      days: [trainingDay(0, 'Full Body'), restDay(1)],
      name: 'Full Body Every Other Day',
      scheduleType: 'alternating',
    };
  }

  return {
    anchorLocalDate,
    days: Array.from({ length: 7 }, (_, index) => restDay(index)),
    name: 'My Program',
    scheduleType: 'weekly',
  };
}
