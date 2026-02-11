import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, BORDER_RADIUS } from '../lib/constants';
import { MAIN_PROTEINS } from '../lib/constants';
import { useLanguage } from '../lib/LanguageContext';
import { getTranslatedProtein } from '../lib/categoryTranslations';

type RootStackParamList = {
  Home: undefined;
  RecipeList: { mainProtein: string };
  RecipeDetail: { recipeId: string | number };
  AddRecipe: undefined;
  EditRecipe: { recipeId: string | number };
  UserGuide: undefined;
};

type UserGuideScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'UserGuide'>;

interface Props {
  navigation: UserGuideScreenNavigationProp;
}

export default function UserGuideScreen({ navigation }: Props) {
  const { t, language } = useLanguage();
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>📖 {t('userGuide')}</Text>
        <Text style={styles.subtitle}>{t('learnToUse')}</Text>
      </View>

      {/* Sección: Añadir Recetas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>➕ {t('addRecipes')}</Text>
        <Text style={styles.sectionText}>
          {t('addRecipesDescription')}
        </Text>

        <View style={styles.methodCard}>
          <Text style={styles.methodTitle}>1️⃣ {t('method1Text')}</Text>
          <Text style={styles.methodText}>
            {t('method1Steps')}
          </Text>
        </View>

        <View style={styles.methodCard}>
          <Text style={styles.methodTitle}>2️⃣ {t('method2Text')}</Text>
          <Text style={styles.methodText}>
            {t('method2Steps')}
          </Text>
        </View>

        <View style={styles.methodCard}>
          <Text style={styles.methodTitle}>3️⃣ {t('method3Text')}</Text>
          <Text style={styles.methodText}>
            {t('method3Steps')}
          </Text>
        </View>
      </View>

      {/* Sección: Editar Recetas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>✏️ {t('editRecipes')}</Text>
        <Text style={styles.sectionText}>
          {t('editRecipesDescription')}
        </Text>
        <View style={styles.methodCard}>
          <Text style={styles.methodText}>
            {t('editRecipesSteps')}
          </Text>
        </View>
      </View>

      {/* Sección: Categorías */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📂 {t('categories')}</Text>
        <Text style={styles.sectionText}>
          {t('categoriesDescription')}
        </Text>
        <View style={styles.categoriesGrid}>
          {MAIN_PROTEINS.map((protein) => (
            <View key={protein.value} style={styles.categoryItem}>
              <Text style={styles.categoryIcon}>{protein.icon}</Text>
              <Text style={styles.categoryLabel}>{getTranslatedProtein(protein.value, language)}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.sectionText}>
          {t('categoriesInstructions')}
        </Text>
      </View>

      {/* Sección: Información Adicional */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ℹ️ {t('additionalInfo')}</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            • <Text style={styles.bold}>{t('aiAnalysis')}</Text> {t('aiAnalysisText')}{'\n\n'}
            • <Text style={styles.bold}>{t('servingsInfo')}</Text> {t('servingsInfoText')}{'\n\n'}
            • <Text style={styles.bold}>{t('cuisinesInfo')}</Text> {t('cuisinesInfoText')}{'\n\n'}
            • <Text style={styles.bold}>{t('notificationsInfo')}</Text> {t('notificationsInfoText')}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <Text style={styles.closeButtonText}>{t('close')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  header: {
    marginBottom: SPACING.lg,
    alignItems: 'center',
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
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  sectionText: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
    marginBottom: SPACING.md,
  },
  methodCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  methodTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  methodText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  categoryItem: {
    width: '48%',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: SPACING.xs,
  },
  categoryLabel: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  infoText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  bold: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  closeButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});




