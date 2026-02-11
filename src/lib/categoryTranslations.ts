import { SupportedLanguage } from './i18n';
import { MAIN_PROTEINS, CUISINES } from './constants';

// Translations for protein categories
export const PROTEIN_TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  es: {
    chicken: 'Pollo',
    fish: 'Pescado',
    pork: 'Cerdo',
    seafood: 'Mariscos',
    beef: 'Ternera',
    vegetables: 'Verduras',
    beans_legumes: 'Legumbres',
    desserts: 'Postres',
    guisos: 'Guisos',
  },
  ca: {
    chicken: 'Pollastre',
    fish: 'Peix',
    pork: 'Porc',
    seafood: 'Marisc',
    beef: 'Vedella',
    vegetables: 'Verdures',
    beans_legumes: 'Llegums',
    desserts: 'Postres',
    guisos: 'Guisats',
  },
  fr: {
    chicken: 'Poulet',
    fish: 'Poisson',
    pork: 'Porc',
    seafood: 'Fruits de mer',
    beef: 'Bœuf',
    vegetables: 'Légumes',
    beans_legumes: 'Légumineuses',
    desserts: 'Desserts',
    guisos: 'Ragoûts',
  },
  en: {
    chicken: 'Chicken',
    fish: 'Fish',
    pork: 'Pork',
    seafood: 'Seafood',
    beef: 'Beef',
    vegetables: 'Vegetables',
    beans_legumes: 'Beans & Legumes',
    desserts: 'Desserts',
    guisos: 'Stews',
  },
  pt: {
    chicken: 'Frango',
    fish: 'Peixe',
    pork: 'Porco',
    seafood: 'Frutos do mar',
    beef: 'Carne',
    vegetables: 'Vegetais',
    beans_legumes: 'Leguminosas',
    desserts: 'Sobremesas',
    guisos: 'Ensopados',
  },
};

// Translations for cuisines
export const CUISINE_TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  es: {
    española: 'Española',
    italiana: 'Italiana',
    mexicana: 'Mexicana',
    francesa: 'Francesa',
    asiática: 'Asiática',
    mediterránea: 'Mediterránea',
    americana: 'Americana',
    india: 'India',
    japonesa: 'Japonesa',
    tailandesa: 'Tailandesa',
    griega: 'Griega',
    turca: 'Turca',
    marroquí: 'Marroquí',
  },
  ca: {
    española: 'Espanyola',
    italiana: 'Italiana',
    mexicana: 'Mexicana',
    francesa: 'Francesa',
    asiática: 'Asiàtica',
    mediterránea: 'Mediterrània',
    americana: 'Americana',
    india: 'Índia',
    japonesa: 'Japonesa',
    tailandesa: 'Tailandesa',
    griega: 'Grecga',
    turca: 'Turca',
    marroquí: 'Marroquina',
  },
  fr: {
    española: 'Espagnole',
    italiana: 'Italienne',
    mexicana: 'Mexicaine',
    francesa: 'Française',
    asiática: 'Asiatique',
    mediterránea: 'Méditerranéenne',
    americana: 'Américaine',
    india: 'Indienne',
    japonesa: 'Japonaise',
    tailandesa: 'Thaïlandaise',
    griega: 'Grecque',
    turca: 'Turque',
    marroquí: 'Marocaine',
  },
  en: {
    española: 'Spanish',
    italiana: 'Italian',
    mexicana: 'Mexican',
    francesa: 'French',
    asiática: 'Asian',
    mediterránea: 'Mediterranean',
    americana: 'American',
    india: 'Indian',
    japonesa: 'Japanese',
    tailandesa: 'Thai',
    griega: 'Greek',
    turca: 'Turkish',
    marroquí: 'Moroccan',
  },
  pt: {
    española: 'Espanhola',
    italiana: 'Italiana',
    mexicana: 'Mexicana',
    francesa: 'Francesa',
    asiática: 'Asiática',
    mediterránea: 'Mediterrânea',
    americana: 'Americana',
    india: 'Indiana',
    japonesa: 'Japonesa',
    tailandesa: 'Tailandesa',
    griega: 'Grega',
    turca: 'Turca',
    marroquí: 'Marroquina',
  },
};

/**
 * Get translated protein label
 */
export function getTranslatedProtein(proteinValue: string, language: SupportedLanguage): string {
  return PROTEIN_TRANSLATIONS[language]?.[proteinValue] || 
         MAIN_PROTEINS.find(p => p.value === proteinValue)?.label || 
         proteinValue;
}

/**
 * Get translated cuisine label
 */
export function getTranslatedCuisine(cuisineValue: string, language: SupportedLanguage): string {
  return CUISINE_TRANSLATIONS[language]?.[cuisineValue] || 
         CUISINES.find(c => c.value === cuisineValue)?.label || 
         cuisineValue;
}

