import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  GlassSurface,
  type GlassTarget,
} from '../../components/GlassSurface';
import { radii } from '../../theme/tokens';
import { useAppTheme } from '../../theme/useAppTheme';

type AttendanceCheckInProps = {
  blurTarget: GlassTarget;
  attendanceSource: 'manual' | 'workout' | null;
  checkedIn: boolean;
  errorMessage: string | null;
  isBusy: boolean;
  isLoading: boolean;
  onCheckIn: () => void;
  onRetry: () => void;
  onUndo: () => void;
};

export function AttendanceCheckIn({
  blurTarget,
  attendanceSource,
  checkedIn,
  errorMessage,
  isBusy,
  isLoading,
  onCheckIn,
  onRetry,
  onUndo,
}: AttendanceCheckInProps) {
  const { colors } = useAppTheme();
  const [buttonScale] = useState(() => new Animated.Value(1));
  const accent = checkedIn ? colors.success : colors.primary;
  const isWorkoutEarned = attendanceSource === 'workout';

  const animateButton = (toValue: number) => {
    Animated.spring(buttonScale, {
      bounciness: 4,
      speed: 34,
      toValue,
      useNativeDriver: true,
    }).start();
  };

  const handlePrimaryAction = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    if (errorMessage) {
      onRetry();
    } else if (checkedIn && !isWorkoutEarned) {
      onUndo();
    } else {
      onCheckIn();
    }
  };

  const title = errorMessage
    ? 'Attendance unavailable'
    : isWorkoutEarned
      ? 'Workout complete'
    : checkedIn
      ? 'Checked in today'
      : 'Gym attendance';
  const detail = errorMessage
    ? 'Your local log could not be opened.'
    : isWorkoutEarned
      ? 'Attendance earned automatically'
    : checkedIn
      ? 'Saved locally · counted this month'
      : 'Not recorded yet';
  const actionLabel = errorMessage ? 'Retry' : checkedIn ? 'Undo' : 'Check in';

  return (
    <GlassSurface blurTarget={blurTarget} intensity={82} style={styles.capsule}>
      <View
        style={[
          styles.iconBubble,
          { backgroundColor: `${errorMessage ? colors.workout : accent}2E` },
        ]}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.primary} size="small" />
        ) : (
          <Text
            style={[
              styles.iconMark,
              { color: errorMessage ? colors.workout : accent },
            ]}
          >
            {errorMessage ? '!' : checkedIn ? '✓' : '●'}
          </Text>
        )}
      </View>

      <View accessibilityLiveRegion="polite" style={styles.copy}>
        <Text numberOfLines={1} style={[styles.title, { color: colors.glassText }]}>
          {isLoading ? 'Loading attendance' : title}
        </Text>
        <Text
          numberOfLines={1}
          style={[styles.detail, { color: colors.glassTextMuted }]}
        >
          {isLoading ? 'Checking this device…' : detail}
        </Text>
      </View>

      {!isLoading && !isWorkoutEarned ? (
        <Pressable
          accessibilityLabel={actionLabel}
          accessibilityRole="button"
          disabled={isBusy}
          onPress={handlePrimaryAction}
          onPressIn={() => animateButton(0.94)}
          onPressOut={() => animateButton(1)}
        >
          <Animated.View
            style={[
              styles.action,
              {
                backgroundColor:
                  errorMessage
                    ? colors.workout
                    : checkedIn
                      ? colors.glassSurfaceMuted
                      : accent,
                opacity: isBusy ? 0.55 : 1,
                transform: [{ scale: buttonScale }],
              },
            ]}
          >
            {isBusy ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.actionLabel}>{actionLabel}</Text>
            )}
          </Animated.View>
        </Pressable>
      ) : null}
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  capsule: {
    alignItems: 'center',
    borderRadius: radii.pill,
    flexDirection: 'row',
    minHeight: 64,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  iconBubble: {
    alignItems: 'center',
    borderRadius: radii.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  iconMark: {
    fontSize: 17,
    fontWeight: '900',
  },
  copy: {
    flex: 1,
    marginHorizontal: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.25,
  },
  detail: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3,
  },
  action: {
    alignItems: 'center',
    borderRadius: radii.pill,
    justifyContent: 'center',
    minHeight: 36,
    minWidth: 68,
    paddingHorizontal: 12,
  },
  actionLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
});
