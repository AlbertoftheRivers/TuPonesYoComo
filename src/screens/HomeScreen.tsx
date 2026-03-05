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
import { getAllRecipes } from '../api/recipes';
import { getAllCuisines } from '../lib/customCategories';
import { suggestRecipeFromIngredients } from '../lib/ollama';
import { Recipe } from '../types/recipe';

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
  const [allCuisines, setAllCuisines] = useState<any[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);

  // Fridge
  const [fridgeInput, setFridgeInput] = useState('');
  const [fridgeIngredients, setFridgeIngredients] = useState<string[]>([]);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadAllRecipes();
      loadCuisines();
    }, [])
  );

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

  const handleSurpriseMe = () => {
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

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <DesktopWarning />

        <View style={styles.topBar}>
          <View style={styles.topBarSpacer} />
          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowLanguageModal(true)}>
            <Text style={styles.iconBtnText}>🌐</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('UserGuide')}>
            <Text style={styles.iconBtnText}>❓</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Admin')}>
            <Text style={styles.iconBtnText}>⚙️</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroTitle}>{t('appName')}</Text>
          <Text style={styles.heroTagline}>{t('tagline')}</Text>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <TextInput
            style={styles.searchInput}
            placeholder={t('searchPlaceholder')}
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity style={styles.clearBtn} onPress={() => setSearchQuery('')}>
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search results */}
        {searchQuery.trim().length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t('searchResults')}: {filteredRecipes.length}
            </Text>
            {loadingRecipes ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={styles.loader} />
            ) : filteredRecipes.length === 0 ? (
              <Text style={styles.noResults}>{t('noRecipesFound')}</Text>
            ) : (
              filteredRecipes.map((recipe) => {
                const cuisineInfos = recipe.cuisines
                  ? recipe.cuisines.map((c) => allCuisines.find((x) => x.value === c)).filter(Boolean)
                  : [];
                return (
                  <TouchableOpacity
                    key={recipe.id}
                    style={styles.resultCard}
                    onPress={() => handleRecipePress(recipe)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.resultTitle}>{recipe.title}</Text>
                    <View style={styles.resultMeta}>
                      <Text style={styles.resultMetaText}>{getTranslatedProtein(recipe.main_protein, language)}</Text>
                      {recipe.total_time_minutes && (
                        <Text style={styles.resultMetaText}> • ⏱️ {recipe.total_time_minutes} {t('min')}</Text>
                      )}
                    </View>
                    {cuisineInfos.length > 0 && (
                      <View style={styles.flags}>
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

        {!searchQuery.trim() && (
          <>
            {/* Fridge block */}
            <View style={styles.fridgeBlock}>
              <Text style={styles.fridgeTitle}>{t('whatsInFridge')}</Text>
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
                  <Text style={styles.fridgeAddBtnText}>{t('addIngredient')}</Text>
                </TouchableOpacity>
              </View>
              {fridgeIngredients.length > 0 && (
                <View style={styles.chips}>
                  {fridgeIngredients.map((ing, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.chip}
                      onPress={() => removeFridgeIngredient(i)}
                    >
                      <Text style={styles.chipText}>{ing}</Text>
                      <Text style={styles.chipX}>×</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {fridgeIngredients.length > 0 && (
                <View style={styles.fridgeActions}>
                  <TouchableOpacity style={[styles.fridgeCta, styles.fridgeCtaMatch]} onPress={handleFindMatching}>
                    <Text style={styles.fridgeCtaText}>{t('findMatchingRecipes')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.fridgeCta, styles.fridgeCtaAI]}
                    onPress={handleSuggestWithAI}
                    disabled={aiLoading}
                  >
                    {aiLoading ? (
                      <ActivityIndicator size="small" color={COLORS.background} />
                    ) : (
                      <Text style={styles.fridgeCtaText}>{t('suggestWithAI')}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Main actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionCard, styles.actionSurprise]}
                onPress={handleSurpriseMe}
                disabled={allRecipes.length === 0}
                activeOpacity={0.8}
              >
                <Text style={styles.actionEmoji}>🎲</Text>
                <Text style={styles.actionLabel}>{t('surpriseMe')}</Text>
                <Text style={styles.actionHint}>{allRecipes.length === 0 ? t('noRecipesFound') : t('surpriseMeHint')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionCard, styles.actionBrowse]}
                onPress={() => navigation.navigate('Categories')}
                activeOpacity={0.8}
              >
                <Text style={styles.actionEmoji}>📖</Text>
                <Text style={styles.actionLabel}>{t('browseByCategory')}</Text>
                <Text style={styles.actionHint}>{t('selectCategory')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionCard, styles.actionAdd]}
                onPress={() => navigation.navigate('AddRecipe')}
                activeOpacity={0.8}
              >
                <Text style={styles.actionEmoji}>➕</Text>
                <Text style={styles.actionLabel}>{t('addRecipeShort')}</Text>
                <Text style={styles.actionHint}>{t('addRecipe')}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={styles.statNum}>{allRecipes.length}</Text>
                <Text style={styles.statText}>{allRecipes.length !== 1 ? t('recipesCountPlural') : t('recipesCount')}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statNum}>{uniqueCuisinesCount}</Text>
                <Text style={styles.statText}>{uniqueCuisinesCount !== 1 ? t('cuisinesCountPlural') : t('cuisinesCount')}</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* AI suggestion modal */}
      <Modal visible={!!aiSuggestion} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>✨ {t('suggestWithAI')}</Text>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalBody}>{aiSuggestion}</Text>
            </ScrollView>
            <View style={styles.modalButtons}>
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('selectLanguage')}</Text>
            {(['es', 'ca', 'fr', 'en', 'pt'] as SupportedLanguage[]).map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[styles.langOption, language === lang && styles.langOptionActive]}
                onPress={() => handleLanguageChange(lang)}
              >
                <Text style={styles.langOptionText}>
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
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.md, paddingBottom: SPACING.xl },
  topBar: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: SPACING.sm },
  topBarSpacer: { flex: 1 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.sharp,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  iconBtnText: { fontSize: 20 },
  hero: { marginBottom: SPACING.lg },
  heroTitle: { fontSize: 30, fontWeight: FONT.headingBold, color: COLORS.text, letterSpacing: -0.5 },
  heroTagline: { fontSize: 15, color: COLORS.textSecondary, marginTop: SPACING.xs },
  searchWrap: { marginBottom: SPACING.lg, position: 'relative' },
  searchInput: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.sharp,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingRight: 48,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  clearBtn: { position: 'absolute', right: SPACING.sm, top: 0, bottom: 0, minWidth: 44, justifyContent: 'center', alignItems: 'center' },
  clearBtnText: { fontSize: 18, color: COLORS.textMuted, fontWeight: '700' },
  section: { marginBottom: SPACING.lg },
  sectionTitle: { fontSize: 18, fontWeight: FONT.headingSemibold, color: COLORS.text, marginBottom: SPACING.md },
  loader: { marginVertical: SPACING.md },
  noResults: { fontSize: 16, color: COLORS.textSecondary, textAlign: 'center', padding: SPACING.lg },
  resultCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.sharp,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.neonLime,
    ...SHADOWS.sm,
  },
  resultTitle: { fontSize: 18, fontWeight: FONT.headingSemibold, color: COLORS.text },
  resultMeta: { flexDirection: 'row', marginTop: SPACING.xs },
  resultMetaText: { fontSize: 14, color: COLORS.textSecondary },
  flags: { flexDirection: 'row', marginTop: SPACING.xs },
  flag: { fontSize: 16 },

  fridgeBlock: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.sharp,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.neonCyan,
  },
  fridgeTitle: { fontSize: 18, fontWeight: FONT.headingBold, color: COLORS.text, marginBottom: SPACING.sm },
  fridgeRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  fridgeInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.sharp,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  fridgeAddBtn: {
    backgroundColor: COLORS.neonCyan,
    borderRadius: BORDER_RADIUS.sharp,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
  },
  fridgeAddBtnText: { fontSize: 14, fontWeight: FONT.headingSemibold, color: COLORS.background },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginBottom: SPACING.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.neonCyanDim,
    borderRadius: BORDER_RADIUS.sharp,
    paddingVertical: SPACING.xs,
    paddingLeft: SPACING.sm,
    paddingRight: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.neonCyan,
  },
  chipText: { fontSize: 14, color: COLORS.text },
  chipX: { fontSize: 18, color: COLORS.neonCyan, marginLeft: SPACING.xs, fontWeight: '700' },
  fridgeActions: { flexDirection: 'row', gap: SPACING.sm },
  fridgeCta: { flex: 1, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.sharp, alignItems: 'center' },
  fridgeCtaMatch: { backgroundColor: COLORS.neonViolet },
  fridgeCtaAI: { backgroundColor: COLORS.neonOrange },
  fridgeCtaText: { fontSize: 14, fontWeight: FONT.headingSemibold, color: COLORS.text },

  actions: { gap: SPACING.md, marginBottom: SPACING.xl },
  actionCard: {
    borderRadius: BORDER_RADIUS.sharp,
    padding: SPACING.lg,
    alignItems: 'center',
    minHeight: 96,
    justifyContent: 'center',
    borderWidth: 2,
    ...SHADOWS.sm,
  },
  actionSurprise: { backgroundColor: COLORS.neonOrangeDim, borderColor: COLORS.neonOrange },
  actionBrowse: { backgroundColor: COLORS.neonCyanDim, borderColor: COLORS.neonCyan },
  actionAdd: { backgroundColor: COLORS.primaryDim, borderColor: COLORS.primary },
  actionEmoji: { fontSize: 28, marginBottom: SPACING.sm },
  actionLabel: { fontSize: 18, fontWeight: FONT.headingBold, color: COLORS.text },
  actionHint: { fontSize: 12, color: COLORS.textSecondary, marginTop: SPACING.xs, textAlign: 'center' },

  stats: { flexDirection: 'row', gap: SPACING.md },
  stat: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.sharp,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statNum: { fontSize: 22, fontWeight: FONT.headingBold, color: COLORS.primary },
  statText: { fontSize: 12, color: COLORS.textSecondary, marginTop: SPACING.xs },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: SPACING.md },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    width: '100%',
    maxWidth: 480,
    maxHeight: '85%',
  },
  modalTitle: { fontSize: 20, fontWeight: FONT.headingBold, color: COLORS.text, marginBottom: SPACING.md },
  modalScroll: { maxHeight: 320, marginBottom: SPACING.md },
  modalBody: { fontSize: 15, color: COLORS.textSecondary, lineHeight: 22 },
  modalButtons: { gap: SPACING.sm },
  modalBtnPrimary: { backgroundColor: COLORS.primary, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.sharp, alignItems: 'center' },
  modalBtnPrimaryText: { fontSize: 16, fontWeight: FONT.headingSemibold, color: COLORS.background },
  modalBtnSecondary: { backgroundColor: COLORS.border, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.sharp, alignItems: 'center' },
  modalBtnSecondaryText: { fontSize: 16, color: COLORS.text },
  langOption: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sharp,
    backgroundColor: COLORS.background,
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  langOptionActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryDim },
  langOptionText: { fontSize: 17, color: COLORS.text, textAlign: 'center' },
  modalCancel: { marginTop: SPACING.md, padding: SPACING.md, borderRadius: BORDER_RADIUS.sharp, backgroundColor: COLORS.border },
  modalCancelText: { fontSize: 16, color: COLORS.text, textAlign: 'center', fontWeight: FONT.headingSemibold },
});
