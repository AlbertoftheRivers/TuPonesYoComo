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
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONT } from '../lib/constants';
import DesktopWarning from '../components/DesktopWarning';
import { useLanguage } from '../lib/LanguageContext';
import { SupportedLanguage } from '../lib/i18n';
import { getTranslatedProtein, getTranslatedCuisine } from '../lib/categoryTranslations';
import { getAllRecipes, getRecentRecipes, getRecipesByProtein } from '../api/recipes';
import { getAllCuisines } from '../lib/customCategories';
import { suggestRecipeFromIngredients, suggestRecipeFromDescription } from '../lib/ollama';
import { Recipe } from '../types/recipe';
import { MAIN_PROTEINS } from '../lib/constants';
import { getRecipesByIngredients } from '../api/recipes';
import RecipeDetailModal from '../components/RecipeDetailModal';

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

  const [fridgePanelOpen, setFridgePanelOpen] = useState(false);
  const [fridgeMatchingRecipes, setFridgeMatchingRecipes] = useState<Recipe[]>([]);
  const [fridgeSearchLoading, setFridgeSearchLoading] = useState(false);
  const [descriptionInput, setDescriptionInput] = useState('');
  const [recommendMeRecipeId, setRecommendMeRecipeId] = useState<string | number | null>(null);
  const [showRecipeBookModal, setShowRecipeBookModal] = useState(false);
  const [recipeBookCategory, setRecipeBookCategory] = useState<string | null>(null);
  const [recipeBookRecipes, setRecipeBookRecipes] = useState<Recipe[]>([]);
  const [recipeBookRecipesLoading, setRecipeBookRecipesLoading] = useState(false);
  const [recipeDetailModalId, setRecipeDetailModalId] = useState<string | number | null>(null);

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

  // Auto-search matching recipes when fridge ingredients change (in panel)
  React.useEffect(() => {
    if (!fridgePanelOpen || fridgeIngredients.length === 0) {
      setFridgeMatchingRecipes([]);
      return;
    }
    let cancelled = false;
    setFridgeSearchLoading(true);
    getRecipesByIngredients(fridgeIngredients)
      .then((list) => {
        if (!cancelled) setFridgeMatchingRecipes(list);
      })
      .finally(() => {
        if (!cancelled) setFridgeSearchLoading(false);
      });
    return () => { cancelled = true; };
  }, [fridgePanelOpen, fridgeIngredients.join(',')]);

  const removeFridgeIngredient = (i: number) => {
    setFridgeIngredients(fridgeIngredients.filter((_, idx) => idx !== i));
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

  const handleSuggestFromDescription = async () => {
    const desc = descriptionInput.trim();
    if (!desc) {
      Alert.alert(t('error'), t('describeWhatYouLike'));
      return;
    }
    setAiLoading(true);
    setAiSuggestion('');
    try {
      const suggestion = await suggestRecipeFromDescription(desc);
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
    setRecommendMeRecipeId(recipe.id);
  };

  const openRecipeInModal = (recipeId: string | number) => {
    setRecipeDetailModalId(recipeId);
  };

  React.useEffect(() => {
    if (!showRecipeBookModal || !recipeBookCategory) {
      setRecipeBookRecipes([]);
      return;
    }
    let cancelled = false;
    setRecipeBookRecipesLoading(true);
    getRecipesByProtein(recipeBookCategory as any)
      .then((list) => {
        if (!cancelled) setRecipeBookRecipes(list);
      })
      .finally(() => {
        if (!cancelled) setRecipeBookRecipesLoading(false);
      });
    return () => { cancelled = true; };
  }, [showRecipeBookModal, recipeBookCategory]);

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

        {/* Hero section (FlavorVault-style) */}
        <View style={styles.hero}>
          <View style={styles.heroHeader}>
            <View style={styles.heroLogoRow}>
              <View style={styles.heroLogoIcon}>
                <Text style={styles.heroLogoEmoji}>👨‍🍳</Text>
              </View>
              <Text style={styles.heroAppName}>{t('appName')}</Text>
            </View>
            <View style={styles.heroActions}>
              <TouchableOpacity style={styles.heroIconBtn} onPress={() => setShowLanguageModal(true)} accessibilityRole="button" accessibilityLabel={t('selectLanguage')}>
                <Text style={styles.heroIconText}>🌐</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.heroIconBtn} onPress={() => navigation.navigate('UserGuide')} accessibilityRole="button" accessibilityLabel={t('userGuide')}>
                <Text style={styles.heroIconText}>❓</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.heroIconBtn} onPress={() => navigation.navigate('Admin')} accessibilityRole="button" accessibilityLabel="Admin">
                <Text style={styles.heroIconText}>⚙️</Text>
              </TouchableOpacity>
              <View style={styles.heroAvatar} />
            </View>
          </View>
          <Text style={styles.heroTitle}>{t('heroTitle')}</Text>
          <Text style={styles.heroTagline}>{t('tagline')}</Text>
          <View style={styles.heroSearchRow}>
            <View style={styles.heroSearchBox}>
              <TextInput
                style={styles.heroSearchInput}
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
            <View style={styles.heroStats}>
              <View style={styles.heroStatPill}>
                <Text style={styles.heroStatIcon}>🍴</Text>
                <View>
                  <Text style={styles.heroStatValue}>{recipeCount}</Text>
                  <Text style={styles.heroStatLabel}>{recipeCount !== 1 ? t('recipesCountPlural') : t('recipesCount')}</Text>
                </View>
              </View>
              <View style={styles.heroStatPill}>
                <Text style={styles.heroStatIcon}>🌍</Text>
                <View>
                  <Text style={styles.heroStatValue}>{uniqueCuisinesCount}</Text>
                  <Text style={styles.heroStatLabel}>{uniqueCuisinesCount !== 1 ? t('cuisinesCountPlural') : t('cuisinesCount')}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Main content: cards + recent recipes */}
        <View style={styles.mainContent}>

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
            {/* Four main action cards: white, professional (FlavorVault-style) */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionCard, styles.actionFridge]}
                onPress={() => setFridgePanelOpen(true)}
                activeOpacity={0.85}
              >
                <View style={styles.actionCardIconWrapFridge}>
                  <Text style={styles.actionCardIcon}>🧊</Text>
                </View>
                <Text style={styles.actionTitle}>{t('myFridge')}</Text>
                <Text style={styles.actionSubtitle}>{t('fridgePanelDescription')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionCard, styles.actionRecommend]}
                onPress={handleRecommendMe}
                disabled={recipeCount === 0}
                activeOpacity={0.85}
              >
                <View style={styles.actionCardIconWrapRecommend}>
                  <Text style={styles.actionCardIcon}>🎲</Text>
                </View>
                <Text style={styles.actionTitle}>{t('surpriseMe')}</Text>
                <Text style={styles.actionSubtitle}>{recipeCount === 0 ? t('noRecipesFound') : t('surpriseMeHint')}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionCard, styles.actionBook]} onPress={() => { setShowRecipeBookModal(true); setRecipeBookCategory(null); }} activeOpacity={0.85}>
                <View style={styles.actionCardIconWrapBook}>
                  <Text style={styles.actionCardIcon}>📖</Text>
                </View>
                <Text style={styles.actionTitle}>{t('recipeBook')}</Text>
                <Text style={styles.actionSubtitle}>{t('selectCategory')}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionCard, styles.actionAdd]} onPress={() => navigation.navigate('AddRecipe')} activeOpacity={0.85}>
                <View style={styles.actionCardIconWrapAdd}>
                  <Text style={styles.actionCardIcon}>+</Text>
                </View>
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
        </View>
      </ScrollView>

      {/* Fridge left sidebar (FlavorVault-style) */}
      {fridgePanelOpen && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setFridgePanelOpen(false)} activeOpacity={1} />
          <View style={styles.fridgePanel}>
            <View style={styles.fridgePanelHeader}>
              <View style={styles.fridgePanelTitleRow}>
                <View style={styles.fridgePanelIconWrap}>
                  <Text style={styles.fridgePanelIcon}>🧊</Text>
                </View>
                <Text style={styles.fridgePanelTitle}>{t('myFridge')}</Text>
              </View>
              <TouchableOpacity onPress={() => setFridgePanelOpen(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text style={styles.fridgePanelClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.fridgePanelDesc}>{t('fridgePanelDescription')}</Text>
            <View style={styles.fridgeRow}>
              <TextInput
                style={styles.fridgeInput}
                placeholder="e.g. tomato, chicken..."
                placeholderTextColor={COLORS.textMuted}
                value={fridgeInput}
                onChangeText={setFridgeInput}
                onSubmitEditing={addFridgeIngredient}
              />
              <TouchableOpacity style={styles.fridgeAddBtn} onPress={addFridgeIngredient}>
                <Text style={styles.fridgeAddBtnLabel}>+</Text>
              </TouchableOpacity>
            </View>
            {fridgeIngredients.length > 0 && (
              <View style={styles.chipRow}>
                {fridgeIngredients.map((ing, i) => (
                  <TouchableOpacity key={i} style={styles.chip} onPress={() => removeFridgeIngredient(i)}>
                    <Text style={styles.chipLabel}>{ing}</Text>
                    <Text style={styles.chipRemove}>×</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {fridgeIngredients.length > 0 && (
              <>
                <Text style={styles.fridgeSectionLabel}>✨ {t('matchingRecipes')}</Text>
                {fridgeSearchLoading ? (
                  <ActivityIndicator size="small" color={COLORS.primary} style={styles.fridgeLoader} />
                ) : fridgeMatchingRecipes.length === 0 ? (
                  <Text style={styles.fridgeEmpty}>{t('noRecipesFound')}</Text>
                ) : (
                  <ScrollView style={styles.fridgeResultsScroll} showsVerticalScrollIndicator={false}>
                    {fridgeMatchingRecipes.slice(0, 20).map((r) => {
                      const proteinIcon = MAIN_PROTEINS.find((x) => x.value === r.main_protein)?.icon || '🍽️';
                      const firstCuisine = r.cuisines?.[0];
                      const cuisineLabel = firstCuisine ? getTranslatedCuisine(firstCuisine, language) : null;
                      return (
                        <TouchableOpacity key={r.id} style={styles.fridgeResultCard} onPress={() => { setFridgePanelOpen(false); openRecipeInModal(r.id); }}>
                          <Text style={styles.fridgeResultEmoji}>{proteinIcon}</Text>
                          <View style={styles.fridgeResultCardInner}>
                            <Text style={styles.fridgeResultTitle} numberOfLines={1}>{r.title}</Text>
                            <Text style={styles.fridgeResultMeta}>
                              {cuisineLabel || ''}{r.total_time_minutes != null ? ` · ${r.total_time_minutes} ${t('min')}` : ''}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
                <TouchableOpacity style={styles.fridgeCtaSecondary} onPress={handleSuggestWithAI} disabled={aiLoading}>
                  {aiLoading ? <ActivityIndicator size="small" color={COLORS.text} /> : <Text style={styles.fridgeCtaSecondaryText}>{t('suggestWithAI')}</Text>}
                </TouchableOpacity>
              </>
            )}
            <View style={styles.fridgeDivider} />
            <Text style={styles.fridgeSectionLabel}>{t('describeWhatYouLike')}</Text>
            <TextInput
              style={styles.fridgeDescInput}
              placeholder={t('describeWhatYouLikePlaceholder')}
              placeholderTextColor={COLORS.textMuted}
              value={descriptionInput}
              onChangeText={setDescriptionInput}
              multiline
            />
            <TouchableOpacity style={styles.fridgeSuggestBtn} onPress={handleSuggestFromDescription} disabled={aiLoading}>
              {aiLoading ? <ActivityIndicator size="small" color={COLORS.primaryForeground} /> : <Text style={styles.fridgeSuggestBtnText}>{t('suggestRecipeFromDescription')}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Recipe Book modal: categories then recipes */}
      <Modal visible={showRecipeBookModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.recipeBookPanel}>
            <View style={styles.fridgePanelHeader}>
              <Text style={styles.fridgePanelTitle}>{t('recipeBook')}</Text>
              <TouchableOpacity onPress={() => setShowRecipeBookModal(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text style={styles.fridgePanelClose}>✕</Text>
              </TouchableOpacity>
            </View>
            {recipeBookCategory == null ? (
              <ScrollView style={styles.recipeBookScroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.recipeBookSubtitle}>{t('selectCategory')}</Text>
                <View style={styles.recipeBookCategoryGrid}>
                  {MAIN_PROTEINS.map((p) => {
                    const count = allRecipes.filter((r) => r.main_protein === p.value).length;
                    return (
                      <TouchableOpacity
                        key={p.value}
                        style={styles.recipeBookCategoryCard}
                        onPress={() => setRecipeBookCategory(p.value)}
                      >
                        <Text style={styles.recipeBookCategoryIcon}>{p.icon || '🍽️'}</Text>
                        <Text style={styles.recipeBookCategoryLabel}>{getTranslatedProtein(p.value, language)}</Text>
                        <Text style={styles.recipeBookCategoryCount}>{count} {count !== 1 ? t('recipesCountPlural') : t('recipesCount')}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            ) : (
              <>
                <TouchableOpacity style={styles.recipeBookBack} onPress={() => setRecipeBookCategory(null)}>
                  <Text style={styles.recipeBookBackText}>← {t('back')}</Text>
                </TouchableOpacity>
                {recipeBookRecipesLoading ? (
                  <ActivityIndicator size="large" color={COLORS.primary} style={styles.fridgeLoader} />
                ) : recipeBookRecipes.length === 0 ? (
                  <Text style={styles.fridgeEmpty}>{t('noRecipes')}</Text>
                ) : (
                  <ScrollView style={styles.recipeBookScroll} showsVerticalScrollIndicator={false}>
                    {recipeBookRecipes.map((r) => {
                      const proteinIcon = MAIN_PROTEINS.find((x) => x.value === r.main_protein)?.icon || '🍽️';
                      const firstCuisine = r.cuisines?.[0];
                      const cuisineLabel = firstCuisine ? getTranslatedCuisine(firstCuisine, language) : null;
                      const cuisineInfo = allCuisines.find((c) => c.value === firstCuisine);
                      return (
                        <TouchableOpacity
                          key={r.id}
                          style={styles.recentCard}
                          onPress={() => { setShowRecipeBookModal(false); openRecipeInModal(r.id); }}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.recentCardEmoji}>{proteinIcon}</Text>
                          <Text style={styles.recentCardTitle} numberOfLines={2}>{r.title}</Text>
                          {cuisineLabel && <Text style={styles.recentCardCuisine}>{cuisineInfo?.flag} {cuisineLabel}</Text>}
                          <View style={styles.recentCardMeta}>
                            {r.total_time_minutes != null && <Text style={styles.recentCardMetaText}>⏱ {r.total_time_minutes} {t('min')}</Text>}
                            <Text style={styles.recentCardMetaText}>👤 {r.servings ?? 2}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Recommend Me: popup with random recipe */}
      <RecipeDetailModal
        visible={recommendMeRecipeId != null}
        recipeId={recommendMeRecipeId}
        onClose={() => setRecommendMeRecipeId(null)}
      />

      {/* Recipe detail popup (from Fridge results or Recipe Book) */}
      <RecipeDetailModal
        visible={recipeDetailModalId != null}
        recipeId={recipeDetailModalId}
        onClose={() => setRecipeDetailModalId(null)}
      />

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
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl * 1.5,
  },

  // Hero (FlavorVault-style)
  hero: {
    backgroundColor: '#3c3730',
    paddingTop: Platform.OS === 'web' ? SPACING.lg : SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    marginHorizontal: -SPACING.lg,
    marginTop: -SPACING.lg,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  heroLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  heroLogoIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroLogoEmoji: {
    fontSize: 22,
  },
  heroAppName: {
    fontSize: 20,
    fontWeight: FONT.headingBold,
    color: COLORS.heroText,
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  heroIconBtn: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroIconText: {
    fontSize: 18,
  },
  heroAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginLeft: SPACING.xs,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: FONT.headingBold,
    color: COLORS.heroText,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  heroTagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  heroSearchRow: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    alignItems: 'center',
    gap: SPACING.md,
  },
  heroSearchBox: {
    flex: 1,
    minWidth: 0,
    position: 'relative',
  },
  heroSearchInput: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    paddingRight: 40,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 0,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  heroStatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.xs,
  },
  heroStatIcon: {
    fontSize: 18,
  },
  heroStatValue: {
    fontSize: 16,
    fontWeight: FONT.headingBold,
    color: COLORS.heroText,
  },
  heroStatLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
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

  mainContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    backgroundColor: COLORS.background,
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
  fridgePanel: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 320,
    maxWidth: '85%',
    backgroundColor: COLORS.surface,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    padding: SPACING.md,
    ...SHADOWS.lg,
  },
  fridgePanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  fridgePanelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  fridgePanelIconWrap: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.fridgeIconBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fridgePanelIcon: {
    fontSize: 20,
  },
  fridgePanelTitle: {
    fontSize: 18,
    fontWeight: FONT.headingBold,
    color: COLORS.text,
  },
  fridgePanelClose: {
    fontSize: 20,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  fridgePanelDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  fridgeSectionLabel: {
    fontSize: 13,
    fontWeight: FONT.headingSemibold,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  fridgeLoader: {
    marginVertical: SPACING.sm,
  },
  fridgeEmpty: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  },
  fridgeResultsScroll: {
    maxHeight: 200,
    marginBottom: SPACING.sm,
  },
  fridgeResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceRaised,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  fridgeResultEmoji: {
    fontSize: 22,
  },
  fridgeResultCardInner: {
    flex: 1,
    minWidth: 0,
  },
  fridgeResultTitle: {
    fontSize: 14,
    fontWeight: FONT.headingSemibold,
    color: COLORS.text,
  },
  fridgeResultMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  fridgeDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  fridgeDescInput: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    fontSize: 14,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  fridgeSuggestBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  fridgeSuggestBtnText: {
    fontSize: 14,
    fontWeight: FONT.headingSemibold,
    color: COLORS.primaryForeground,
  },
  recipeBookPanel: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    width: '100%',
    maxWidth: 440,
    maxHeight: '85%',
    padding: SPACING.md,
    ...SHADOWS.lg,
  },
  recipeBookScroll: {
    maxHeight: 400,
  },
  recipeBookSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  recipeBookCategoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  recipeBookCategoryCard: {
    width: '47%',
    minWidth: 120,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  recipeBookCategoryIcon: {
    fontSize: 28,
    marginBottom: SPACING.xs,
  },
  recipeBookCategoryLabel: {
    fontSize: 14,
    fontWeight: FONT.headingSemibold,
    color: COLORS.text,
    textAlign: 'center',
  },
  recipeBookCategoryCount: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  recipeBookBack: {
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  recipeBookBackText: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: FONT.headingSemibold,
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
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    minWidth: 48,
  },
  fridgeAddBtnLabel: {
    fontSize: 20,
    fontWeight: FONT.headingBold,
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
    backgroundColor: COLORS.chipOrange,
    paddingVertical: 6,
    paddingLeft: SPACING.sm,
    paddingRight: 6,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  chipLabel: {
    fontSize: 13,
    color: COLORS.text,
  },
  chipRemove: {
    fontSize: 16,
    color: COLORS.primary,
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  actionCard: {
    width: '48%',
    minWidth: 140,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 110,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  actionCardIconWrapFridge: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.fridgeIconBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  actionCardIconWrapRecommend: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primaryDim,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  actionCardIconWrapBook: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(139, 90, 43, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  actionCardIconWrapAdd: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  actionCardIcon: {
    fontSize: 24,
  },
  actionRecommend: {},
  actionFridge: {},
  actionBook: {},
  actionAdd: {},
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
    fontSize: 22,
    fontWeight: FONT.headingBold,
    color: COLORS.text,
    marginBottom: SPACING.md,
    letterSpacing: -0.3,
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
