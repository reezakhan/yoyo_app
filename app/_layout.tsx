import 'react-native-get-random-values';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider } from '@/contexts/AuthContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { NotificationService } from '@/services/notificationService';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import 'react-native-reanimated';
import '../global.css';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { SheetProvider } from 'react-native-actions-sheet';
import './sheets';

export default function RootLayout() {
  useFrameworkReady();
  const colorScheme = useColorScheme();
  const [loaded, error] = useFonts({
    'PlusJakartaSans-Regular': PlusJakartaSans_400Regular,
    'PlusJakartaSans-Medium': PlusJakartaSans_500Medium,
    'PlusJakartaSans-SemiBold': PlusJakartaSans_600SemiBold,
    'PlusJakartaSans-Bold': PlusJakartaSans_700Bold,
    'PlusJakartaSans-ExtraBold': PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    // Register for push notifications and set up listeners
    const initializeNotifications = async () => {
      await NotificationService.registerDeviceToken();

      // Set up notification listeners
      const cleanup = NotificationService.setupNotificationListeners();

      // Return cleanup function for useEffect
      return cleanup;
    };

    initializeNotifications().then((cleanup) => {
      // Store cleanup function if needed
      return cleanup;
    });
  }, []);

  if (!loaded && !error) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <WishlistProvider>
          <SheetProvider>
            <ThemeProvider value={DefaultTheme}>
              <Stack initialRouteName='(tabs)'>
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="onboarding" options={{ headerShown: true }} />
                {/* <Stack.Screen name="hotels" options={{ headerShown: true }} /> */}
                <Stack.Screen name="checkout" options={{ headerShown: true, presentation: 'card' }} />
                <Stack.Screen name="contactus" options={{ headerShown: true, presentation: 'card' }} />
                <Stack.Screen name="personal-info" options={{ headerShown: true, presentation: 'card' }} />
                <Stack.Screen name="wallet" options={{ headerShown: true, presentation: 'card' }} />
                <Stack.Screen name="notifications" options={{ headerShown: true , presentation: 'modal'}} />
                <Stack.Screen name="maintenance_mode" options={{ headerShown: false }} />

                <Stack.Screen name="+not-found" />
              </Stack>
              <StatusBar style="dark" />
            </ThemeProvider>
          </SheetProvider>
        </WishlistProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}