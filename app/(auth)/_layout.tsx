import { useEffect } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthLayout() {
  const { isAuthenticated, loading, profileComplete } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    if (!rootNavigationState?.key) return;
    if (loading) return;

    const inAuth = segments[0] === '(auth)';

    if (isAuthenticated && inAuth) {
      if (profileComplete) {
        router.replace('/(app)');
      } else {
        router.replace('/onboarding');
      }
    }
  }, [isAuthenticated, loading, profileComplete, segments, rootNavigationState?.key]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}
