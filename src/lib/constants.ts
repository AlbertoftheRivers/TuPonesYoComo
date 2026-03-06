/**
 * TuPonesYoComo – Lovable-style theme (fridge-to-fork-26.lovable.app)
 * Light, warm: cream background, DM Serif Display + Space Grotesk, orange primary, sage green secondary.
 * Same look as the published Lovable app; backend keeps OCR, dictation, Ollama.
 */

// Lovable CSS variables → hex for React Native
// :root { --background: 35 33% 96%; --foreground: 20 10% 15%; --card: 35 30% 98%;
//   --primary: 16 65% 50%; --secondary: 140 20% 55%; --muted: 35 20% 90%;
//   --muted-foreground: 20 8% 45%; --accent: 40 60% 60%; --border: 30 15% 85%; --radius: .75rem; }
export const COLORS = {
  background: '#faf8f5',
  surface: '#fdfcfa',
  surfaceRaised: '#f5f3ef',
  text: '#262422',
  textSecondary: '#4a4744',
  textMuted: '#6e6b67',
  primary: '#d94e1a',
  primaryDim: 'rgba(217, 78, 26, 0.15)',
  primaryForeground: '#faf8f5',
  accent: '#c9a227',
  secondary: '#6b9b6e',
  secondaryDim: 'rgba(107, 155, 110, 0.2)',
  error: '#dc2626',
  success: '#16a34a',
  border: '#ddd8d0',
  borderBright: '#e8e4de',
  card: '#fdfcfa',
  muted: '#e8e4de',
  mutedForeground: '#6e6b67',
  // Aliases for components that used neon names
  neonLime: '#6b9b6e',
  neonLimeDim: 'rgba(107, 155, 110, 0.2)',
  neonCyan: '#6b9b6e',
  neonCyanDim: 'rgba(107, 155, 110, 0.15)',
  neonOrange: '#d94e1a',
  neonOrangeDim: 'rgba(217, 78, 26, 0.15)',
  neonViolet: '#8b6914',
  neonVioletDim: 'rgba(139, 105, 20, 0.15)',
  neonPink: '#d94e1a',
  neonPinkDim: 'rgba(217, 78, 26, 0.15)',
  // Hero / FlavorVault-style
  heroOverlay: 'rgba(60, 55, 48, 0.75)',
  heroText: '#ffffff',
  fridgeIconBg: '#d4e8d5',
  chipOrange: 'rgba(217, 78, 26, 0.2)',
};

export const RADIUS = {
  none: 0,
  sharp: 2,
  sm: 6,
  md: 10,
  lg: 12,
  full: 9999,
};

export const BORDER_RADIUS = RADIUS;

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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  glowLime: {
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  glowCyan: {
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const FONT = {
  headingBold: '700' as const,
  headingSemibold: '600' as const,
  bodyRegular: '400' as const,
  bodyMedium: '500' as const,
};

export const CATEGORY_STRIPES = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.accent,
  COLORS.primary,
  COLORS.secondary,
  COLORS.accent,
  COLORS.primary,
  COLORS.secondary,
  COLORS.accent,
];

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
