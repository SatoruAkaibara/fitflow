import { BlurTargetView } from 'expo-blur';
import { useMemo, useRef } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FeatureCard } from '../components/FeatureCard';
import {
  FloatingNavigation,
  type AppSection,
} from '../components/FloatingNavigation';
import { AttendanceCheckIn } from '../features/attendance/AttendanceCheckIn';
import { AttendanceHeatmap } from '../features/attendance/AttendanceHeatmap';
import { useAttendance } from '../features/attendance/useAttendance';
import { radii, spacing } from '../theme/tokens';
import { useAppTheme } from '../theme/useAppTheme';

const formatToday = () =>
  new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

const nativeSystemFont = Platform.select({
  android: 'sans-serif',
  default: 'System',
});

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning.';
  if (hour < 18) return 'Good afternoon.';
  return 'Good evening.';
};

type TodayScreenProps = {
  onNavigate: (section: AppSection) => void;
};

export function TodayScreen({ onNavigate }: TodayScreenProps) {
  const { colors } = useAppTheme();
  const navigationBlurTarget = useRef<View | null>(null);
  const surfaceBlurTarget = useRef<View | null>(null);
  const {
    checkIn,
    currentDate,
    errorMessage,
    isMutating,
    records,
    retry,
    status,
    todayRecord,
    undoToday,
  } = useAttendance();
  const attendedDateKeys = useMemo(
    () => new Set(records.map((record) => record.localDate)),
    [records],
  );

  const features = [
    {
      accent: colors.workout,
      label: 'Workout',
      symbol: 'W',
      summary: 'Sessions and gym attendance',
    },
    {
      accent: colors.nutrition,
      label: 'Nutrition',
      symbol: 'N',
      summary: 'Calories and daily macros',
    },
    {
      accent: colors.focus,
      label: 'Focus',
      symbol: 'F',
      summary: 'Habits and focus sessions',
    },
    {
      accent: colors.notes,
      label: 'Notes',
      symbol: 'M',
      summary: 'Thoughts, cues, and routines',
    },
  ];

  return (
    <SafeAreaView
      edges={['top', 'right', 'bottom', 'left']}
      style={styles.safeArea}
    >
      <BlurTargetView
        ref={navigationBlurTarget}
        style={styles.contentTarget}
      >
        <BlurTargetView
          pointerEvents="none"
          ref={surfaceBlurTarget}
          style={[styles.wallpaper, { backgroundColor: colors.background }]}
        >
          <View style={[styles.blueGlow, { backgroundColor: colors.primarySoft }]} />
          <View style={[styles.greenGlow, { backgroundColor: colors.successSoft }]} />
          <View style={[styles.warmGlow, { backgroundColor: `${colors.focus}22` }]} />
        </BlurTargetView>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.header}>
          <View>
            <Text style={[styles.wordmark, { color: colors.text }]}>FitFlow</Text>
            <Text style={[styles.date, { color: colors.textMuted }]}>
              {formatToday()}
            </Text>
          </View>
          <View
            accessibilityLabel="FitFlow profile placeholder"
            style={[styles.avatar, { backgroundColor: colors.primarySoft }]}
          >
            <Text style={[styles.avatarText, { color: colors.primary }]}>FF</Text>
          </View>
        </View>

        <View style={styles.titleBlock}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>TODAY</Text>
          <Text style={[styles.title, { color: colors.text }]}>{getGreeting()}</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Here’s your rhythm at a glance.
          </Text>
        </View>

        <View style={styles.attendanceSection}>
          <AttendanceCheckIn
            attendanceSource={todayRecord?.source ?? null}
            blurTarget={surfaceBlurTarget}
            checkedIn={todayRecord !== null}
            errorMessage={errorMessage}
            isBusy={isMutating}
            isLoading={status === 'loading'}
            onCheckIn={() => void checkIn()}
            onRetry={() => void retry()}
            onUndo={() => void undoToday()}
          />
          <AttendanceHeatmap
            attendedDateKeys={attendedDateKeys}
            blurTarget={surfaceBlurTarget}
            referenceDate={currentDate}
          />
        </View>

        <View style={styles.sectionHeading}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your spaces</Text>
          <View
            style={[styles.previewPill, { backgroundColor: colors.glassStrong }]}
          >
            <Text style={[styles.sectionMeta, { color: colors.textMuted }]}>COMING UP</Text>
          </View>
        </View>

        <View style={styles.grid}>
          {features.map((feature) => (
            <FeatureCard
              key={feature.label}
              {...feature}
              blurTarget={surfaceBlurTarget}
            />
          ))}
        </View>

        </ScrollView>
      </BlurTargetView>
      <FloatingNavigation
        activeSection="today"
        blurTarget={navigationBlurTarget}
        onSelect={onNavigate}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  contentTarget: {
    flex: 1,
  },
  wallpaper: {
    bottom: 0,
    overflow: 'hidden',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  blueGlow: {
    borderRadius: 220,
    height: 360,
    opacity: 0.72,
    position: 'absolute',
    right: -170,
    top: -120,
    width: 360,
  },
  greenGlow: {
    borderRadius: 180,
    height: 300,
    left: -190,
    opacity: 0.5,
    position: 'absolute',
    top: 430,
    width: 300,
  },
  warmGlow: {
    borderRadius: 160,
    bottom: -80,
    height: 280,
    opacity: 0.48,
    position: 'absolute',
    right: -150,
    width: 280,
  },
  content: {
    paddingBottom: 112,
    paddingHorizontal: 20,
    paddingTop: spacing.lg,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  wordmark: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  date: {
    fontFamily: nativeSystemFont,
    fontSize: 15,
    fontWeight: '500',
    includeFontPadding: false,
    letterSpacing: -0.15,
    lineHeight: 20,
    marginTop: 4,
  },
  avatar: {
    alignItems: 'center',
    borderRadius: radii.pill,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
  },
  titleBlock: {
    marginBottom: 28,
    marginTop: 48,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.7,
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: nativeSystemFont,
    fontSize: 36,
    fontWeight: '700',
    includeFontPadding: false,
    letterSpacing: -1.1,
    lineHeight: 43,
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 23,
    marginTop: spacing.sm,
    maxWidth: 320,
  },
  attendanceSection: {
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  sectionHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionMeta: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  previewPill: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
});
