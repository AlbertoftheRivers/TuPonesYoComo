/**
 * Design system: warm editorial / cookbook
 * Distinctive, high-contrast, responsive. OCR, dictation, Ollama + Supabase unchanged.
 */

export const COLORS = {
  // Warm paper & surfaces
  background: '#FAF6F1',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  // Text – dark chocolate (4.5:1+ on background)
  text: '#1A1510',
  textSecondary: '#6B5B4F',
  textMuted: '#9C8B7D',
  // Brand – terracotta & honey
  primary: '#B84A14',
  primaryDark: '#8F3A10',
  accent: '#C9921C',
  accentLight: '#E8C45C',
  // Semantic
  error: '#C62828',
  success: '#2E7D32',
  border: '#E8E0D8',
  borderLight: '#F0EBE6',
  card: '#FFFFFF',
};

export const SPACING = {
  xs: 6,
  sm: 12,
  md: 20,
  lg: 28,
  xl: 40,
};

export const BORDER_RADIUS = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#1A1510',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#1A1510',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#1A1510',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const FONT = {
  headingBold: '700' as const,
  headingSemibold: '600' as const,
  bodyRegular: '400' as const,
  bodyMedium: '500' as const,
  caption: '400' as const,
};

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
