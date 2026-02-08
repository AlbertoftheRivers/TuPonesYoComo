import { Ingredient } from '../types/recipe';

/**
 * Calculate adjusted ingredients based on serving size multiplier
 */
export function calculateAdjustedIngredients(
  ingredients: Ingredient[],
  originalServings: number,
  desiredServings: number
): Ingredient[] {
  if (originalServings <= 0 || desiredServings <= 0) {
    return ingredients;
  }

  const multiplier = desiredServings / originalServings;

  return ingredients.map((ingredient) => {
    const adjusted: Ingredient = { ...ingredient };

    // Only multiply if quantity is a number
    if (typeof ingredient.quantity === 'number') {
      adjusted.quantity = Math.round((ingredient.quantity * multiplier) * 100) / 100; // Round to 2 decimals
    } else if (typeof ingredient.quantity === 'string') {
      // Try to parse string quantities like "1/2", "1.5", etc.
      const parsed = parseQuantity(ingredient.quantity);
      if (parsed !== null) {
        const adjustedValue = parsed * multiplier;
        adjusted.quantity = formatQuantity(adjustedValue);
      }
    }

    return adjusted;
  });
}

/**
 * Parse quantity string to number (handles fractions and decimals)
 */
function parseQuantity(quantity: string): number | null {
  // Remove whitespace
  const clean = quantity.trim();

  // Handle fractions like "1/2", "3/4"
  const fractionMatch = clean.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const numerator = parseFloat(fractionMatch[1]);
    const denominator = parseFloat(fractionMatch[2]);
    if (denominator !== 0) {
      return numerator / denominator;
    }
  }

  // Handle decimals
  const decimal = parseFloat(clean);
  if (!isNaN(decimal)) {
    return decimal;
  }

  return null;
}

/**
 * Format number to readable quantity string
 */
function formatQuantity(value: number): string {
  // Round to 2 decimals
  const rounded = Math.round(value * 100) / 100;

  // If it's a whole number, return as integer string
  if (rounded % 1 === 0) {
    return rounded.toString();
  }

  // Try to convert to fraction if it's a common fraction
  const fraction = decimalToFraction(rounded);
  if (fraction) {
    return fraction;
  }

  // Otherwise return as decimal
  return rounded.toString();
}

/**
 * Convert decimal to common fraction (1/2, 1/3, 1/4, 3/4, etc.)
 */
function decimalToFraction(decimal: number): string | null {
  const commonFractions: { [key: number]: string } = {
    0.25: '1/4',
    0.33: '1/3',
    0.5: '1/2',
    0.67: '2/3',
    0.75: '3/4',
  };

  // Check if it's close to a common fraction
  for (const [dec, frac] of Object.entries(commonFractions)) {
    if (Math.abs(decimal - parseFloat(dec)) < 0.01) {
      return frac;
    }
  }

  return null;
}


/**
 * Calculate adjusted ingredients based on serving size multiplier
 */
export function calculateAdjustedIngredients(
  ingredients: Ingredient[],
  originalServings: number,
  desiredServings: number
): Ingredient[] {
  if (originalServings <= 0 || desiredServings <= 0) {
    return ingredients;
  }

  const multiplier = desiredServings / originalServings;

  return ingredients.map((ingredient) => {
    const adjusted: Ingredient = { ...ingredient };

    // Only multiply if quantity is a number
    if (typeof ingredient.quantity === 'number') {
      adjusted.quantity = Math.round((ingredient.quantity * multiplier) * 100) / 100; // Round to 2 decimals
    } else if (typeof ingredient.quantity === 'string') {
      // Try to parse string quantities like "1/2", "1.5", etc.
      const parsed = parseQuantity(ingredient.quantity);
      if (parsed !== null) {
        const adjustedValue = parsed * multiplier;
        adjusted.quantity = formatQuantity(adjustedValue);
      }
    }

    return adjusted;
  });
}

/**
 * Parse quantity string to number (handles fractions and decimals)
 */
function parseQuantity(quantity: string): number | null {
  // Remove whitespace
  const clean = quantity.trim();

  // Handle fractions like "1/2", "3/4"
  const fractionMatch = clean.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const numerator = parseFloat(fractionMatch[1]);
    const denominator = parseFloat(fractionMatch[2]);
    if (denominator !== 0) {
      return numerator / denominator;
    }
  }

  // Handle decimals
  const decimal = parseFloat(clean);
  if (!isNaN(decimal)) {
    return decimal;
  }

  return null;
}

/**
 * Format number to readable quantity string
 */
function formatQuantity(value: number): string {
  // Round to 2 decimals
  const rounded = Math.round(value * 100) / 100;

  // If it's a whole number, return as integer string
  if (rounded % 1 === 0) {
    return rounded.toString();
  }

  // Try to convert to fraction if it's a common fraction
  const fraction = decimalToFraction(rounded);
  if (fraction) {
    return fraction;
  }

  // Otherwise return as decimal
  return rounded.toString();
}

/**
 * Convert decimal to common fraction (1/2, 1/3, 1/4, 3/4, etc.)
 */
function decimalToFraction(decimal: number): string | null {
  const commonFractions: { [key: number]: string } = {
    0.25: '1/4',
    0.33: '1/3',
    0.5: '1/2',
    0.67: '2/3',
    0.75: '3/4',
  };

  // Check if it's close to a common fraction
  for (const [dec, frac] of Object.entries(commonFractions)) {
    if (Math.abs(decimal - parseFloat(dec)) < 0.01) {
      return frac;
    }
  }

  return null;
}


