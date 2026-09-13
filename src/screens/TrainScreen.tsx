import { BlurTargetView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  FloatingNavigation,
  type AppSection,
} from '../components/FloatingNavigation';
import { GlassSurface } from '../components/GlassSurface';
import { ProgramEditor } from '../features/programs/ProgramEditor';
import { ProgramOverview } from '../features/programs/ProgramOverview';
import type {
  PlannedProgramDay,
  TrainingProgramInput,
} from '../features/programs/types';
import { useTrainingProgram } from '../features/programs/useTrainingProgram';
import { WorkoutExerciseCard } from '../features/workouts/WorkoutExerciseCard';
import { useWorkout } from '../features/workouts/useWorkout';
import { radii, spacing } from '../theme/tokens';
import { useAppTheme } from '../theme/useAppTheme';

type TrainScreenProps = {
  onNavigate: (section: AppSection) => void;
};

function getElapsedLabel(startedAtUtc: string, now: number) {
  const elapsedMinutes = Math.max(
    0,
    Math.floor((now - new Date(startedAtUtc).getTime()) / 60000),
  );
  const hours = Math.floor(elapsedMinutes / 60);
  const minutes = elapsedMinutes % 60;

  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes} min`;
}

export function TrainScreen({ onNavigate }: TrainScreenProps) {
  const { colors } = useAppTheme();
  const navigationBlurTarget = useRef<View | null>(null);
  const surfaceBlurTarget = useRef<View | null>(null);
  const [exerciseName, setExerciseName] = useState('');
  const [isEditingProgram, setIsEditingProgram] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const {
    addExercise,
    addSet,
    completeSet,
    discard,
    errorMessage: workoutError,
    finish,
    isMutating,
    moveExercise,
    removeExercise,
    removeSet,
    renameExercise,
    retry,
    saveSetDraft,
    session,
    start,
    status,
    uncompleteSet,
  } = useWorkout();
  const {
    archive: archiveProgram,
    errorMessage: programError,
    isMutating: isProgramMutating,
    program,
    retry: retryProgram,
    save: saveProgram,
    status: programStatus,
  } = useTrainingProgram();
  const isBusy = isMutating || isProgramMutating;

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const startSession = async (plannedDay?: PlannedProgramDay) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await start(
      plannedDay && !plannedDay.day.isRest && plannedDay.day.label
        ? {
            programDayId: plannedDay.day.id,
            sessionLabel: plannedDay.day.label,
          }
        : undefined,
    );
  };

  const saveProgramDraft = (input: TrainingProgramInput) => {
    if (!program) {
      return saveProgram(input).then((saved) => {
        if (saved) setIsEditingProgram(false);
        return saved;
      });
    }

    return new Promise<boolean>((resolve) => {
      Alert.alert(
        'Apply program changes?',
        'Your current program will be archived. Completed workouts will not change.',
        [
          { onPress: () => resolve(false), style: 'cancel', text: 'Cancel' },
          {
            onPress: () => {
              void saveProgram(input).then((saved) => {
                if (saved) setIsEditingProgram(false);
                resolve(saved);
              });
            },
            text: 'Apply',
          },
        ],
        { cancelable: true, onDismiss: () => resolve(false) },
      );
    });
  };

  const confirmRemoveProgram = () => {
    Alert.alert(
      'Remove active program?',
      'The schedule will be archived. Your completed workouts stay unchanged.',
      [
        { style: 'cancel', text: 'Keep program' },
        { onPress: () => void archiveProgram(), style: 'destructive', text: 'Remove' },
      ],
    );
  };

  const submitExercise = async () => {
    const added = await addExercise(exerciseName);
    if (added) {
      setExerciseName('');
      void Haptics.selectionAsync();
    }
  };

  const finishSession = async () => {
    const finished = await finish();
    if (finished) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onNavigate('today');
    }
  };

  const confirmDiscard = () => {
    Alert.alert(
      'Discard this workout?',
      'The active workout, its exercises, and all sets will be permanently removed.',
      [
        { style: 'cancel', text: 'Keep workout' },
        {
          onPress: () => {
            void discard();
          },
          style: 'destructive',
          text: 'Discard',
        },
      ],
    );
  };

  const confirmRemoveExercise = (exerciseId: string, name: string, hasCompletedSets: boolean) => {
    const remove = () => void removeExercise(exerciseId);
    if (!hasCompletedSets) {
      remove();
      return;
    }

    Alert.alert(
      `Remove ${name}?`,
      'Its completed sets will also be removed.',
      [
        { style: 'cancel', text: 'Cancel' },
        { onPress: remove, style: 'destructive', text: 'Remove' },
      ],
    );
  };

  return (
    <SafeAreaView edges={['top', 'right', 'bottom', 'left']} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <BlurTargetView ref={navigationBlurTarget} style={styles.flex}>
          <BlurTargetView
            pointerEvents="none"
            ref={surfaceBlurTarget}
            style={[styles.wallpaper, { backgroundColor: colors.background }]}
          >
            <View style={[styles.blueGlow, { backgroundColor: colors.primarySoft }]} />
            <View style={[styles.redGlow, { backgroundColor: `${colors.workout}28` }]} />
          </BlurTargetView>

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.topBar}>
              <View>
                <Text style={[styles.eyebrow, { color: colors.primary }]}>TRAIN</Text>
                <Text style={[styles.screenTitle, { color: colors.text }]}>Workout</Text>
              </View>
              {session ? (
                <View style={[styles.elapsedPill, { backgroundColor: colors.primarySoft }]}>
                  <Text style={[styles.elapsed, { color: colors.primary }]}>
                    {getElapsedLabel(session.startedAtUtc, now)}
                  </Text>
                </View>
              ) : null}
            </View>

            {workoutError || programError ? (
              <View
                accessibilityLiveRegion="polite"
                style={[styles.errorBanner, { backgroundColor: `${colors.workout}20` }]}
              >
                <Text style={[styles.errorText, { color: colors.text }]}>
                  {workoutError ?? programError}
                </Text>
                {status === 'error' ? (
                  <Pressable accessibilityRole="button" onPress={() => void retry()}>
                    <Text style={[styles.retry, { color: colors.primary }]}>Retry</Text>
                  </Pressable>
                ) : programStatus === 'error' ? (
                  <Pressable accessibilityRole="button" onPress={() => void retryProgram()}>
                    <Text style={[styles.retry, { color: colors.primary }]}>Retry</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            {status === 'loading' ? (
              <View style={styles.loading}>
                <ActivityIndicator color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textMuted }]}>Recovering workout…</Text>
              </View>
            ) : status === 'error' ? (
              <View style={styles.loading}>
                <Text style={[styles.loadingText, { color: colors.textMuted }]}>Use Retry to reopen your local workout log.</Text>
              </View>
            ) : session ? (
              <>
                <View style={styles.sessionHeading}>
                  <View>
                    <Text style={[styles.sessionTitle, { color: colors.text }]}>
                      {session.sessionLabel ?? 'Workout in progress'}
                    </Text>
                    <Text style={[styles.sessionMeta, { color: colors.textMuted }]}>Changes save on this device</Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    disabled={isBusy}
                    onPress={() => void finishSession()}
                    style={[styles.finishButton, { backgroundColor: colors.primary }]}
                  >
                    <Text style={styles.finishLabel}>Finish</Text>
                  </Pressable>
                </View>

                <View style={styles.exerciseList}>
                  {session.exercises.map((exercise, index) => (
                    <WorkoutExerciseCard
                      blurTarget={surfaceBlurTarget}
                      disabled={isBusy}
                      exercise={exercise}
                      isFirst={index === 0}
                      isLast={index === session.exercises.length - 1}
                      key={`${exercise.id}-${exercise.name}`}
                      onAddSet={() => addSet(exercise.id)}
                      onCompleteSet={completeSet}
                      onMove={(direction) => moveExercise(exercise.id, direction)}
                      onRemove={() =>
                        confirmRemoveExercise(
                          exercise.id,
                          exercise.name,
                          exercise.sets.some((set) => set.isCompleted),
                        )
                      }
                      onRemoveSet={(setId) => void removeSet(exercise.id, setId)}
                      onRename={(name) => renameExercise(exercise.id, name)}
                      onSaveDraft={saveSetDraft}
                      onUncompleteSet={uncompleteSet}
                    />
                  ))}
                </View>

                {session.exercises.length === 0 ? (
                  <Text style={[styles.emptyHint, { color: colors.textMuted }]}>Add your first exercise below.</Text>
                ) : null}

                <GlassSurface blurTarget={surfaceBlurTarget} intensity={62} style={styles.addExercise}>
                  <TextInput
                    accessibilityLabel="New exercise name"
                    editable={!isBusy}
                    maxLength={80}
                    onChangeText={setExerciseName}
                    onSubmitEditing={() => void submitExercise()}
                    placeholder="Exercise name"
                    placeholderTextColor={colors.glassTextMuted}
                    returnKeyType="done"
                    style={[styles.exerciseInput, { color: colors.glassText }]}
                    value={exerciseName}
                  />
                  <Pressable
                    accessibilityLabel="Add exercise"
                    accessibilityRole="button"
                    disabled={isBusy}
                    onPress={() => void submitExercise()}
                    style={[styles.addButton, { backgroundColor: colors.primary }]}
                  >
                    <Text style={styles.addButtonLabel}>Add</Text>
                  </Pressable>
                </GlassSurface>

                <Pressable
                  accessibilityRole="button"
                  disabled={isBusy}
                  onPress={confirmDiscard}
                  style={styles.discardButton}
                >
                  <Text style={[styles.discardLabel, { color: colors.workout }]}>Discard workout</Text>
                </Pressable>
              </>
            ) : isEditingProgram ? (
              <ProgramEditor
                blurTarget={surfaceBlurTarget}
                initialProgram={program}
                isSaving={isProgramMutating}
                onCancel={() => setIsEditingProgram(false)}
                onSave={saveProgramDraft}
              />
            ) : programStatus === 'loading' ? (
              <View style={styles.loading}>
                <ActivityIndicator color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading program…</Text>
              </View>
            ) : program ? (
              <ProgramOverview
                blurTarget={surfaceBlurTarget}
                disabled={isBusy}
                onEdit={() => setIsEditingProgram(true)}
                onRemove={confirmRemoveProgram}
                onStart={(plannedDay) => void startSession(plannedDay)}
                program={program}
              />
            ) : (
              <GlassSurface blurTarget={surfaceBlurTarget} intensity={70} style={styles.startCard}>
                <View style={[styles.startIcon, { backgroundColor: colors.primary }]}>
                  <Text style={styles.startIconText}>▦</Text>
                </View>
                <Text style={[styles.startTitle, { color: colors.glassText }]}>Plan your training</Text>
                <Text style={[styles.startCopy, { color: colors.glassTextMuted }]}>Choose PPL, Upper / Lower, FBEOD, or make a custom week.</Text>
                <Pressable
                  accessibilityRole="button"
                  disabled={isBusy}
                  onPress={() => setIsEditingProgram(true)}
                  style={[styles.startButton, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.startButtonLabel}>Create program</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={isBusy}
                  onPress={() => void startSession()}
                  style={styles.emptyWorkoutButton}
                >
                  <Text style={[styles.emptyWorkoutLabel, { color: colors.glassTextMuted }]}>Start without a program</Text>
                </Pressable>
              </GlassSurface>
            )}
          </ScrollView>
        </BlurTargetView>

        <FloatingNavigation
          activeSection="train"
          blurTarget={navigationBlurTarget}
          onSelect={onNavigate}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  wallpaper: {
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: 0,
  },
  blueGlow: {
    borderRadius: 220,
    height: 360,
    opacity: 0.7,
    position: 'absolute',
    right: -170,
    top: -120,
    width: 360,
  },
  redGlow: {
    borderRadius: 180,
    height: 320,
    left: -190,
    position: 'absolute',
    top: 480,
    width: 320,
  },
  content: {
    paddingBottom: 116,
    paddingHorizontal: 20,
    paddingTop: spacing.lg,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xxl,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.7,
  },
  screenTitle: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
    marginTop: 2,
  },
  elapsedPill: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  elapsed: {
    fontSize: 12,
    fontWeight: '800',
  },
  errorBanner: {
    alignItems: 'center',
    borderRadius: radii.md,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  retry: {
    fontSize: 12,
    fontWeight: '900',
  },
  loading: {
    alignItems: 'center',
    gap: spacing.md,
    justifyContent: 'center',
    minHeight: 280,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sessionHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sessionMeta: {
    fontSize: 11,
    marginTop: 3,
  },
  finishButton: {
    alignItems: 'center',
    borderRadius: radii.pill,
    justifyContent: 'center',
    minHeight: 40,
    minWidth: 76,
    paddingHorizontal: spacing.md,
  },
  finishLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  exerciseList: {
    gap: spacing.md,
  },
  emptyHint: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  addExercise: {
    alignItems: 'center',
    borderRadius: radii.pill,
    flexDirection: 'row',
    marginTop: spacing.md,
    padding: 7,
    paddingLeft: spacing.lg,
  },
  exerciseInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    minHeight: 42,
    paddingVertical: spacing.sm,
  },
  addButton: {
    alignItems: 'center',
    borderRadius: radii.pill,
    justifyContent: 'center',
    minHeight: 42,
    minWidth: 68,
  },
  addButtonLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  discardButton: {
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  discardLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  startCard: {
    alignItems: 'center',
    borderRadius: radii.xl,
    padding: spacing.xl,
  },
  startIcon: {
    alignItems: 'center',
    borderRadius: radii.pill,
    height: 56,
    justifyContent: 'center',
    marginBottom: spacing.lg,
    width: 56,
  },
  startIconText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '500',
  },
  startTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  startCopy: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.sm,
    maxWidth: 250,
    textAlign: 'center',
  },
  startButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: radii.pill,
    justifyContent: 'center',
    marginTop: spacing.xl,
    minHeight: 48,
  },
  startButtonLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  emptyWorkoutButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    marginTop: spacing.sm,
  },
  emptyWorkoutLabel: {
    fontSize: 11,
    fontWeight: '800',
  },
});
