/**
 * TuPonesYoComo – DARK NEON BRUTALIST
 * Bold, unforgettable: dark bg, electric accents, sharp shapes, asymmetric energy.
 * No soft corners. No timid palettes.
 */

export const COLORS = {
  // Dark base
  background: '#0A0A0B',
  surface: '#141416',
  surfaceRaised: '#1C1C1F',
  // Text
  text: '#FAFAFA',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  // Neon accents – use sparingly for maximum punch
  neonLime: '#B8FF3C',
  neonLimeDim: 'rgba(184, 255, 60, 0.25)',
  neonPink: '#FF2E97',
  neonPinkDim: 'rgba(255, 46, 151, 0.25)',
  neonCyan: '#00E5FF',
  neonCyanDim: 'rgba(0, 229, 255, 0.25)',
  neonOrange: '#FF6B00',
  neonOrangeDim: 'rgba(255, 107, 0, 0.25)',
  neonViolet: '#8B5CF6',
  neonVioletDim: 'rgba(139, 92, 246, 0.25)',
  // Semantic
  primary: '#B8FF3C',
  primaryDim: 'rgba(184, 255, 60, 0.2)',
  accent: '#00E5FF',
  error: '#FF3B5C',
  success: '#00E676',
  border: '#27272A',
  borderBright: '#3F3F46',
  card: '#18181B',
};

// Brutalist: sharp corners only (0 or tiny)
export const RADIUS = {
  none: 0,
  sharp: 2,
  sm: 4,
  md: 6,
  lg: 10,
  full: 9999,
};

export const SPACING = {
  xs: 6,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
  glowLime: {
    shadowColor: COLORS.neonLime,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  glowCyan: {
    shadowColor: COLORS.neonCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
};

export const FONT = {
  headingBold: '800' as const,
  headingSemibold: '600' as const,
  bodyRegular: '400' as const,
  bodyMedium: '500' as const,
};

// Category stripe colors (neon set)
export const CATEGORY_STRIPES = [
  COLORS.neonLime,
  COLORS.neonCyan,
  COLORS.neonPink,
  COLORS.neonOrange,
  COLORS.neonViolet,
  COLORS.neonLime,
  COLORS.neonCyan,
  COLORS.neonPink,
  COLORS.neonOrange,
];

// Alias for compatibility
export const BORDER_RADIUS = RADIUS;

export const MAIN_PROTEINS: Array<{ value: string; label: string; icon: string }> = [
  { value: 'chicken', label: 'Pollo', icon: '🐔' },
  { value: 'fish', label: 'Pescado', icon: '🐟' },
  { value: 'pork', label: 'Cerdo', icon: '🐷' },
  { value: 'seafood', label: 'Mariscos', icon: '🦐' },
  { value: 'beef', label: 'Ternera', icon: '🐄' },
  { value: 'vegetables', label: 'Verduras', icon: '🥕' },
  { value: 'beans_legumes', label: 'Legumbres', icon: '🫘' },
  { value: 'desserts', label: 'Postres', icon: '🍰' },
  { value: 'guisos', label: 'Guisos', icon: '🍲' },
];

export const CUISINES: Array<{ value: string; label: string; flag: string }> = [
  { value: 'española', label: 'Española', flag: '🇪🇸' },
  { value: 'italiana', label: 'Italiana', flag: '🇮🇹' },
  { value: 'mexicana', label: 'Mexicana', flag: '🇲🇽' },
  { value: 'francesa', label: 'Francesa', flag: '🇫🇷' },
  { value: 'asiática', label: 'Asiática', flag: '🇨🇳' },
  { value: 'mediterránea', label: 'Mediterránea', flag: '🌊' },
  { value: 'americana', label: 'Americana', flag: '🇺🇸' },
  { value: 'india', label: 'India', flag: '🇮🇳' },
  { value: 'japonesa', label: 'Japonesa', flag: '🇯🇵' },
  { value: 'tailandesa', label: 'Tailandesa', flag: '🇹🇭' },
  { value: 'griega', label: 'Griega', flag: '🇬🇷' },
  { value: 'turca', label: 'Turca', flag: '🇹🇷' },
  { value: 'marroquí', label: 'Marroquí', flag: '🇲🇦' },
];
