import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper, Button } from '@/components';
import { Colors, Theme } from '@/constants';
import { Utensils } from 'lucide-react-native';

export default function OnboardingWelcome() {
  const router = useRouter();

  const handleStart = () => {
    router.push('/onboarding/step1');
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Utensils size={64} color={Colors.primary} />
          </View>

          <Text style={styles.title}>Bienvenue !</Text>

          <Text style={styles.description}>
            Nous allons créer votre plan nutritionnel personnalisé en quelques étapes simples.
          </Text>

          <Text style={styles.subtitle}>
            Cela prendra environ 2 minutes
          </Text>
        </View>

        <Button
          title="Démarrer"
          onPress={handleStart}
          style={styles.button}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Theme.spacing.lg,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.xl,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Theme.spacing.md,
    textAlign: 'center',
  },
  description: {
    fontSize: Theme.fontSize.lg,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Theme.spacing.lg,
    lineHeight: Theme.fontSize.lg * 1.5,
    paddingHorizontal: Theme.spacing.md,
  },
  subtitle: {
    fontSize: Theme.fontSize.md,
    color: Colors.text.light,
    textAlign: 'center',
  },
  button: {
    marginTop: Theme.spacing.md,
  },
});
