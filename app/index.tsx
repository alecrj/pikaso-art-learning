import React, { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useUserProgress } from '../src/contexts/UserProgressContext';
import { useTheme } from '../src/contexts/ThemeContext';

export default function Index() {
  const { user, isLoading } = useUserProgress();
  const { colors } = useTheme();

  useEffect(() => {
    console.log('🚀 App Index: Checking user status', { 
      hasUser: !!user, 
      isLoading,
      userId: user?.id 
    });
  }, [user, isLoading]);

  // Show loading while checking user status
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Redirect based on user status
  if (user && user.id) {
    console.log('✅ User authenticated, redirecting to tabs');
    return <Redirect href="/(tabs)" />;
  } else {
    console.log('❌ No user found, redirecting to onboarding');
    return <Redirect href="/onboarding" />;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});