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
// ImagePicker imported dynamically to avoid crash if native module is not available
import { COLORS, SPACING, BORDER_RADIUS, MAIN_PROTEINS, CUISINES } from '../lib/constants';
import { getRecipeById, updateRecipe } from '../api/recipes';
import { analyzeRecipe } from '../lib/ollama';
import { extractTextFromImage } from '../lib/ocr';
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
  const [servings, setServings] = useState<number>(2);
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

  // OCR states
  const [ocrStatus, setOcrStatus] = useState<'idle' | 'processing'>('idle');
  const [ocrLanguage, setOcrLanguage] = useState('spa'); // Default to Spanish

  useEffect(() => {
    loadRecipe();
    loadCustomOptions();
    // ImagePicker permissions requested lazily when needed
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
        setServings(data.servings || 2);
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

  const handleTakePhoto = async () => {
    try {
      // Dynamically import ImagePicker to avoid crash if native module is not available
      const ImagePicker = await import('expo-image-picker').catch(() => null);
      if (!ImagePicker || typeof ImagePicker.requestCameraPermissionsAsync !== 'function') {
        Alert.alert('Error', 'La funcionalidad de cámara no está disponible en esta versión de la app.');
        return;
      }

      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Se necesitan permisos de cámara para tomar fotos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions?.Images || ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Allow selecting entire photo without forced cropping
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await processImageOCR(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      if (errorMessage.includes('native module') || errorMessage.includes('ExponentImagePicker')) {
        Alert.alert('Error', 'La funcionalidad de cámara no está disponible. Por favor usa texto o dictado para añadir recetas.');
      } else {
        Alert.alert('Error', 'No se pudo tomar la foto. Por favor intenta de nuevo.');
      }
    }
  };

  const handlePickImage = async () => {
    try {
      // Dynamically import ImagePicker to avoid crash if native module is not available
      const ImagePicker = await import('expo-image-picker').catch(() => null);
      if (!ImagePicker || typeof ImagePicker.requestMediaLibraryPermissionsAsync !== 'function') {
        Alert.alert('Error', 'La funcionalidad de galería no está disponible en esta versión de la app.');
        return;
      }

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Se necesitan permisos de galería para seleccionar imágenes.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions?.Images || ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Allow selecting entire photo without forced cropping
        quality: 0.9,
        allowsMultipleSelection: true, // Enable batch processing
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Process multiple images if selected
        if (result.assets.length > 1) {
          const { extractTextFromImages } = await import('../lib/ocr');
          // Use default preprocessing (no adjustments)
          const batchResult = await extractTextFromImages(
            result.assets.map(asset => asset.uri),
            ocrLanguage
          );
          const allTexts = batchResult.results.map(r => r.text).filter(Boolean);
          const combinedText = allTexts.join('\n\n---\n\n');
          const newText = rawText.trim() ? `${rawText.trim()}\n\n${combinedText}` : combinedText;
          setRawText(newText);
          setOcrStatus('idle');
          const avgConfidence = batchResult.results
            .map(r => r.confidence)
            .filter(c => c !== undefined && c !== null)
            .reduce((a, b, _, arr) => a + (b || 0) / arr.length, 0);
          Alert.alert(
            'Éxito',
            `Procesadas ${batchResult.successful}/${batchResult.totalImages} imágenes${avgConfidence > 0 ? ` (Confianza: ${avgConfidence.toFixed(1)}%)` : ''}`
          );
        } else {
          await processImageOCR(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      if (errorMessage.includes('native module') || errorMessage.includes('ExponentImagePicker')) {
        Alert.alert('Error', 'La funcionalidad de galería no está disponible. Por favor usa texto o dictado para añadir recetas.');
      } else {
        Alert.alert('Error', 'No se pudo seleccionar la imagen. Por favor intenta de nuevo.');
      }
    }
  };

  const processImageOCR = async (imageUri: string) => {
    try {
      setOcrStatus('processing');
      Alert.alert('Procesando', 'Extrayendo texto de la imagen...');

      // Use default preprocessing (no adjustments)
      const result = await extractTextFromImage(imageUri, ocrLanguage);

      const newText = rawText.trim()
        ? `${rawText.trim()}\n\n${result.text}`
        : result.text;
      setRawText(newText);

      setOcrStatus('idle');
      
      const confidenceMsg = result.confidence 
        ? ` (Confianza: ${result.confidence.toFixed(1)}%)`
        : '';
      Alert.alert('Éxito', `Texto extraído correctamente de la imagen${confidenceMsg}`);
    } catch (error) {
      console.error('Error processing OCR:', error);
      setOcrStatus('idle');
      const errorMessage = error instanceof Error
        ? error.message
        : 'Error al extraer texto de la imagen. Por favor verifica la conexión con el servidor.';

      Alert.alert('Error de OCR', errorMessage);
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Escanear Receta',
      'Elige una opción para escanear la receta',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Tomar Foto', onPress: handleTakePhoto },
        { text: 'Seleccionar de Galería', onPress: handlePickImage },
        { 
          text: 'Cambiar Idioma OCR', 
          onPress: () => {
            Alert.alert(
              'Idioma del OCR',
              'Selecciona el idioma de la receta para mejor reconocimiento',
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Español', onPress: () => setOcrLanguage('spa') },
                { text: 'English', onPress: () => setOcrLanguage('eng') },
                { text: 'Français', onPress: () => setOcrLanguage('fra') },
                { text: 'Italiano', onPress: () => setOcrLanguage('ita') },
                { text: 'Português', onPress: () => setOcrLanguage('por') },
                { text: 'Deutsch', onPress: () => setOcrLanguage('deu') },
              ]
            );
          }
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
        servings: servings,
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
            <Text style={styles.label}>Número de Porciones</Text>
            <TextInput
              style={styles.input}
              value={servings.toString()}
              onChangeText={(text) => {
                const num = parseInt(text, 10);
                if (!isNaN(num) && num > 0) {
                  setServings(num);
                } else if (text === '') {
                  setServings(2);
                }
              }}
              placeholder="2"
              keyboardType="numeric"
              placeholderTextColor={COLORS.textSecondary}
            />
            <Text style={styles.hintText}>Para cuántas personas es esta receta</Text>
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
            <View style={styles.fieldHeader}>
              <Text style={styles.label}>Texto de la Receta</Text>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.cameraButton,
                  ocrStatus === 'processing' && styles.actionButtonDisabled
                ]}
                onPress={showImagePickerOptions}
                disabled={ocrStatus === 'processing'}
              >
                {ocrStatus === 'processing' ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.actionButtonText}>📷</Text>
                )}
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={rawText}
              onChangeText={setRawText}
              placeholder="Texto de la receta... O usa 📷 para escanear"
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
    marginBottom: SPACING.sm,
  },
  actionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  cameraButton: {
    backgroundColor: COLORS.primary,
  },
  actionButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: 20,
    color: '#ffffff',
  },
  hintText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: SPACING.xs,
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
// ImagePicker imported dynamically to avoid crash if native module is not available
import { COLORS, SPACING, BORDER_RADIUS, MAIN_PROTEINS, CUISINES } from '../lib/constants';
import { getRecipeById, updateRecipe } from '../api/recipes';
import { analyzeRecipe } from '../lib/ollama';
import { extractTextFromImage } from '../lib/ocr';
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
  const [servings, setServings] = useState<number>(2);
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

  // OCR states
  const [ocrStatus, setOcrStatus] = useState<'idle' | 'processing'>('idle');
  const [ocrLanguage, setOcrLanguage] = useState('spa'); // Default to Spanish

  useEffect(() => {
    loadRecipe();
    loadCustomOptions();
    // ImagePicker permissions requested lazily when needed
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
        setServings(data.servings || 2);
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

  const handleTakePhoto = async () => {
    try {
      // Dynamically import ImagePicker to avoid crash if native module is not available
      const ImagePicker = await import('expo-image-picker').catch(() => null);
      if (!ImagePicker || typeof ImagePicker.requestCameraPermissionsAsync !== 'function') {
        Alert.alert('Error', 'La funcionalidad de cámara no está disponible en esta versión de la app.');
        return;
      }

      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Se necesitan permisos de cámara para tomar fotos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions?.Images || ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Allow selecting entire photo without forced cropping
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await processImageOCR(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      if (errorMessage.includes('native module') || errorMessage.includes('ExponentImagePicker')) {
        Alert.alert('Error', 'La funcionalidad de cámara no está disponible. Por favor usa texto o dictado para añadir recetas.');
      } else {
        Alert.alert('Error', 'No se pudo tomar la foto. Por favor intenta de nuevo.');
      }
    }
  };

  const handlePickImage = async () => {
    try {
      // Dynamically import ImagePicker to avoid crash if native module is not available
      const ImagePicker = await import('expo-image-picker').catch(() => null);
      if (!ImagePicker || typeof ImagePicker.requestMediaLibraryPermissionsAsync !== 'function') {
        Alert.alert('Error', 'La funcionalidad de galería no está disponible en esta versión de la app.');
        return;
      }

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Se necesitan permisos de galería para seleccionar imágenes.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions?.Images || ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Allow selecting entire photo without forced cropping
        quality: 0.9,
        allowsMultipleSelection: true, // Enable batch processing
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Process multiple images if selected
        if (result.assets.length > 1) {
          const { extractTextFromImages } = await import('../lib/ocr');
          // Use default preprocessing (no adjustments)
          const batchResult = await extractTextFromImages(
            result.assets.map(asset => asset.uri),
            ocrLanguage
          );
          const allTexts = batchResult.results.map(r => r.text).filter(Boolean);
          const combinedText = allTexts.join('\n\n---\n\n');
          const newText = rawText.trim() ? `${rawText.trim()}\n\n${combinedText}` : combinedText;
          setRawText(newText);
          setOcrStatus('idle');
          const avgConfidence = batchResult.results
            .map(r => r.confidence)
            .filter(c => c !== undefined && c !== null)
            .reduce((a, b, _, arr) => a + (b || 0) / arr.length, 0);
          Alert.alert(
            'Éxito',
            `Procesadas ${batchResult.successful}/${batchResult.totalImages} imágenes${avgConfidence > 0 ? ` (Confianza: ${avgConfidence.toFixed(1)}%)` : ''}`
          );
        } else {
          await processImageOCR(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      if (errorMessage.includes('native module') || errorMessage.includes('ExponentImagePicker')) {
        Alert.alert('Error', 'La funcionalidad de galería no está disponible. Por favor usa texto o dictado para añadir recetas.');
      } else {
        Alert.alert('Error', 'No se pudo seleccionar la imagen. Por favor intenta de nuevo.');
      }
    }
  };

  const processImageOCR = async (imageUri: string) => {
    try {
      setOcrStatus('processing');
      Alert.alert('Procesando', 'Extrayendo texto de la imagen...');

      // Use default preprocessing (no adjustments)
      const result = await extractTextFromImage(imageUri, ocrLanguage);

      const newText = rawText.trim()
        ? `${rawText.trim()}\n\n${result.text}`
        : result.text;
      setRawText(newText);

      setOcrStatus('idle');
      
      const confidenceMsg = result.confidence 
        ? ` (Confianza: ${result.confidence.toFixed(1)}%)`
        : '';
      Alert.alert('Éxito', `Texto extraído correctamente de la imagen${confidenceMsg}`);
    } catch (error) {
      console.error('Error processing OCR:', error);
      setOcrStatus('idle');
      const errorMessage = error instanceof Error
        ? error.message
        : 'Error al extraer texto de la imagen. Por favor verifica la conexión con el servidor.';

      Alert.alert('Error de OCR', errorMessage);
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Escanear Receta',
      'Elige una opción para escanear la receta',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Tomar Foto', onPress: handleTakePhoto },
        { text: 'Seleccionar de Galería', onPress: handlePickImage },
        { 
          text: 'Cambiar Idioma OCR', 
          onPress: () => {
            Alert.alert(
              'Idioma del OCR',
              'Selecciona el idioma de la receta para mejor reconocimiento',
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Español', onPress: () => setOcrLanguage('spa') },
                { text: 'English', onPress: () => setOcrLanguage('eng') },
                { text: 'Français', onPress: () => setOcrLanguage('fra') },
                { text: 'Italiano', onPress: () => setOcrLanguage('ita') },
                { text: 'Português', onPress: () => setOcrLanguage('por') },
                { text: 'Deutsch', onPress: () => setOcrLanguage('deu') },
              ]
            );
          }
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
        servings: servings,
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
            <Text style={styles.label}>Número de Porciones</Text>
            <TextInput
              style={styles.input}
              value={servings.toString()}
              onChangeText={(text) => {
                const num = parseInt(text, 10);
                if (!isNaN(num) && num > 0) {
                  setServings(num);
                } else if (text === '') {
                  setServings(2);
                }
              }}
              placeholder="2"
              keyboardType="numeric"
              placeholderTextColor={COLORS.textSecondary}
            />
            <Text style={styles.hintText}>Para cuántas personas es esta receta</Text>
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
            <View style={styles.fieldHeader}>
              <Text style={styles.label}>Texto de la Receta</Text>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.cameraButton,
                  ocrStatus === 'processing' && styles.actionButtonDisabled
                ]}
                onPress={showImagePickerOptions}
                disabled={ocrStatus === 'processing'}
              >
                {ocrStatus === 'processing' ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.actionButtonText}>📷</Text>
                )}
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={rawText}
              onChangeText={setRawText}
              placeholder="Texto de la receta... O usa 📷 para escanear"
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
    marginBottom: SPACING.sm,
  },
  actionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  cameraButton: {
    backgroundColor: COLORS.primary,
  },
  actionButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: 20,
    color: '#ffffff',
  },
  hintText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: SPACING.xs,
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

