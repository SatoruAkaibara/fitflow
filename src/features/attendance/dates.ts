export type MonthCalendarDay = {
  dateKey: string;
  dayNumber: number;
  isAttended: boolean;
  isToday: boolean;
};

export type HeatmapDay = MonthCalendarDay & {
  isFuture: boolean;
};

const padNumber = (value: number) => value.toString().padStart(2, '0');

export function getLocalDateKey(date: Date) {
  return [
    date.getFullYear(),
    padNumber(date.getMonth() + 1),
    padNumber(date.getDate()),
  ].join('-');
}

export function getDeviceTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown';
}

export function getMonthDateRange(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);

  return {
    startDateKey: getLocalDateKey(start),
    endDateKey: getLocalDateKey(end),
  };
}

export function getMonthCalendarDays(
  date: Date,
  attendedDateKeys: ReadonlySet<string>,
  today = new Date(),
): (MonthCalendarDay | null)[] {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const finalDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const leadingMondayOffset = (firstDay.getDay() + 6) % 7;
  const days: (MonthCalendarDay | null)[] = Array.from(
    { length: leadingMondayOffset },
    () => null,
  );
  const todayKey = getLocalDateKey(today);

  for (let day = 1; day <= finalDay.getDate(); day += 1) {
    const dayDate = new Date(date.getFullYear(), date.getMonth(), day);
    const dateKey = getLocalDateKey(dayDate);
    days.push({
      dateKey,
      dayNumber: day,
      isAttended: attendedDateKeys.has(dateKey),
      isToday: dateKey === todayKey,
    });
  }

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
}

export function getRollingHeatmapDateRange(date: Date, weekCount = 16) {
  const currentMonday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  currentMonday.setDate(currentMonday.getDate() - ((currentMonday.getDay() + 6) % 7));

  const start = new Date(currentMonday);
  start.setDate(start.getDate() - (weekCount - 1) * 7);

  const end = new Date(currentMonday);
  end.setDate(end.getDate() + 7);

  return {
    startDateKey: getLocalDateKey(start),
    endDateKey: getLocalDateKey(end),
  };
}

export function getRollingHeatmapWeeks(
  date: Date,
  attendedDateKeys: ReadonlySet<string>,
  weekCount = 16,
): HeatmapDay[][] {
  const { startDateKey } = getRollingHeatmapDateRange(date, weekCount);
  const [year, month, day] = startDateKey.split('-').map(Number);
  const start = new Date(year, month - 1, day);
  const todayKey = getLocalDateKey(date);

  return Array.from({ length: weekCount }, (_, weekIndex) =>
    Array.from({ length: 7 }, (__, dayIndex) => {
      const cellDate = new Date(start);
      cellDate.setDate(start.getDate() + weekIndex * 7 + dayIndex);
      const dateKey = getLocalDateKey(cellDate);

      return {
        dateKey,
        dayNumber: cellDate.getDate(),
        isAttended: attendedDateKeys.has(dateKey),
        isFuture: dateKey > todayKey,
        isToday: dateKey === todayKey,
      };
    }),
  );
}
