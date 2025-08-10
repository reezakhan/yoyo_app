import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function AuthIndex() {
  const { isAuthenticated, isLoading, isMaintenanceMode, user } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isMaintenanceMode) {
        router.replace('/maintenance_mode');
      } else if (isAuthenticated && user) {
        router.replace('/(tabs)');
        // if (user.hasOnboarded) {
        //   router.replace('/(tabs)');
        // } else {
        //   router.replace('/onboarding');
        // }
      } else {
        router.replace('/(auth)/login');
      }
    }
  }, [isAuthenticated, isLoading, isMaintenanceMode, user]);

  return (
    <View style={styles.container}>
      <LoadingSpinner fullScreen text="Loading..." />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});