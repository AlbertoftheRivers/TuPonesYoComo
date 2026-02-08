/**
 * Notification service for TuPonesYoComo
 * Handles push notifications when new recipes are added
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior (with error handling)
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch (error) {
  console.warn('Failed to set notification handler:', error);
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Notification permissions not granted');
      return false;
    }

    // Configure notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Get the Expo push token (for future use with Expo Push Notification service)
 * Note: This requires a projectId from app.json or expo config
 */
export async function getExpoPushToken(projectId?: string): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return null;
    }

    // Only get token if projectId is provided
    if (!projectId) {
      console.warn('ProjectId not provided, skipping Expo push token');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    return tokenData.data;
  } catch (error) {
    console.error('Error getting Expo push token:', error);
    return null;
  }
}

/**
 * Send a local notification when a new recipe is added
 */
export async function sendNewRecipeNotification(recipeTitle: string, mainProtein: string): Promise<void> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.warn('Cannot send notification: permissions not granted');
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🍳 Nueva Receta Añadida',
        body: `${recipeTitle} ha sido añadida a la categoría ${mainProtein}`,
        data: { recipeTitle, mainProtein },
        sound: true,
      },
      trigger: null, // Show immediately
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

/**
 * Initialize notifications on app start
 */
export async function initializeNotifications(): Promise<void> {
  try {
    // Only initialize if expo-notifications is available
    if (typeof Notifications !== 'undefined') {
      await requestNotificationPermissions();
    } else {
      console.warn('Notifications module not available');
    }
  } catch (error) {
    console.error('Error initializing notifications:', error);
    // Don't throw - allow app to continue without notifications
  }
}

