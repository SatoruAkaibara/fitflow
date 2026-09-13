import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import { getLocalDateKey } from './dates';
import {
  createManualAttendance,
  deleteManualAttendanceForDate,
  listAttendanceForHeatmap,
  type AttendanceRecord,
} from './repository';

type AttendanceStatus = 'loading' | 'ready' | 'error';

export function useAttendance() {
  const db = useSQLiteContext();
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [status, setStatus] = useState<AttendanceStatus>('loading');
  const [isMutating, setIsMutating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadAttendance = useCallback(
    async (date = new Date()) => {
      try {
        const nextRecords = await listAttendanceForHeatmap(db, date);
        setCurrentDate(date);
        setRecords(nextRecords);
        setErrorMessage(null);
        setStatus('ready');
      } catch {
        setErrorMessage('Attendance could not be loaded. Your saved data is still on this device.');
        setStatus('error');
      }
    },
    [db],
  );

  useEffect(() => {
    const initialLoad = setTimeout(() => {
      void loadAttendance();
    }, 0);

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void loadAttendance();
      }
    });

    return () => {
      clearTimeout(initialLoad);
      subscription.remove();
    };
  }, [loadAttendance]);

  const todayDateKey = getLocalDateKey(currentDate);
  const todayRecord = useMemo(
    () => records.find((record) => record.localDate === todayDateKey) ?? null,
    [records, todayDateKey],
  );

  const mutate = useCallback(
    async (operation: () => Promise<void>) => {
      setIsMutating(true);
      setErrorMessage(null);

      try {
        await operation();
        await loadAttendance(new Date());
      } catch {
        setErrorMessage('That change was not saved. Please try again.');
        setStatus('error');
      } finally {
        setIsMutating(false);
      }
    },
    [loadAttendance],
  );

  const checkIn = useCallback(
    () => mutate(() => createManualAttendance(db)),
    [db, mutate],
  );

  const undoToday = useCallback(
    () => mutate(() => deleteManualAttendanceForDate(db, todayDateKey)),
    [db, mutate, todayDateKey],
  );

  return {
    checkIn,
    currentDate,
    errorMessage,
    isMutating,
    records,
    retry: loadAttendance,
    status,
    todayRecord,
    undoToday,
  };
}
