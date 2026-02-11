import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, BORDER_RADIUS } from '../lib/constants';
import { MAIN_PROTEINS } from '../lib/constants';

type RootStackParamList = {
  Home: undefined;
  RecipeList: { mainProtein: string };
  RecipeDetail: { recipeId: string | number };
  AddRecipe: undefined;
  EditRecipe: { recipeId: string | number };
  UserGuide: undefined;
};

type UserGuideScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'UserGuide'>;

interface Props {
  navigation: UserGuideScreenNavigationProp;
}

export default function UserGuideScreen({ navigation }: Props) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>📖 Guía de Usuario</Text>
        <Text style={styles.subtitle}>Aprende a usar TuPonesYoComo</Text>
      </View>

      {/* Sección: Añadir Recetas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>➕ Añadir Recetas</Text>
        <Text style={styles.sectionText}>
          Puedes añadir recetas de tres formas diferentes:
        </Text>

        <View style={styles.methodCard}>
          <Text style={styles.methodTitle}>1️⃣ Texto Plano</Text>
          <Text style={styles.methodText}>
            • Toca el botón "➕ Añadir Receta" en la pantalla principal{'\n'}
            • Escribe o pega el texto de tu receta en el campo "Texto de la Receta"{'\n'}
            • Selecciona la categoría principal (Pollo, Pescado, etc.){'\n'}
            • Selecciona las cocinas (opcional){'\n'}
            • Indica para cuántas personas es la receta{'\n'}
            • Toca "Analizar con IA" para extraer ingredientes, pasos y tiempos{'\n'}
            • Revisa el análisis y toca "Guardar Receta"
          </Text>
        </View>

        <View style={styles.methodCard}>
          <Text style={styles.methodTitle}>2️⃣ Dictado por Voz 🎤</Text>
          <Text style={styles.methodText}>
            • En la pantalla de añadir receta, toca el botón del micrófono 🎤{'\n'}
            • Habla tu receta claramente{'\n'}
            • El sistema transcribirá tu voz a texto automáticamente{'\n'}
            • El texto aparecerá en el campo "Texto de la Receta"{'\n'}
            • Continúa con el análisis y guardado como en el método de texto plano
          </Text>
        </View>

        <View style={styles.methodCard}>
          <Text style={styles.methodTitle}>3️⃣ Escaneo OCR 📷</Text>
          <Text style={styles.methodText}>
            • En la pantalla de añadir receta, toca el botón de cámara 📷{'\n'}
            • Toma una foto de tu receta o selecciona una imagen de la galería{'\n'}
            • Selecciona el idioma de la receta (Español por defecto){'\n'}
            • El sistema extraerá el texto de la imagen automáticamente{'\n'}
            • El texto aparecerá en el campo "Texto de la Receta"{'\n'}
            • Continúa con el análisis y guardado como en el método de texto plano
          </Text>
        </View>
      </View>

      {/* Sección: Editar Recetas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>✏️ Editar Recetas</Text>
        <Text style={styles.sectionText}>
          Para editar una receta existente:
        </Text>
        <View style={styles.methodCard}>
          <Text style={styles.methodText}>
            • Abre cualquier receta desde la lista de categorías{'\n'}
            • Toca el botón "Editar" en la parte superior{'\n'}
            • Modifica cualquier campo (título, ingredientes, pasos, etc.){'\n'}
            • Puedes cambiar el número de porciones y los ingredientes se ajustarán automáticamente{'\n'}
            • Si cambias el texto original, puedes tocar "Re-analizar con IA" para actualizar los datos estructurados{'\n'}
            • Toca "Guardar Cambios" cuando termines
          </Text>
        </View>
      </View>

      {/* Sección: Categorías */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📂 Categorías</Text>
        <Text style={styles.sectionText}>
          Las recetas se organizan por categoría principal:
        </Text>
        <View style={styles.categoriesGrid}>
          {MAIN_PROTEINS.map((protein) => (
            <View key={protein.value} style={styles.categoryItem}>
              <Text style={styles.categoryIcon}>{protein.icon}</Text>
              <Text style={styles.categoryLabel}>{protein.label}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.sectionText}>
          • Toca cualquier categoría en la pantalla principal para ver sus recetas{'\n'}
          • Las recetas se muestran ordenadas alfabéticamente{'\n'}
          • Puedes buscar recetas por nombre, cocina o ingredientes{'\n'}
          • Puedes añadir nuevas categorías personalizadas desde la pantalla de añadir receta
        </Text>
      </View>

      {/* Sección: Información Adicional */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ℹ️ Información Adicional</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            • <Text style={styles.bold}>Análisis con IA:</Text> La app usa inteligencia artificial para extraer automáticamente ingredientes, pasos, utensilios y tiempos de tus recetas.{'\n\n'}
            • <Text style={styles.bold}>Porciones:</Text> Puedes ajustar el número de porciones y las cantidades de ingredientes se calcularán automáticamente.{'\n\n'}
            • <Text style={styles.bold}>Cocinas:</Text> Puedes asignar múltiples cocinas a cada receta (Española, Italiana, Mexicana, etc.).{'\n\n'}
            • <Text style={styles.bold}>Notificaciones:</Text> Recibirás una notificación cuando alguien añada una nueva receta.
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <Text style={styles.closeButtonText}>Cerrar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  header: {
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  sectionText: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
    marginBottom: SPACING.md,
  },
  methodCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  methodTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  methodText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  categoryItem: {
    width: '48%',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: SPACING.xs,
  },
  categoryLabel: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  infoText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  bold: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  closeButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});




