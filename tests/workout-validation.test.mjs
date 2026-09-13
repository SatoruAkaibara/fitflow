import assert from 'node:assert/strict';
import test from 'node:test';

import {
  normalizeExerciseName,
  parseCompletedSet,
  parseDraftSet,
} from '../src/features/workouts/validation.ts';

test('normalizes an exercise name', () => {
  assert.deepEqual(normalizeExerciseName('  Barbell   Squat  '), {
    ok: true,
    value: 'Barbell Squat',
  });
});

test('rejects an empty exercise name', () => {
  assert.equal(normalizeExerciseName('   ').ok, false);
});

test('accepts an empty draft set', () => {
  assert.deepEqual(parseDraftSet('', ''), {
    ok: true,
    value: { reps: null, weightKg: null },
  });
});

test('accepts bodyweight and whole-number reps', () => {
  assert.deepEqual(parseCompletedSet('0', '12'), {
    ok: true,
    value: { reps: 12, weightKg: 0 },
  });
});

test('rejects incomplete and out-of-range completed sets', () => {
  assert.equal(parseCompletedSet('', '10').ok, false);
  assert.equal(parseCompletedSet('20', '').ok, false);
  assert.equal(parseCompletedSet('1000', '10').ok, false);
  assert.equal(parseCompletedSet('20', '0').ok, false);
  assert.equal(parseCompletedSet('20.123', '10').ok, false);
});
