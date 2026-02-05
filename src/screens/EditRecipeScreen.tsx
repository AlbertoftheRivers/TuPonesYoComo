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
import { COLORS, SPACING, BORDER_RADIUS, MAIN_PROTEINS, CUISINES } from '../lib/constants';
import { getRecipeById, updateRecipe } from '../api/recipes';
import { analyzeRecipe } from '../lib/ollama';
import { getAllProteins, getAllCuisines } from '../lib/customCategories';
import { Recipe, MainProtein, RecipeAIAnalysis, Cuisine } from '../types/recipe';

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
  const [cuisine, setCuisine] = useState<Cuisine[]>([]);
  const [rawText, setRawText] = useState('');
  const [ingredients, setIngredients] = useState<RecipeAIAnalysis['ingredients']>([]);
  const [steps, setSteps] = useState<string[]>([]);
  const [gadgets, setGadgets] = useState<string[]>([]);
  const [totalTimeMinutes, setTotalTimeMinutes] = useState<number | null>(null);
  const [ovenTimeMinutes, setOvenTimeMinutes] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [analyzeStatus, setAnalyzeStatus] = useState<string>('');
  const [allProteins, setAllProteins] = useState(MAIN_PROTEINS);
  const [allCuisines, setAllCuisines] = useState(CUISINES);

  useEffect(() => {
    loadRecipe();
    loadCustomOptions();
  }, [recipeId]);

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

  const loadRecipe = async () => {
    try {
      setLoading(true);
      const data = await getRecipeById(recipeId);
      if (data) {
        setRecipe(data);
        setTitle(data.title);
        setMainProtein(data.main_protein);
        setCuisine(data.cuisines || []);
        setRawText(data.raw_text);
        setIngredients(data.ingredients);
        setSteps(data.steps);
        setGadgets(data.gadgets);
        setTotalTimeMinutes(data.total_time_minutes);
        setOvenTimeMinutes(data.oven_time_minutes);
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

  const handleReAnalyze = async () => {
    if (!rawText.trim()) {
      Alert.alert('Error', 'Por favor ingresa el texto de la receta para analizar.');
      return;
    }

    try {
      setAnalyzing(true);
      setAnalyzeStatus('Conectando al servidor de IA...');
      const result = await analyzeRecipe(rawText, mainProtein);
      setAnalyzeStatus('Procesando respuesta...');
      setIngredients(result.ingredients);
      setSteps(result.steps);
      setGadgets(result.gadgets);
      setTotalTimeMinutes(result.total_time_minutes);
      setOvenTimeMinutes(result.oven_time_minutes);
      setAnalyzeStatus('');
      Alert.alert('Éxito', '¡Receta re-analizada correctamente!');
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

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Por favor ingresa un título para la receta.');
      return;
    }

    if (!rawText.trim()) {
      Alert.alert('Error', 'Por favor ingresa el texto de la receta.');
      return;
    }

    try {
      setSaving(true);
      await updateRecipe(recipeId, {
        title: title.trim(),
        main_protein: mainProtein,
        cuisines: cuisine.length > 0 ? cuisine : undefined,
        raw_text: rawText.trim(),
        ingredients,
        steps,
        gadgets,
        total_time_minutes: totalTimeMinutes,
        oven_time_minutes: ovenTimeMinutes,
      });

      Alert.alert('Éxito', '¡Receta actualizada!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Error al actualizar la receta. Por favor intenta de nuevo.');
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
          <Text style={styles.title}>Editar Receta</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Título</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Título de la receta"
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
                const isSelected = cuisine.includes(c.value as Cuisine);
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
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Texto de la Receta</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={rawText}
              onChangeText={setRawText}
              placeholder="Texto de la receta"
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
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#ffffff" />
                {analyzeStatus ? (
                  <Text style={[styles.buttonText, { marginLeft: 10 }]}>{analyzeStatus}</Text>
                ) : null}
              </View>
            ) : (
              <Text style={styles.buttonText}>Re-analizar con IA</Text>
            )}
          </TouchableOpacity>

          {analyzeStatus && !analyzing && (
            <Text style={styles.statusText}>{analyzeStatus}</Text>
          )}

          <View style={styles.structuredSection}>
            <Text style={styles.sectionTitle}>Datos Estructurados</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Tiempo Total (minutos)</Text>
              <TextInput
                style={styles.input}
                value={totalTimeMinutes?.toString() || ''}
                onChangeText={(text) => {
                  const num = parseInt(text, 10);
                  setTotalTimeMinutes(isNaN(num) ? null : num);
                }}
                placeholder="Ej: 45"
                keyboardType="numeric"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Tiempo en Horno (minutos)</Text>
              <TextInput
                style={styles.input}
                value={ovenTimeMinutes?.toString() || ''}
                onChangeText={(text) => {
                  const num = parseInt(text, 10);
                  setOvenTimeMinutes(isNaN(num) ? null : num);
                }}
                placeholder="Ej: 30 (dejar vacío si no aplica)"
                keyboardType="numeric"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Utensilios (separados por comas)</Text>
              <TextInput
                style={styles.input}
                value={gadgets.join(', ')}
                onChangeText={(text) => {
                  setGadgets(text.split(',').map(g => g.trim()).filter(g => g.length > 0));
                }}
                placeholder="Ej: horno, sartén, licuadora"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <View style={styles.readonlySection}>
              <Text style={styles.label}>Ingredientes (del análisis de IA)</Text>
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
                  <Text style={styles.readonlyText}>Sin ingredientes aún. Ejecuta el análisis de IA primero.</Text>
                )}
              </View>
            </View>

            <View style={styles.readonlySection}>
              <Text style={styles.label}>Pasos (del análisis de IA)</Text>
              <View style={styles.readonlyBox}>
                {steps.length > 0 ? (
                  steps.map((step, idx) => (
                    <Text key={idx} style={styles.readonlyText}>
                      {idx + 1}. {step}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.readonlyText}>Sin pasos aún. Ejecuta el análisis de IA primero.</Text>
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
              <Text style={styles.buttonText}>Guardar Cambios</Text>
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
});

