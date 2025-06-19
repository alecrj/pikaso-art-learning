// app/_layout.tsx - PRODUCTION GRADE WITH CRASH PREVENTION
import { useEffect, useState } from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { FadeIn } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';

// Contexts
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { UserProgressProvider } from '../src/contexts/UserProgressContext';
import { DrawingProvider } from '../src/contexts/DrawingContext';
import { LearningProvider } from '../src/contexts/LearningContext';

// Initialize app
import { AppInitializer } from '../src/utils/appInitializer';

// Components
import { ErrorBoundary } from '../src/engines/core/ErrorBoundary';

export default function RootLayout() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [initWarnings, setInitWarnings] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const initializeApp = async () => {
      try {
        console.log('🚀 Starting Pikaso initialization...');
        
        // Use the new centralized initializer
        const result = await AppInitializer.initialize();
        
        if (!mounted) return;
        
        if (result.success) {
          setIsInitialized(true);
          
          if (result.warnings.length > 0) {
            setInitWarnings(result.warnings);
            console.warn('⚠️ Initialization warnings:', result.warnings);
          }
          
          console.log('✅ App ready!');
        } else {
          // App can still run with errors, just with limited functionality
          setIsInitialized(true);
          setInitError(result.errors[0] || 'Unknown initialization error');
          setInitWarnings(result.warnings);
          
          console.error('❌ Initialization had errors but app will continue');
        }
        
      } catch (error) {
        console.error('💥 Critical initialization failure:', error);
        
        if (mounted) {
          // Still allow app to run
          setIsInitialized(true);
          setInitError(error instanceof Error ? error.message : 'Critical initialization error');
        }
      }
    };

    initializeApp();

    return () => {
      mounted = false;
      // Cleanup on unmount
      AppInitializer.cleanup();
    };
  }, []);

  if (!isInitialized) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#000000',
      }}>
        <Animated.View 
          entering={FadeIn}
          style={{ alignItems: 'center' }}
        >
          <Text style={{ 
            color: '#FFFFFF', 
            fontSize: 32, 
            fontWeight: '700',
            marginBottom: 8,
            letterSpacing: -1,
          }}>
            Pikaso
          </Text>
          <Text style={{ 
            color: '#CCCCCC', 
            fontSize: 16,
            marginBottom: 32,
          }}>
            Master the art of drawing
          </Text>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={{ 
            color: '#888888', 
            fontSize: 14,
            marginTop: 16,
          }}>
            Initializing engines...
          </Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary
        fallback={(error) => (
          <View style={{ 
            flex: 1, 
            justifyContent: 'center', 
            alignItems: 'center',
            backgroundColor: '#f5f5f5',
            padding: 40,
          }}>
            <Text style={{ fontSize: 24, marginBottom: 16 }}>😔</Text>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>
              Something went wrong
            </Text>
            <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
              {error?.message || 'An unexpected error occurred'}
            </Text>
          </View>
        )}
      >
        <ThemeProvider>
          <UserProgressProvider>
            <DrawingProvider>
              <LearningProvider>
                <StatusBar style="auto" />
                
                {/* Show warnings banner if any */}
                {(initError || initWarnings.length > 0) && (
                  <View style={{
                    position: 'absolute',
                    top: 60,
                    left: 20,
                    right: 20,
                    backgroundColor: initError ? '#ff6b6b' : '#ffd93d',
                    padding: 12,
                    borderRadius: 8,
                    zIndex: 1000,
                  }}>
                    <Text style={{
                      color: initError ? '#fff' : '#333',
                      fontSize: 12,
                      fontWeight: '600',
                    }}>
                      {initError ? '⚠️ Limited functionality' : 'ℹ️ Notice'}
                    </Text>
                    <Text style={{
                      color: initError ? '#fff' : '#333',
                      fontSize: 11,
                      marginTop: 4,
                    }}>
                      {initError || initWarnings[0]}
                    </Text>
                  </View>
                )}
                
                <Stack 
                  screenOptions={{ 
                    headerShown: false,
                    animation: 'slide_from_right',
                  }}
                >
                  <Stack.Screen name="index" />
                  <Stack.Screen name="onboarding" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen 
                    name="lesson/[id]" 
                    options={{ 
                      presentation: 'modal',
                      animation: 'slide_from_bottom',
                    }} 
                  />
                  <Stack.Screen 
                    name="drawing/[id]"
                    options={{ 
                      presentation: 'fullScreenModal',
                    }} 
                  />
                  <Stack.Screen 
                    name="profile/[id]"
                    options={{ 
                      animation: 'slide_from_bottom',
                    }} 
                  />
                  <Stack.Screen 
                    name="settings"
                    options={{ 
                      presentation: 'modal',
                      animation: 'slide_from_bottom',
                    }} 
                  />
                </Stack>
              </LearningProvider>
            </DrawingProvider>
          </UserProgressProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}