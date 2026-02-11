import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../lib/constants';

/**
 * Warning component shown on desktop to inform users the app is optimized for mobile
 */
export default function DesktopWarning() {
  if (Platform.OS !== 'web') return null;

  // Check if it's a mobile device by user agent
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    typeof navigator !== 'undefined' ? navigator.userAgent : ''
  );

  if (isMobileDevice) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📱 App Optimizada para Móviles</Text>
      <Text style={styles.text}>
        Esta aplicación está diseñada para usarse en dispositivos móviles (iPhone/iPad).
        Para la mejor experiencia, ábrela desde Safari en tu iPhone o iPad.
      </Text>
      <Text style={styles.hint}>
        💡 En iOS: Abre esta página en Safari → Toca el botón Compartir → "Añadir a pantalla de inicio"
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.accent + '20',
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    margin: SPACING.md,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  text: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.xs,
  },
  hint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: SPACING.xs,
  },
});


