import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { COLORS, SPACING, BORDER_RADIUS, MAIN_PROTEINS } from '../lib/constants';
import { getRecipeById, updateRecipe } from '../api/recipes';
import { analyzeRecipe } from '../lib/ollama';
import { Recipe, MainProtein, RecipeAIAnalysis } from '../types/recipe';

type RootStackParamList = {
  Home: undefined;
  RecipeList: { mainProtein: string };
  RecipeDetail: { recipeId: string | number };
  AddRecipe: undefined;
  EditRecipe: { recipeId: string | number };
};

type EditRecipeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'EditRecipe'>;
type EditRecipeScreenRouteProp = RouteProp<RootStackParamList, 'EditRecipe'>;

interface Props {
  navigation: EditRecipeScreenNavigationProp;
  route: EditRecipeScreenRouteProp;
}

export default function EditRecipeScreen({ navigation, route }: Props) {
  const { recipeId } = route.params;
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [title, setTitle] = useState('');
  const [mainProtein, setMainProtein] = useState<MainProtein>('chicken');
  const [rawText, setRawText] = useState('');
  const [ingredients, setIngredients] = useState<RecipeAIAnalysis['ingredients']>([]);
  const [steps, setSteps] = useState<string[]>([]);
  const [gadgets, setGadgets] = useState<string[]>([]);
  const [totalTimeMinutes, setTotalTimeMinutes] = useState<number | null>(null);
  const [ovenTimeMinutes, setOvenTimeMinutes] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadRecipe();
  }, [recipeId]);

  const loadRecipe = async () => {
    try {
      setLoading(true);
      const data = await getRecipeById(recipeId);
      if (data) {
        setRecipe(data);
        setTitle(data.title);
        setMainProtein(data.main_protein);
        setRawText(data.raw_text);
        setIngredients(data.ingredients);
        setSteps(data.steps);
        setGadgets(data.gadgets);
        setTotalTimeMinutes(data.total_time_minutes);
        setOvenTimeMinutes(data.oven_time_minutes);
      } else {
        Alert.alert('Error', 'Recipe not found');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load recipe. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleReAnalyze = async () => {
    if (!rawText.trim()) {
      Alert.alert('Error', 'Please enter some recipe text to analyze.');
      return;
    }

    try {
      setAnalyzing(true);
      const result = await analyzeRecipe(rawText, mainProtein);
      setIngredients(result.ingredients);
      setSteps(result.steps);
      setGadgets(result.gadgets);
      setTotalTimeMinutes(result.total_time_minutes);
      setOvenTimeMinutes(result.oven_time_minutes);
      Alert.alert('Success', 'Recipe re-analyzed successfully!');
    } catch (error) {
      Alert.alert(
        'Analysis Error',
        error instanceof Error ? error.message : 'Failed to analyze recipe. Please check your Ollama server connection and try again.'
      );
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a recipe title.');
      return;
    }

    if (!rawText.trim()) {
      Alert.alert('Error', 'Please enter recipe text.');
      return;
    }

    try {
      setSaving(true);
      await updateRecipe(recipeId, {
        title: title.trim(),
        main_protein: mainProtein,
        raw_text: rawText.trim(),
        ingredients,
        steps,
        gadgets,
        total_time_minutes: totalTimeMinutes,
        oven_time_minutes: ovenTimeMinutes,
      });

      Alert.alert('Success', 'Recipe updated!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update recipe. Please try again.');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !recipe) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Edit Recipe</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Recipe title"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Main Protein</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={mainProtein}
                onValueChange={(value) => setMainProtein(value)}
                style={styles.picker}
              >
                {MAIN_PROTEINS.map((protein) => (
                  <Picker.Item
                    key={protein.value}
                    label={protein.label}
                    value={protein.value}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Raw Recipe Text</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={rawText}
              onChangeText={setRawText}
              placeholder="Recipe text"
              placeholderTextColor={COLORS.textSecondary}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, styles.analyzeButton, analyzing && styles.buttonDisabled]}
            onPress={handleReAnalyze}
            disabled={analyzing}
          >
            {analyzing ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Re-run AI on raw text</Text>
            )}
          </TouchableOpacity>

          <View style={styles.structuredSection}>
            <Text style={styles.sectionTitle}>Structured Data</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Total Time (minutes)</Text>
              <TextInput
                style={styles.input}
                value={totalTimeMinutes?.toString() || ''}
                onChangeText={(text) => {
                  const num = parseInt(text, 10);
                  setTotalTimeMinutes(isNaN(num) ? null : num);
                }}
                placeholder="e.g., 45"
                keyboardType="numeric"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Oven Time (minutes)</Text>
              <TextInput
                style={styles.input}
                value={ovenTimeMinutes?.toString() || ''}
                onChangeText={(text) => {
                  const num = parseInt(text, 10);
                  setOvenTimeMinutes(isNaN(num) ? null : num);
                }}
                placeholder="e.g., 30 (leave empty if not applicable)"
                keyboardType="numeric"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Gadgets (comma-separated)</Text>
              <TextInput
                style={styles.input}
                value={gadgets.join(', ')}
                onChangeText={(text) => {
                  setGadgets(text.split(',').map(g => g.trim()).filter(g => g.length > 0));
                }}
                placeholder="e.g., oven, pan, blender"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <View style={styles.readonlySection}>
              <Text style={styles.label}>Ingredients (from AI analysis)</Text>
              <View style={styles.readonlyBox}>
                {ingredients.length > 0 ? (
                  ingredients.map((ing, idx) => (
                    <Text key={idx} style={styles.readonlyText}>
                      • {ing.quantity && `${ing.quantity} `}
                      {ing.unit && `${ing.unit} `}
                      {ing.name}
                      {ing.notes && ` (${ing.notes})`}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.readonlyText}>No ingredients yet. Run AI analysis first.</Text>
                )}
              </View>
            </View>

            <View style={styles.readonlySection}>
              <Text style={styles.label}>Steps (from AI analysis)</Text>
              <View style={styles.readonlyBox}>
                {steps.length > 0 ? (
                  steps.map((step, idx) => (
                    <Text key={idx} style={styles.readonlyText}>
                      {idx + 1}. {step}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.readonlyText}>No steps yet. Run AI analysis first.</Text>
                )}
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, styles.saveButton, saving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: SPACING.md,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  form: {
    gap: SPACING.md,
  },
  field: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.text,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  picker: {
    color: COLORS.text,
  },
  button: {
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  analyzeButton: {
    backgroundColor: COLORS.accent,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  structuredSection: {
    marginTop: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  readonlySection: {
    marginBottom: SPACING.md,
  },
  readonlyBox: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    minHeight: 80,
  },
  readonlyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.xs,
  },
});

