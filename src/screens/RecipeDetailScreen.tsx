import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONT, MAIN_PROTEINS } from '../lib/constants';
import { getRecipeById, deleteRecipe } from '../api/recipes';
import { getAllCuisines } from '../lib/customCategories';
import { calculateAdjustedIngredients } from '../lib/ingredientCalculator';
import { Recipe, Ingredient } from '../types/recipe';
import { useLanguage } from '../lib/LanguageContext';
import { isWeb } from '../lib/platform';
import { translateRecipe } from '../lib/recipeTranslation';

type RootStackParamList = {
  Home: undefined;
  RecipeList: { mainProtein: string };
  RecipeDetail: { recipeId: string | number };
  AddRecipe: undefined;
  EditRecipe: { recipeId: string | number };
};

type RecipeDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'RecipeDetail'>;
type RecipeDetailScreenRouteProp = RouteProp<RootStackParamList, 'RecipeDetail'>;

interface Props {
  navigation: RecipeDetailScreenNavigationProp;
  route: RecipeDetailScreenRouteProp;
}

export default function RecipeDetailScreen({ navigation, route }: Props) {
  const { t, language } = useLanguage();
  const { recipeId } = route.params;
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [translatedRecipe, setTranslatedRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [allCuisines, setAllCuisines] = useState<Array<{ value: string; label?: string; flag?: string }>>([]);
  const [desiredServings, setDesiredServings] = useState<number>(2);
  const [cookModeActive, setCookModeActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const loadCuisines = async () => {
    try {
      const cuisines = await getAllCuisines();
      setAllCuisines(cuisines);
    } catch (error) {
      console.error('Error loading cuisines:', error);
    }
  };

  const loadRecipe = async () => {
    try {
      setLoading(true);
      const data = await getRecipeById(recipeId);
      if (data) {
        setRecipe(data);
        setDesiredServings(data.servings || 2);
        // Translate recipe if language is not Spanish (default)
        if (language !== 'es') {
          translateRecipeContent(data, language);
        } else {
          setTranslatedRecipe(data);
        }
      } else {
        Alert.alert('Error', 'Receta no encontrada');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', 'Error al cargar la receta. Por favor intenta de nuevo.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const translateRecipeContent = async (recipeData: Recipe, targetLanguage: string) => {
    try {
      console.log(`🌐 [TRANSLATE] Starting translation to ${targetLanguage} for recipe: ${recipeData.title}`);
      setTranslating(true);
      const translated = await translateRecipe(recipeData, targetLanguage as any);
      console.log(`✅ [TRANSLATE] Translation completed. Original title: "${recipeData.title}" → Translated: "${translated.title}"`);
      setTranslatedRecipe(translated);
    } catch (error) {
      console.error('❌ [TRANSLATE] Error translating recipe:', error);
      // If translation fails, use original recipe
      setTranslatedRecipe(recipeData);
    } finally {
      setTranslating(false);
    }
  };

  // Re-translate when language changes
  useEffect(() => {
    if (recipe && language !== 'es') {
      translateRecipeContent(recipe, language);
    } else if (recipe) {
      setTranslatedRecipe(recipe);
    }
  }, [language, recipe]);

  const handleEdit = () => {
    if (recipe) {
      navigation.navigate('EditRecipe', { recipeId: recipe.id });
    }
  };

  const handleDelete = useCallback(async () => {
    console.log('🗑️ [DELETE] handleDelete called');
    if (!recipe) {
      console.log('🗑️ [DELETE] No recipe found, returning');
      return;
    }

    console.log('🗑️ [DELETE] Recipe to delete:', { id: recipe.id, title: recipe.title });

    // Use window.confirm on web, Alert.alert on native
    const confirmMessage = `¿Estás seguro de que quieres eliminar "${recipe.title}"?`;
    let confirmed = false;

    if (isWeb && typeof window !== 'undefined' && window.confirm) {
      confirmed = window.confirm(confirmMessage);
      console.log('🗑️ [DELETE] Web confirmation result:', confirmed);
    } else {
      // For native, we'll use a promise-based Alert
      confirmed = await new Promise<boolean>((resolve) => {
        Alert.alert(
          'Eliminar Receta',
          confirmMessage,
          [
            { 
              text: 'Cancelar', 
              style: 'cancel',
              onPress: () => resolve(false)
            },
            {
              text: 'Eliminar',
              style: 'destructive',
              onPress: () => resolve(true)
            },
          ]
        );
      });
      console.log('🗑️ [DELETE] Native confirmation result:', confirmed);
    }

    if (!confirmed) {
      console.log('🗑️ [DELETE] User cancelled deletion');
      return;
    }

    try {
      console.log('🗑️ [DELETE] Starting deletion process...');
      setDeleting(true);
      console.log('🗑️ [DELETE] Calling deleteRecipe with id:', recipe.id);
      await deleteRecipe(recipe.id);
      console.log('🗑️ [DELETE] Recipe deleted successfully');
      console.log('🗑️ [DELETE] Navigating to Home...');
      // Navigate directly to home screen
      navigation.navigate('Home');
    } catch (error) {
      console.error('🗑️ [DELETE] Error deleting recipe:', error);
      setDeleting(false);
      Alert.alert('Error', 'Error al eliminar la receta. Por favor intenta de nuevo.');
    }
  }, [recipe, navigation]);

  useEffect(() => {
    loadRecipe();
    loadCuisines();
  }, [recipeId]);

  // Removed header delete button - now in bottom actions

  const handleGoToMainMenu = () => {
    navigation.navigate('Home');
  };

  if (loading || !recipe) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        {translating && (
          <Text style={styles.metaText}>{t('loading')}...</Text>
        )}
      </View>
    );
  }

  // Use translated recipe if available, otherwise use original
  const displayRecipe = translatedRecipe || recipe;

  const proteinLabel = MAIN_PROTEINS.find(p => p.value === displayRecipe.main_protein)?.label || displayRecipe.main_protein;
  const proteinIcon = MAIN_PROTEINS.find(p => p.value === displayRecipe.main_protein)?.icon || '🍽️';
  const cuisineInfos = displayRecipe.cuisines
    ? displayRecipe.cuisines.map(cuisineValue => allCuisines.find(c => c.value === cuisineValue)).filter(Boolean)
    : [];
  const steps = displayRecipe.steps || [];
  const hasSteps = steps.length > 0;
  const canNext = hasSteps && currentStepIndex < steps.length - 1;
  const canPrev = hasSteps && currentStepIndex > 0;
  const proTipContent = displayRecipe.gadgets && displayRecipe.gadgets.length > 0
    ? displayRecipe.gadgets.join(' • ')
    : null;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{displayRecipe.title}</Text>
            {cuisineInfos.length > 0 && (
              <View style={styles.cuisineFlagsContainer}>
                {cuisineInfos.map((cuisineInfo, idx) => (
                  <Text key={idx} style={styles.cuisineFlag}>{cuisineInfo?.flag}</Text>
                ))}
              </View>
            )}
          </View>
          <View style={styles.meta}>
            {displayRecipe.added_by && (
              <Text style={styles.metaText}>👤 {t('addedBy')}: {displayRecipe.added_by}</Text>
            )}
            <Text style={styles.metaText}>{proteinIcon} {proteinLabel}</Text>
            {displayRecipe.total_time_minutes && (
              <Text style={styles.metaText}>• ⏱️ {displayRecipe.total_time_minutes} {t('min')}</Text>
            )}
            {displayRecipe.oven_time_minutes && (
              <Text style={styles.metaText}>• 🔥 {t('oven')}: {displayRecipe.oven_time_minutes} {t('min')}</Text>
            )}
          </View>
        </View>

        {displayRecipe.ingredients.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('ingredients')}</Text>
              <View style={styles.servingsSelector}>
                <Text style={styles.servingsLabel}>{t('servings')}:</Text>
                <View style={styles.servingsInputContainer}>
                  <TouchableOpacity
                    style={styles.servingsButton}
                    onPress={() => {
                      if (desiredServings > 1) {
                        setDesiredServings(desiredServings - 1);
                      }
                    }}
                  >
                    <Text style={styles.servingsButtonText}>−</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.servingsInput}
                    value={desiredServings.toString()}
                    onChangeText={(text) => {
                      const num = parseInt(text, 10);
                      if (!isNaN(num) && num > 0) {
                        setDesiredServings(num);
                      } else if (text === '') {
                        setDesiredServings(displayRecipe.servings || 2);
                      }
                    }}
                    keyboardType="numeric"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                  <TouchableOpacity
                    style={styles.servingsButton}
                    onPress={() => setDesiredServings(desiredServings + 1)}
                  >
                    <Text style={styles.servingsButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
                {desiredServings !== (displayRecipe.servings || 2) && (
                  <TouchableOpacity
                    style={styles.resetButton}
                    onPress={() => setDesiredServings(displayRecipe.servings || 2)}
                  >
                    <Text style={styles.resetButtonText}>Reset</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
              {desiredServings !== (displayRecipe.servings || 2) && (
                <Text style={styles.adjustmentHint}>
                  {t('adjustedFrom')} {displayRecipe.servings || 2} {t('portions')} (×{((desiredServings / (displayRecipe.servings || 2)) * 100) / 100})
                </Text>
              )}
            {calculateAdjustedIngredients(
              displayRecipe.ingredients,
              displayRecipe.servings || 2,
              desiredServings
            ).map((ingredient, index) => (
              <View key={index} style={styles.ingredientItem}>
                <Text style={styles.ingredientText}>
                  {ingredient.quantity && `${ingredient.quantity} `}
                  {ingredient.unit && `${ingredient.unit} `}
                  <Text style={styles.ingredientName}>{ingredient.name}</Text>
                  {ingredient.notes && (
                    <Text style={styles.ingredientNotes}> ({ingredient.notes})</Text>
                  )}
                </Text>
              </View>
            ))}
          </View>
        )}

        {displayRecipe.steps.length > 0 && (
          <View style={styles.section}>
            <View style={styles.stepsHeader}>
              <Text style={styles.sectionTitle}>{t('steps')}</Text>
              <TouchableOpacity
                style={[styles.cookModeButton, cookModeActive && styles.cookModeButtonActive]}
                onPress={() => {
                  setCookModeActive(!cookModeActive);
                  setCurrentStepIndex(0);
                }}
              >
                <Text style={styles.cookModeButtonText}>
                  {cookModeActive ? t('cookModeOff') : t('cookMode')}
                </Text>
              </TouchableOpacity>
            </View>
            {cookModeActive ? (
              <View style={styles.cookModeView}>
                <Text style={styles.cookModeStepLabel}>
                  {t('steps')} {currentStepIndex + 1} / {steps.length}
                </Text>
                <View style={styles.cookModeStepCard}>
                  <Text style={styles.cookModeStepText}>{steps[currentStepIndex]}</Text>
                </View>
                <View style={styles.cookModeNav}>
                  <TouchableOpacity
                    style={[styles.cookModeNavButton, !canPrev && styles.cookModeNavButtonDisabled]}
                    onPress={() => setCurrentStepIndex(i => Math.max(0, i - 1))}
                    disabled={!canPrev}
                  >
                    <Text style={styles.cookModeNavButtonText}>← {t('prevStep')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.cookModeNavButton, !canNext && styles.cookModeNavButtonDisabled]}
                    onPress={() => setCurrentStepIndex(i => Math.min(steps.length - 1, i + 1))}
                    disabled={!canNext}
                  >
                    <Text style={styles.cookModeNavButtonText}>{t('nextStep')} →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                {displayRecipe.steps.map((step, index) => (
                  <View key={index} style={styles.stepItem}>
                    <Text style={styles.stepNumber}>{index + 1}.</Text>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </>
            )}
          </View>
        )}

        {displayRecipe.gadgets.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('gadgets')}</Text>
            <View style={styles.gadgetsContainer}>
              {displayRecipe.gadgets.map((gadget, index) => (
                <View key={index} style={styles.gadgetPill}>
                  <Text style={styles.gadgetText}>{gadget}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {proTipContent && (
          <View style={styles.proTipBlock}>
            <Text style={styles.proTipTitle}>💡 {t('proTip')}</Text>
            <Text style={styles.proTipText}>{proTipContent}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.editButton]}
          onPress={handleEdit}
        >
          <Text style={styles.buttonText}>{t('edit')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.deleteButton, deleting && styles.buttonDisabled]}
          onPress={handleDelete}
          disabled={deleting}
        >
          {deleting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Eliminar receta</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.mainMenuButton]}
          onPress={handleGoToMainMenu}
        >
          <Text style={styles.buttonText}>{t('backToMainMenu')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  header: {
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: 26,
    fontWeight: FONT.headingBold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  cuisineFlagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  cuisineFlag: {
    fontSize: 24,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  metaText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    flexWrap: 'wrap',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: FONT.headingBold,
    color: COLORS.text,
    flex: 1,
  },
  stepsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: SPACING.md,
  },
  cookModeButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.fun,
    borderWidth: 1,
    borderColor: COLORS.funDark,
  },
  cookModeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryDark,
  },
  cookModeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  cookModeView: {
    marginTop: SPACING.sm,
  },
  cookModeStepLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  cookModeStepCard: {
    backgroundColor: COLORS.fun,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.funDark,
  },
  cookModeStepText: {
    fontSize: 18,
    color: COLORS.text,
    lineHeight: 26,
  },
  cookModeNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  cookModeNavButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  cookModeNavButtonDisabled: {
    opacity: 0.5,
  },
  cookModeNavButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  proTipBlock: {
    backgroundColor: COLORS.accentLight + '40',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
  },
  proTipTitle: {
    fontSize: 16,
    fontWeight: FONT.headingSemibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  proTipText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  servingsSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  servingsLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  servingsInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  servingsButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  servingsButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  servingsInput: {
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    minWidth: 50,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  resetButton: {
    marginLeft: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.sm,
  },
  resetButtonText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  adjustmentHint: {
    fontSize: 12,
    color: COLORS.primary,
    fontStyle: 'italic',
    marginBottom: SPACING.sm,
  },
  ingredientItem: {
    marginBottom: SPACING.sm,
    paddingLeft: SPACING.sm,
  },
  ingredientText: {
    fontSize: 16,
    color: COLORS.text,
  },
  ingredientName: {
    fontWeight: '600',
  },
  ingredientNotes: {
    fontStyle: 'italic',
    color: COLORS.textSecondary,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginRight: SPACING.sm,
    minWidth: 24,
  },
  stepText: {
    fontSize: 16,
    color: COLORS.text,
    flex: 1,
  },
  gadgetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  gadgetPill: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.xl,
  },
  gadgetText: {
    fontSize: 14,
    color: COLORS.text,
  },
  actions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.md,
  },
  button: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: COLORS.primary,
  },
  deleteButton: {
    backgroundColor: COLORS.error,
  },
  mainMenuButton: {
    backgroundColor: COLORS.accent,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
