import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONT, MAIN_PROTEINS } from '../lib/constants';
import { getRecipeById } from '../api/recipes';
import { getAllCuisines } from '../lib/customCategories';
import { Recipe } from '../types/recipe';
import { useLanguage } from '../lib/LanguageContext';
import { getTranslatedCuisine } from '../lib/categoryTranslations';

interface RecipeDetailModalProps {
  visible: boolean;
  recipeId: string | number | null;
  onClose: () => void;
}

export default function RecipeDetailModal({ visible, recipeId, onClose }: RecipeDetailModalProps) {
  const { t, language } = useLanguage();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [allCuisines, setAllCuisines] = useState<Array<{ value: string; label?: string; flag?: string }>>([]);

  useEffect(() => {
    getAllCuisines().then(setAllCuisines);
  }, []);

  useEffect(() => {
    if (!visible || recipeId == null) {
      setRecipe(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getRecipeById(recipeId)
      .then((data) => {
        if (!cancelled) setRecipe(data);
      })
      .catch(() => {
        if (!cancelled) setRecipe(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [visible, recipeId]);

  if (!visible) return null;

  const proteinIcon = recipe
    ? MAIN_PROTEINS.find((p) => p.value === recipe.main_protein)?.icon || '🍽️'
    : '🍽️';
  const cuisineLabels = recipe?.cuisines?.length
    ? recipe.cuisines.map((c) => {
        const info = allCuisines.find((x) => x.value === c);
        return info?.flag ? `${info.flag} ${getTranslatedCuisine(c, language)}` : getTranslatedCuisine(c, language);
      })
    : [];
  const firstCuisineLabel = cuisineLabels[0] || '';

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.panelTitle}>{recipe ? recipe.title : ''}</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : !recipe ? (
            <Text style={styles.emptyText}>{t('noRecipesFound')}</Text>
          ) : (
            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.emoji}>{proteinIcon}</Text>
              <Text style={styles.title}>{recipe.title}</Text>
              {firstCuisineLabel ? <Text style={styles.cuisine}>{firstCuisineLabel}</Text> : null}
              <View style={styles.metaRow}>
                {recipe.total_time_minutes != null && (
                  <Text style={styles.metaText}>⏱ {recipe.total_time_minutes} {t('min')}</Text>
                )}
                <Text style={styles.metaText}>👤 {recipe.servings ?? 2} {t('servings')}</Text>
              </View>

              {recipe.ingredients.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t('ingredients')}</Text>
                  <View style={styles.tagRow}>
                    {recipe.ingredients.map((ing, i) => (
                      <View key={i} style={styles.tag}>
                        <Text style={styles.tagText}>{ing.name}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {recipe.steps.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t('steps')}</Text>
                  <Text style={styles.instructions}>
                    {recipe.steps.join(' ')}
                  </Text>
                </View>
              )}

              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>{t('close')}</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  panel: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    width: '100%',
    maxWidth: 440,
    maxHeight: '85%',
    ...SHADOWS.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: FONT.headingBold,
    color: COLORS.text,
    flex: 1,
  },
  closeBtn: {
    padding: SPACING.xs,
  },
  closeBtnText: {
    fontSize: 18,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  loaderWrap: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    padding: SPACING.lg,
    textAlign: 'center',
    color: COLORS.textMuted,
  },
  scroll: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  emoji: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: FONT.headingBold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  cuisine: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  metaText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: FONT.headingBold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  tag: {
    backgroundColor: COLORS.muted,
    paddingVertical: 6,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
  },
  tagText: {
    fontSize: 14,
    color: COLORS.text,
  },
  instructions: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  closeButton: {
    backgroundColor: COLORS.muted,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: FONT.headingSemibold,
    color: COLORS.text,
  },
});
