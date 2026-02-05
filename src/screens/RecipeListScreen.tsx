import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { COLORS, SPACING, BORDER_RADIUS, MAIN_PROTEINS } from '../lib/constants';
import { getRecipesByProtein } from '../api/recipes';
import { Recipe, MainProtein } from '../types/recipe';

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

  useEffect(() => {
    loadRecipes();
  }, [mainProtein]);

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

  const proteinLabel = MAIN_PROTEINS.find(p => p.value === mainProtein)?.label || mainProtein;

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
        <Text style={styles.title}>{proteinLabel} Recipes</Text>
        <Text style={styles.count}>{recipes.length} recipe{recipes.length !== 1 ? 's' : ''}</Text>
      </View>

      {recipes.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No recipes found</Text>
          <Text style={styles.emptySubtext}>Tap "Add recipe" to create your first recipe</Text>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.recipeCard}
              onPress={() => handleRecipePress(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.recipeTitle}>{item.title}</Text>
              <View style={styles.badges}>
                {item.total_time_minutes && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.total_time_minutes} min</Text>
                  </View>
                )}
                {item.oven_time_minutes && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Oven: {item.oven_time_minutes} min</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
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
  recipeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
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

