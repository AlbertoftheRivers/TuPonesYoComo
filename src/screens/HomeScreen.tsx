import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, BORDER_RADIUS, MAIN_PROTEINS } from '../lib/constants';
import { getAllProteins, addCustomProtein } from '../lib/customCategories';
import { detectEmojiForCategory } from '../lib/emojiMapper';
import { MainProtein } from '../types/recipe';

type RootStackParamList = {
  Home: undefined;
  RecipeList: { mainProtein: string };
  RecipeDetail: { recipeId: string | number };
  AddRecipe: undefined;
  EditRecipe: { recipeId: string | number };
};

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

export default function HomeScreen({ navigation }: Props) {
  const [allProteins, setAllProteins] = useState(MAIN_PROTEINS);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('');

  useEffect(() => {
    loadCustomProteins();
  }, []);

  const loadCustomProteins = async () => {
    try {
      const proteins = await getAllProteins();
      setAllProteins(proteins);
    } catch (error) {
      console.error('Error loading custom proteins:', error);
    }
  };

  const handleProteinPress = (protein: string) => {
    navigation.navigate('RecipeList', { mainProtein: protein });
  };

  const handleAddRecipe = () => {
    navigation.navigate('AddRecipe');
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para la categoría');
      return;
    }

    try {
      // Detectar emoji automáticamente
      const detectedIcon = detectEmojiForCategory(newCategoryName);
      const iconToUse = newCategoryIcon.trim() || detectedIcon;

      const newProtein = {
        value: newCategoryName.toLowerCase().replace(/\s+/g, '_'),
        label: newCategoryName.trim(),
        icon: iconToUse,
      };

      await addCustomProtein(newProtein);
      await loadCustomProteins();
      
      Alert.alert('Éxito', `Categoría "${newCategoryName}" añadida con el icono ${iconToUse}`);
      setShowAddCategoryModal(false);
      setNewCategoryName('');
      setNewCategoryIcon('');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Error al añadir categoría');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>TuPonesYoComo</Text>
          <Text style={styles.subtitle}>Selecciona una categoría para ver recetas</Text>
        </View>

        <View style={styles.grid}>
          {allProteins.map((protein) => (
            <TouchableOpacity
              key={protein.value}
              style={styles.proteinCard}
              onPress={() => handleProteinPress(protein.value)}
              activeOpacity={0.7}
            >
              <View style={[styles.cardIcon, { backgroundColor: COLORS.accent + '30' }]}>
                <Text style={styles.cardIconText}>
                  {protein.icon}
                </Text>
              </View>
              <Text style={styles.cardLabel}>{protein.label}</Text>
            </TouchableOpacity>
          ))}
          
          {/* Botón para añadir nueva categoría */}
          <TouchableOpacity
            style={[styles.proteinCard, styles.addCategoryCard]}
            onPress={() => setShowAddCategoryModal(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.cardIcon, { backgroundColor: COLORS.primary + '30' }]}>
              <Text style={styles.cardIconText}>➕</Text>
            </View>
            <Text style={styles.cardLabel}>Añadir Categoría</Text>
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
                // Auto-detectar emoji cuando el usuario escribe
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
      </ScrollView>

      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddRecipe}
        activeOpacity={0.8}
      >
        <Text style={styles.addButtonText}>➕ Añadir Receta</Text>
      </TouchableOpacity>
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
    paddingBottom: 100, // Space for floating button
  },
  header: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  proteinCard: {
    width: '48%',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  cardIconText: {
    fontSize: 32,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addCategoryCard: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
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

