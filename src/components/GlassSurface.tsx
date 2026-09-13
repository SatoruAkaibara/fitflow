import { BlurView } from 'expo-blur';
import type { PropsWithChildren, RefObject } from 'react';
import type { StyleProp, View, ViewProps, ViewStyle } from 'react-native';
import { StyleSheet, View as NativeView } from 'react-native';

import { radii } from '../theme/tokens';
import { useAppTheme } from '../theme/useAppTheme';

export type GlassTarget = RefObject<View | null>;

type GlassSurfaceProps = PropsWithChildren<{
  blurTarget: GlassTarget;
  intensity?: number;
  style?: StyleProp<ViewStyle>;
}> &
  Pick<ViewProps, 'accessibilityLabel' | 'accessibilityRole'>;

export function GlassSurface({
  accessibilityLabel,
  accessibilityRole,
  blurTarget,
  children,
  intensity = 72,
  style,
}: GlassSurfaceProps) {
  const { colors } = useAppTheme();

  return (
    <NativeView
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      style={[
        styles.surface,
        {
          borderColor: colors.glassBorder,
          shadowColor: colors.shadow,
        },
        style,
      ]}
    >
      <BlurView
        blurMethod="dimezisBlurViewSdk31Plus"
        blurReductionFactor={3}
        blurTarget={blurTarget}
        intensity={intensity}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
        tint="dark"
      />
      <NativeView
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: colors.glass }]}
      />
      {children}
    </NativeView>
  );
}

const styles = StyleSheet.create({
  surface: {
    borderRadius: radii.lg,
    borderWidth: 1,
    elevation: 4,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 26,
  },
});
