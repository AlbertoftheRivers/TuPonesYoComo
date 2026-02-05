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
import { COLORS, SPACING, BORDER_RADIUS, MAIN_PROTEINS, CUISINES } from '../lib/constants';
import { getRecipesByProtein, updateRecipe } from '../api/recipes';
import { getAllCuisines, addCustomCuisine } from '../lib/customCategories';
import { Recipe, MainProtein, Cuisine } from '../types/recipe';

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
  const { mainProtein } = route.params;
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [allCuisines, setAllCuisines] = useState(CUISINES);

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
      Alert.alert('Error', 'Failed to load recipes. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecipePress = (recipe: Recipe) => {
    navigation.navigate('RecipeDetail', { recipeId: recipe.id });
  };

  const handleEditCuisine = (recipe: Recipe) => {
    Alert.alert(
      'Editar Cocina',
      'Selecciona una opción:',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Seleccionar Cocina',
          onPress: () => {
            Alert.alert(
              'Seleccionar Cocina',
              '',
              [
                { text: 'Cancelar', style: 'cancel' },
                ...allCuisines.map((c) => ({
                  text: `${c.flag} ${c.label}`,
                  onPress: () => {
                    updateRecipeCuisine(recipe.id, c.value as Cuisine);
                  },
                })),
                {
                  text: 'Sin cocina',
                  onPress: () => {
                    updateRecipeCuisine(recipe.id, undefined);
                  },
                },
              ],
              { cancelable: true }
            );
          },
        },
        {
          text: 'Nueva Cocina',
          onPress: () => {
            // For React Native, we'll use a simple approach with two alerts
            // First ask for name, then flag
            Alert.alert(
              'Nueva Cocina',
              'Escribe el nombre de la cocina en el siguiente paso',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Continuar',
                  onPress: () => {
                    // Note: React Native doesn't have Alert.prompt
                    // User will need to go to Add Recipe screen to add custom cuisines
                    // Or we can navigate there
                    Alert.alert(
                      'Añadir Nueva Cocina',
                      'Para añadir una nueva cocina, ve a la pantalla de "Añadir Receta" y usa el botón "+ Añadir" junto al selector de cocina.',
                      [{ text: 'OK' }]
                    );
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const updateRecipeCuisine = async (recipeId: string | number, cuisine: Cuisine | undefined) => {
    try {
      await updateRecipe(recipeId, { cuisine });
      await loadRecipes();
      Alert.alert('Éxito', 'Cocina actualizada');
    } catch (error) {
      Alert.alert('Error', 'Error al actualizar la cocina');
      console.error(error);
    }
  };

  const proteinLabel = MAIN_PROTEINS.find(p => p.value === mainProtein)?.label || mainProtein;
  const proteinIcon = MAIN_PROTEINS.find(p => p.value === mainProtein)?.icon || '🍽️';

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

      // Buscar en cuisine
      if (recipe.cuisine) {
        const cuisineLabel = allCuisines.find(c => c.value === recipe.cuisine)?.label || '';
        if (cuisineLabel.toLowerCase().includes(query)) {
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
        <Text style={styles.count}>{filteredRecipes.length} receta{filteredRecipes.length !== 1 ? 's' : ''}</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre, cocina o ingrediente..."
          placeholderTextColor={COLORS.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {filteredRecipes.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>
            {searchQuery ? 'No se encontraron recetas' : 'No hay recetas'}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchQuery 
              ? 'Intenta con otros términos de búsqueda'
              : 'Toca "Añadir Receta" para crear tu primera receta'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredRecipes}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => {
            const cuisineInfo = item.cuisine ? allCuisines.find(c => c.value === item.cuisine) : null;
            return (
              <TouchableOpacity
                style={styles.recipeCard}
                onPress={() => handleRecipePress(item)}
                onLongPress={() => handleEditCuisine(item)}
                activeOpacity={0.7}
              >
                <View style={styles.recipeHeader}>
                  <Text style={styles.recipeTitle}>{item.title}</Text>
                  <TouchableOpacity
                    onPress={() => handleEditCuisine(item)}
                    activeOpacity={0.7}
                  >
                    {cuisineInfo ? (
                      <View style={styles.cuisineBadge}>
                        <Text style={styles.cuisineFlag}>{cuisineInfo.flag}</Text>
                        <Text style={styles.cuisineLabel}>{cuisineInfo.label}</Text>
                      </View>
                    ) : (
                      <View style={[styles.cuisineBadge, styles.cuisineBadgeEmpty]}>
                        <Text style={styles.cuisineLabel}>+ Cocina</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
                <View style={styles.badges}>
                  {item.total_time_minutes && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>⏱️ {item.total_time_minutes} min</Text>
                    </View>
                  )}
                  {item.oven_time_minutes && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>🔥 Horno: {item.oven_time_minutes} min</Text>
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
    fontWeight: 'bold',
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
    padding: SPACING.sm,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  count: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  listContent: {
    padding: SPACING.md,
  },
  recipeCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    marginRight: SPACING.sm,
  },
  cuisineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  cuisineFlag: {
    fontSize: 16,
    marginRight: SPACING.xs,
  },
  cuisineLabel: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '500',
  },
  cuisineBadgeEmpty: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  badge: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  badgeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});


