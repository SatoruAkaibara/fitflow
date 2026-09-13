import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { radii, spacing } from '../../theme/tokens';
import { useAppTheme } from '../../theme/useAppTheme';
import type { WorkoutSet } from './repository';
import { parseCompletedSet, parseDraftSet } from './validation';

type WorkoutSetRowProps = {
  disabled: boolean;
  onComplete: (setId: string, weightKg: number, reps: number) => Promise<boolean>;
  onRemove: (setId: string) => void;
  onSaveDraft: (
    setId: string,
    weightKg: number | null,
    reps: number | null,
  ) => Promise<boolean>;
  onUncomplete: (setId: string) => Promise<boolean>;
  set: WorkoutSet;
};

export function WorkoutSetRow({
  disabled,
  onComplete,
  onRemove,
  onSaveDraft,
  onUncomplete,
  set,
}: WorkoutSetRowProps) {
  const { colors } = useAppTheme();
  const [weight, setWeight] = useState(set.weightKg?.toString() ?? '');
  const [reps, setReps] = useState(set.reps?.toString() ?? '');
  const [error, setError] = useState<string | null>(null);

  const saveDraft = () => {
    if (set.isCompleted) return;
    const result = parseDraftSet(weight, reps);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setError(null);
    void onSaveDraft(set.id, result.value.weightKg, result.value.reps);
  };

  const toggleCompleted = async () => {
    void Haptics.selectionAsync();
    if (set.isCompleted) {
      setError(null);
      await onUncomplete(set.id);
      return;
    }

    const result = parseCompletedSet(weight, reps);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setError(null);
    await onComplete(set.id, result.value.weightKg, result.value.reps);
  };

  return (
    <View>
      <View style={styles.row}>
        <Text style={[styles.number, { color: colors.glassTextMuted }]}>
          {set.setNumber}
        </Text>
        <View style={styles.fieldGroup}>
          <TextInput
            accessibilityLabel={`Set ${set.setNumber} weight in kilograms`}
            editable={!disabled && !set.isCompleted}
            keyboardType="decimal-pad"
            maxLength={6}
            onBlur={saveDraft}
            onChangeText={setWeight}
            placeholder="0"
            placeholderTextColor={colors.glassTextMuted}
            selectTextOnFocus
            style={[
              styles.input,
              {
                backgroundColor: colors.glassSurfaceMuted,
                color: colors.glassText,
              },
            ]}
            value={weight}
          />
          <Text style={[styles.unit, { color: colors.glassTextMuted }]}>kg</Text>
        </View>
        <View style={styles.fieldGroup}>
          <TextInput
            accessibilityLabel={`Set ${set.setNumber} repetitions`}
            editable={!disabled && !set.isCompleted}
            keyboardType="number-pad"
            maxLength={3}
            onBlur={saveDraft}
            onChangeText={setReps}
            placeholder="0"
            placeholderTextColor={colors.glassTextMuted}
            selectTextOnFocus
            style={[
              styles.input,
              {
                backgroundColor: colors.glassSurfaceMuted,
                color: colors.glassText,
              },
            ]}
            value={reps}
          />
          <Text style={[styles.unit, { color: colors.glassTextMuted }]}>reps</Text>
        </View>
        <Pressable
          accessibilityLabel={set.isCompleted ? `Uncomplete set ${set.setNumber}` : `Complete set ${set.setNumber}`}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: set.isCompleted, disabled }}
          disabled={disabled}
          onPress={() => void toggleCompleted()}
          style={[
            styles.complete,
            {
              backgroundColor: set.isCompleted
                ? colors.success
                : colors.glassSurfaceMuted,
              borderColor: set.isCompleted ? colors.success : colors.glassBorder,
            },
          ]}
        >
          <Text style={[styles.check, { color: set.isCompleted ? '#FFFFFF' : colors.glassText }]}>✓</Text>
        </Pressable>
        <Pressable
          accessibilityLabel={`Remove set ${set.setNumber}`}
          accessibilityRole="button"
          disabled={disabled}
          hitSlop={8}
          onPress={() => onRemove(set.id)}
          style={styles.remove}
        >
          <Text style={[styles.removeText, { color: colors.glassTextMuted }]}>×</Text>
        </Pressable>
      </View>
      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          style={[styles.error, { color: colors.workout }]}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    minHeight: 46,
  },
  number: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    width: 16,
  },
  fieldGroup: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  input: {
    borderRadius: radii.sm,
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    minHeight: 40,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    textAlign: 'center',
  },
  unit: {
    fontSize: 9,
    fontWeight: '700',
  },
  complete: {
    alignItems: 'center',
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  check: {
    fontSize: 15,
    fontWeight: '900',
  },
  remove: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    width: 20,
  },
  removeText: {
    fontSize: 18,
    fontWeight: '500',
  },
  error: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 14,
    marginLeft: 22,
    marginTop: 2,
  },
});
