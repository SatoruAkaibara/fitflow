export type ScheduleType = 'weekly' | 'alternating';

export type ProgramPresetId = 'ppl' | 'upper_lower' | 'fbeod' | 'custom';

export type ProgramDayDraft = {
  isRest: boolean;
  label: string | null;
  slotIndex: number;
};

export type TrainingProgramDay = ProgramDayDraft & {
  id: string;
};

export type TrainingProgram = {
  anchorLocalDate: string;
  days: TrainingProgramDay[];
  id: string;
  name: string;
  scheduleType: ScheduleType;
};

export type TrainingProgramInput = {
  anchorLocalDate: string;
  days: ProgramDayDraft[];
  name: string;
  scheduleType: ScheduleType;
};

export type PlannedProgramDay = {
  dateKey: string;
  day: TrainingProgramDay;
  isToday: boolean;
  weekdayLabel: string;
};
