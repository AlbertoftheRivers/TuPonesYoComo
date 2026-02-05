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
import { COLORS, SPACING, BORDER_RADIUS, MAIN_PROTEINS, CUISINES } from '../lib/constants';
import { analyzeRecipe } from '../lib/ollama';
import { createRecipe } from '../api/recipes';
import { getAllProteins, getAllCuisines, addCustomProtein, addCustomCuisine } from '../lib/customCategories';
import { MainProtein, RecipeAIAnalysis, Ingredient, Cuisine } from '../types/recipe';

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
  const [cuisine, setCuisine] = useState<Cuisine[]>([]);
  const [rawText, setRawText] = useState('');
  const [analysis, setAnalysis] = useState<RecipeAIAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [analyzeStatus, setAnalyzeStatus] = useState<string>('');
  const [allProteins, setAllProteins] = useState(MAIN_PROTEINS);
  const [allCuisines, setAllCuisines] = useState(CUISINES);

  useEffect(() => {
    loadCustomOptions();
  }, []);

  const loadCustomOptions = async () => {
    try {
      const proteins = await getAllProteins();
      const cuisines = await getAllCuisines();
      setAllProteins(proteins);
      setAllCuisines(cuisines);
    } catch (error) {
      console.error('Error loading custom options:', error);
    }
  };

  const handleAnalyze = async () => {
    if (!rawText.trim()) {
      Alert.alert('Error', 'Por favor ingresa el texto de la receta para analizar.');
      return;
    }

    try {
      setAnalyzing(true);
      setAnalyzeStatus('Conectando al servidor de IA...');
      const result = await analyzeRecipe(rawText, mainProtein);
      setAnalyzeStatus('Procesando respuesta...');
      setAnalysis(result);
      setAnalyzeStatus('');
      Alert.alert('Éxito', '¡Receta analizada correctamente!');
    } catch (error) {
      setAnalyzeStatus('');
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Error al analizar la receta. Por favor verifica la conexión con el servidor.';
      
      Alert.alert(
        'Error de Análisis',
        errorMessage,
        [
          { text: 'OK', style: 'default' },
          {
            text: 'Verificar Configuración',
            style: 'default',
            onPress: () => {
              Alert.alert(
                'Configuración de API',
                `URL de API: ${process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000'}\n\nAsegúrate de:\n- El servidor API está corriendo\n- La URL de API es correcta\n- Tu dispositivo puede alcanzar el servidor`
              );
            }
          }
        ]
      );
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAddCustomCuisine = () => {
    Alert.alert(
      'Añadir Nueva Cocina',
      'Escribe el nombre de la cocina:',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar',
          onPress: () => {
            // Note: React Native doesn't have Alert.prompt
            // User should use the HomeScreen to add categories
            Alert.alert(
              'Añadir Cocina',
              'Para añadir una nueva cocina, ve a la pantalla principal y usa la sección "Añadir Categoría"',
              [{ text: 'OK' }]
            );
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Por favor ingresa un título para la receta.');
      return;
    }

    if (!rawText.trim()) {
      Alert.alert('Error', 'Por favor ingresa el texto de la receta.');
      return;
    }

    if (!analysis) {
      Alert.alert('Error', 'Por favor analiza la receta primero antes de guardar.');
      return;
    }

    try {
      setSaving(true);
      const recipe =       await createRecipe({
        title: title.trim(),
        main_protein: mainProtein,
        cuisines: cuisine.length > 0 ? cuisine : undefined,
        raw_text: rawText.trim(),
        ingredients: analysis.ingredients,
        steps: analysis.steps,
        gadgets: analysis.gadgets,
        total_time_minutes: analysis.total_time_minutes,
        oven_time_minutes: analysis.oven_time_minutes,
      });

      Alert.alert('Éxito', '¡Receta guardada!', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('RecipeDetail', { recipeId: recipe.id }),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Error al guardar la receta. Por favor intenta de nuevo.');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Añadir Nueva Receta</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Título</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Ej: Pollo a la Plancha"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Categoría Principal</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={mainProtein}
                onValueChange={(value) => setMainProtein(value)}
                style={styles.picker}
              >
                {allProteins.map((protein) => (
                  <Picker.Item
                    key={protein.value}
                    label={`${protein.icon} ${protein.label}`}
                    value={protein.value}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Cocinas (Puedes seleccionar múltiples)</Text>
            <View style={styles.cuisineSelector}>
              {allCuisines.map((c) => {
                const isSelected = cuisine.includes(c.value);
                return (
                  <TouchableOpacity
                    key={c.value}
                    style={[
                      styles.cuisineChip,
                      isSelected && styles.cuisineChipSelected,
                    ]}
                    onPress={() => {
                      if (isSelected) {
                        setCuisine(cuisine.filter(cuis => cuis !== c.value));
                      } else {
                        setCuisine([...cuisine, c.value as Cuisine]);
                      }
                    }}
                  >
                    <Text style={styles.cuisineChipFlag}>{c.flag}</Text>
                    <Text style={[
                      styles.cuisineChipLabel,
                      isSelected && styles.cuisineChipLabelSelected,
                    ]}>
                      {c.label}
                    </Text>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              style={styles.addCuisineButton}
              onPress={handleAddCustomCuisine}
            >
              <Text style={styles.addCuisineButtonText}>+ Añadir Nueva Cocina</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Texto de la Receta</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={rawText}
              onChangeText={setRawText}
              placeholder="Pega o escribe tu receta aquí..."
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
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#ffffff" />
                {analyzeStatus ? (
                  <Text style={[styles.buttonText, { marginLeft: 10 }]}>{analyzeStatus}</Text>
                ) : null}
              </View>
            ) : (
              <Text style={styles.buttonText}>Analizar con IA</Text>
            )}
          </TouchableOpacity>

          {analyzeStatus && !analyzing && (
            <Text style={styles.statusText}>{analyzeStatus}</Text>
          )}

          {analysis && (
            <View style={styles.analysisSection}>
              <Text style={styles.analysisTitle}>Vista Previa del Análisis</Text>

              {analysis.ingredients.length > 0 && (
                <View style={styles.analysisBlock}>
                  <Text style={styles.analysisLabel}>Ingredientes:</Text>
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
                  <Text style={styles.analysisLabel}>Pasos:</Text>
                  {analysis.steps.map((step, idx) => (
                    <Text key={idx} style={styles.analysisText}>
                      {idx + 1}. {step}
                    </Text>
                  ))}
                </View>
              )}

              {analysis.gadgets.length > 0 && (
                <View style={styles.analysisBlock}>
                  <Text style={styles.analysisLabel}>Utensilios:</Text>
                  <Text style={styles.analysisText}>{analysis.gadgets.join(', ')}</Text>
                </View>
              )}

              <View style={styles.analysisBlock}>
                <Text style={styles.analysisLabel}>Tiempo:</Text>
                <Text style={styles.analysisText}>
                  Total: {analysis.total_time_minutes || 'N/A'} min
                  {analysis.oven_time_minutes && ` | Horno: ${analysis.oven_time_minutes} min`}
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
              <Text style={styles.buttonText}>Guardar Receta</Text>
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
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  addButtonSmall: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  addButtonSmallText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    marginTop: SPACING.sm,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
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
  cuisineSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  cuisineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  cuisineChipSelected: {
    backgroundColor: COLORS.accent + '30',
    borderColor: COLORS.accent,
    borderWidth: 2,
  },
  cuisineChipFlag: {
    fontSize: 18,
  },
  cuisineChipLabel: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  cuisineChipLabelSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginLeft: SPACING.xs,
  },
  addCuisineButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  addCuisineButtonText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});

