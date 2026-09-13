import { StyleSheet, Text, View } from 'react-native';

import { radii, spacing } from '../theme/tokens';
import { useAppTheme } from '../theme/useAppTheme';
import { GlassSurface, type GlassTarget } from './GlassSurface';

type FeatureCardProps = {
  accent: string;
  blurTarget: GlassTarget;
  label: string;
  symbol: string;
  summary: string;
};

export function FeatureCard({
  accent,
  blurTarget,
  label,
  symbol,
  summary,
}: FeatureCardProps) {
  const { colors } = useAppTheme();

  return (
    <GlassSurface
      accessibilityLabel={`${label}. ${summary}`}
      blurTarget={blurTarget}
      intensity={64}
      style={styles.card}
    >
      <View
        style={[styles.symbol, { backgroundColor: colors.glassSurfaceMuted }]}
      >
        <Text style={[styles.symbolText, { color: accent }]}>{symbol}</Text>
      </View>
      <Text style={[styles.label, { color: colors.glassText }]}>{label}</Text>
      <Text style={[styles.summary, { color: colors.glassTextMuted }]}>{summary}</Text>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 164,
    padding: 18,
  },
  symbol: {
    alignItems: 'center',
    borderRadius: radii.pill,
    height: 42,
    justifyContent: 'center',
    marginBottom: spacing.lg,
    width: 42,
  },
  symbolText: {
    fontSize: 15,
    fontWeight: '800',
  },
  label: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: spacing.xs,
  },
  summary: {
    fontSize: 13,
    lineHeight: 18,
  },
});
