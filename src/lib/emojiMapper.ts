// Mapeo de palabras clave a emojis para categorías de proteínas/ingredientes
const EMOJI_MAP: Record<string, string> = {
  // Animales
  'cordero': '🐑',
  'lamb': '🐑',
  'oveja': '🐑',
  'conejo': '🐰',
  'rabbit': '🐰',
  'venado': '🦌',
  'deer': '🦌',
  'ciervo': '🦌',
  'pato': '🦆',
  'duck': '🦆',
  'pavo': '🦃',
  'turkey': '🦃',
  'codorniz': '🐦',
  'quail': '🐦',
  'pigeon': '🕊️',
  'paloma': '🕊️',
  
  // Carnes procesadas
  'embutido': '🌭',
  'salami': '🌭',
  'chorizo': '🌭',
  'jamón': '🍖',
  'ham': '🍖',
  'tocino': '🥓',
  'bacon': '🥓',
  'panceta': '🥓',
  
  // Pescados específicos
  'salmón': '🐟',
  'salmon': '🐟',
  'atún': '🐟',
  'tuna': '🐟',
  'bacalao': '🐟',
  'cod': '🐟',
  'merluza': '🐟',
  'hake': '🐟',
  'sardina': '🐟',
  'sardine': '🐟',
  'trucha': '🐟',
  'trout': '🐟',
  
  // Mariscos específicos
  'langosta': '🦞',
  'lobster': '🦞',
  'cangrejo': '🦀',
  'crab': '🦀',
  'pulpo': '🐙',
  'octopus': '🐙',
  'calamar': '🦑',
  'squid': '🦑',
  'mejillón': '🦪',
  'mussel': '🦪',
  'ostra': '🦪',
  'oyster': '🦪',
  
  // Vegetales específicos
  'seta': '🍄',
  'mushroom': '🍄',
  'champiñón': '🍄',
  'hongos': '🍄',
  'aguacate': '🥑',
  'avocado': '🥑',
  'palta': '🥑',
  'berenjena': '🍆',
  'eggplant': '🍆',
  'calabacín': '🥒',
  'zucchini': '🥒',
  'calabaza': '🎃',
  'pumpkin': '🎃',
  'tomate': '🍅',
  'tomato': '🍅',
  'pimiento': '🫑',
  'pepper': '🫑',
  'pimentón': '🫑',
  'brócoli': '🥦',
  'broccoli': '🥦',
  'coliflor': '🥦',
  'cauliflower': '🥦',
  'espinaca': '🥬',
  'spinach': '🥬',
  'lechuga': '🥬',
  'lettuce': '🥬',
  'maíz': '🌽',
  'corn': '🌽',
  'patata': '🥔',
  'potato': '🥔',
  'papa': '🥔',
  'batata': '🍠',
  'sweet potato': '🍠',
  'boniato': '🍠',
  
  // Frutas
  'fresa': '🍓',
  'strawberry': '🍓',
  'plátano': '🍌',
  'banana': '🍌',
  'manzana': '🍎',
  'apple': '🍎',
  'naranja': '🍊',
  'orange': '🍊',
  'limón': '🍋',
  'lemon': '🍋',
  'uva': '🍇',
  'grape': '🍇',
  'cereza': '🍒',
  'cherry': '🍒',
  
  // Granos y legumbres
  'arroz': '🍚',
  'rice': '🍚',
  'pasta': '🍝',
  'noodles': '🍜',
  'lenteja': '🫘',
  'lentil': '🫘',
  'garbanzo': '🫘',
  'chickpea': '🫘',
  'frijol': '🫘',
  'bean': '🫘',
  'judía': '🫘',
  'haba': '🫘',
  'fava': '🫘',
  
  // Lácteos
  'queso': '🧀',
  'cheese': '🧀',
  'yogur': '🥛',
  'yogurt': '🥛',
  'leche': '🥛',
  'milk': '🥛',
  'mantequilla': '🧈',
  'butter': '🧈',
  'nata': '🥛',
  'cream': '🥛',
  
  // Huevos
  'huevo': '🥚',
  'egg': '🥚',
  'huevos': '🥚',
  'eggs': '🥚',
  
  // Otros
  'pan': '🍞',
  'bread': '🍞',
  'tortilla': '🫓',
  'pizza': '🍕',
  'hamburguesa': '🍔',
  'burger': '🍔',
  'taco': '🌮',
  'burrito': '🌯',
  'sushi': '🍣',
  'ramen': '🍜',
  'sopa': '🍲',
  'soup': '🍲',
  'ensalada': '🥗',
  'salad': '🥗',
};

/**
 * Detecta automáticamente el emoji apropiado basado en el nombre de la categoría
 */
export function detectEmojiForCategory(categoryName: string): string {
  const normalized = categoryName.toLowerCase().trim();
  
  // Buscar coincidencias exactas primero
  if (EMOJI_MAP[normalized]) {
    return EMOJI_MAP[normalized];
  }
  
  // Buscar coincidencias parciales
  for (const [key, emoji] of Object.entries(EMOJI_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return emoji;
    }
  }
  
  // Emoji por defecto según el tipo
  if (normalized.includes('carne') || normalized.includes('meat')) {
    return '🥩';
  }
  if (normalized.includes('pescado') || normalized.includes('fish')) {
    return '🐟';
  }
  if (normalized.includes('pollo') || normalized.includes('chicken')) {
    return '🐔';
  }
  if (normalized.includes('cerdo') || normalized.includes('pork')) {
    return '🐷';
  }
  if (normalized.includes('marisco') || normalized.includes('seafood')) {
    return '🦐';
  }
  if (normalized.includes('vegetal') || normalized.includes('vegetable') || normalized.includes('verdura')) {
    return '🥕';
  }
  if (normalized.includes('fruta') || normalized.includes('fruit')) {
    return '🍎';
  }
  if (normalized.includes('postre') || normalized.includes('dessert') || normalized.includes('dulce')) {
    return '🍰';
  }
  if (normalized.includes('guiso') || normalized.includes('stew')) {
    return '🍲';
  }
  
  // Emoji genérico por defecto
  return '🍽️';
}

