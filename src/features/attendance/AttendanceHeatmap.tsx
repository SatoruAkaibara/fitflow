import { StyleSheet, Text, View } from 'react-native';

import {
  GlassSurface,
  type GlassTarget,
} from '../../components/GlassSurface';
import { radii, spacing } from '../../theme/tokens';
import { useAppTheme } from '../../theme/useAppTheme';
import { getLocalDateKey, getRollingHeatmapWeeks } from './dates';

type AttendanceHeatmapProps = {
  attendedDateKeys: ReadonlySet<string>;
  blurTarget: GlassTarget;
  referenceDate: Date;
};

const weekDays = ['', 'T', '', 'T', '', 'S', ''];

export function AttendanceHeatmap({
  attendedDateKeys,
  blurTarget,
  referenceDate,
}: AttendanceHeatmapProps) {
  const { colors } = useAppTheme();
  const weeks = getRollingHeatmapWeeks(referenceDate, attendedDateKeys);
  const monthPrefix = getLocalDateKey(referenceDate).slice(0, 7);
  const monthTotal = [...attendedDateKeys].filter((dateKey) =>
    dateKey.startsWith(monthPrefix),
  ).length;

  return (
    <GlassSurface blurTarget={blurTarget} intensity={74} style={styles.card}>
      <View style={styles.headingRow}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.glassTextMuted }]}>CONSISTENCY</Text>
          <Text style={[styles.title, { color: colors.glassText }]}>Last 16 weeks</Text>
        </View>
        <View
          style={[styles.totalBadge, { backgroundColor: colors.glassSurfaceMuted }]}
        >
          <Text style={[styles.totalText, { color: colors.glassTextMuted }]}>
            <Text style={[styles.totalValue, { color: colors.glassText }]}>
              {monthTotal}
            </Text>{' '}
            this month
          </Text>
        </View>
      </View>

      <View style={styles.heatmapRow}>
        <View style={styles.weekDayColumn}>
          {weekDays.map((label, index) => (
            <View key={`${label}-${index}`} style={styles.weekDayCell}>
              <Text style={[styles.weekDay, { color: colors.glassTextMuted }]}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.weeks}>
          {weeks.map((week) => (
            <View key={week[0].dateKey} style={styles.weekColumn}>
              {week.map((day) => (
                <View
                  accessibilityLabel={`${day.dateKey}. ${
                    day.isAttended ? 'Gym day' : day.isFuture ? 'Future date' : 'No attendance'
                  }${day.isToday ? '. Today' : ''}`}
                  key={day.dateKey}
                  style={[
                    styles.heatCell,
                    { backgroundColor: colors.glassSurfaceMuted },
                    day.isAttended && { backgroundColor: colors.success },
                    day.isFuture && styles.futureCell,
                    day.isToday && !day.isAttended && {
                      borderColor: colors.primary,
                      borderWidth: 1.5,
                    },
                  ]}
                />
              ))}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.legend}>
        <Text style={[styles.legendText, { color: colors.glassTextMuted }]}>Less</Text>
        <View style={[styles.legendCell, { backgroundColor: colors.glassSurfaceMuted }]} />
        <View style={[styles.legendCell, { backgroundColor: `${colors.success}55` }]} />
        <View style={[styles.legendCell, { backgroundColor: `${colors.success}AA` }]} />
        <View style={[styles.legendCell, { backgroundColor: colors.success }]} />
        <Text style={[styles.legendText, { color: colors.glassTextMuted }]}>More</Text>
      </View>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    padding: 20,
  },
  headingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.3,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  totalBadge: {
    alignItems: 'center',
    borderRadius: radii.pill,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  totalText: {
    fontSize: 10,
    fontWeight: '700',
    includeFontPadding: false,
    lineHeight: 20,
    textAlign: 'center',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '900',
    includeFontPadding: false,
  },
  heatmapRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  weekDayColumn: {
    gap: 4,
  },
  weekDayCell: {
    height: 13,
    justifyContent: 'center',
    width: 12,
  },
  weekDay: {
    fontSize: 8,
    fontWeight: '700',
  },
  weeks: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekColumn: {
    gap: 4,
  },
  heatCell: {
    borderRadius: 3,
    height: 13,
    width: 13,
  },
  futureCell: {
    opacity: 0.24,
  },
  legend: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'flex-end',
    marginTop: spacing.lg,
  },
  legendCell: {
    borderRadius: 2,
    height: 9,
    width: 9,
  },
  legendText: {
    fontSize: 9,
    fontWeight: '600',
    marginHorizontal: 2,
  },
});
