import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { COLORS, MAIN_PROTEINS } from './src/lib/constants';
import { initializeNotifications } from './src/lib/notifications';
import { loadLanguage, t } from './src/lib/i18n';
import HomeScreen from './src/screens/HomeScreen';
import RecipeListScreen from './src/screens/RecipeListScreen';
import RecipeDetailScreen from './src/screens/RecipeDetailScreen';
import AddRecipeScreen from './src/screens/AddRecipeScreen';
import EditRecipeScreen from './src/screens/EditRecipeScreen';
import UserGuideScreen from './src/screens/UserGuideScreen';

// Custom back button component for web
function CustomBackButton({ navigation }: { navigation: any }) {
  if (Platform.OS !== 'web') {
    return null; // Use default on native
  }

  if (!navigation || !navigation.canGoBack()) {
    return null; // Don't show if can't go back
  }

  return (
    <TouchableOpacity
      onPress={() => navigation.goBack()}
      style={{
        marginLeft: 10,
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 44,
        minHeight: 44,
      }}
    >
      <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>←</Text>
    </TouchableOpacity>
  );
}

export type RootStackParamList = {
  Home: undefined;
  RecipeList: { mainProtein: string };
  RecipeDetail: { recipeId: string | number };
  AddRecipe: undefined;
  EditRecipe: { recipeId: string | number };
  UserGuide: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Algo salió mal</Text>
          <Text style={styles.errorText}>{this.state.error?.message}</Text>
          <Text style={styles.errorHint}>Revisa la consola para más detalles</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  useEffect(() => {
    // Initialize language on app start
    loadLanguage().catch((error) => {
      console.error('Failed to load language:', error);
    });
    
    // Initialize notifications on app start (non-blocking)
    initializeNotifications().catch((error) => {
      console.error('Failed to initialize notifications:', error);
      // Don't crash the app if notifications fail
    });
  }, []);

  try {
    return (
      <ErrorBoundary>
        <NavigationContainer>
          <StatusBar style="auto" />
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={({ navigation, route }) => ({
              headerStyle: {
                backgroundColor: COLORS.primary,
              },
              headerTintColor: '#fff',
              headerBackTitleVisible: false,
              headerBackVisible: true,
              headerShown: true,
              headerTitleStyle: {
                fontWeight: 'bold',
                color: '#fff',
              },
              // Custom back button for web if default doesn't work
              ...(Platform.OS === 'web' && navigation.canGoBack() && {
                headerLeft: () => <CustomBackButton navigation={navigation} />,
                headerLeftContainerStyle: {
                  paddingLeft: 10,
                },
              }),
            })}
          >
            <Stack.Screen 
              name="Home" 
              component={HomeScreen}
              options={{ title: 'TuPonesYoComo' }}
            />
            <Stack.Screen 
              name="RecipeList" 
              component={RecipeListScreen}
              options={({ route }) => {
                const protein = MAIN_PROTEINS.find(p => p.value === route.params.mainProtein);
                return {
                  title: protein ? `${protein.icon} ${protein.label}` : 'Recetas',
                  headerBackVisible: true,
                };
              }}
            />
                <Stack.Screen
                  name="RecipeDetail"
                  component={RecipeDetailScreen}
                  options={{
                    title: t('recipeDetails'),
                    headerBackVisible: true,
                  }}
                />
                <Stack.Screen
                  name="AddRecipe"
                  component={AddRecipeScreen}
                  options={{
                    title: t('addRecipeTitle'),
                    headerBackVisible: true,
                  }}
                />
                <Stack.Screen
                  name="EditRecipe"
                  component={EditRecipeScreen}
                  options={{
                    title: t('editRecipe'),
                    headerBackVisible: true,
                  }}
                />
                <Stack.Screen
                  name="UserGuide"
                  component={UserGuideScreen}
                  options={{
                    title: t('userGuide'),
                    headerBackVisible: true,
                  }}
                />
          </Stack.Navigator>
        </NavigationContainer>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('App initialization error:', error);
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Error al inicializar la app</Text>
        <Text style={styles.errorText}>{error instanceof Error ? error.message : String(error)}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#F44336',
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorHint: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});

