import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { GlassSurface, type GlassTarget } from '../../components/GlassSurface';
import { radii, spacing } from '../../theme/tokens';
import { useAppTheme } from '../../theme/useAppTheme';
import { WEEKDAY_LABELS } from './dates';
import { createPresetProgram, PROGRAM_PRESETS } from './presets';
import type {
  ProgramDayDraft,
  ProgramPresetId,
  TrainingProgram,
  TrainingProgramInput,
} from './types';
import { validateTrainingProgram } from './validation';

type ProgramEditorProps = {
  blurTarget: GlassTarget;
  initialProgram: TrainingProgram | null;
  isSaving: boolean;
  onCancel: () => void;
  onSave: (input: TrainingProgramInput) => Promise<boolean>;
};

function copyProgram(program: TrainingProgram): TrainingProgramInput {
  return {
    anchorLocalDate: program.anchorLocalDate,
    days: program.days.map(({ isRest, label, slotIndex }) => ({
      isRest,
      label,
      slotIndex,
    })),
    name: program.name,
    scheduleType: program.scheduleType,
  };
}

export function ProgramEditor({
  blurTarget,
  initialProgram,
  isSaving,
  onCancel,
  onSave,
}: ProgramEditorProps) {
  const { colors } = useAppTheme();
  const [selectedPreset, setSelectedPreset] = useState<ProgramPresetId>(
    initialProgram ? 'custom' : 'ppl',
  );
  const [draft, setDraft] = useState<TrainingProgramInput>(() =>
    initialProgram ? copyProgram(initialProgram) : createPresetProgram('ppl'),
  );
  const [error, setError] = useState<string | null>(null);

  const choosePreset = (presetId: ProgramPresetId) => {
    setSelectedPreset(presetId);
    setDraft(createPresetProgram(presetId));
    setError(null);
  };

  const updateDay = (slotIndex: number, update: Partial<ProgramDayDraft>) => {
    setDraft((current) => ({
      ...current,
      days: current.days.map((day) =>
        day.slotIndex === slotIndex ? { ...day, ...update } : day,
      ),
    }));
  };

  const toggleRest = (day: ProgramDayDraft) => {
    updateDay(day.slotIndex, {
      isRest: !day.isRest,
      label: day.isRest ? day.label ?? 'Workout' : null,
    });
  };

  const submit = async () => {
    const result = validateTrainingProgram(draft);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setError(null);
    await onSave(result.value);
  };

  return (
    <GlassSurface blurTarget={blurTarget} intensity={72} style={styles.card}>
      <Text style={[styles.eyebrow, { color: colors.primary }]}>PROGRAM BUILDER</Text>
      <Text style={[styles.title, { color: colors.glassText }]}>Choose your rhythm</Text>
      <Text style={[styles.copy, { color: colors.glassTextMuted }]}>Presets are starting points. Every day stays editable.</Text>

      <View style={styles.presets}>
        {PROGRAM_PRESETS.map((preset) => {
          const selected = preset.id === selectedPreset;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              disabled={isSaving}
              key={preset.id}
              onPress={() => choosePreset(preset.id)}
              style={[
                styles.preset,
                {
                  backgroundColor: selected
                    ? colors.primary
                    : colors.glassSurfaceMuted,
                },
              ]}
            >
              <Text
                style={[
                  styles.presetLabel,
                  { color: selected ? '#FFFFFF' : colors.glassText },
                ]}
              >
                {preset.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.fieldLabel, { color: colors.glassTextMuted }]}>PROGRAM NAME</Text>
      <TextInput
        accessibilityLabel="Program name"
        editable={!isSaving}
        maxLength={60}
        onChangeText={(name) => setDraft((current) => ({ ...current, name }))}
        placeholder="My program"
        placeholderTextColor={colors.glassTextMuted}
        style={[
          styles.nameInput,
          { backgroundColor: colors.glassSurfaceMuted, color: colors.glassText },
        ]}
        value={draft.name}
      />

      {draft.scheduleType === 'alternating' ? (
        <>
          <Text style={[styles.fieldLabel, { color: colors.glassTextMuted }]}>FIRST FULL-BODY DAY</Text>
          <TextInput
            accessibilityHint="Use a four digit year, two digit month, and two digit day"
            accessibilityLabel="Program start date"
            editable={!isSaving}
            maxLength={10}
            onChangeText={(anchorLocalDate) =>
              setDraft((current) => ({ ...current, anchorLocalDate }))
            }
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.glassTextMuted}
            style={[
              styles.nameInput,
              { backgroundColor: colors.glassSurfaceMuted, color: colors.glassText },
            ]}
            value={draft.anchorLocalDate}
          />
        </>
      ) : null}

      <View style={styles.dayList}>
        {draft.days.map((day) => (
          <View key={day.slotIndex} style={styles.dayRow}>
            <Text style={[styles.dayName, { color: colors.glassTextMuted }]}>
              {draft.scheduleType === 'weekly'
                ? WEEKDAY_LABELS[day.slotIndex]
                : `Day ${day.slotIndex + 1}`}
            </Text>
            <TextInput
              accessibilityLabel={`${draft.scheduleType === 'weekly' ? WEEKDAY_LABELS[day.slotIndex] : `Day ${day.slotIndex + 1}`} workout label`}
              editable={!isSaving && !day.isRest}
              maxLength={40}
              onChangeText={(label) => updateDay(day.slotIndex, { label })}
              placeholder="Workout"
              placeholderTextColor={colors.glassTextMuted}
              style={[
                styles.dayInput,
                {
                  backgroundColor: colors.glassSurfaceMuted,
                  color: day.isRest ? colors.glassTextMuted : colors.glassText,
                  opacity: day.isRest ? 0.45 : 1,
                },
              ]}
              value={day.isRest ? 'Rest' : day.label ?? ''}
            />
            <Pressable
              accessibilityLabel={`${day.isRest ? 'Make training day' : 'Make rest day'}`}
              accessibilityRole="switch"
              accessibilityState={{ checked: !day.isRest }}
              disabled={isSaving}
              onPress={() => toggleRest(day)}
              style={[
                styles.dayToggle,
                {
                  backgroundColor: day.isRest
                    ? colors.glassSurfaceMuted
                    : colors.success,
                },
              ]}
            >
              <Text style={[styles.dayToggleText, { color: day.isRest ? colors.glassTextMuted : '#FFFFFF' }]}>
                {day.isRest ? 'REST' : 'ON'}
              </Text>
            </Pressable>
          </View>
        ))}
      </View>

      {error ? (
        <Text accessibilityLiveRegion="polite" style={[styles.error, { color: colors.workout }]}>
          {error}
        </Text>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          disabled={isSaving}
          onPress={onCancel}
          style={[styles.secondaryButton, { backgroundColor: colors.glassSurfaceMuted }]}
        >
          <Text style={[styles.secondaryLabel, { color: colors.glassText }]}>Cancel</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={isSaving}
          onPress={() => void submit()}
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.saveLabel}>{isSaving ? 'Saving…' : 'Activate program'}</Text>
        </Pressable>
      </View>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.3,
  },
  title: {
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: spacing.xs,
  },
  copy: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: spacing.xs,
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    marginTop: spacing.lg,
  },
  preset: {
    borderRadius: radii.pill,
    minHeight: 36,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetLabel: {
    fontSize: 10,
    fontWeight: '900',
  },
  fieldLabel: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: spacing.md,
  },
  nameInput: {
    borderRadius: radii.md,
    fontSize: 13,
    fontWeight: '700',
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  dayList: {
    gap: 7,
    marginTop: spacing.lg,
  },
  dayRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dayName: {
    fontSize: 10,
    fontWeight: '800',
    width: 38,
  },
  dayInput: {
    borderRadius: radii.sm,
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    minHeight: 40,
    paddingHorizontal: spacing.md,
  },
  dayToggle: {
    alignItems: 'center',
    borderRadius: radii.pill,
    justifyContent: 'center',
    minHeight: 34,
    width: 50,
  },
  dayToggleText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  error: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
    marginTop: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  secondaryButton: {
    alignItems: 'center',
    borderRadius: radii.pill,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
  },
  secondaryLabel: {
    fontSize: 11,
    fontWeight: '800',
  },
  saveButton: {
    alignItems: 'center',
    borderRadius: radii.pill,
    flex: 1.7,
    justifyContent: 'center',
    minHeight: 44,
  },
  saveLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
});
