import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_KEY = '@tuponesyocomo:language';

export type SupportedLanguage = 'es' | 'ca' | 'fr' | 'en' | 'pt';

let currentLanguage: SupportedLanguage = 'es';

export const translations: Record<SupportedLanguage, Record<string, string>> = {
  es: {
    // Home Screen
    appName: 'TuPonesYoComo',
    selectCategory: 'Selecciona una categoría para ver recetas',
    addRecipe: 'Añadir Receta',
    
    // Navigation
    recipeDetails: 'Detalles de la Receta',
    addRecipeTitle: 'Añadir Receta',
    editRecipe: 'Editar Receta',
    userGuide: 'Guía de Usuario',
    
    // Add/Edit Recipe Screen
    recipeTitle: 'Título de la Receta',
    mainProtein: 'Proteína Principal',
    cuisines: 'Cocinas',
    rawText: 'Texto de la Receta',
    analyze: 'Analizar',
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    servings: 'Porciones',
    totalTime: 'Tiempo Total',
    ovenTime: 'Tiempo de Horno',
    ingredients: 'Ingredientes',
    steps: 'Pasos',
    gadgets: 'Utensilios',
    
    // Actions
    record: 'Grabar',
    stop: 'Detener',
    takePhoto: 'Tomar Foto',
    selectFromGallery: 'Seleccionar de Galería',
    scanRecipe: 'Escanear Receta',
    chooseOption: 'Elige una opción para escanear la receta',
    
    // Modals
    addCategory: 'Añadir Categoría',
    categoryName: 'Nombre de la categoría',
    categoryIcon: 'Icono (emoji)',
    add: 'Añadir',
    addCuisine: 'Añadir Cocina',
    cuisineName: 'Nombre de la cocina',
    cuisineFlag: 'Bandera (emoji)',
    
    // Messages
    success: 'Éxito',
    error: 'Error',
    categoryAdded: 'Categoría añadida',
    cuisineAdded: 'Cocina añadida',
    recipeSaved: 'Receta guardada',
    recipeDeleted: 'Receta eliminada',
    recipeSavedSuccess: '¡Receta guardada correctamente!',
    viewRecipe: 'Ver Receta',
    backToMainMenu: 'Volver al Menú Principal',
    pleaseEnterName: 'Por favor ingresa un nombre',
    pleaseEnterIcon: 'Por favor ingresa un icono',
    pleaseEnterFlag: 'Por favor ingresa un emoji de bandera',
    categoryExists: 'Esta categoría ya existe',
    cuisineExists: 'Esta cocina ya existe',
    
    // Recipe List
    noRecipes: 'No hay recetas en esta categoría',
    pullToRefresh: 'Tira para actualizar',
    
    // Language
    language: 'Idioma',
    selectLanguage: 'Seleccionar Idioma',
    spanish: 'Español',
    catalan: 'Catalán',
    french: 'Francés',
    english: 'Inglés',
    portuguese: 'Portugués',
  },
  ca: {
    appName: 'TuPonesYoComo',
    selectCategory: 'Selecciona una categoria per veure receptes',
    addRecipe: 'Afegir Recepta',
    recipeDetails: 'Detalls de la Recepta',
    addRecipeTitle: 'Afegir Recepta',
    editRecipe: 'Editar Recepta',
    userGuide: 'Guia d\'Usuari',
    recipeTitle: 'Títol de la Recepta',
    mainProtein: 'Proteïna Principal',
    cuisines: 'Cuines',
    rawText: 'Text de la Recepta',
    analyze: 'Analitzar',
    save: 'Desar',
    cancel: 'Cancel·lar',
    delete: 'Eliminar',
    edit: 'Editar',
    servings: 'Racions',
    totalTime: 'Temps Total',
    ovenTime: 'Temps de Forn',
    ingredients: 'Ingredients',
    steps: 'Passos',
    gadgets: 'Eines',
    record: 'Enregistrar',
    stop: 'Aturar',
    takePhoto: 'Fer Foto',
    selectFromGallery: 'Seleccionar de la Galeria',
    scanRecipe: 'Escanejar Recepta',
    chooseOption: 'Tria una opció per escanejar la recepta',
    addCategory: 'Afegir Categoria',
    categoryName: 'Nom de la categoria',
    categoryIcon: 'Icona (emoji)',
    add: 'Afegir',
    addCuisine: 'Afegir Cuina',
    cuisineName: 'Nom de la cuina',
    cuisineFlag: 'Bandera (emoji)',
    success: 'Èxit',
    error: 'Error',
    categoryAdded: 'Categoria afegida',
    cuisineAdded: 'Cuina afegida',
    recipeSaved: 'Recepta desada',
    recipeDeleted: 'Recepta eliminada',
    recipeSavedSuccess: 'Recepta desada correctament!',
    viewRecipe: 'Veure Recepta',
    backToMainMenu: 'Tornar al Menú Principal',
    pleaseEnterName: 'Si us plau, introdueix un nom',
    pleaseEnterIcon: 'Si us plau, introdueix una icona',
    pleaseEnterFlag: 'Si us plau, introdueix un emoji de bandera',
    categoryExists: 'Aquesta categoria ja existeix',
    cuisineExists: 'Aquesta cuina ja existeix',
    noRecipes: 'No hi ha receptes en aquesta categoria',
    pullToRefresh: 'Tira per actualitzar',
    language: 'Idioma',
    selectLanguage: 'Seleccionar Idioma',
    spanish: 'Espanyol',
    catalan: 'Català',
    french: 'Francès',
    english: 'Anglès',
    portuguese: 'Portuguès',
  },
  fr: {
    appName: 'TuPonesYoComo',
    selectCategory: 'Sélectionnez une catégorie pour voir les recettes',
    addRecipe: 'Ajouter une Recette',
    recipeDetails: 'Détails de la Recette',
    addRecipeTitle: 'Ajouter une Recette',
    editRecipe: 'Modifier la Recette',
    userGuide: 'Guide de l\'Utilisateur',
    recipeTitle: 'Titre de la Recette',
    mainProtein: 'Protéine Principale',
    cuisines: 'Cuisines',
    rawText: 'Texte de la Recette',
    analyze: 'Analyser',
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    servings: 'Portions',
    totalTime: 'Temps Total',
    ovenTime: 'Temps au Four',
    ingredients: 'Ingrédients',
    steps: 'Étapes',
    gadgets: 'Ustensiles',
    record: 'Enregistrer',
    stop: 'Arrêter',
    takePhoto: 'Prendre une Photo',
    selectFromGallery: 'Sélectionner depuis la Galerie',
    scanRecipe: 'Scanner la Recette',
    chooseOption: 'Choisissez une option pour scanner la recette',
    addCategory: 'Ajouter une Catégorie',
    categoryName: 'Nom de la catégorie',
    categoryIcon: 'Icône (emoji)',
    add: 'Ajouter',
    addCuisine: 'Ajouter une Cuisine',
    cuisineName: 'Nom de la cuisine',
    cuisineFlag: 'Drapeau (emoji)',
    success: 'Succès',
    error: 'Erreur',
    categoryAdded: 'Catégorie ajoutée',
    cuisineAdded: 'Cuisine ajoutée',
    recipeSaved: 'Recette enregistrée',
    recipeDeleted: 'Recette supprimée',
    recipeSavedSuccess: 'Recette enregistrée avec succès!',
    viewRecipe: 'Voir la Recette',
    backToMainMenu: 'Retour au Menu Principal',
    pleaseEnterName: 'Veuillez entrer un nom',
    pleaseEnterIcon: 'Veuillez entrer une icône',
    pleaseEnterFlag: 'Veuillez entrer un emoji de drapeau',
    categoryExists: 'Cette catégorie existe déjà',
    cuisineExists: 'Cette cuisine existe déjà',
    noRecipes: 'Aucune recette dans cette catégorie',
    pullToRefresh: 'Tirez pour actualiser',
    language: 'Langue',
    selectLanguage: 'Sélectionner la Langue',
    spanish: 'Espagnol',
    catalan: 'Catalan',
    french: 'Français',
    english: 'Anglais',
    portuguese: 'Portugais',
  },
  en: {
    appName: 'TuPonesYoComo',
    selectCategory: 'Select a category to view recipes',
    addRecipe: 'Add Recipe',
    recipeDetails: 'Recipe Details',
    addRecipeTitle: 'Add Recipe',
    editRecipe: 'Edit Recipe',
    userGuide: 'User Guide',
    recipeTitle: 'Recipe Title',
    mainProtein: 'Main Protein',
    cuisines: 'Cuisines',
    rawText: 'Recipe Text',
    analyze: 'Analyze',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    servings: 'Servings',
    totalTime: 'Total Time',
    ovenTime: 'Oven Time',
    ingredients: 'Ingredients',
    steps: 'Steps',
    gadgets: 'Utensils',
    record: 'Record',
    stop: 'Stop',
    takePhoto: 'Take Photo',
    selectFromGallery: 'Select from Gallery',
    scanRecipe: 'Scan Recipe',
    chooseOption: 'Choose an option to scan the recipe',
    addCategory: 'Add Category',
    categoryName: 'Category name',
    categoryIcon: 'Icon (emoji)',
    add: 'Add',
    addCuisine: 'Add Cuisine',
    cuisineName: 'Cuisine name',
    cuisineFlag: 'Flag (emoji)',
    success: 'Success',
    error: 'Error',
    categoryAdded: 'Category added',
    cuisineAdded: 'Cuisine added',
    recipeSaved: 'Recipe saved',
    recipeDeleted: 'Recipe deleted',
    recipeSavedSuccess: 'Recipe saved successfully!',
    viewRecipe: 'View Recipe',
    backToMainMenu: 'Back to Main Menu',
    pleaseEnterName: 'Please enter a name',
    pleaseEnterIcon: 'Please enter an icon',
    pleaseEnterFlag: 'Please enter a flag emoji',
    categoryExists: 'This category already exists',
    cuisineExists: 'This cuisine already exists',
    noRecipes: 'No recipes in this category',
    pullToRefresh: 'Pull to refresh',
    language: 'Language',
    selectLanguage: 'Select Language',
    spanish: 'Spanish',
    catalan: 'Catalan',
    french: 'French',
    english: 'English',
    portuguese: 'Portuguese',
  },
  pt: {
    appName: 'TuPonesYoComo',
    selectCategory: 'Selecione uma categoria para ver receitas',
    addRecipe: 'Adicionar Receita',
    recipeDetails: 'Detalhes da Receita',
    addRecipeTitle: 'Adicionar Receita',
    editRecipe: 'Editar Receita',
    userGuide: 'Guia do Usuário',
    recipeTitle: 'Título da Receita',
    mainProtein: 'Proteína Principal',
    cuisines: 'Culinárias',
    rawText: 'Texto da Receita',
    analyze: 'Analisar',
    save: 'Salvar',
    cancel: 'Cancelar',
    delete: 'Excluir',
    edit: 'Editar',
    servings: 'Porções',
    totalTime: 'Tempo Total',
    ovenTime: 'Tempo no Forno',
    ingredients: 'Ingredientes',
    steps: 'Passos',
    gadgets: 'Utensílios',
    record: 'Gravar',
    stop: 'Parar',
    takePhoto: 'Tirar Foto',
    selectFromGallery: 'Selecionar da Galeria',
    scanRecipe: 'Escanear Receita',
    chooseOption: 'Escolha uma opção para escanear a receita',
    addCategory: 'Adicionar Categoria',
    categoryName: 'Nome da categoria',
    categoryIcon: 'Ícone (emoji)',
    add: 'Adicionar',
    addCuisine: 'Adicionar Culinária',
    cuisineName: 'Nome da culinária',
    cuisineFlag: 'Bandeira (emoji)',
    success: 'Sucesso',
    error: 'Erro',
    categoryAdded: 'Categoria adicionada',
    cuisineAdded: 'Culinária adicionada',
    recipeSaved: 'Receita salva',
    recipeDeleted: 'Receita excluída',
    recipeSavedSuccess: 'Receita salva com sucesso!',
    viewRecipe: 'Ver Receita',
    backToMainMenu: 'Voltar ao Menu Principal',
    pleaseEnterName: 'Por favor, insira um nome',
    pleaseEnterIcon: 'Por favor, insira um ícone',
    pleaseEnterFlag: 'Por favor, insira um emoji de bandeira',
    categoryExists: 'Esta categoria já existe',
    cuisineExists: 'Esta culinária já existe',
    noRecipes: 'Nenhuma receita nesta categoria',
    pullToRefresh: 'Puxe para atualizar',
    language: 'Idioma',
    selectLanguage: 'Selecionar Idioma',
    spanish: 'Espanhol',
    catalan: 'Catalão',
    french: 'Francês',
    english: 'Inglês',
    portuguese: 'Português',
  },
};

// Load saved language
export async function loadLanguage(): Promise<SupportedLanguage> {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (savedLanguage && (savedLanguage === 'es' || savedLanguage === 'ca' || savedLanguage === 'fr' || savedLanguage === 'en' || savedLanguage === 'pt')) {
      currentLanguage = savedLanguage as SupportedLanguage;
      return currentLanguage;
    }
  } catch (error) {
    console.error('Error loading language:', error);
  }
  currentLanguage = 'es';
  return 'es';
}

// Save language
export async function saveLanguage(language: SupportedLanguage): Promise<void> {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
    currentLanguage = language;
  } catch (error) {
    console.error('Error saving language:', error);
  }
}

// Get current language
export function getCurrentLanguage(): SupportedLanguage {
  return currentLanguage;
}

// Translate function
export function t(key: string, params?: Record<string, any>): string {
  const lang = currentLanguage || 'es';
  const translation = translations[lang]?.[key] || translations['es']?.[key] || key;
  
  // Simple parameter replacement
  if (params) {
    return Object.keys(params).reduce((str, paramKey) => {
      return str.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(params[paramKey]));
    }, translation);
  }
  
  return translation;
}

