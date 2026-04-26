import { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../src/store/authStore';
import { useSettingsStore } from '../src/store/settingsStore';
import { getAccessToken } from '../src/api/client';
import { Colors } from '../src/theme';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry:              2,
      staleTime:          1000 * 60 * 5, // 5 min
      gcTime:             1000 * 60 * 30,
    },
  },
});

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const [isReady, setIsReady] = useState(false);
  const segments = useSegments();

  useEffect(() => {
    async function bootstrap() {
      try {
        const token = await getAccessToken();
        if (token) {
          useAuthStore.getState().setUser({ id: '', email: '', displayName: '' });
        }
        await useSettingsStore.getState().loadSettings();
      } catch {}
      setIsReady(true);
      await SplashScreen.hideAsync();
    }
    bootstrap();
  }, []);

  // Once ready, handle navigation based on auth state
  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Not authenticated and not on auth screen → send to login
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Authenticated but still on auth screen → send to tabs
      router.replace('/(tabs)');
    }
  }, [isReady, isAuthenticated, segments]);

  // Show nothing while bootstrapping — native splash is still visible
  if (!isReady) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <AuthGate>
            <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="workout/[id]" options={{ presentation: 'modal' }} />
              <Stack.Screen name="workout/active" options={{ gestureEnabled: false, animation: 'slide_from_bottom' }} />
              <Stack.Screen name="exercise/[id]" options={{ presentation: 'card' }} />
              <Stack.Screen name="template/new" options={{ presentation: 'card', animation: 'slide_from_bottom' }} />
              <Stack.Screen name="template/[id]" options={{ presentation: 'card' }} />
              <Stack.Screen name="body/log" options={{ presentation: 'modal' }} />
              <Stack.Screen name="body/index" options={{ presentation: 'card' }} />
              <Stack.Screen name="settings" options={{ presentation: 'card', animation: 'slide_from_right' }} />
            </Stack>
          </AuthGate>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex:            1,
    backgroundColor: Colors.bg,
    alignItems:      'center',
    justifyContent:  'center',
  },
});
