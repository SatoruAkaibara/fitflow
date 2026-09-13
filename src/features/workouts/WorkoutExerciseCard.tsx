import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { GlassSurface, type GlassTarget } from '../../components/GlassSurface';
import { radii, spacing } from '../../theme/tokens';
import { useAppTheme } from '../../theme/useAppTheme';
import type { WorkoutExercise } from './repository';
import { normalizeExerciseName } from './validation';
import { WorkoutSetRow } from './WorkoutSetRow';

type WorkoutExerciseCardProps = {
  blurTarget: GlassTarget;
  disabled: boolean;
  exercise: WorkoutExercise;
  isFirst: boolean;
  isLast: boolean;
  onAddSet: () => Promise<boolean>;
  onCompleteSet: (setId: string, weightKg: number, reps: number) => Promise<boolean>;
  onMove: (direction: -1 | 1) => Promise<boolean>;
  onRemove: () => void;
  onRemoveSet: (setId: string) => void;
  onRename: (name: string) => Promise<boolean>;
  onSaveDraft: (
    setId: string,
    weightKg: number | null,
    reps: number | null,
  ) => Promise<boolean>;
  onUncompleteSet: (setId: string) => Promise<boolean>;
};

export function WorkoutExerciseCard({
  blurTarget,
  disabled,
  exercise,
  isFirst,
  isLast,
  onAddSet,
  onCompleteSet,
  onMove,
  onRemove,
  onRemoveSet,
  onRename,
  onSaveDraft,
  onUncompleteSet,
}: WorkoutExerciseCardProps) {
  const { colors } = useAppTheme();
  const [name, setName] = useState(exercise.name);
  const [nameError, setNameError] = useState<string | null>(null);

  const saveName = () => {
    const result = normalizeExerciseName(name);
    if (!result.ok) {
      setNameError(result.error);
      return;
    }

    setNameError(null);
    setName(result.value);
    if (result.value !== exercise.name) void onRename(result.value);
  };

  return (
    <GlassSurface blurTarget={blurTarget} intensity={68} style={styles.card}>
      <View style={styles.header}>
        <TextInput
          accessibilityLabel="Exercise name"
          editable={!disabled}
          maxLength={80}
          onBlur={saveName}
          onChangeText={setName}
          onSubmitEditing={saveName}
          returnKeyType="done"
          style={[styles.name, { color: colors.glassText }]}
          value={name}
        />
        <View style={styles.actions}>
          <Pressable
            accessibilityLabel={`Move ${exercise.name} up`}
            disabled={disabled || isFirst}
            hitSlop={6}
            onPress={() => void onMove(-1)}
            style={styles.iconAction}
          >
            <Text style={[styles.iconActionText, { color: colors.glassTextMuted, opacity: isFirst ? 0.28 : 1 }]}>↑</Text>
          </Pressable>
          <Pressable
            accessibilityLabel={`Move ${exercise.name} down`}
            disabled={disabled || isLast}
            hitSlop={6}
            onPress={() => void onMove(1)}
            style={styles.iconAction}
          >
            <Text style={[styles.iconActionText, { color: colors.glassTextMuted, opacity: isLast ? 0.28 : 1 }]}>↓</Text>
          </Pressable>
          <Pressable
            accessibilityLabel={`Remove ${exercise.name}`}
            disabled={disabled}
            hitSlop={6}
            onPress={onRemove}
            style={styles.iconAction}
          >
            <Text style={[styles.iconActionText, { color: colors.workout }]}>×</Text>
          </Pressable>
        </View>
      </View>
      {nameError ? (
        <Text style={[styles.nameError, { color: colors.workout }]}>{nameError}</Text>
      ) : null}

      <View style={styles.columnHeadings}>
        <Text style={[styles.columnNumber, { color: colors.glassTextMuted }]}>SET</Text>
        <Text style={[styles.column, { color: colors.glassTextMuted }]}>WEIGHT</Text>
        <Text style={[styles.column, { color: colors.glassTextMuted }]}>REPS</Text>
        <View style={styles.columnSpacer} />
      </View>

      <View style={styles.sets}>
        {exercise.sets.map((set) => (
          <WorkoutSetRow
            disabled={disabled}
            key={`${set.id}-${set.weightKg}-${set.reps}-${set.isCompleted}`}
            onComplete={onCompleteSet}
            onRemove={onRemoveSet}
            onSaveDraft={onSaveDraft}
            onUncomplete={onUncompleteSet}
            set={set}
          />
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={() => void onAddSet()}
        style={[styles.addSet, { backgroundColor: colors.glassSurfaceMuted }]}
      >
        <Text style={[styles.addSetLabel, { color: colors.glassText }]}>＋ Add set</Text>
      </Pressable>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  name: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.35,
    minHeight: 40,
    padding: 0,
  },
  actions: {
    flexDirection: 'row',
  },
  iconAction: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 30,
  },
  iconActionText: {
    fontSize: 17,
    fontWeight: '800',
  },
  nameError: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  columnHeadings: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  columnNumber: {
    fontSize: 8,
    fontWeight: '900',
    textAlign: 'center',
    width: 16,
  },
  column: {
    flex: 1,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  columnSpacer: {
    width: 62,
  },
  sets: {
    gap: spacing.xs,
  },
  addSet: {
    alignItems: 'center',
    borderRadius: radii.pill,
    justifyContent: 'center',
    marginTop: spacing.md,
    minHeight: 38,
  },
  addSetLabel: {
    fontSize: 11,
    fontWeight: '800',
  },
});
