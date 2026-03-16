import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../src/store/authStore';
import { getAccessToken } from '../src/api/client';

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

export default function RootLayout() {
  const { setUser, isAuthenticated } = useAuthStore();

  useEffect(() => {
    async function bootstrap() {
      const token = await getAccessToken();
      // If a token exists, assume authenticated until the first API call proves otherwise
      if (token) setUser({ id: '', email: '', displayName: '' });
      await SplashScreen.hideAsync();
    }
    bootstrap();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="workout/[id]" options={{ presentation: 'modal' }} />
            <Stack.Screen name="workout/active" options={{ gestureEnabled: false }} />
            <Stack.Screen name="exercise/[id]" options={{ presentation: 'card' }} />
            <Stack.Screen name="template/[id]" options={{ presentation: 'card' }} />
            <Stack.Screen name="body/log" options={{ presentation: 'modal' }} />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
