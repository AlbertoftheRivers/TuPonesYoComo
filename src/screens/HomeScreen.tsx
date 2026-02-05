import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, BORDER_RADIUS, MAIN_PROTEINS } from '../lib/constants';
import { getAllProteins } from '../lib/customCategories';

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
        </View>
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
});

