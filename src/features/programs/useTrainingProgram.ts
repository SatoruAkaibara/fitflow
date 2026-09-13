import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import {
  archiveActiveTrainingProgram,
  loadActiveTrainingProgram,
  saveTrainingProgram,
} from './repository';
import type { TrainingProgram, TrainingProgramInput } from './types';
import { validateTrainingProgram } from './validation';

type ProgramStatus = 'loading' | 'ready' | 'error';

export function useTrainingProgram() {
  const db = useSQLiteContext();
  const [program, setProgram] = useState<TrainingProgram | null>(null);
  const [status, setStatus] = useState<ProgramStatus>('loading');
  const [isMutating, setIsMutating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const mutationInFlight = useRef(false);

  const load = useCallback(async () => {
    try {
      setProgram(await loadActiveTrainingProgram(db));
      setErrorMessage(null);
      setStatus('ready');
    } catch {
      setErrorMessage('Your training program could not be loaded.');
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
      } catch {
        setErrorMessage('That program change was not saved. Please try again.');
        return false;
      } finally {
        mutationInFlight.current = false;
        setIsMutating(false);
      }
    },
    [load],
  );

  const save = useCallback(
    (input: TrainingProgramInput) => {
      const result = validateTrainingProgram(input);
      if (!result.ok) {
        setErrorMessage(result.error);
        return Promise.resolve(false);
      }
      return mutate(() => saveTrainingProgram(db, result.value));
    },
    [db, mutate],
  );

  return {
    archive: () => mutate(() => archiveActiveTrainingProgram(db)),
    clearError: () => setErrorMessage(null),
    errorMessage,
    isMutating,
    program,
    retry: load,
    save,
    status,
  };
}
