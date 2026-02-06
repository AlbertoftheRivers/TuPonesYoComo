import React, { useState, useEffect } from 'react';
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
import { COLORS, SPACING, BORDER_RADIUS, MAIN_PROTEINS, CUISINES } from '../lib/constants';
import { getRecipeById, deleteRecipe } from '../api/recipes';
import { getAllCuisines } from '../lib/customCategories';
import { calculateAdjustedIngredients } from '../lib/ingredientCalculator';
import { Recipe, Ingredient } from '../types/recipe';

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
  const { recipeId } = route.params;
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [allCuisines, setAllCuisines] = useState(CUISINES);
  const [desiredServings, setDesiredServings] = useState<number>(2);

  useEffect(() => {
    loadRecipe();
    loadCuisines();
  }, [recipeId]);

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

  const handleEdit = () => {
    if (recipe) {
      navigation.navigate('EditRecipe', { recipeId: recipe.id });
    }
  };

  const handleDelete = () => {
    if (!recipe) return;

    Alert.alert(
      'Eliminar Receta',
      `¿Estás seguro de que quieres eliminar "${recipe.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRecipe(recipe.id);
              Alert.alert('Éxito', 'Receta eliminada');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Error al eliminar la receta. Por favor intenta de nuevo.');
              console.error(error);
            }
          },
        },
      ]
    );
  };

  if (loading || !recipe) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const proteinLabel = MAIN_PROTEINS.find(p => p.value === recipe.main_protein)?.label || recipe.main_protein;
  const proteinIcon = MAIN_PROTEINS.find(p => p.value === recipe.main_protein)?.icon || '🍽️';
  const cuisineInfos = recipe.cuisines 
    ? recipe.cuisines.map(cuisineValue => allCuisines.find(c => c.value === cuisineValue)).filter(Boolean)
    : [];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{recipe.title}</Text>
            {cuisineInfos.length > 0 && (
              <View style={styles.cuisineFlagsContainer}>
                {cuisineInfos.map((cuisineInfo, idx) => (
                  <Text key={idx} style={styles.cuisineFlag}>{cuisineInfo?.flag}</Text>
                ))}
              </View>
            )}
          </View>
          <View style={styles.meta}>
            <Text style={styles.metaText}>{proteinIcon} {proteinLabel}</Text>
            {recipe.total_time_minutes && (
              <Text style={styles.metaText}>• ⏱️ {recipe.total_time_minutes} min</Text>
            )}
            {recipe.oven_time_minutes && (
              <Text style={styles.metaText}>• 🔥 Horno: {recipe.oven_time_minutes} min</Text>
            )}
          </View>
        </View>

        {recipe.ingredients.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Ingredientes</Text>
              <View style={styles.servingsSelector}>
                <Text style={styles.servingsLabel}>Para:</Text>
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
                        setDesiredServings(recipe.servings || 2);
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
                <Text style={styles.servingsLabel}>personas</Text>
                {desiredServings !== (recipe.servings || 2) && (
                  <TouchableOpacity
                    style={styles.resetButton}
                    onPress={() => setDesiredServings(recipe.servings || 2)}
                  >
                    <Text style={styles.resetButtonText}>Reset</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            {desiredServings !== (recipe.servings || 2) && (
              <Text style={styles.adjustmentHint}>
                Ajustado de {recipe.servings || 2} porciones (×{((desiredServings / (recipe.servings || 2)) * 100) / 100})
              </Text>
            )}
            {calculateAdjustedIngredients(
              recipe.ingredients,
              recipe.servings || 2,
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

        {recipe.steps.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pasos</Text>
            {recipe.steps.map((step, index) => (
              <View key={index} style={styles.stepItem}>
                <Text style={styles.stepNumber}>{index + 1}.</Text>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        )}

        {recipe.gadgets.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Utensilios</Text>
            <View style={styles.gadgetsContainer}>
              {recipe.gadgets.map((gadget, index) => (
                <View key={index} style={styles.gadgetPill}>
                  <Text style={styles.gadgetText}>{gadget}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.editButton]}
          onPress={handleEdit}
        >
          <Text style={styles.buttonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.deleteButton]}
          onPress={handleDelete}
        >
          <Text style={[styles.buttonText, styles.deleteButtonText]}>Eliminar</Text>
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
    fontSize: 28,
    fontWeight: 'bold',
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
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
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  deleteButtonText: {
    color: COLORS.error,
  },
});


