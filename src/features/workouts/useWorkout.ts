import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import {
  addExercise as addExerciseRecord,
  addSet as addSetRecord,
  completeSet as completeSetRecord,
  discardWorkout as discardWorkoutRecord,
  finishWorkout as finishWorkoutRecord,
  loadActiveWorkout,
  moveExercise as moveExerciseRecord,
  removeExercise as removeExerciseRecord,
  removeSet as removeSetRecord,
  renameExercise as renameExerciseRecord,
  saveSetDraft as saveSetDraftRecord,
  startWorkout as startWorkoutRecord,
  uncompleteSet as uncompleteSetRecord,
  WorkoutRepositoryError,
  type PlannedWorkout,
  type WorkoutSession,
} from './repository';
import { normalizeExerciseName } from './validation';

type WorkoutStatus = 'loading' | 'ready' | 'error';

export function useWorkout() {
  const db = useSQLiteContext();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [status, setStatus] = useState<WorkoutStatus>('loading');
  const [isMutating, setIsMutating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const mutationInFlight = useRef(false);

  const load = useCallback(async () => {
    try {
      setSession(await loadActiveWorkout(db));
      setErrorMessage(null);
      setStatus('ready');
    } catch {
      setErrorMessage('Your workout could not be loaded. Your data is still on this device.');
      setStatus('error');
    }
  }, [db]);

  useEffect(() => {
    const initialLoad = setTimeout(() => void load(), 0);
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') void load();
    });

    return () => {
      clearTimeout(initialLoad);
      subscription.remove();
    };
  }, [load]);

  const mutate = useCallback(
    async (operation: () => Promise<void>) => {
      if (mutationInFlight.current) return false;
      mutationInFlight.current = true;
      setIsMutating(true);
      setErrorMessage(null);

      try {
        await operation();
        await load();
        return true;
      } catch (error) {
        setErrorMessage(
          error instanceof WorkoutRepositoryError
            ? error.message
            : 'That workout change was not saved. Please try again.',
        );
        return false;
      } finally {
        mutationInFlight.current = false;
        setIsMutating(false);
      }
    },
    [load],
  );

  const saveDraft = useCallback(
    async (setId: string, weightKg: number | null, reps: number | null) => {
      try {
        await saveSetDraftRecord(db, setId, weightKg, reps);
        return true;
      } catch {
        setErrorMessage('That set was not saved. Please try again.');
        return false;
      }
    },
    [db],
  );

  const start = useCallback(
    (plannedWorkout?: PlannedWorkout) =>
      mutate(() => startWorkoutRecord(db, plannedWorkout)),
    [db, mutate],
  );
  const finish = useCallback(
    () => (session ? mutate(() => finishWorkoutRecord(db, session.id)) : Promise.resolve(false)),
    [db, mutate, session],
  );
  const discard = useCallback(
    () => (session ? mutate(() => discardWorkoutRecord(db, session.id)) : Promise.resolve(false)),
    [db, mutate, session],
  );
  const addExercise = useCallback(
    (name: string) => {
      if (!session) return Promise.resolve(false);
      const result = normalizeExerciseName(name);
      if (!result.ok) {
        setErrorMessage(result.error);
        return Promise.resolve(false);
      }
      return mutate(() => addExerciseRecord(db, session.id, result.value));
    },
    [db, mutate, session],
  );

  return {
    addExercise,
    addSet: (exerciseId: string) => mutate(() => addSetRecord(db, exerciseId)),
    completeSet: (setId: string, weightKg: number, reps: number) =>
      mutate(() => completeSetRecord(db, setId, weightKg, reps)),
    discard,
    errorMessage,
    finish,
    isMutating,
    moveExercise: (exerciseId: string, direction: -1 | 1) =>
      session
        ? mutate(() => moveExerciseRecord(db, session.id, exerciseId, direction))
        : Promise.resolve(false),
    removeExercise: (exerciseId: string) =>
      session
        ? mutate(() => removeExerciseRecord(db, session.id, exerciseId))
        : Promise.resolve(false),
    removeSet: (exerciseId: string, setId: string) =>
      mutate(() => removeSetRecord(db, exerciseId, setId)),
    renameExercise: (exerciseId: string, name: string) => {
      const result = normalizeExerciseName(name);
      if (!result.ok) {
        setErrorMessage(result.error);
        return Promise.resolve(false);
      }
      return mutate(() => renameExerciseRecord(db, exerciseId, result.value));
    },
    retry: load,
    saveSetDraft: saveDraft,
    session,
    start,
    status,
    uncompleteSet: (setId: string) => mutate(() => uncompleteSetRecord(db, setId)),
  };
}
