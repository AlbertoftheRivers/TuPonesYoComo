import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, BORDER_RADIUS } from '../lib/constants';
import DesktopWarning from '../components/DesktopWarning';
import { useLanguage } from '../lib/LanguageContext';
import { SupportedLanguage } from '../lib/i18n';
import { getTranslatedProtein, getTranslatedCuisine } from '../lib/categoryTranslations';
import { getAllRecipes } from '../api/recipes';
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

  const handleAddRecipe = () => {
    navigation.navigate('AddRecipe');
  };

  const handleOpenRecipeBook = () => {
    navigation.navigate('Categories');
  };

  const handleOpenGuide = () => {
    navigation.navigate('UserGuide');
  };

  const handleOpenAdmin = () => {
    navigation.navigate('Admin');
  };

  const handleRecipePress = (recipe: Recipe) => {
    navigation.navigate('RecipeDetail', { recipeId: recipe.id });
  };

  // Search functionality
  const filteredRecipes = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }

    const query = searchQuery.toLowerCase().trim();
    return allRecipes.filter((recipe) => {
      // Search in title
      if (recipe.title.toLowerCase().includes(query)) {
        return true;
      }

      // Search in ingredients
      const ingredientNames = recipe.ingredients
        .map(ing => ing.name.toLowerCase())
        .join(' ');
      if (ingredientNames.includes(query)) {
        return true;
      }

      // Search in cuisines
      if (recipe.cuisines && recipe.cuisines.length > 0) {
        const cuisineLabels = recipe.cuisines
          .map(cuisineValue => getTranslatedCuisine(cuisineValue, language))
          .join(' ')
          .toLowerCase();
        if (cuisineLabels.includes(query)) {
          return true;
        }
      }

      return false;
    });
  }, [searchQuery, allRecipes, language]);

  // Get unique recipes count
  const uniqueRecipesCount = useMemo(() => {
    return allRecipes.length;
  }, [allRecipes]);

  // Get unique cuisines count
  const uniqueCuisinesCount = useMemo(() => {
    const cuisineSet = new Set<string>();
    allRecipes.forEach(recipe => {
      if (recipe.cuisines && recipe.cuisines.length > 0) {
        recipe.cuisines.forEach(cuisine => cuisineSet.add(cuisine));
      }
    });
    return cuisineSet.size;
  }, [allRecipes]);

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <DesktopWarning />
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>{t('appName')}</Text>
              <Text style={styles.subtitle}>{t('searchPlaceholder')}</Text>
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.languageButton}
                onPress={() => setShowLanguageModal(true)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t('selectLanguage')}
              >
                <Text style={styles.languageButtonText}>🌐</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.helpButton}
                onPress={handleOpenGuide}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t('userGuide')}
              >
                <Text style={styles.helpButtonText}>❓</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.adminButton}
                onPress={handleOpenAdmin}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Admin"
              >
                <Text style={styles.adminButtonText}>⚙️</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Search bar - full width */}
          <View style={styles.searchContainerFull}>
            <TextInput
              style={styles.searchInput}
              placeholder={t('searchPlaceholder')}
              placeholderTextColor={COLORS.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setSearchQuery('')}
                accessibilityRole="button"
                accessibilityLabel={t('cancel')}
              >
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Recipe and cuisines counters */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{uniqueRecipesCount}</Text>
              <Text style={styles.statLabel}>
                {uniqueRecipesCount !== 1 ? t('recipesCountPlural') : t('recipesCount')}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{uniqueCuisinesCount}</Text>
              <Text style={styles.statLabel}>
                {uniqueCuisinesCount !== 1 ? t('cuisinesCountPlural') : t('cuisinesCount')}
              </Text>
            </View>
          </View>
        </View>

        {/* Search Results */}
        {searchQuery.trim() && (
          <View style={styles.searchResultsContainer}>
            <Text style={styles.searchResultsTitle}>
              {t('searchResults')}: {filteredRecipes.length} {filteredRecipes.length !== 1 ? t('recipesCountPlural') : t('recipesCount')}
            </Text>
            {loadingRecipes ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={styles.loadingIndicator} />
            ) : filteredRecipes.length === 0 ? (
              <Text style={styles.noResultsText}>{t('noRecipesFound')}</Text>
            ) : (
              <View style={styles.searchResultsList}>
                {filteredRecipes.map((recipe) => {
                  const cuisineInfos = recipe.cuisines 
                    ? recipe.cuisines.map(cuisineValue => allCuisines.find(c => c.value === cuisineValue)).filter(Boolean)
                    : [];
                  return (
                    <TouchableOpacity
                      key={recipe.id}
                      style={styles.searchResultCard}
                      onPress={() => handleRecipePress(recipe)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.searchResultHeader}>
                        <Text style={styles.searchResultTitle}>{recipe.title}</Text>
                        {cuisineInfos.length > 0 && (
                          <View style={styles.cuisineFlagsContainer}>
                            {cuisineInfos.map((cuisineInfo, idx) => (
                              <Text key={idx} style={styles.cuisineFlag}>{cuisineInfo?.flag}</Text>
                            ))}
                          </View>
                        )}
                      </View>
                      <View style={styles.searchResultMeta}>
                        <Text style={styles.searchResultMetaText}>
                          {getTranslatedProtein(recipe.main_protein, language)}
                        </Text>
                        {recipe.total_time_minutes && (
                          <>
                            <Text style={styles.searchResultMetaText}>•</Text>
                            <Text style={styles.searchResultMetaText}>
                              ⏱️ {recipe.total_time_minutes} {t('min')}
                            </Text>
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

        {/* When not searching: Recipe book + Add recipe cards */}
        {!searchQuery.trim() && (
          <View style={styles.actionCards}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleOpenRecipeBook}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('recipeBook')}
            >
              <View style={[styles.actionCardIcon, { backgroundColor: COLORS.accent + '35' }]}>
                <Text style={styles.actionCardIconText}>📖</Text>
              </View>
              <Text style={styles.actionCardLabel}>{t('recipeBook')}</Text>
              <Text style={styles.actionCardHint}>{t('selectCategory')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleAddRecipe}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('addRecipe')}
            >
              <View style={[styles.actionCardIcon, { backgroundColor: COLORS.primary + '35' }]}>
                <Text style={styles.actionCardIconText}>➕</Text>
              </View>
              <Text style={styles.actionCardLabel}>{t('addRecipeShort')}</Text>
              <Text style={styles.actionCardHint}>{t('addRecipe')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('selectLanguage')}</Text>
            
            <TouchableOpacity
              style={[styles.languageOption, language === 'es' && styles.languageOptionActive]}
              onPress={() => handleLanguageChange('es')}
            >
              <Text style={styles.languageOptionText}>🇪🇸 {t('spanish')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.languageOption, language === 'ca' && styles.languageOptionActive]}
              onPress={() => handleLanguageChange('ca')}
            >
              <Text style={styles.languageOptionText}>🇪🇸 {t('catalan')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.languageOption, language === 'fr' && styles.languageOptionActive]}
              onPress={() => handleLanguageChange('fr')}
            >
              <Text style={styles.languageOptionText}>🇫🇷 {t('french')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.languageOption, language === 'en' && styles.languageOptionActive]}
              onPress={() => handleLanguageChange('en')}
            >
              <Text style={styles.languageOptionText}>🇬🇧 {t('english')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.languageOption, language === 'pt' && styles.languageOptionActive]}
              onPress={() => handleLanguageChange('pt')}
            >
              <Text style={styles.languageOptionText}>🇵🇹 {t('portuguese')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowLanguageModal(false)}
            >
              <Text style={styles.modalCancelButtonText}>{t('cancel')}</Text>
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
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  languageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  languageButtonText: {
    fontSize: 20,
  },
  helpButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  helpButtonText: {
    fontSize: 20,
  },
  adminButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  adminButtonText: {
    fontSize: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  proteinCard: {
    width: '48%',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  cardIconText: {
    fontSize: 32,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  languageOption: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '20',
  },
  languageOptionText: {
    fontSize: 18,
    color: COLORS.text,
    textAlign: 'center',
  },
  modalCancelButton: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.border,
  },
  modalCancelButtonText: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    fontWeight: '600',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  searchContainerFull: {
    marginTop: SPACING.md,
    position: 'relative',
  },
  searchContainer: {
    flex: 1,
    position: 'relative',
  },
  searchInput: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingRight: 44,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  clearButton: {
    position: 'absolute',
    right: SPACING.sm,
    top: 0,
    bottom: 0,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 18,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: SPACING.md,
    gap: SPACING.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 72,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    alignItems: 'center',
    minWidth: 60,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 12,
    color: '#ffffff',
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  actionCards: {
    marginTop: SPACING.xl,
    gap: SPACING.lg,
  },
  actionCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  actionCardIconText: {
    fontSize: 28,
  },
  actionCardLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  actionCardHint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  proteinCard: {
    width: '48%',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  cardIconText: {
    fontSize: 32,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
    marginBottom: SPACING.lg,
  },
  searchResultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  loadingIndicator: {
    marginVertical: SPACING.md,
  },
  noResultsText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    padding: SPACING.lg,
  },
  searchResultsList: {
    gap: SPACING.sm,
  },
  searchResultCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  searchResultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  cuisineFlagsContainer: {
    flexDirection: 'row',
    marginLeft: SPACING.sm,
  },
  cuisineFlag: {
    fontSize: 18,
  },
  searchResultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  searchResultMetaText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});

