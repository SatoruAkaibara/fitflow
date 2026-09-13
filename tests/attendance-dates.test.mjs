import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getLocalDateKey,
  getMonthCalendarDays,
  getMonthDateRange,
  getRollingHeatmapDateRange,
  getRollingHeatmapWeeks,
} from '../src/features/attendance/dates.ts';

test('formats a date using local calendar values', () => {
  assert.equal(getLocalDateKey(new Date(2026, 8, 3, 23, 59)), '2026-09-03');
});

test('returns an exclusive month date range across a year boundary', () => {
  assert.deepEqual(getMonthDateRange(new Date(2026, 11, 15)), {
    startDateKey: '2026-12-01',
    endDateKey: '2027-01-01',
  });
});

test('builds a Monday-first calendar and marks attendance and today', () => {
  const attended = new Set(['2026-09-01', '2026-09-13']);
  const days = getMonthCalendarDays(
    new Date(2026, 8, 1),
    attended,
    new Date(2026, 8, 13),
  );

  assert.equal(days.length, 35);
  assert.equal(days[0], null);
  assert.deepEqual(days[1], {
    dateKey: '2026-09-01',
    dayNumber: 1,
    isAttended: true,
    isToday: false,
  });
  assert.equal(days.find((day) => day?.dayNumber === 13)?.isToday, true);
});

test('includes leap day at the end of February', () => {
  const days = getMonthCalendarDays(new Date(2028, 1, 1), new Set());
  const calendarDates = days.filter(Boolean);

  assert.equal(calendarDates.length, 29);
  assert.equal(calendarDates.at(-1)?.dateKey, '2028-02-29');
});

test('creates a 16-week Monday-first range ending after the current week', () => {
  assert.deepEqual(getRollingHeatmapDateRange(new Date(2026, 8, 13)), {
    startDateKey: '2026-05-25',
    endDateKey: '2026-09-14',
  });
});

test('builds GitHub-style week columns and distinguishes future dates', () => {
  const weeks = getRollingHeatmapWeeks(
    new Date(2026, 8, 9),
    new Set(['2026-09-08']),
  );

  assert.equal(weeks.length, 16);
  assert.equal(weeks.every((week) => week.length === 7), true);
  assert.equal(weeks.at(-1)?.[1].isAttended, true);
  assert.equal(weeks.at(-1)?.[2].isToday, true);
  assert.equal(weeks.at(-1)?.[3].isFuture, true);
});
