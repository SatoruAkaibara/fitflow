import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text } from 'react-native';

import { radii, spacing } from '../theme/tokens';
import { useAppTheme } from '../theme/useAppTheme';
import { GlassSurface, type GlassTarget } from './GlassSurface';

type FloatingNavigationProps = {
  activeSection: AppSection;
  blurTarget: GlassTarget;
  onSelect: (section: AppSection) => void;
};

export type AppSection = 'today' | 'train';

const items = [
  { label: 'Today', section: 'today' as const, symbol: '●' },
  { label: 'Train', section: 'train' as const, symbol: '＋' },
  { label: 'Fuel', section: null, symbol: '◫' },
  { label: 'More', section: null, symbol: '••' },
];

export function FloatingNavigation({
  activeSection,
  blurTarget,
  onSelect,
}: FloatingNavigationProps) {
  const { colors } = useAppTheme();

  return (
    <GlassSurface
      accessibilityLabel="Main navigation"
      blurTarget={blurTarget}
      intensity={92}
      style={styles.container}
    >
      {items.map((item) => {
        const isActive = item.section === activeSection;

        return (
        <Pressable
          accessibilityLabel={item.section ? item.label : `${item.label}, coming soon`}
          accessibilityRole="button"
          accessibilityState={{ disabled: item.section === null, selected: isActive }}
          disabled={item.section === null}
          key={item.label}
          onPress={() => {
            if (!item.section) return;
            void Haptics.selectionAsync();
            onSelect(item.section);
          }}
          style={[
            styles.item,
            isActive && { backgroundColor: colors.primary },
          ]}
        >
          <Text
            style={[
              styles.symbol,
              { color: isActive ? '#FFFFFF' : colors.glassTextMuted },
            ]}
          >
            {item.symbol}
          </Text>
          <Text
            style={[
              styles.label,
              { color: isActive ? '#FFFFFF' : colors.glassTextMuted },
            ]}
          >
            {item.label}
          </Text>
        </Pressable>
        );
      })}
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: radii.pill,
    bottom: 12,
    flexDirection: 'row',
    gap: spacing.xs,
    left: 18,
    padding: 6,
    position: 'absolute',
    right: 18,
  },
  item: {
    alignItems: 'center',
    borderRadius: radii.pill,
    flex: 1,
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.sm,
  },
  symbol: {
    fontSize: 11,
    fontWeight: '900',
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
  },
});
