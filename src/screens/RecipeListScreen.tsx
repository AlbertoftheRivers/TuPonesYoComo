import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONT, MAIN_PROTEINS, CATEGORY_STRIPES } from '../lib/constants';
import { getRecipesByProtein } from '../api/recipes';
import { getAllCuisines } from '../lib/customCategories';
import { Recipe, MainProtein } from '../types/recipe';
import { useLanguage } from '../lib/LanguageContext';
import { getTranslatedProtein, getTranslatedCuisine } from '../lib/categoryTranslations';

type RootStackParamList = {
  Home: undefined;
  RecipeList: { mainProtein: string };
  RecipeDetail: { recipeId: string | number };
  AddRecipe: undefined;
  EditRecipe: { recipeId: string | number };
};

type RecipeListScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'RecipeList'>;
type RecipeListScreenRouteProp = RouteProp<RootStackParamList, 'RecipeList'>;

interface Props {
  navigation: RecipeListScreenNavigationProp;
  route: RecipeListScreenRouteProp;
}

export default function RecipeListScreen({ navigation, route }: Props) {
  const { t, language } = useLanguage();
  const { mainProtein } = route.params;
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [allCuisines, setAllCuisines] = useState<Array<{ value: string; label?: string; flag?: string }>>([]);

  useEffect(() => {
    loadRecipes();
    loadCuisines();
  }, [mainProtein]);

  const loadCuisines = async () => {
    try {
      const cuisines = await getAllCuisines();
      setAllCuisines(cuisines);
    } catch (error) {
      console.error('Error loading cuisines:', error);
    }
  };

  const loadRecipes = async () => {
    try {
      setLoading(true);
      const data = await getRecipesByProtein(mainProtein as MainProtein);
      setRecipes(data);
    } catch (error) {
      Alert.alert(t('error'), t('error'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecipePress = (recipe: Recipe) => {
    navigation.navigate('RecipeDetail', { recipeId: recipe.id });
  };

  const proteinLabel = getTranslatedProtein(mainProtein, language);
  const proteinIcon = MAIN_PROTEINS.find(p => p.value === mainProtein)?.icon || '🍽️';
  const categoryStripeIndex = MAIN_PROTEINS.findIndex(p => p.value === mainProtein);
  const stripeColor = CATEGORY_STRIPES[categoryStripeIndex >= 0 ? categoryStripeIndex % CATEGORY_STRIPES.length : 0];

  // Filtrar recetas basado en búsqueda
  const filteredRecipes = useMemo(() => {
    if (!searchQuery.trim()) {
      return recipes;
    }

    const query = searchQuery.toLowerCase().trim();
    return recipes.filter((recipe) => {
      // Buscar en título
      if (recipe.title.toLowerCase().includes(query)) {
        return true;
      }

      // Buscar en cuisines
      if (recipe.cuisines && recipe.cuisines.length > 0) {
        const cuisineLabels = recipe.cuisines
          .map(cuisineValue => getTranslatedCuisine(cuisineValue, language))
          .join(' ');
        if (cuisineLabels.toLowerCase().includes(query)) {
          return true;
        }
      }

      // Buscar en ingredientes
      const ingredientNames = recipe.ingredients.map(ing => ing.name.toLowerCase()).join(' ');
      if (ingredientNames.includes(query)) {
        return true;
      }

      return false;
    });
  }, [recipes, searchQuery]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.titleIcon}>{proteinIcon}</Text>
          <Text style={styles.title}>{proteinLabel}</Text>
        </View>
        <Text style={styles.count}>
          {filteredRecipes.length} {filteredRecipes.length !== 1 ? t('recipesCountPlural') : t('recipesCount')}
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('searchPlaceholder')}
          placeholderTextColor={COLORS.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {filteredRecipes.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>
            {searchQuery ? t('noRecipesFound') : t('noRecipes')}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchQuery 
              ? t('tryOtherSearch')
              : t('tapAddRecipe')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredRecipes}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => {
            const cuisineInfos = item.cuisines
              ? item.cuisines.map(cuisineValue => allCuisines.find(c => c.value === cuisineValue)).filter(Boolean)
              : [];
            return (
              <TouchableOpacity
                style={[styles.recipeCard, { borderLeftColor: stripeColor, borderLeftWidth: 4 }]}
                onPress={() => handleRecipePress(item)}
                activeOpacity={0.7}
              >
                <View style={styles.recipeHeader}>
                  <View style={styles.recipeTitleContainer}>
                    <Text style={styles.recipeTitle}>{item.title}</Text>
                  </View>
                </View>
                <View style={styles.footerRow}>
                  {item.total_time_minutes ? (
                    <Text style={styles.timeText}>⏱️ {item.total_time_minutes} {t('min')}</Text>
                  ) : (
                    <Text style={styles.timeText}>⏱️ -- {t('min')}</Text>
                  )}
                  {cuisineInfos.length > 0 && (
                    <View style={styles.cuisineFlagsContainer}>
                      {cuisineInfos.map((cuisineInfo: any, idx) => (
                        <Text key={idx} style={styles.cuisineFlag}>{cuisineInfo?.flag}</Text>
                      ))}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.listContent}
        />
      )}
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
    padding: SPACING.lg,
  },
  header: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  titleIcon: {
    fontSize: 28,
    marginRight: SPACING.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: FONT.headingBold,
    color: COLORS.text,
  },
  searchContainer: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchInput: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  count: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  listContent: {
    padding: SPACING.md,
  },
  recipeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderColor: COLORS.borderLight,
    ...SHADOWS.md,
  },
  recipeHeader: {
    marginBottom: SPACING.sm,
  },
  recipeTitleContainer: {
    flex: 1,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: FONT.headingSemibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  timeText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  cuisineFlagsContainer: {
    flexDirection: 'row',
    marginLeft: SPACING.xs,
    alignItems: 'center',
  },
  cuisineFlag: {
    fontSize: 18,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: FONT.headingSemibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
