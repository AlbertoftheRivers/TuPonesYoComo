import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONT, CATEGORY_STRIPES } from '../lib/constants';
import { getRecipesByIngredients } from '../api/recipes';
import { getAllCuisines } from '../lib/customCategories';
import { Recipe } from '../types/recipe';
import { useLanguage } from '../lib/LanguageContext';
import { getTranslatedProtein } from '../lib/categoryTranslations';

type RootStackParamList = {
  Home: undefined;
  FridgeResults: { ingredients: string[] };
  RecipeDetail: { recipeId: string | number };
};

type FridgeResultsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'FridgeResults'>;
type FridgeResultsScreenRouteProp = RouteProp<RootStackParamList, 'FridgeResults'>;

interface Props {
  navigation: FridgeResultsScreenNavigationProp;
  route: FridgeResultsScreenRouteProp;
}

export default function FridgeResultsScreen({ navigation, route }: Props) {
  const { t, language } = useLanguage();
  const { ingredients } = route.params;
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [allCuisines, setAllCuisines] = useState<Array<{ value: string; label?: string; flag?: string }>>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [list, cuisines] = await Promise.all([
          getRecipesByIngredients(ingredients),
          getAllCuisines(),
        ]);
        setRecipes(list);
        setAllCuisines(cuisines);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [ingredients.join(',')]);

  const handleRecipePress = (recipe: Recipe) => {
    navigation.navigate('RecipeDetail', { recipeId: recipe.id });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('matchingRecipes')}</Text>
        <Text style={styles.subtitle}>
          {ingredients.join(', ')}
        </Text>
      </View>
      {recipes.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>{t('noRecipesFound')}</Text>
          <Text style={styles.emptyHint}>{t('tryOtherSearch')}</Text>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => {
            const stripe = CATEGORY_STRIPES[index % CATEGORY_STRIPES.length];
            const cuisineInfos = item.cuisines
              ? item.cuisines.map((c) => allCuisines.find((x) => x.value === c)).filter(Boolean)
              : [];
            return (
              <TouchableOpacity
                style={[styles.card, { borderLeftColor: stripe, borderLeftWidth: 4 }]}
                onPress={() => handleRecipePress(item)}
                activeOpacity={0.8}
              >
                <Text style={styles.cardTitle}>{item.title}</Text>
                <View style={styles.cardMeta}>
                  <Text style={styles.cardMetaText}>{getTranslatedProtein(item.main_protein, language)}</Text>
                  {item.total_time_minutes && (
                    <Text style={styles.cardMetaText}> • ⏱️ {item.total_time_minutes} {t('min')}</Text>
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
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  loadingText: { marginTop: SPACING.md, color: COLORS.textSecondary },
  header: { padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { fontSize: 22, fontWeight: FONT.headingBold, color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textMuted, marginTop: SPACING.xs },
  list: { padding: SPACING.md },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.sharp,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  cardTitle: { fontSize: 18, fontWeight: FONT.headingSemibold, color: COLORS.text },
  cardMeta: { flexDirection: 'row', marginTop: SPACING.xs },
  cardMetaText: { fontSize: 14, color: COLORS.textSecondary },
  flags: { flexDirection: 'row', marginTop: SPACING.xs },
  flag: { fontSize: 16 },
  emptyText: { fontSize: 18, color: COLORS.text, marginBottom: SPACING.xs },
  emptyHint: { fontSize: 14, color: COLORS.textSecondary },
});
