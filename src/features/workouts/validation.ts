export type SetValues = {
  reps: number | null;
  weightKg: number | null;
};

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { error: string; ok: false };

const weightPattern = /^\d{1,3}(?:\.\d{0,2})?$/;
const repsPattern = /^\d{1,3}$/;

export function normalizeExerciseName(name: string): ValidationResult<string> {
  const normalized = name.trim().replace(/\s+/g, ' ');

  if (!normalized) {
    return { error: 'Enter an exercise name.', ok: false };
  }

  if (normalized.length > 80) {
    return { error: 'Exercise names can be up to 80 characters.', ok: false };
  }

  return { ok: true, value: normalized };
}

function parseWeight(value: string): ValidationResult<number | null> {
  const normalized = value.trim();
  if (!normalized) return { ok: true, value: null };

  if (!weightPattern.test(normalized)) {
    return { error: 'Weight must use up to 2 decimal places.', ok: false };
  }

  const weightKg = Number(normalized);
  if (weightKg > 999.99) {
    return { error: 'Weight must be 999.99 kg or less.', ok: false };
  }

  return { ok: true, value: weightKg };
}

function parseReps(value: string): ValidationResult<number | null> {
  const normalized = value.trim();
  if (!normalized) return { ok: true, value: null };

  if (!repsPattern.test(normalized)) {
    return { error: 'Reps must be a whole number from 1 to 999.', ok: false };
  }

  const reps = Number(normalized);
  if (reps < 1 || reps > 999) {
    return { error: 'Reps must be a whole number from 1 to 999.', ok: false };
  }

  return { ok: true, value: reps };
}

export function parseDraftSet(
  weightInput: string,
  repsInput: string,
): ValidationResult<SetValues> {
  const weight = parseWeight(weightInput);
  if (!weight.ok) return weight;

  const reps = parseReps(repsInput);
  if (!reps.ok) return reps;

  return { ok: true, value: { reps: reps.value, weightKg: weight.value } };
}

export function parseCompletedSet(
  weightInput: string,
  repsInput: string,
): ValidationResult<{ reps: number; weightKg: number }> {
  const draft = parseDraftSet(weightInput, repsInput);
  if (!draft.ok) return draft;

  if (draft.value.weightKg === null) {
    return { error: 'Enter a weight. Use 0 kg for bodyweight.', ok: false };
  }

  if (draft.value.reps === null) {
    return { error: 'Enter reps before completing this set.', ok: false };
  }

  return {
    ok: true,
    value: { reps: draft.value.reps, weightKg: draft.value.weightKg },
  };
}
