import { useEffect } from 'react';
import { Stack, useRootNavigationState, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '@/contexts/AuthContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { supabase } from '@/lib/supabase';

function AppContent() {
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    const handleUrl = async (url: string) => {
      if (!url) return;
      if (url.includes('type=recovery') || url.includes('code=')) {
        try {
          await supabase.auth.exchangeCodeForSession(url);
        } catch {}
      }
    };

    Linking.getInitialURL().then(url => { if (url) handleUrl(url); });
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));

    return () => {
      sub.remove();
    };
  }, [rootNavigationState?.key]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="(app)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  useFrameworkReady();
  const rootNavigationState = useRootNavigationState();

  if (!rootNavigationState?.key) {
    return null;
  }

  return (
    <AuthProvider>
      <FavoritesProvider>
        <AppContent />
        <StatusBar style="auto" />
      </FavoritesProvider>
    </AuthProvider>
  );
}
