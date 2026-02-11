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
  Dimensions,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Audio } from 'expo-av';
// ImagePicker imported dynamically to avoid crash if native module is not available
import { COLORS, SPACING, BORDER_RADIUS, MAIN_PROTEINS, CUISINES } from '../lib/constants';
import { analyzeRecipe } from '../lib/ollama';
import { createRecipe } from '../api/recipes';
import { transcribeAudio } from '../lib/transcribe';
import { extractTextFromImage } from '../lib/ocr';
import { getAllProteins, getAllCuisines, addCustomProtein, addCustomCuisine } from '../lib/customCategories';
import { detectEmojiForCategory } from '../lib/emojiMapper';
import { t } from '../lib/i18n';
import { MainProtein, RecipeAIAnalysis, Ingredient, Cuisine } from '../types/recipe';
import { isWeb } from '../lib/platform';
import { createWebAudioRecorder, transcribeWebAudio, isWebAudioRecordingAvailable, WebAudioRecorder } from '../lib/webAudioRecorder';
import { pickImageFromFile, pickMultipleImagesFromFile, capturePhotoFromCamera } from '../lib/webImagePicker';

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
  // Web Audio Recorder state (for Whisper backend, same as Android)
  const [webAudioRecorder, setWebAudioRecorder] = useState<WebAudioRecorder | null>(null);

  // OCR states
  const [ocrStatus, setOcrStatus] = useState<'idle' | 'processing'>('idle');
  const [ocrLanguage, setOcrLanguage] = useState('spa'); // Default to Spanish
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);

  useEffect(() => {
    loadCustomOptions();
    // Request audio permissions on mount (only for native)
    if (!isWeb) {
      (async () => {
        try {
          const { status } = await Audio.requestPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert(
              'Permisos de Audio',
              'Se necesitan permisos de micrófono para usar la función de dictado por voz.',
              [{ text: 'OK' }]
            );
          }
        } catch (error) {
          console.error('Error requesting audio permissions:', error);
        }
      })();
    }
    // ImagePicker permissions requested lazily when needed
  }, []);

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
      if (webAudioRecorder) {
        try {
          webAudioRecorder.cancel();
        } catch (error) {
          console.error('Error canceling web audio recorder:', error);
        }
      }
    };
  }, [recording, webAudioRecorder]);

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
      Alert.alert(t('error'), t('pleaseEnterName'));
      return;
    }

    try {
      setAnalyzing(true);
      setAnalyzeStatus('Conectando al servidor de IA...');
      const result = await analyzeRecipe(rawText, mainProtein);
      setAnalyzeStatus('Procesando respuesta...');
      setAnalysis(result);
      setAnalyzeStatus('');
      Alert.alert(t('success'), '¡Receta analizada correctamente!');
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
      Alert.alert(t('error'), t('pleaseEnterName'));
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
      
      Alert.alert(t('success'), `${t('categoryAdded')}: "${newCategoryName}"`);
      setShowAddCategoryModal(false);
      setNewCategoryName('');
      setNewCategoryIcon('');
    } catch (error) {
      Alert.alert(t('error'), error instanceof Error ? error.message : t('error'));
    }
  };

  const handleAddCuisine = async () => {
    if (!newCuisineName.trim()) {
      Alert.alert(t('error'), t('pleaseEnterName'));
      return;
    }

    if (!newCuisineFlag.trim()) {
      Alert.alert(t('error'), t('pleaseEnterFlag'));
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
      
      Alert.alert(t('success'), `${t('cuisineAdded')}: "${newCuisineName}"`);
      setShowAddCuisineModal(false);
      setNewCuisineName('');
      setNewCuisineFlag('🌍');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Error al añadir cocina');
    }
  };

  const startRecording = async () => {
    // Use Web Audio Recorder + Whisper backend on web (same as Android)
    if (isWeb) {
      if (!isWebAudioRecordingAvailable()) {
        Alert.alert('Error', 'La grabación de audio no está disponible en este navegador. Por favor usa Chrome, Edge o Safari.');
        return;
      }

      try {
        const recorder = createWebAudioRecorder();
        if (!recorder) {
          Alert.alert('Error', 'No se pudo crear el grabador de audio.');
          return;
        }

        await recorder.start();
        setWebAudioRecorder(recorder);
        setRecordingStatus('recording');
        setRecordingDuration(0);

        const interval = setInterval(() => {
          setRecordingDuration(prev => prev + 1);
        }, 1000);

        (recorder as any)._durationInterval = interval;
      } catch (error) {
        console.error('Error starting web recording:', error);
        Alert.alert('Error', 'No se pudo iniciar la grabación. Por favor verifica los permisos del micrófono.');
        setRecordingStatus('idle');
      }
      return;
    }

    // Native recording
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
    // Web Audio Recorder + Whisper backend (same as Android)
    if (isWeb && webAudioRecorder) {
      try {
        setRecordingStatus('transcribing');
        
        if ((webAudioRecorder as any)._durationInterval) {
          clearInterval((webAudioRecorder as any)._durationInterval);
        }

        const audioBlob = await webAudioRecorder.stop();
        setWebAudioRecorder(null);
        setRecordingDuration(0);

        if (!audioBlob) {
          throw new Error('No se pudo obtener el archivo de audio');
        }

        Alert.alert('Transcribiendo', 'Procesando tu audio con Whisper...');
        const result = await transcribeWebAudio(audioBlob, 'es');

        const newText = rawText.trim() 
          ? `${rawText.trim()}\n\n${result.text}` 
          : result.text;
        setRawText(newText);

        setRecordingStatus('idle');
        Alert.alert('Éxito', 'Audio transcrito correctamente');
      } catch (error) {
        console.error('Error transcribing web audio:', error);
        setRecordingStatus('idle');
        setRecordingDuration(0);
        setWebAudioRecorder(null);
        
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Error al transcribir el audio. Por favor verifica la conexión con el servidor.';
        
        Alert.alert('Error de Transcripción', errorMessage);
      }
      return;
    }

    // Native recording
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
    // Web Audio Recorder
    if (isWeb && webAudioRecorder) {
      try {
        if ((webAudioRecorder as any)._durationInterval) {
          clearInterval((webAudioRecorder as any)._durationInterval);
        }
        webAudioRecorder.cancel();
        setWebAudioRecorder(null);
        setRecordingStatus('idle');
        setRecordingDuration(0);
      } catch (error) {
        console.error('Error canceling web recording:', error);
      }
      return;
    }

    // Native recording
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

      if (!result.canceled && result.assets[0]) {
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
    // Use web file picker on web
    if (isWeb) {
      try {
        const images = await pickMultipleImagesFromFile();
        if (images.length === 0) return;
        
        if (images.length > 1) {
          await processBatchOCR(images);
        } else {
          await processImageOCR(images[0]);
        }
      } catch (error) {
        console.error('Error picking image:', error);
        Alert.alert('Error', 'No se pudo seleccionar la imagen. Por favor intenta de nuevo.');
      }
      return;
    }

    // Native image picker
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
          await processBatchOCR(result.assets.map(asset => asset.uri));
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
    console.log('📷 [OCR] processImageOCR called');
    console.log('📷 [OCR] imageUri type:', typeof imageUri);
    console.log('📷 [OCR] imageUri length:', imageUri?.length);
    console.log('📷 [OCR] imageUri preview:', imageUri?.substring(0, 100));
    console.log('📷 [OCR] ocrLanguage:', ocrLanguage);
    
    try {
      setOcrStatus('processing');
      console.log('📷 [OCR] Status set to processing');
      Alert.alert('Procesando', 'Extrayendo texto de la imagen...');

      console.log('📷 [OCR] Calling extractTextFromImage...');
      // Use default preprocessing (no adjustments)
      const result = await extractTextFromImage(imageUri, ocrLanguage);
      console.log('📷 [OCR] extractTextFromImage result:', {
        textLength: result.text?.length,
        textPreview: result.text?.substring(0, 100),
        confidence: result.confidence,
        language: result.language,
      });

      const newText = rawText.trim()
        ? `${rawText.trim()}\n\n${result.text}`
        : result.text;
      setRawText(newText);
      console.log('📷 [OCR] Text added to rawText, new length:', newText.length);

      setOcrStatus('idle');
      console.log('📷 [OCR] Status set to idle');
      
      const confidenceMsg = result.confidence 
        ? ` (Confianza: ${result.confidence.toFixed(1)}%)`
        : '';
      Alert.alert('Éxito', `Texto extraído correctamente de la imagen${confidenceMsg}`);
      console.log('📷 [OCR] Success alert shown');
    } catch (error) {
      console.error('📷 [OCR] Error processing OCR:', error);
      console.error('📷 [OCR] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
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

  const handleTakePhotoWeb = async () => {
    console.log('📷 [OCR] handleTakePhotoWeb called');
    try {
      console.log('📷 [OCR] Calling capturePhotoFromCamera()...');
      const imageDataUrl = await capturePhotoFromCamera();
      console.log('📷 [OCR] capturePhotoFromCamera returned:', imageDataUrl ? `Data URL (${imageDataUrl.substring(0, 50)}...)` : 'null');
      if (imageDataUrl) {
        console.log('📷 [OCR] Image captured, calling processImageOCR...');
        await processImageOCR(imageDataUrl);
      } else {
        // User cancelled or error occurred (error message already shown by capturePhotoFromCamera)
        console.log('📷 [OCR] Photo capture cancelled or failed - no image data');
      }
    } catch (error) {
      console.error('📷 [OCR] Error taking photo:', error);
      const errorMessage = error instanceof Error ? error.message : 'No se pudo tomar la foto. Por favor intenta de nuevo.';
      Alert.alert('Error', errorMessage);
    }
  };

  const showImagePickerOptions = () => {
    console.log('📷 [OCR] showImagePickerOptions called');
    console.log('📷 [OCR] isWeb:', isWeb);
    
    // Use modal for web, Alert for native
    if (isWeb) {
      console.log('📷 [OCR] Opening modal for web');
      setShowImagePickerModal(true);
    } else {
      // Same dialog for mobile - exactly like APK
      Alert.alert(
        'Escanear Receta',
        'Elige una opción para escanear la receta',
        [
          { text: 'Cancelar', style: 'cancel', onPress: () => console.log('📷 [OCR] User cancelled') },
          { 
            text: 'Tomar Foto', 
            onPress: () => {
              console.log('📷 [OCR] "Tomar Foto" button pressed');
              handleTakePhoto();
            }
          },
          { 
            text: 'Seleccionar de Galería', 
            onPress: () => {
              console.log('📷 [OCR] "Seleccionar de Galería" button pressed');
              handlePickImage();
            }
          },
        ]
      );
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

    if (!analysis) {
      Alert.alert('Error', 'Por favor analiza la receta primero antes de guardar.');
      return;
    }

    if (!mainProtein) {
      Alert.alert('Error', 'Por favor selecciona una categoría principal.');
      return;
    }

    // Ensure we have a time estimate - if not, estimate based on steps
    let finalTime = analysis.total_time_minutes;
    if (!finalTime || finalTime <= 0) {
      const stepCount = analysis.steps.length;
      if (stepCount <= 3) {
        finalTime = 25;
      } else if (stepCount <= 6) {
        finalTime = 45;
      } else {
        finalTime = 75;
      }
      
      // Add time if oven is mentioned
      const hasOven = analysis.gadgets.some(g => 
        String(g).toLowerCase().includes('oven') || 
        String(g).toLowerCase().includes('horno')
      );
      if (hasOven) {
        finalTime += 30;
      }
    }

    try {
      console.log('💾 Starting save process...');
      setSaving(true);
      
      console.log('📝 Recipe data:', {
        title: title.trim(),
        main_protein: mainProtein,
        cuisines: selectedCuisines,
        hasIngredients: analysis.ingredients.length > 0,
        hasSteps: analysis.steps.length > 0,
      });
      
      const recipe = await createRecipe({
        title: title.trim(),
        main_protein: mainProtein as MainProtein,
        cuisines: selectedCuisines.length > 0 ? selectedCuisines : undefined,
        raw_text: rawText.trim(),
        ingredients: analysis.ingredients,
        steps: analysis.steps,
        gadgets: analysis.gadgets,
        total_time_minutes: finalTime,
        oven_time_minutes: analysis.oven_time_minutes,
        servings: servings,
      });

      console.log('✅ Recipe created successfully:', recipe.id);

      // Send notification about new recipe
      try {
        const { sendNewRecipeNotification } = await import('../lib/notifications');
        const proteinLabel = allProteins.find(p => p.value === mainProtein)?.label || mainProtein;
        await sendNewRecipeNotification(title.trim(), proteinLabel);
      } catch (notifError) {
        console.warn('⚠️ Could not send notification:', notifError);
        // Don't fail the save if notification fails
      }

      setSaving(false);
      
      // Show success message and navigate to recipe detail screen
      Alert.alert(
        t('success'),
        t('recipeSavedSuccess'),
        [
          {
            text: 'OK',
            style: 'default',
            onPress: () => {
              navigation.navigate('RecipeDetail', { recipeId: recipe.id });
            },
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error('❌ Error saving recipe:', error);
      setSaving(false);
      
      let errorMessage = 'Error al guardar la receta. Por favor verifica la conexión con Supabase e intenta de nuevo.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        // Provide more helpful error messages
        if (error.message.includes('Network') || error.message.includes('fetch')) {
          errorMessage = 'Error de conexión. Por favor verifica tu conexión a internet.';
        } else if (error.message.includes('JWT') || error.message.includes('auth')) {
          errorMessage = 'Error de autenticación. Por favor verifica la configuración de Supabase.';
        }
      }
      
      Alert.alert('Error al Guardar', errorMessage);
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
                  selectedValue={mainProtein || ''}
                  onValueChange={(value) => {
                    if (value === '__add_new__') {
                      setShowAddCategoryModal(true);
                    } else if (value === '') {
                      setMainProtein('');
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
                    (recordingStatus === 'recording' || webAudioRecorder) && styles.micButtonRecording,
                    recordingStatus === 'transcribing' && styles.actionButtonDisabled
                  ]}
                  onPress={(recording || webAudioRecorder) ? stopRecording : startRecording}
                  onLongPress={(recording || webAudioRecorder) ? cancelRecording : undefined}
                  disabled={recordingStatus === 'transcribing' || ocrStatus === 'processing'}
                >
                  {recordingStatus === 'transcribing' ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (recordingStatus === 'recording' || webAudioRecorder) ? (
                    <Text style={styles.actionButtonText}>⏹️ {formatDuration(recordingDuration)}</Text>
                  ) : (
                    <Text style={styles.actionButtonText}>🎤</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
            {(recordingStatus === 'recording' || webAudioRecorder) && (
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

      {/* Modal para seleccionar imagen (OCR) - Web only */}
      <Modal
        visible={showImagePickerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          console.log('📷 [OCR] Image picker modal closed');
          setShowImagePickerModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Escanear Receta</Text>
            <Text style={[styles.modalLabel, { marginTop: 0 }]}>
              Elige una opción para escanear la receta
            </Text>
            
            <View style={[styles.modalButtons, { flexDirection: 'column', gap: SPACING.sm }]}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonAdd]}
                onPress={() => {
                  console.log('📷 [OCR] "Tomar Foto" button pressed from modal');
                  setShowImagePickerModal(false);
                  handleTakePhotoWeb();
                }}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextAdd]}>📷 Tomar Foto</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonAdd]}
                onPress={() => {
                  console.log('📷 [OCR] "Seleccionar de Galería" button pressed from modal');
                  setShowImagePickerModal(false);
                  handlePickImage();
                }}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextAdd]}>🖼️ Seleccionar de Galería</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  console.log('📷 [OCR] User cancelled from modal');
                  setShowImagePickerModal(false);
                }}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
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

// Get screen dimensions for responsive design
const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;
const isDesktop = screenWidth >= 1024;
const maxContentWidth = isDesktop ? 800 : '100%';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    ...(Platform.OS === 'web' && {
      alignItems: 'center',
    }),
  },
  scrollContent: {
    padding: SPACING.md,
    ...(Platform.OS === 'web' && {
      width: maxContentWidth,
      maxWidth: '100%',
    }),
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
    flexDirection: isTablet ? 'row' : 'column',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    alignItems: 'flex-start',
  },
  rowField: {
    flex: 1,
    minWidth: 0, // Important for flex items to shrink properly
  },
  rowFieldNarrow: {
    ...(isTablet ? { flex: 0.6 } : { width: '100%' }),
    marginBottom: SPACING.md,
  },
  rowFieldWide: {
    ...(isTablet ? { flex: 1.2 } : { width: '100%' }),
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
    width: isTablet ? '70%' : '90%',
    maxWidth: isDesktop ? 500 : 400,
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

