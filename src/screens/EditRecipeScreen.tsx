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
  Modal,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { COLORS, SPACING, BORDER_RADIUS, MAIN_PROTEINS, CUISINES } from '../lib/constants';
import { getRecipeById, updateRecipe } from '../api/recipes';
import { analyzeRecipe } from '../lib/ollama';
import { getAllProteins, getAllCuisines, addCustomProtein, addCustomCuisine } from '../lib/customCategories';
import { detectEmojiForCategory } from '../lib/emojiMapper';
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
  const [selectedCuisines, setSelectedCuisines] = useState<Cuisine[]>([]);
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
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('');
  const [showAddCuisineModal, setShowAddCuisineModal] = useState(false);
  const [newCuisineName, setNewCuisineName] = useState('');
  const [newCuisineFlag, setNewCuisineFlag] = useState('🌍');

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
        setSelectedCuisines(data.cuisines || []);
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

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para la categoría');
      return;
    }

    try {
      const detectedIcon = detectEmojiForCategory(newCategoryName);
      const iconToUse = newCategoryIcon.trim() || detectedIcon;

      const newProtein = {
        value: newCategoryName.toLowerCase().replace(/\s+/g, '_'),
        label: newCategoryName.trim(),
        icon: iconToUse,
      };

      await addCustomProtein(newProtein);
      await loadCustomOptions();
      setMainProtein(newProtein.value as MainProtein);
      
      Alert.alert('Éxito', `Categoría "${newCategoryName}" añadida`);
      setShowAddCategoryModal(false);
      setNewCategoryName('');
      setNewCategoryIcon('');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Error al añadir categoría');
    }
  };

  const handleAddCuisine = async () => {
    if (!newCuisineName.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para la cocina');
      return;
    }

    if (!newCuisineFlag.trim()) {
      Alert.alert('Error', 'Por favor ingresa un emoji de bandera');
      return;
    }

    try {
      const newCuisine = {
        value: newCuisineName.toLowerCase().replace(/\s+/g, '_'),
        label: newCuisineName.trim(),
        flag: newCuisineFlag.trim(),
      };

      await addCustomCuisine(newCuisine);
      await loadCustomOptions();
      setSelectedCuisines([...selectedCuisines, newCuisine.value as Cuisine]);
      
      Alert.alert('Éxito', `Cocina "${newCuisineName}" añadida`);
      setShowAddCuisineModal(false);
      setNewCuisineName('');
      setNewCuisineFlag('🌍');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Error al añadir cocina');
    }
  };

  const handleRemoveCuisine = (cuisineToRemove: Cuisine) => {
    setSelectedCuisines(selectedCuisines.filter(c => c !== cuisineToRemove));
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
        cuisines: selectedCuisines.length > 0 ? selectedCuisines : undefined,
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
                onValueChange={(value) => {
                  if (value === '__add_new__') {
                    setShowAddCategoryModal(true);
                  } else {
                    setMainProtein(value);
                  }
                }}
                style={styles.picker}
              >
                {allProteins.map((protein) => (
                  <Picker.Item
                    key={protein.value}
                    label={`${protein.icon} ${protein.label}`}
                    value={protein.value}
                  />
                ))}
                <Picker.Item
                  label="➕ Otra..."
                  value="__add_new__"
                />
              </Picker>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Cocinas</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedCuisines.length > 0 ? selectedCuisines[0] : ''}
                onValueChange={(value) => {
                  if (value === '__add_new__') {
                    setShowAddCuisineModal(true);
                  } else if (value && value !== '') {
                    const cuisineValue = value as Cuisine;
                    if (!selectedCuisines.includes(cuisineValue)) {
                      setSelectedCuisines([...selectedCuisines, cuisineValue]);
                    }
                  }
                }}
                style={styles.picker}
              >
                <Picker.Item label="Seleccionar cocina..." value="" />
                {allCuisines.map((c) => (
                  <Picker.Item
                    key={c.value}
                    label={`${c.flag} ${c.label}`}
                    value={c.value}
                  />
                ))}
                <Picker.Item
                  label="➕ Añadir Nueva Cocina"
                  value="__add_new__"
                />
              </Picker>
            </View>
            {selectedCuisines.length > 0 && (
              <View style={styles.selectedCuisinesContainer}>
                {selectedCuisines.map((cuisineValue, idx) => {
                  const cuisineInfo = allCuisines.find(c => c.value === cuisineValue);
                  return (
                    <View key={idx} style={styles.selectedCuisineBadge}>
                      <Text style={styles.selectedCuisineFlag}>{cuisineInfo?.flag}</Text>
                      <Text style={styles.selectedCuisineLabel}>{cuisineInfo?.label}</Text>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedCuisines(selectedCuisines.filter(c => c !== cuisineValue));
                        }}
                        style={styles.removeCuisineButton}
                      >
                        <Text style={styles.removeCuisineText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}
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

      {/* Modal para añadir categoría */}
      <Modal
        visible={showAddCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Añadir Nueva Categoría</Text>
            
            <Text style={styles.modalLabel}>Nombre de la categoría:</Text>
            <TextInput
              style={styles.modalInput}
              value={newCategoryName}
              onChangeText={(text) => {
                setNewCategoryName(text);
                if (text.trim()) {
                  const detected = detectEmojiForCategory(text);
                  setNewCategoryIcon(detected);
                }
              }}
              placeholder="Ej: Cordero, Setas, etc."
              placeholderTextColor={COLORS.textSecondary}
            />
            
            <Text style={styles.modalLabel}>Icono (emoji):</Text>
            <View style={styles.iconPreview}>
              <Text style={styles.iconPreviewText}>
                {newCategoryIcon || detectEmojiForCategory(newCategoryName) || '🍽️'}
              </Text>
              <Text style={styles.iconPreviewLabel}>
                {newCategoryIcon || detectEmojiForCategory(newCategoryName) || '🍽️'} 
                {newCategoryName.trim() ? ` - ${newCategoryName}` : ' (se detectará automáticamente)'}
              </Text>
            </View>
            
            <TextInput
              style={styles.modalInput}
              value={newCategoryIcon}
              onChangeText={setNewCategoryIcon}
              placeholder="Opcional: personaliza el emoji"
              placeholderTextColor={COLORS.textSecondary}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowAddCategoryModal(false);
                  setNewCategoryName('');
                  setNewCategoryIcon('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonAdd]}
                onPress={handleAddCategory}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextAdd]}>Añadir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para añadir cocina */}
      <Modal
        visible={showAddCuisineModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddCuisineModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Añadir Nueva Cocina</Text>
            
            <Text style={styles.modalLabel}>Nombre de la cocina:</Text>
            <TextInput
              style={styles.modalInput}
              value={newCuisineName}
              onChangeText={setNewCuisineName}
              placeholder="Ej: Peruana, Brasileña, etc."
              placeholderTextColor={COLORS.textSecondary}
            />
            
            <Text style={styles.modalLabel}>Bandera (emoji):</Text>
            <View style={styles.iconPreview}>
              <Text style={styles.iconPreviewText}>
                {newCuisineFlag || '🌍'}
              </Text>
              <Text style={styles.iconPreviewLabel}>
                {newCuisineFlag || '🌍'} 
                {newCuisineName.trim() ? ` - ${newCuisineName}` : ' (ejemplo)'}
              </Text>
            </View>
            
            <TextInput
              style={styles.modalInput}
              value={newCuisineFlag}
              onChangeText={setNewCuisineFlag}
              placeholder="Emoji de bandera (ej: 🇵🇪, 🇧🇷)"
              placeholderTextColor={COLORS.textSecondary}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowAddCuisineModal(false);
                  setNewCuisineName('');
                  setNewCuisineFlag('🌍');
                }}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonAdd]}
                onPress={handleAddCuisine}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextAdd]}>Añadir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  selectedCuisinesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  selectedCuisineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent + '30',
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    gap: SPACING.xs,
  },
  selectedCuisineFlag: {
    fontSize: 14,
  },
  selectedCuisineLabel: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '500',
  },
  removeCuisineButton: {
    marginLeft: SPACING.xs,
    paddingHorizontal: SPACING.xs,
  },
  removeCuisineText: {
    fontSize: 18,
    color: COLORS.error,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  modalInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.text,
  },
  iconPreview: {
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  iconPreviewText: {
    fontSize: 48,
    marginBottom: SPACING.xs,
  },
  iconPreviewLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
    gap: SPACING.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalButtonAdd: {
    backgroundColor: COLORS.primary,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalButtonTextAdd: {
    color: '#ffffff',
  },
});

