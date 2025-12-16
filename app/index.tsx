import { useEffect } from 'react';
import { useRouter, useRootNavigationState } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants';

export default function Index() {
  const { isAuthenticated, loading, profileComplete } = useAuth();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    if (!rootNavigationState?.key) return;
    if (loading) return;

    if (isAuthenticated) {
      if (profileComplete) {
        router.replace('/(app)');
      } else {
        router.replace('/onboarding/step1');
      }
    } else {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, loading, profileComplete, rootNavigationState?.key]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
