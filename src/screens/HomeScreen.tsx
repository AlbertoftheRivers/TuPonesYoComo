import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp, useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, BORDER_RADIUS, MAIN_PROTEINS } from '../lib/constants';
import { getAllProteins } from '../lib/customCategories';
import DesktopWarning from '../components/DesktopWarning';
import { useLanguage, SupportedLanguage } from '../lib/LanguageContext';

type RootStackParamList = {
  Home: undefined;
  RecipeList: { mainProtein: string };
  RecipeDetail: { recipeId: string | number };
  AddRecipe: undefined;
  EditRecipe: { recipeId: string | number };
  UserGuide: undefined;
};

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

export default function HomeScreen({ navigation }: Props) {
  const { language, setLanguage, t } = useLanguage();
  const [allProteins, setAllProteins] = useState(MAIN_PROTEINS);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  // Reload categories when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadCustomProteins();
    }, [])
  );

  const loadCustomProteins = async () => {
    try {
      const proteins = await getAllProteins();
      setAllProteins(proteins);
    } catch (error) {
      console.error('Error loading custom proteins:', error);
    }
  };

  const handleLanguageChange = async (lang: SupportedLanguage) => {
    await setLanguage(lang);
    setShowLanguageModal(false);
  };

  const handleProteinPress = (protein: string) => {
    navigation.navigate('RecipeList', { mainProtein: protein });
  };

  const handleAddRecipe = () => {
    navigation.navigate('AddRecipe');
  };

  const handleOpenGuide = () => {
    navigation.navigate('UserGuide');
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <DesktopWarning />
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>{t('appName')}</Text>
              <Text style={styles.subtitle}>{t('selectCategory')}</Text>
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.languageButton}
                onPress={() => setShowLanguageModal(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.languageButtonText}>🌐</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.helpButton}
                onPress={handleOpenGuide}
                activeOpacity={0.7}
              >
                <Text style={styles.helpButtonText}>❓</Text>
              </TouchableOpacity>
            </View>
          </View>
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
        <Text style={styles.addButtonText}>➕ {t('addRecipe')}</Text>
      </TouchableOpacity>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('selectLanguage')}</Text>
            
            <TouchableOpacity
              style={[styles.languageOption, language === 'es' && styles.languageOptionActive]}
              onPress={() => handleLanguageChange('es')}
            >
              <Text style={styles.languageOptionText}>🇪🇸 {t('spanish')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.languageOption, language === 'ca' && styles.languageOptionActive]}
              onPress={() => handleLanguageChange('ca')}
            >
              <Text style={styles.languageOptionText}>🇪🇸 {t('catalan')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.languageOption, language === 'fr' && styles.languageOptionActive]}
              onPress={() => handleLanguageChange('fr')}
            >
              <Text style={styles.languageOptionText}>🇫🇷 {t('french')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.languageOption, language === 'en' && styles.languageOptionActive]}
              onPress={() => handleLanguageChange('en')}
            >
              <Text style={styles.languageOptionText}>🇬🇧 {t('english')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.languageOption, language === 'pt' && styles.languageOptionActive]}
              onPress={() => handleLanguageChange('pt')}
            >
              <Text style={styles.languageOptionText}>🇵🇹 {t('portuguese')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowLanguageModal(false)}
            >
              <Text style={styles.modalCancelButtonText}>{t('cancel')}</Text>
            </TouchableOpacity>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  languageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  languageButtonText: {
    fontSize: 20,
  },
  helpButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  helpButtonText: {
    fontSize: 20,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  languageOption: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '20',
  },
  languageOptionText: {
    fontSize: 18,
    color: COLORS.text,
    textAlign: 'center',
  },
  modalCancelButton: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.border,
  },
  modalCancelButtonText: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    fontWeight: '600',
  },
});

