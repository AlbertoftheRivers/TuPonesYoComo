/**
 * Recipe Zine – Bold, playful, editorial design system
 * Add recipes, check recipes, learn to cook. OCR, dictation, Ollama + Supabase unchanged.
 */

export const COLORS = {
  // Zine palette: warm cream + bold coral + teal + mustard
  background: '#FFF8F0',
  surface: '#FFFFFF',
  surfaceWarm: '#FFFBF5',
  text: '#1C1917',
  textSecondary: '#57534E',
  textMuted: '#A8A29E',
  // Primary actions & header
  primary: '#E07A5F',
  primaryDark: '#C45C3E',
  // Accent: teal (browse, links)
  accent: '#3D405B',
  accentLight: '#81B29A',
  // Fun accent: mustard (highlights, Surprise me)
  fun: '#F2CC8F',
  funDark: '#E4A853',
  error: '#C53030',
  success: '#2F855A',
  border: '#E7E5E4',
  borderLight: '#F5F5F4',
  card: '#FFFFFF',
};

export const SPACING = {
  xs: 6,
  sm: 12,
  md: 18,
  lg: 26,
  xl: 36,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
};

export const FONT = {
  headingBold: '700' as const,
  headingSemibold: '600' as const,
  bodyRegular: '400' as const,
  bodyMedium: '500' as const,
};

// Category accent colors for recipe card stripes (by index)
export const CATEGORY_STRIPES = [
  '#E07A5F',
  '#81B29A',
  '#F2CC8F',
  '#3D405B',
  '#E07A5F',
  '#81B29A',
  '#F2CC8F',
  '#3D405B',
  '#E07A5F',
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
