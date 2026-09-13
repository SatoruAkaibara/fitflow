import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GlassSurface, type GlassTarget } from '../../components/GlassSurface';
import { radii, spacing } from '../../theme/tokens';
import { useAppTheme } from '../../theme/useAppTheme';
import { getUpcomingProgramDays } from './dates';
import type { PlannedProgramDay, TrainingProgram } from './types';

type ProgramOverviewProps = {
  blurTarget: GlassTarget;
  disabled: boolean;
  onEdit: () => void;
  onRemove: () => void;
  onStart: (day: PlannedProgramDay) => void;
  program: TrainingProgram;
};

export function ProgramOverview({
  blurTarget,
  disabled,
  onEdit,
  onRemove,
  onStart,
  program,
}: ProgramOverviewProps) {
  const { colors } = useAppTheme();
  const upcoming = getUpcomingProgramDays(program);
  const today = upcoming[0];

  return (
    <GlassSurface blurTarget={blurTarget} intensity={72} style={styles.card}>
      <View style={styles.heading}>
        <View style={styles.headingCopy}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>ACTIVE PROGRAM</Text>
          <Text numberOfLines={1} style={[styles.name, { color: colors.glassText }]}>
            {program.name}
          </Text>
        </View>
        <Pressable
          accessibilityLabel="Edit active program"
          accessibilityRole="button"
          disabled={disabled}
          onPress={onEdit}
          style={[styles.editButton, { backgroundColor: colors.glassSurfaceMuted }]}
        >
          <Text style={[styles.editLabel, { color: colors.glassText }]}>Edit</Text>
        </Pressable>
      </View>

      <View style={[styles.today, { backgroundColor: colors.glassSurfaceMuted }]}>
        <View style={styles.todayCopy}>
          <Text style={[styles.todayEyebrow, { color: colors.glassTextMuted }]}>TODAY</Text>
          <Text style={[styles.todayLabel, { color: colors.glassText }]}>
            {today.day.isRest ? 'Recovery day' : today.day.label}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={disabled}
          onPress={() => onStart(today)}
          style={[
            styles.startButton,
            {
              backgroundColor: today.day.isRest
                ? colors.glassStrong
                : colors.primary,
            },
          ]}
        >
          <Text style={styles.startLabel}>
            {today.day.isRest ? 'Train anyway' : 'Start'}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.schedule}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {upcoming.map((planned) => (
          <View
            key={planned.dateKey}
            style={[
              styles.day,
              {
                backgroundColor: planned.isToday
                  ? colors.primary
                  : colors.glassSurfaceMuted,
              },
            ]}
          >
            <Text
              style={[
                styles.weekday,
                { color: planned.isToday ? '#FFFFFF' : colors.glassTextMuted },
              ]}
            >
              {planned.weekdayLabel}
            </Text>
            <Text
              numberOfLines={1}
              style={[
                styles.dayLabel,
                { color: planned.isToday ? '#FFFFFF' : colors.glassText },
              ]}
            >
              {planned.day.isRest ? 'Rest' : planned.day.label}
            </Text>
          </View>
        ))}
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onRemove}
        style={styles.removeButton}
      >
        <Text style={[styles.removeLabel, { color: colors.workout }]}>Remove program</Text>
      </Pressable>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  heading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  headingCopy: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginTop: 3,
  },
  editButton: {
    alignItems: 'center',
    borderRadius: radii.pill,
    justifyContent: 'center',
    minHeight: 36,
    minWidth: 58,
  },
  editLabel: {
    fontSize: 10,
    fontWeight: '900',
  },
  today: {
    alignItems: 'center',
    borderRadius: radii.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  todayCopy: {
    flex: 1,
  },
  todayEyebrow: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  todayLabel: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 2,
  },
  startButton: {
    alignItems: 'center',
    borderRadius: radii.pill,
    justifyContent: 'center',
    minHeight: 40,
    minWidth: 72,
    paddingHorizontal: spacing.md,
  },
  startLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  schedule: {
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  day: {
    borderRadius: radii.md,
    justifyContent: 'space-between',
    minHeight: 70,
    padding: 10,
    width: 76,
  },
  weekday: {
    fontSize: 9,
    fontWeight: '900',
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '800',
  },
  removeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
  },
  removeLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
});
