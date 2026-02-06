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
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, BORDER_RADIUS, MAIN_PROTEINS, CUISINES } from '../lib/constants';
import { analyzeRecipe } from '../lib/ollama';
import { createRecipe } from '../api/recipes';
import { transcribeAudio } from '../lib/transcribe';
import { extractTextFromImage } from '../lib/ocr';
import { getAllProteins, getAllCuisines, addCustomProtein, addCustomCuisine } from '../lib/customCategories';
import { detectEmojiForCategory } from '../lib/emojiMapper';
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
  const [mainProtein, setMainProtein] = useState<MainProtein | ''>('');
  const [selectedCuisines, setSelectedCuisines] = useState<Cuisine[]>([]);
  const [showCuisinePicker, setShowCuisinePicker] = useState(false);
  const [servings, setServings] = useState<number>(2);
  const [rawText, setRawText] = useState('');
  const [analysis, setAnalysis] = useState<RecipeAIAnalysis | null>(null);
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
  
  // Audio recording states
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'transcribing'>('idle');
  const [recordingDuration, setRecordingDuration] = useState(0);

  // OCR states
  const [ocrStatus, setOcrStatus] = useState<'idle' | 'processing'>('idle');
  const [ocrLanguage, setOcrLanguage] = useState('spa'); // Default to Spanish

  useEffect(() => {
    loadCustomOptions();
    // Request audio permissions on mount
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permisos de Audio',
          'Se necesitan permisos de micrófono para usar la función de dictado por voz.',
          [{ text: 'OK' }]
        );
      }
    })();
    // Request camera/gallery permissions
    (async () => {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
        // Don't show alert on mount, only when user tries to use it
      }
    })();
  }, []);

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, [recording]);

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

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Se necesitan permisos de micrófono para grabar audio.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setRecordingStatus('recording');
      setRecordingDuration(0);

      const interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      (newRecording as any)._durationInterval = interval;
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'No se pudo iniciar la grabación. Por favor intenta de nuevo.');
      setRecordingStatus('idle');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setRecordingStatus('transcribing');
      
      if ((recording as any)._durationInterval) {
        clearInterval((recording as any)._durationInterval);
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (!uri) {
        throw new Error('No se pudo obtener el archivo de audio');
      }

      setRecording(null);
      setRecordingDuration(0);

      Alert.alert('Transcribiendo', 'Procesando tu audio...');
      const result = await transcribeAudio(uri, 'es');

      const newText = rawText.trim() 
        ? `${rawText.trim()}\n\n${result.text}` 
        : result.text;
      setRawText(newText);

      setRecordingStatus('idle');
      Alert.alert('Éxito', 'Audio transcrito correctamente');
    } catch (error) {
      console.error('Error transcribing audio:', error);
      setRecordingStatus('idle');
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Error al transcribir el audio. Por favor verifica la conexión con el servidor.';
      
      Alert.alert('Error de Transcripción', errorMessage);
    }
  };

  const cancelRecording = async () => {
    if (!recording) return;

    try {
      if ((recording as any)._durationInterval) {
        clearInterval((recording as any)._durationInterval);
      }

      await recording.stopAndUnloadAsync();
      setRecording(null);
      setRecordingStatus('idle');
      setRecordingDuration(0);
    } catch (error) {
      console.error('Error canceling recording:', error);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Se necesitan permisos de cámara para tomar fotos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Allow selecting entire photo without forced cropping
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        await processImageOCR(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'No se pudo tomar la foto. Por favor intenta de nuevo.');
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Se necesitan permisos de galería para seleccionar imágenes.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Allow selecting entire photo without forced cropping
        quality: 0.9,
        allowsMultipleSelection: true, // Enable batch processing
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Process multiple images if selected
        if (result.assets.length > 1) {
          await processBatchOCR(result.assets.map(asset => asset.uri));
        } else {
          await processImageOCR(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen. Por favor intenta de nuevo.');
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

  const processBatchOCR = async (imageUris: string[]) => {
    try {
      setOcrStatus('processing');
      Alert.alert('Procesando', `Extrayendo texto de ${imageUris.length} imagen(es)...`);

      // Use default preprocessing (no adjustments)
      const { extractTextFromImages } = await import('../lib/ocr');
      const batchResult = await extractTextFromImages(imageUris, ocrLanguage);

      // Combine all extracted texts
      const allTexts = batchResult.results.map(r => r.text).filter(Boolean);
      const combinedText = allTexts.join('\n\n---\n\n');

      const newText = rawText.trim()
        ? `${rawText.trim()}\n\n${combinedText}`
        : combinedText;
      setRawText(newText);

      setOcrStatus('idle');
      
      const avgConfidence = batchResult.results
        .map(r => r.confidence)
        .filter(c => c !== undefined && c !== null)
        .reduce((a, b, _, arr) => a + (b || 0) / arr.length, 0);
      
      const confidenceMsg = avgConfidence > 0
        ? ` (Confianza promedio: ${avgConfidence.toFixed(1)}%)`
        : '';
      
      Alert.alert(
        'Éxito', 
        `Procesadas ${batchResult.successful}/${batchResult.totalImages} imágenes${confidenceMsg}`
      );
    } catch (error) {
      console.error('Error processing batch OCR:', error);
      setOcrStatus('idle');
      const errorMessage = error instanceof Error
        ? error.message
        : 'Error al procesar las imágenes. Por favor verifica la conexión con el servidor.';

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

    if (!analysis) {
      Alert.alert('Error', 'Por favor analiza la receta primero antes de guardar.');
      return;
    }

    try {
      setSaving(true);
      const recipe = await createRecipe({
        title: title.trim(),
        main_protein: mainProtein,
        cuisines: selectedCuisines.length > 0 ? selectedCuisines : undefined,
        raw_text: rawText.trim(),
        ingredients: analysis.ingredients,
        steps: analysis.steps,
        gadgets: analysis.gadgets,
        total_time_minutes: analysis.total_time_minutes,
        oven_time_minutes: analysis.oven_time_minutes,
        servings: servings,
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

          {/* Row with Personas, Categorías, and Cocina */}
          <View style={styles.rowContainer}>
            <View style={styles.rowFieldNarrow}>
              <Text style={styles.boxTitle}>Personas</Text>
              <TextInput
                style={styles.rowInput}
                value={servings > 0 ? servings.toString() : ''}
                onChangeText={(text) => {
                  const num = parseInt(text, 10);
                  if (!isNaN(num) && num > 0) {
                    setServings(num);
                  } else if (text === '') {
                    setServings(0);
                  }
                }}
                placeholder="add"
                keyboardType="numeric"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <View style={styles.rowFieldWide}>
              <Text style={styles.boxTitle}>Categorías</Text>
              <View style={styles.rowPickerContainer}>
                <Picker
                  selectedValue={mainProtein}
                  onValueChange={(value) => {
                    if (value === '__add_new__') {
                      setShowAddCategoryModal(true);
                    } else {
                      setMainProtein(value as MainProtein);
                    }
                  }}
                  style={styles.rowPicker}
                >
                  <Picker.Item label="añadir" value="" />
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

            <View style={styles.rowFieldWide}>
              <Text style={styles.boxTitle}>Cocina</Text>
              <View style={styles.rowPickerContainer}>
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
                  style={styles.rowPicker}
                >
                  <Picker.Item label="añadir" value="" />
                  {allCuisines.map((c) => (
                    <Picker.Item
                      key={c.value}
                      label={`${c.flag} ${c.label}`}
                      value={c.value}
                    />
                  ))}
                  <Picker.Item
                    label="➕ Nueva Cocina"
                    value="__add_new__"
                  />
                </Picker>
              </View>
            </View>
          </View>

          {/* Selected cuisines badges below the row */}
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

          <View style={styles.field}>
            <View style={styles.fieldHeader}>
              <Text style={styles.label}>Texto de la Receta</Text>
              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.cameraButton,
                    ocrStatus === 'processing' && styles.actionButtonDisabled
                  ]}
                  onPress={showImagePickerOptions}
                  disabled={ocrStatus === 'processing' || recordingStatus !== 'idle'}
                >
                  {ocrStatus === 'processing' ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.actionButtonText}>📷</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.micButton,
                    recordingStatus === 'recording' && styles.micButtonRecording,
                    recordingStatus === 'transcribing' && styles.actionButtonDisabled
                  ]}
                  onPress={recording ? stopRecording : startRecording}
                  onLongPress={recording ? cancelRecording : undefined}
                  disabled={recordingStatus === 'transcribing' || ocrStatus === 'processing'}
                >
                  {recordingStatus === 'transcribing' ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : recordingStatus === 'recording' ? (
                    <Text style={styles.actionButtonText}>⏹️ {formatDuration(recordingDuration)}</Text>
                  ) : (
                    <Text style={styles.actionButtonText}>🎤</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
            {recordingStatus === 'recording' && (
              <Text style={styles.recordingHint}>
                Grabando... Mantén presionado para cancelar
              </Text>
            )}
            <TextInput
              style={[styles.input, styles.textArea]}
              value={rawText}
              onChangeText={setRawText}
              placeholder="Pega o escribe tu receta aquí... O usa 📷 para escanear o 🎤 para dictar"
              placeholderTextColor={COLORS.textSecondary}
              multiline
              numberOfLines={12}
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
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
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
  micButton: {
    backgroundColor: COLORS.accent,
  },
  micButtonRecording: {
    backgroundColor: COLORS.error,
  },
  actionButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: 20,
    color: '#ffffff',
  },
  recordingHint: {
    fontSize: 12,
    color: COLORS.error,
    fontStyle: 'italic',
    marginBottom: SPACING.xs,
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
    marginBottom: SPACING.xs,
  },
  hintText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: SPACING.xs,
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
  addButtonText: {
    color: COLORS.text,
    fontSize: 16,
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
    minHeight: 200,
    textAlignVertical: 'top',
  },
  rowContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    alignItems: 'flex-start',
  },
  rowField: {
    flex: 1,
    minWidth: 0, // Important for flex items to shrink properly
  },
  rowFieldNarrow: {
    flex: 0.6,
    marginBottom: SPACING.md,
  },
  rowFieldWide: {
    flex: 1.2,
    marginBottom: SPACING.md,
  },
  boxTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  rowInput: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 50,
  },
  rowPickerContainer: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    minHeight: 50,
  },
  rowPicker: {
    color: COLORS.text,
    height: 50,
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

