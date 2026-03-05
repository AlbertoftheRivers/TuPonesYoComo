import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONT } from '../lib/constants';
import DesktopWarning from '../components/DesktopWarning';
import { useLanguage } from '../lib/LanguageContext';
import { SupportedLanguage } from '../lib/i18n';
import { getTranslatedProtein, getTranslatedCuisine } from '../lib/categoryTranslations';
import { getAllRecipes, getRecentRecipes } from '../api/recipes';
import { getAllCuisines } from '../lib/customCategories';
import { suggestRecipeFromIngredients } from '../lib/ollama';
import { Recipe } from '../types/recipe';
import { MAIN_PROTEINS } from '../lib/constants';

type RootStackParamList = {
  Home: undefined;
  Categories: undefined;
  RecipeList: { mainProtein: string };
  RecipeDetail: { recipeId: string | number };
  FridgeResults: { ingredients: string[] };
  AddRecipe: { initialRawText?: string } | undefined;
  EditRecipe: { recipeId: string | number };
  UserGuide: undefined;
  Admin: undefined;
};

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

export default function HomeScreen({ navigation }: Props) {
  const { language, setLanguage, t } = useLanguage();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [recentRecipes, setRecentRecipes] = useState<Recipe[]>([]);
  const [allCuisines, setAllCuisines] = useState<any[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);

  const [fridgeInput, setFridgeInput] = useState('');
  const [fridgeIngredients, setFridgeIngredients] = useState<string[]>([]);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadAllRecipes();
      loadCuisines();
      loadRecentRecipes();
    }, [])
  );

  const loadRecentRecipes = async () => {
    try {
      const recent = await getRecentRecipes(8);
      setRecentRecipes(recent);
    } catch (e) {
      console.error(e);
    }
  };

  const loadAllRecipes = async () => {
    try {
      setLoadingRecipes(true);
      const recipes = await getAllRecipes();
      setAllRecipes(recipes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRecipes(false);
    }
  };

  const loadCuisines = async () => {
    try {
      const cuisines = await getAllCuisines();
      setAllCuisines(cuisines);
    } catch (e) {
      console.error(e);
    }
  };

  const addFridgeIngredient = () => {
    const v = fridgeInput.trim();
    if (v && !fridgeIngredients.includes(v)) {
      setFridgeIngredients([...fridgeIngredients, v]);
      setFridgeInput('');
    }
  };

  const removeFridgeIngredient = (i: number) => {
    setFridgeIngredients(fridgeIngredients.filter((_, idx) => idx !== i));
  };

  const handleFindMatching = () => {
    if (fridgeIngredients.length === 0) {
      Alert.alert(t('error'), t('noRecipesFound'));
      return;
    }
    navigation.navigate('FridgeResults', { ingredients: fridgeIngredients });
  };

  const handleSuggestWithAI = async () => {
    if (fridgeIngredients.length === 0) {
      Alert.alert(t('error'), t('noRecipesFound'));
      return;
    }
    setAiLoading(true);
    setAiSuggestion('');
    try {
      const suggestion = await suggestRecipeFromIngredients(fridgeIngredients);
      setAiSuggestion(suggestion);
    } catch (e) {
      Alert.alert(t('error'), e instanceof Error ? e.message : t('error'));
    } finally {
      setAiLoading(false);
    }
  };

  const handleUseSuggestionInAddRecipe = () => {
    setAiSuggestion('');
    navigation.navigate('AddRecipe', { initialRawText: aiSuggestion });
  };

  const handleLanguageChange = async (lang: SupportedLanguage) => {
    await setLanguage(lang);
    setShowLanguageModal(false);
  };

  const handleRecommendMe = () => {
    if (allRecipes.length === 0) return;
    const randomIndex = Math.floor(Math.random() * allRecipes.length);
    const recipe = allRecipes[randomIndex];
    navigation.navigate('RecipeDetail', { recipeId: recipe.id });
  };

  const handleRecipePress = (recipe: Recipe) => {
    navigation.navigate('RecipeDetail', { recipeId: recipe.id });
  };

  const filteredRecipes = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return allRecipes.filter((r) => {
      if (r.title.toLowerCase().includes(q)) return true;
      if (r.ingredients.some((ing) => ing.name.toLowerCase().includes(q))) return true;
      if (r.cuisines?.length) {
        const labels = r.cuisines.map((c) => getTranslatedCuisine(c, language)).join(' ').toLowerCase();
        if (labels.includes(q)) return true;
      }
      return false;
    });
  }, [searchQuery, allRecipes, language]);

  const uniqueCuisinesCount = useMemo(() => {
    const set = new Set<string>();
    allRecipes.forEach((r) => r.cuisines?.forEach((c) => set.add(c)));
    return set.size;
  }, [allRecipes]);

  const recipeCount = allRecipes.length;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <DesktopWarning />

        {/* Header: app name + tagline */}
        <View style={styles.brand}>
          <Text style={styles.brandTitle}>{t('appName')}</Text>
          <Text style={styles.brandTagline}>{t('tagline')}</Text>
        </View>

        {/* Top row: search bar (left) | recipe/cuisine counters + language, help, admin (right) */}
        <View style={styles.topRow}>
          <View style={styles.searchBox}>
            <TextInput
              style={styles.searchInput}
              placeholder={t('searchPlaceholder')}
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity style={styles.clearBtn} onPress={() => setSearchQuery('')} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text style={styles.clearBtnText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.topRight}>
            <View style={styles.counters}>
              <View style={styles.counterPill}>
                <Text style={styles.counterValue}>{recipeCount}</Text>
                <Text style={styles.counterLabel}>{recipeCount !== 1 ? t('recipesCountPlural') : t('recipesCount')}</Text>
              </View>
              <View style={styles.counterPill}>
                <Text style={styles.counterValue}>{uniqueCuisinesCount}</Text>
                <Text style={styles.counterLabel}>{uniqueCuisinesCount !== 1 ? t('cuisinesCountPlural') : t('cuisinesCount')}</Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerBtn} onPress={() => setShowLanguageModal(true)} accessibilityRole="button" accessibilityLabel={t('selectLanguage')}>
                <Text style={styles.headerBtnText}>🌐</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('UserGuide')} accessibilityRole="button" accessibilityLabel={t('userGuide')}>
                <Text style={styles.headerBtnText}>❓</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('Admin')} accessibilityRole="button" accessibilityLabel="Admin">
                <Text style={styles.headerBtnText}>⚙️</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Search results (when user is searching) */}
        {searchQuery.trim().length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsTitle}>
              {t('searchResults')}: {filteredRecipes.length}
            </Text>
            {loadingRecipes ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={styles.loader} />
            ) : filteredRecipes.length === 0 ? (
              <Text style={styles.emptyResults}>{t('noRecipesFound')}</Text>
            ) : (
              filteredRecipes.map((recipe) => {
                const cuisineInfos = recipe.cuisines
                  ? recipe.cuisines.map((c) => allCuisines.find((x) => x.value === c)).filter(Boolean)
                  : [];
                return (
                  <TouchableOpacity
                    key={recipe.id}
                    style={styles.recipeCard}
                    onPress={() => handleRecipePress(recipe)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.recipeCardTitle}>{recipe.title}</Text>
                    <View style={styles.recipeCardMeta}>
                      <Text style={styles.recipeCardMetaText}>{getTranslatedProtein(recipe.main_protein, language)}</Text>
                      {recipe.total_time_minutes != null && (
                        <Text style={styles.recipeCardMetaText}> · {recipe.total_time_minutes} {t('min')}</Text>
                      )}
                    </View>
                    {cuisineInfos.length > 0 && (
                      <View style={styles.recipeCardFlags}>
                        {cuisineInfos.map((info: any, i) => (
                          <Text key={i} style={styles.flag}>{info?.flag}</Text>
                        ))}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {/* Main content when not searching */}
        {!searchQuery.trim() && (
          <>
            {/* Fridge: what you have → find similar or get AI suggestion */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('whatsInFridge')}</Text>
              <View style={styles.fridgeRow}>
                <TextInput
                  style={styles.fridgeInput}
                  placeholder={t('fridgePlaceholder')}
                  placeholderTextColor={COLORS.textMuted}
                  value={fridgeInput}
                  onChangeText={setFridgeInput}
                  onSubmitEditing={addFridgeIngredient}
                />
                <TouchableOpacity style={styles.fridgeAddBtn} onPress={addFridgeIngredient}>
                  <Text style={styles.fridgeAddBtnLabel}>{t('addIngredient')}</Text>
                </TouchableOpacity>
              </View>
              {fridgeIngredients.length > 0 && (
                <>
                  <View style={styles.chipRow}>
                    {fridgeIngredients.map((ing, i) => (
                      <TouchableOpacity key={i} style={styles.chip} onPress={() => removeFridgeIngredient(i)}>
                        <Text style={styles.chipLabel}>{ing}</Text>
                        <Text style={styles.chipRemove}>×</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.fridgeCtas}>
                    <TouchableOpacity style={styles.fridgeCtaPrimary} onPress={handleFindMatching}>
                      <Text style={styles.fridgeCtaPrimaryText}>{t('findMatchingRecipes')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.fridgeCtaSecondary} onPress={handleSuggestWithAI} disabled={aiLoading}>
                      {aiLoading ? <ActivityIndicator size="small" color={COLORS.text} /> : <Text style={styles.fridgeCtaSecondaryText}>{t('suggestWithAI')}</Text>}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>

            {/* Three main actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionCard, styles.actionRecommend]}
                onPress={handleRecommendMe}
                disabled={recipeCount === 0}
                activeOpacity={0.85}
              >
                <Text style={styles.actionIcon}>🎲</Text>
                <Text style={styles.actionTitle}>{t('surpriseMe')}</Text>
                <Text style={styles.actionSubtitle}>{recipeCount === 0 ? t('noRecipesFound') : t('surpriseMeHint')}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionCard, styles.actionBook]} onPress={() => navigation.navigate('Categories')} activeOpacity={0.85}>
                <Text style={styles.actionIcon}>📖</Text>
                <Text style={styles.actionTitle}>{t('recipeBook')}</Text>
                <Text style={styles.actionSubtitle}>{t('selectCategory')}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionCard, styles.actionAdd]} onPress={() => navigation.navigate('AddRecipe')} activeOpacity={0.85}>
                <Text style={styles.actionIcon}>➕</Text>
                <Text style={styles.actionTitle}>{t('addRecipeShort')}</Text>
                <Text style={styles.actionSubtitle}>{t('addRecipe')}</Text>
              </TouchableOpacity>
            </View>

            {/* Recent Recipes (Lovable-style grid) */}
            {recentRecipes.length > 0 && (
              <View style={styles.recentSection}>
                <Text style={styles.recentSectionTitle}>{t('recentRecipes')}</Text>
                <View style={styles.recentGrid}>
                  {recentRecipes.map((recipe) => {
                    const proteinIcon = MAIN_PROTEINS.find((p) => p.value === recipe.main_protein)?.icon || '🍽️';
                    const firstCuisine = recipe.cuisines?.[0];
                    const cuisineLabel = firstCuisine ? getTranslatedCuisine(firstCuisine, language) : null;
                    const cuisineInfo = allCuisines.find((c) => c.value === firstCuisine);
                    return (
                      <TouchableOpacity
                        key={recipe.id}
                        style={styles.recentCard}
                        onPress={() => handleRecipePress(recipe)}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.recentCardEmoji}>{proteinIcon}</Text>
                        <Text style={styles.recentCardTitle} numberOfLines={2}>{recipe.title}</Text>
                        {cuisineLabel && (
                          <Text style={styles.recentCardCuisine}>{cuisineInfo?.flag} {cuisineLabel}</Text>
                        )}
                        <View style={styles.recentCardMeta}>
                          {recipe.total_time_minutes != null && (
                            <Text style={styles.recentCardMetaText}>⏱ {recipe.total_time_minutes} {t('min')}</Text>
                          )}
                          <Text style={styles.recentCardMetaText}>👤 {recipe.servings ?? 2}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* AI suggestion modal */}
      <Modal visible={!!aiSuggestion} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalPanel}>
            <Text style={styles.modalHeading}>✨ {t('suggestWithAI')}</Text>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalBody}>{aiSuggestion}</Text>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalBtnPrimary} onPress={handleUseSuggestionInAddRecipe}>
                <Text style={styles.modalBtnPrimaryText}>{t('useThisRecipe')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnSecondary} onPress={() => setAiSuggestion('')}>
                <Text style={styles.modalBtnSecondaryText}>{t('cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Language modal */}
      <Modal visible={showLanguageModal} transparent animationType="slide" onRequestClose={() => setShowLanguageModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalPanel}>
            <Text style={styles.modalHeading}>{t('selectLanguage')}</Text>
            {(['es', 'ca', 'fr', 'en', 'pt'] as SupportedLanguage[]).map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[styles.langItem, language === lang && styles.langItemActive]}
                onPress={() => handleLanguageChange(lang)}
              >
                <Text style={styles.langItemText}>
                  {lang === 'es' && '🇪🇸 '}{lang === 'ca' && '🇪🇸 '}{lang === 'fr' && '🇫🇷 '}{lang === 'en' && '🇬🇧 '}{lang === 'pt' && '🇵🇹 '}
                  {t(lang === 'es' ? 'spanish' : lang === 'ca' ? 'catalan' : lang === 'fr' ? 'french' : lang === 'en' ? 'english' : 'portuguese')}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowLanguageModal(false)}>
              <Text style={styles.modalCancelText}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl * 1.5,
  },

  brand: {
    marginBottom: SPACING.lg,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: FONT.headingBold,
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  brandTagline: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  searchBox: {
    flex: 1,
    minWidth: 0,
    position: 'relative',
  },
  searchInput: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    paddingRight: 40,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  clearBtn: {
    position: 'absolute',
    right: SPACING.sm,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    minWidth: 36,
  },
  clearBtnText: {
    fontSize: 16,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  counters: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  counterPill: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    minWidth: 44,
  },
  counterValue: {
    fontSize: 15,
    fontWeight: FONT.headingBold,
    color: COLORS.primary,
  },
  counterLabel: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 0,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBtnText: {
    fontSize: 18,
  },

  resultsSection: {
    marginBottom: SPACING.lg,
  },
  resultsTitle: {
    fontSize: 15,
    fontWeight: FONT.headingSemibold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  loader: {
    marginVertical: SPACING.md,
  },
  emptyResults: {
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: SPACING.xl,
  },
  recipeCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  recipeCardTitle: {
    fontSize: 17,
    fontWeight: FONT.headingSemibold,
    color: COLORS.text,
  },
  recipeCardMeta: {
    flexDirection: 'row',
    marginTop: 4,
  },
  recipeCardMetaText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  recipeCardFlags: {
    flexDirection: 'row',
    marginTop: 4,
  },
  flag: {
    fontSize: 14,
  },

  section: {
    marginBottom: SPACING.xl,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: FONT.headingSemibold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: SPACING.sm,
  },
  fridgeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  fridgeInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  fridgeAddBtn: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
  },
  fridgeAddBtnLabel: {
    fontSize: 13,
    fontWeight: FONT.headingSemibold,
    color: COLORS.primaryForeground,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondaryDim,
    paddingVertical: 4,
    paddingLeft: SPACING.sm,
    paddingRight: 6,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  chipLabel: {
    fontSize: 13,
    color: COLORS.text,
  },
  chipRemove: {
    fontSize: 16,
    color: COLORS.secondary,
    marginLeft: 2,
    fontWeight: '700',
  },
  fridgeCtas: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  fridgeCtaPrimary: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  fridgeCtaPrimaryText: {
    fontSize: 13,
    fontWeight: FONT.headingSemibold,
    color: COLORS.primaryForeground,
  },
  fridgeCtaSecondary: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  fridgeCtaSecondaryText: {
    fontSize: 13,
    fontWeight: FONT.headingSemibold,
    color: COLORS.text,
  },

  actions: {
    gap: SPACING.md,
  },
  actionCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    borderWidth: 1,
    ...SHADOWS.sm,
  },
  actionRecommend: {
    backgroundColor: COLORS.neonOrangeDim,
    borderColor: COLORS.neonOrange,
  },
  actionBook: {
    backgroundColor: COLORS.neonCyanDim,
    borderColor: COLORS.neonCyan,
  },
  actionAdd: {
    backgroundColor: COLORS.primaryDim,
    borderColor: COLORS.primary,
  },
  actionIcon: {
    fontSize: 26,
    marginBottom: SPACING.sm,
  },
  actionTitle: {
    fontSize: 17,
    fontWeight: FONT.headingBold,
    color: COLORS.text,
  },
  actionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },

  recentSection: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  recentSectionTitle: {
    fontSize: 18,
    fontWeight: FONT.headingBold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  recentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  recentCard: {
    width: '47%',
    minWidth: 140,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  recentCardEmoji: {
    fontSize: 28,
    marginBottom: SPACING.xs,
  },
  recentCardTitle: {
    fontSize: 15,
    fontWeight: FONT.headingSemibold,
    color: COLORS.text,
  },
  recentCardCuisine: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  recentCardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: 4,
  },
  recentCardMetaText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalPanel: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    width: '100%',
    maxWidth: 440,
    maxHeight: '82%',
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: FONT.headingBold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  modalScroll: {
    maxHeight: 300,
    marginBottom: SPACING.md,
  },
  modalBody: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  modalFooter: {
    gap: SPACING.sm,
  },
  modalBtnPrimary: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  modalBtnPrimaryText: {
    fontSize: 15,
    fontWeight: FONT.headingSemibold,
    color: COLORS.primaryForeground,
  },
  modalBtnSecondary: {
    backgroundColor: COLORS.border,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  modalBtnSecondaryText: {
    fontSize: 15,
    color: COLORS.text,
  },
  langItem: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  langItemActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryDim,
  },
  langItemText: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
  },
  modalCancel: {
    marginTop: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.border,
  },
  modalCancelText: {
    fontSize: 15,
    color: COLORS.text,
    textAlign: 'center',
    fontWeight: FONT.headingSemibold,
  },
});
