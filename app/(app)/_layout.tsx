import { useEffect } from 'react';
import { Tabs, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { Home, Calendar, ShoppingCart, User } from 'lucide-react-native';
import { Colors } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';

export default function AppLayout() {
  const { isAuthenticated, loading, profileComplete } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    if (!rootNavigationState?.key) return;
    if (loading) return;

    const inApp = segments[0] === '(app)';

    if (!isAuthenticated && inApp) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && !profileComplete && inApp) {
      router.replace('/onboarding');
    }
  }, [isAuthenticated, loading, profileComplete, segments, rootNavigationState?.key]);

  if (loading) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.text.light,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ size, color }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: 'Mon Plan',
          tabBarIcon: ({ size, color }) => (
            <Calendar size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="groceries"
        options={{
          title: 'Courses',
          tabBarIcon: ({ size, color }) => (
            <ShoppingCart size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ size, color }) => <User size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="support"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile-settings"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
