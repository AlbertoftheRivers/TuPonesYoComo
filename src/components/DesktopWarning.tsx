import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../lib/constants';
import { useLanguage } from '../lib/LanguageContext';

/**
 * Warning component shown on desktop to inform users the app is optimized for mobile
 */
export default function DesktopWarning() {
  const { t } = useLanguage();
  
  if (Platform.OS !== 'web') return null;

  // Check if it's a mobile device by user agent
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    typeof navigator !== 'undefined' ? navigator.userAgent : ''
  );

  if (isMobileDevice) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📱 {t('appOptimizedForMobile')}</Text>
      <Text style={styles.text}>
        {t('appMobileDescription')}
      </Text>
      <Text style={styles.hint}>
        {t('iosInstructions')}
      </Text>
      <Text style={styles.translationNotice}>
        ⚠️ {t('translationNotice')}
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
  translationNotice: {
    fontSize: 11,
    color: COLORS.primary,
    fontStyle: 'italic',
    marginTop: SPACING.sm,
    fontWeight: '600',
  },
});


