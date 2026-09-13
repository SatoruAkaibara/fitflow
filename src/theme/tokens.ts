export type AppTheme = {
  isDark: boolean;
  colors: {
    background: string;
    surface: string;
    surfaceMuted: string;
    glass: string;
    glassStrong: string;
    glassSurfaceMuted: string;
    glassText: string;
    glassTextMuted: string;
    glassBorder: string;
    text: string;
    textMuted: string;
    border: string;
    shadow: string;
    primary: string;
    primarySoft: string;
    success: string;
    successSoft: string;
    workout: string;
    nutrition: string;
    focus: string;
    notes: string;
  };
};

const shared = {
  workout: '#E15D3D',
  nutrition: '#18865B',
  focus: '#7656D6',
  notes: '#C77A12',
};

export const lightTheme: AppTheme = {
  isDark: false,
  colors: {
    background: '#E9EEF6',
    surface: '#FCFCFE',
    surfaceMuted: 'rgba(22, 34, 54, 0.10)',
    glass: 'rgba(8, 15, 27, 0.78)',
    glassStrong: 'rgba(255, 255, 255, 0.14)',
    glassSurfaceMuted: 'rgba(255, 255, 255, 0.11)',
    glassText: '#FFFFFF',
    glassTextMuted: '#DCE3ED',
    glassBorder: 'rgba(255, 255, 255, 0.19)',
    text: '#080B10',
    textMuted: '#4D5665',
    border: 'rgba(8, 18, 34, 0.15)',
    shadow: '#647087',
    primary: '#086CFF',
    primarySoft: '#BCD4FF',
    success: '#087A52',
    successSoft: '#B9EAD8',
    workout: shared.workout,
    nutrition: shared.nutrition,
    focus: shared.focus,
    notes: shared.notes,
  },
};

export const darkTheme: AppTheme = {
  isDark: true,
  colors: {
    background: '#06090E',
    surface: '#15161A',
    surfaceMuted: 'rgba(255, 255, 255, 0.11)',
    glass: 'rgba(5, 9, 16, 0.80)',
    glassStrong: 'rgba(255, 255, 255, 0.13)',
    glassSurfaceMuted: 'rgba(255, 255, 255, 0.10)',
    glassText: '#FFFFFF',
    glassTextMuted: '#D8DEE8',
    glassBorder: 'rgba(255, 255, 255, 0.16)',
    text: '#F8F8FA',
    textMuted: '#B1B8C4',
    border: 'rgba(255, 255, 255, 0.17)',
    shadow: '#000000',
    primary: '#79A9FF',
    primarySoft: '#183668',
    success: '#63D6A7',
    successSoft: '#173C32',
    workout: '#FF8A70',
    nutrition: '#6BD5A9',
    focus: '#B49CFF',
    notes: '#F2B75E',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  sm: 14,
  md: 22,
  lg: 30,
  xl: 36,
  pill: 999,
} as const;
