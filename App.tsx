import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './src/screens/HomeScreen';
import RecipeListScreen from './src/screens/RecipeListScreen';
import RecipeDetailScreen from './src/screens/RecipeDetailScreen';
import AddRecipeScreen from './src/screens/AddRecipeScreen';
import EditRecipeScreen from './src/screens/EditRecipeScreen';

export type RootStackParamList = {
  Home: undefined;
  RecipeList: { mainProtein: string };
  RecipeDetail: { recipeId: string | number };
  AddRecipe: undefined;
  EditRecipe: { recipeId: string | number };
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
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{this.state.error?.message}</Text>
          <Text style={styles.errorHint}>Check the console for details</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  try {
    return (
      <ErrorBoundary>
        <NavigationContainer>
          <StatusBar style="auto" />
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerStyle: {
                backgroundColor: '#4CAF50',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          >
            <Stack.Screen 
              name="Home" 
              component={HomeScreen}
              options={{ title: 'TuPonesYoComo' }}
            />
            <Stack.Screen 
              name="RecipeList" 
              component={RecipeListScreen}
              options={({ route }) => ({ 
                title: route.params.mainProtein 
                  ? route.params.mainProtein.charAt(0).toUpperCase() + route.params.mainProtein.slice(1) + ' Recipes'
                  : 'Recipes'
              })}
            />
            <Stack.Screen 
              name="RecipeDetail" 
              component={RecipeDetailScreen}
              options={{ title: 'Recipe Details' }}
            />
            <Stack.Screen 
              name="AddRecipe" 
              component={AddRecipeScreen}
              options={{ title: 'Add Recipe' }}
            />
            <Stack.Screen 
              name="EditRecipe" 
              component={EditRecipeScreen}
              options={{ title: 'Edit Recipe' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('App initialization error:', error);
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Failed to initialize app</Text>
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

