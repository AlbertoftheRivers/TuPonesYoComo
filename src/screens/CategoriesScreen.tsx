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
import { COLORS, SPACING, BORDER_RADIUS, MAIN_PROTEINS } from '../lib/constants';
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
          <Text style={styles.title}>{t('recipeBook')}</Text>
          <Text style={styles.subtitle}>{t('selectCategory')}</Text>
        </View>

        <View style={styles.grid}>
          {allProteins.map((protein) => (
            <TouchableOpacity
              key={protein.value}
              style={styles.proteinCard}
              onPress={() => handleProteinPress(protein.value)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`${protein.label || getTranslatedProtein(protein.value, language)}`}
            >
              <View style={[styles.cardIcon, { backgroundColor: COLORS.accent + '30' }]}>
                <Text style={styles.cardIconText}>{protein.icon || '🍽️'}</Text>
              </View>
              <Text style={styles.cardLabel}>
                {protein.label || getTranslatedProtein(protein.value, language)}
              </Text>
            </TouchableOpacity>
          ))}
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
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
});
