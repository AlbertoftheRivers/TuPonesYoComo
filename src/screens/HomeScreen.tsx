import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONT } from '../lib/constants';
import DesktopWarning from '../components/DesktopWarning';
import { useLanguage } from '../lib/LanguageContext';
import { SupportedLanguage } from '../lib/i18n';
import { getTranslatedProtein, getTranslatedCuisine } from '../lib/categoryTranslations';
import { getAllRecipes, getRandomRecipe } from '../api/recipes';
import { getAllCuisines } from '../lib/customCategories';
import { Recipe } from '../types/recipe';

type RootStackParamList = {
  Home: undefined;
  Categories: undefined;
  RecipeList: { mainProtein: string };
  RecipeDetail: { recipeId: string | number };
  AddRecipe: undefined;
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
  const [surpriseLoading, setSurpriseLoading] = useState(false);

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
    } catch (error) {
      console.error('Error loading all recipes:', error);
    } finally {
      setLoadingRecipes(false);
    }
  };

  const loadCuisines = async () => {
    try {
      const cuisines = await getAllCuisines();
      setAllCuisines(cuisines);
    } catch (error) {
      console.error('Error loading cuisines:', error);
    }
  };

  const handleLanguageChange = async (lang: SupportedLanguage) => {
    await setLanguage(lang);
    setShowLanguageModal(false);
  };

  const handleSurpriseMe = async () => {
    if (allRecipes.length === 0) return;
    setSurpriseLoading(true);
    try {
      const recipe = await getRandomRecipe();
      if (recipe) navigation.navigate('RecipeDetail', { recipeId: recipe.id });
    } finally {
      setSurpriseLoading(false);
    }
  };

  const handleBrowseByCategory = () => navigation.navigate('Categories');
  const handleAddRecipe = () => navigation.navigate('AddRecipe');
  const handleOpenGuide = () => navigation.navigate('UserGuide');
  const handleOpenAdmin = () => navigation.navigate('Admin');
  const handleRecipePress = (recipe: Recipe) => {
    navigation.navigate('RecipeDetail', { recipeId: recipe.id });
  };

  const filteredRecipes = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    return allRecipes.filter((recipe) => {
      if (recipe.title.toLowerCase().includes(query)) return true;
      const ingredientNames = recipe.ingredients.map(ing => ing.name.toLowerCase()).join(' ');
      if (ingredientNames.includes(query)) return true;
      if (recipe.cuisines?.length) {
        const cuisineLabels = recipe.cuisines
          .map(c => getTranslatedCuisine(c, language))
          .join(' ')
          .toLowerCase();
        if (cuisineLabels.includes(query)) return true;
      }
      return false;
    });
  }, [searchQuery, allRecipes, language]);

  const uniqueRecipesCount = allRecipes.length;
  const uniqueCuisinesCount = useMemo(() => {
    const set = new Set<string>();
    allRecipes.forEach(r => r.cuisines?.forEach(c => set.add(c)));
    return set.size;
  }, [allRecipes]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <DesktopWarning />

        {/* Top bar: language, help, admin */}
        <View style={styles.topBar}>
          <View style={styles.topBarSpacer} />
          <View style={styles.topBarButtons}>
            <TouchableOpacity style={styles.iconButton} onPress={() => setShowLanguageModal(true)} accessibilityRole="button" accessibilityLabel={t('selectLanguage')}>
              <Text style={styles.iconButtonText}>🌐</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={handleOpenGuide} accessibilityRole="button" accessibilityLabel={t('userGuide')}>
              <Text style={styles.iconButtonText}>❓</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={handleOpenAdmin} accessibilityRole="button" accessibilityLabel="Admin">
              <Text style={styles.iconButtonText}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero */}
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
            <TouchableOpacity style={styles.clearBtn} onPress={() => setSearchQuery('')} accessibilityRole="button">
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* When searching: results */}
        {searchQuery.trim().length > 0 && (
          <View style={styles.searchSection}>
            <Text style={styles.searchSectionTitle}>
              {t('searchResults')}: {filteredRecipes.length} {filteredRecipes.length !== 1 ? t('recipesCountPlural') : t('recipesCount')}
            </Text>
            {loadingRecipes ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={styles.loader} />
            ) : filteredRecipes.length === 0 ? (
              <Text style={styles.noResults}>{t('noRecipesFound')}</Text>
            ) : (
              <View style={styles.resultList}>
                {filteredRecipes.map((recipe) => {
                  const cuisineInfos = recipe.cuisines
                    ? recipe.cuisines.map(c => allCuisines.find(x => x.value === c)).filter(Boolean)
                    : [];
                  return (
                    <TouchableOpacity
                      key={recipe.id}
                      style={styles.resultCard}
                      onPress={() => handleRecipePress(recipe)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.resultHeader}>
                        <Text style={styles.resultTitle}>{recipe.title}</Text>
                        {cuisineInfos.length > 0 && (
                          <View style={styles.flags}>
                            {cuisineInfos.map((info: any, i) => (
                              <Text key={i} style={styles.flag}>{info?.flag}</Text>
                            ))}
                          </View>
                        )}
                      </View>
                      <View style={styles.resultMeta}>
                        <Text style={styles.resultMetaText}>{getTranslatedProtein(recipe.main_protein, language)}</Text>
                        {recipe.total_time_minutes && (
                          <>
                            <Text style={styles.resultMetaText}> • </Text>
                            <Text style={styles.resultMetaText}>⏱️ {recipe.total_time_minutes} {t('min')}</Text>
                          </>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* When not searching: three main actions */}
        {!searchQuery.trim() && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionCard, styles.actionSurprise]}
              onPress={handleSurpriseMe}
              disabled={allRecipes.length === 0 || surpriseLoading}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('surpriseMe')}
            >
              {surpriseLoading ? (
                <ActivityIndicator size="small" color={COLORS.text} />
              ) : (
                <>
                  <Text style={styles.actionEmoji}>🎲</Text>
                  <Text style={styles.actionLabel}>{t('surpriseMe')}</Text>
                  <Text style={styles.actionHint}>
                    {allRecipes.length === 0 ? t('noRecipesFound') : t('surpriseMeHint')}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, styles.actionBrowse]}
              onPress={handleBrowseByCategory}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('browseByCategory')}
            >
              <Text style={styles.actionEmoji}>📖</Text>
              <Text style={styles.actionLabel}>{t('browseByCategory')}</Text>
              <Text style={styles.actionHint}>{t('selectCategory')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, styles.actionAdd]}
              onPress={handleAddRecipe}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('addRecipeShort')}
            >
              <Text style={styles.actionEmoji}>➕</Text>
              <Text style={styles.actionLabel}>{t('addRecipeShort')}</Text>
              <Text style={styles.actionHint}>{t('addRecipe')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Stats at bottom */}
        {!searchQuery.trim() && (
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{uniqueRecipesCount}</Text>
              <Text style={styles.statText}>{uniqueRecipesCount !== 1 ? t('recipesCountPlural') : t('recipesCount')}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{uniqueCuisinesCount}</Text>
              <Text style={styles.statText}>{uniqueCuisinesCount !== 1 ? t('cuisinesCountPlural') : t('cuisinesCount')}</Text>
            </View>
          </View>
        )}
      </ScrollView>

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
  scrollContent: { padding: SPACING.md, paddingBottom: SPACING.xl },
  topBar: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: SPACING.sm },
  topBarSpacer: { flex: 1 },
  topBarButtons: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  iconButtonText: { fontSize: 20 },
  hero: { marginBottom: SPACING.lg },
  heroTitle: { fontSize: 32, fontWeight: FONT.headingBold, color: COLORS.text, letterSpacing: -0.5 },
  heroTagline: { fontSize: 16, color: COLORS.textSecondary, marginTop: SPACING.xs },
  searchWrap: { marginBottom: SPACING.lg, position: 'relative' },
  searchInput: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingRight: 48,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  clearBtn: { position: 'absolute', right: SPACING.sm, top: 0, bottom: 0, minWidth: 44, justifyContent: 'center', alignItems: 'center' },
  clearBtnText: { fontSize: 18, color: COLORS.textSecondary, fontWeight: '700' },
  searchSection: { marginBottom: SPACING.lg },
  searchSectionTitle: { fontSize: 18, fontWeight: FONT.headingSemibold, color: COLORS.text, marginBottom: SPACING.md },
  loader: { marginVertical: SPACING.md },
  noResults: { fontSize: 16, color: COLORS.textSecondary, textAlign: 'center', padding: SPACING.lg },
  resultList: { gap: SPACING.sm },
  resultCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.xs },
  resultTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text, flex: 1 },
  flags: { flexDirection: 'row', marginLeft: SPACING.sm },
  flag: { fontSize: 18 },
  resultMeta: { flexDirection: 'row', alignItems: 'center' },
  resultMetaText: { fontSize: 14, color: COLORS.textSecondary },
  actions: { gap: SPACING.md, marginBottom: SPACING.xl },
  actionCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  actionSurprise: { backgroundColor: COLORS.fun },
  actionBrowse: { backgroundColor: COLORS.accentLight },
  actionAdd: { backgroundColor: COLORS.primary },
  actionEmoji: { fontSize: 32, marginBottom: SPACING.sm },
  actionLabel: { fontSize: 20, fontWeight: FONT.headingBold, color: COLORS.text },
  actionHint: { fontSize: 13, color: COLORS.textSecondary, marginTop: SPACING.xs, textAlign: 'center' },
  stats: { flexDirection: 'row', gap: SPACING.md, marginTop: 'auto' },
  stat: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  statNum: { fontSize: 22, fontWeight: FONT.headingBold, color: COLORS.primary },
  statText: { fontSize: 12, color: COLORS.textSecondary, marginTop: SPACING.xs },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    width: '88%',
    maxWidth: 400,
    ...SHADOWS.lg,
  },
  modalTitle: { fontSize: 22, fontWeight: FONT.headingBold, color: COLORS.text, marginBottom: SPACING.lg, textAlign: 'center' },
  langOption: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  langOptionActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '18' },
  langOptionText: { fontSize: 17, color: COLORS.text, textAlign: 'center' },
  modalCancel: { marginTop: SPACING.md, padding: SPACING.md, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.borderLight },
  modalCancelText: { fontSize: 16, color: COLORS.text, textAlign: 'center', fontWeight: FONT.headingSemibold },
});
