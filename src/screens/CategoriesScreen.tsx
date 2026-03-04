import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONT, MAIN_PROTEINS, CATEGORY_STRIPES } from '../lib/constants';
import { getAllProteins } from '../lib/customCategories';
import DesktopWarning from '../components/DesktopWarning';
import { useLanguage } from '../lib/LanguageContext';
import { getTranslatedProtein } from '../lib/categoryTranslations';

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

type CategoriesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Categories'>;

interface Props {
  navigation: CategoriesScreenNavigationProp;
}

export default function CategoriesScreen({ navigation }: Props) {
  const { t, language } = useLanguage();
  const [allProteins, setAllProteins] = useState(MAIN_PROTEINS);

  useFocusEffect(
    React.useCallback(() => {
      loadCustomProteins();
    }, [])
  );

  const loadCustomProteins = async () => {
    try {
      const proteins = await getAllProteins();
      setAllProteins(proteins);
    } catch (error) {
      console.error('Error loading custom proteins:', error);
    }
  };

  const handleProteinPress = (protein: string) => {
    navigation.navigate('RecipeList', { mainProtein: protein });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <DesktopWarning />
        <View style={styles.header}>
          <Text style={styles.heroTitle}>{t('recipeBook')}</Text>
          <Text style={styles.heroTagline}>{t('selectCategory')}</Text>
        </View>

        <View style={styles.grid}>
          {allProteins.map((protein, index) => {
            const stripeColor = CATEGORY_STRIPES[index % CATEGORY_STRIPES.length];
            return (
              <TouchableOpacity
                key={protein.value}
                style={[styles.proteinCard, { borderLeftColor: stripeColor, borderLeftWidth: 4 }]}
                onPress={() => handleProteinPress(protein.value)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`${protein.label || getTranslatedProtein(protein.value, language)}`}
              >
                <View style={[styles.cardIcon, { backgroundColor: stripeColor + '35' }]}>
                  <Text style={styles.cardIconText}>{protein.icon || '🍽️'}</Text>
                </View>
                <Text style={styles.cardLabel}>
                  {protein.label || getTranslatedProtein(protein.value, language)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
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
  heroTitle: {
    fontSize: 28,
    fontWeight: FONT.headingBold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  heroTagline: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  proteinCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderLeftWidth: 4,
    borderColor: COLORS.borderLight,
    ...SHADOWS.md,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  cardIconText: {
    fontSize: 28,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: FONT.headingSemibold,
    color: COLORS.text,
    textAlign: 'center',
  },
});
