import { useEffect } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { useAuth } from '@/contexts/AuthContext';

export default function OnboardingLayout() {
  const { isAuthenticated, loading, profileComplete } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    if (!rootNavigationState?.key) return;
    if (loading) return;

    const inOnboarding = segments[0] === 'onboarding';

    if (!isAuthenticated && inOnboarding) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && profileComplete && inOnboarding) {
      router.replace('/(app)');
    }
  }, [isAuthenticated, loading, profileComplete, segments, rootNavigationState?.key]);

  if (loading) {
    return null;
  }

  return (
    <OnboardingProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="step1" />
        <Stack.Screen name="step2" />
        <Stack.Screen name="step3" />
        <Stack.Screen name="step4" />
        <Stack.Screen name="validate-plan" />
      </Stack>
    </OnboardingProvider>
  );
}
