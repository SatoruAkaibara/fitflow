import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { spacing } from '../theme/tokens';
import { useAppTheme } from '../theme/useAppTheme';

export function AppLoadingScreen() {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={[styles.label, { color: colors.textMuted }]}>Preparing FitFlow…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
});
