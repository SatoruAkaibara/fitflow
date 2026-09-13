import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getProgramSlotIndex,
  getUpcomingProgramDays,
  isValidLocalDateKey,
} from '../src/features/programs/dates.ts';
import { createPresetProgram } from '../src/features/programs/presets.ts';
import { validateTrainingProgram } from '../src/features/programs/validation.ts';

function withIds(input) {
  return {
    ...input,
    days: input.days.map((day) => ({ ...day, id: `day-${day.slotIndex}` })),
    id: 'program-one',
  };
}

test('creates the recommended PPL week', () => {
  const preset = createPresetProgram('ppl', new Date(2026, 8, 14));
  assert.deepEqual(
    preset.days.map((day) => day.label ?? 'Rest'),
    ['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs', 'Rest'],
  );
});

test('maps weekly programs Monday first', () => {
  const program = withIds(createPresetProgram('upper_lower'));
  assert.equal(getProgramSlotIndex(program, new Date(2026, 8, 14)), 0);
  assert.equal(getProgramSlotIndex(program, new Date(2026, 8, 20)), 6);
});

test('keeps FBEOD alternating across leap day and month boundaries', () => {
  const input = createPresetProgram('fbeod');
  const program = withIds({ ...input, anchorLocalDate: '2028-02-28' });
  const upcoming = getUpcomingProgramDays(program, new Date(2028, 1, 28), 4);

  assert.deepEqual(
    upcoming.map((planned) => planned.day.label ?? 'Rest'),
    ['Full Body', 'Rest', 'Full Body', 'Rest'],
  );
  assert.deepEqual(
    upcoming.map((planned) => planned.dateKey),
    ['2028-02-28', '2028-02-29', '2028-03-01', '2028-03-02'],
  );
});

test('validates real local dates and rejects all-rest programs', () => {
  assert.equal(isValidLocalDateKey('2028-02-29'), true);
  assert.equal(isValidLocalDateKey('2027-02-29'), false);
  assert.equal(validateTrainingProgram(createPresetProgram('custom')).ok, false);
});

test('normalizes program and workout labels', () => {
  const input = createPresetProgram('ppl');
  const result = validateTrainingProgram({
    ...input,
    name: '  My   Split  ',
    days: input.days.map((day) =>
      day.label === 'Push' ? { ...day, label: ' Push   A ' } : day,
    ),
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.name, 'My Split');
    assert.equal(result.value.days[0].label, 'Push A');
  }
});
