import React, { useState } from 'react';
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
import { COLORS, SPACING, BORDER_RADIUS, MAIN_PROTEINS } from '../lib/constants';
import { analyzeRecipe } from '../lib/ollama';
import { createRecipe } from '../api/recipes';
import { MainProtein, RecipeAIAnalysis, Ingredient } from '../types/recipe';

type RootStackParamList = {
  Home: undefined;
  RecipeList: { mainProtein: string };
  RecipeDetail: { recipeId: string | number };
  AddRecipe: undefined;
  EditRecipe: { recipeId: string | number };
};

type AddRecipeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddRecipe'>;

interface Props {
  navigation: AddRecipeScreenNavigationProp;
}

export default function AddRecipeScreen({ navigation }: Props) {
  const [title, setTitle] = useState('');
  const [mainProtein, setMainProtein] = useState<MainProtein>('chicken');
  const [rawText, setRawText] = useState('');
  const [analysis, setAnalysis] = useState<RecipeAIAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAnalyze = async () => {
    if (!rawText.trim()) {
      Alert.alert('Error', 'Please enter some recipe text to analyze.');
      return;
    }

    try {
      setAnalyzing(true);
      const result = await analyzeRecipe(rawText, mainProtein);
      setAnalysis(result);
      Alert.alert('Success', 'Recipe analyzed successfully!');
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

    if (!analysis) {
      Alert.alert('Error', 'Please analyze the recipe first before saving.');
      return;
    }

    try {
      setSaving(true);
      const recipe = await createRecipe({
        title: title.trim(),
        main_protein: mainProtein,
        raw_text: rawText.trim(),
        ingredients: analysis.ingredients,
        steps: analysis.steps,
        gadgets: analysis.gadgets,
        total_time_minutes: analysis.total_time_minutes,
        oven_time_minutes: analysis.oven_time_minutes,
      });

      Alert.alert('Success', 'Recipe saved!', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('RecipeDetail', { recipeId: recipe.id }),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save recipe. Please try again.');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Add New Recipe</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Grilled Chicken Breast"
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
              placeholder="Paste or type your recipe here..."
              placeholderTextColor={COLORS.textSecondary}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, styles.analyzeButton, analyzing && styles.buttonDisabled]}
            onPress={handleAnalyze}
            disabled={analyzing}
          >
            {analyzing ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Analyze with AI</Text>
            )}
          </TouchableOpacity>

          {analysis && (
            <View style={styles.analysisSection}>
              <Text style={styles.analysisTitle}>Analysis Preview</Text>

              {analysis.ingredients.length > 0 && (
                <View style={styles.analysisBlock}>
                  <Text style={styles.analysisLabel}>Ingredients:</Text>
                  {analysis.ingredients.map((ing, idx) => (
                    <Text key={idx} style={styles.analysisText}>
                      • {ing.quantity && `${ing.quantity} `}
                      {ing.unit && `${ing.unit} `}
                      {ing.name}
                      {ing.notes && ` (${ing.notes})`}
                    </Text>
                  ))}
                </View>
              )}

              {analysis.steps.length > 0 && (
                <View style={styles.analysisBlock}>
                  <Text style={styles.analysisLabel}>Steps:</Text>
                  {analysis.steps.map((step, idx) => (
                    <Text key={idx} style={styles.analysisText}>
                      {idx + 1}. {step}
                    </Text>
                  ))}
                </View>
              )}

              {analysis.gadgets.length > 0 && (
                <View style={styles.analysisBlock}>
                  <Text style={styles.analysisLabel}>Gadgets:</Text>
                  <Text style={styles.analysisText}>{analysis.gadgets.join(', ')}</Text>
                </View>
              )}

              <View style={styles.analysisBlock}>
                <Text style={styles.analysisLabel}>Time:</Text>
                <Text style={styles.analysisText}>
                  Total: {analysis.total_time_minutes || 'N/A'} min
                  {analysis.oven_time_minutes && ` | Oven: ${analysis.oven_time_minutes} min`}
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, styles.saveButton, saving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={saving || !analysis}
          >
            {saving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Save Recipe</Text>
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
  analysisSection: {
    marginTop: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
  },
  analysisTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  analysisBlock: {
    marginBottom: SPACING.md,
  },
  analysisLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  analysisText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});

