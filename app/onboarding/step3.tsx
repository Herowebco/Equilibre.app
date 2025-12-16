import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper, Button, SelectableCard } from '@/components';
import { Colors, Theme } from '@/constants';
import { useOnboarding } from '@/contexts/OnboardingContext';

type Goal = 'lose_weight' | 'maintain' | 'gain_muscle';

const GOALS: { value: Goal; label: string; description: string }[] = [
  {
    value: 'lose_weight',
    label: 'Perdre du poids',
    description: 'Réduire ma masse corporelle',
  },
  {
    value: 'maintain',
    label: 'Maintenir',
    description: 'Stabiliser mon poids actuel',
  },
  {
    value: 'gain_muscle',
    label: 'Prendre de la masse',
    description: 'Développer ma musculature',
  },
];

export default function Step3Screen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();

  const [goal, setGoal] = useState<Goal>(data.goal || 'maintain');

  const handleNext = () => {
    updateData({ goal });
    router.push('/onboarding/step4');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <ScreenWrapper scrollable>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.step}>Étape 3/4</Text>
          <Text style={styles.title}>Votre objectif</Text>
          <Text style={styles.subtitle}>
            Quel est votre objectif principal ?
          </Text>
        </View>

        <View style={styles.content}>
          {GOALS.map((goalOption) => (
            <View key={goalOption.value} style={styles.cardWrapper}>
              <SelectableCard
                title={goalOption.label}
                selected={goal === goalOption.value}
                onPress={() => setGoal(goalOption.value)}
              />
              <Text style={styles.description}>{goalOption.description}</Text>
            </View>
          ))}
        </View>

        <View style={styles.buttons}>
          <Button
            title="Retour"
            onPress={handleBack}
            variant="outline"
            style={styles.backButton}
          />
          <Button
            title="Continuer"
            onPress={handleNext}
            style={styles.nextButton}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Theme.spacing.lg,
  },
  header: {
    marginBottom: Theme.spacing.xl,
  },
  step: {
    fontSize: Theme.fontSize.sm,
    color: Colors.primary,
    fontWeight: Theme.fontWeight.medium,
    marginBottom: Theme.spacing.xs,
  },
  title: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Theme.spacing.sm,
  },
  subtitle: {
    fontSize: Theme.fontSize.md,
    color: Colors.text.secondary,
  },
  content: {
    flex: 1,
  },
  cardWrapper: {
    marginBottom: Theme.spacing.lg,
  },
  description: {
    fontSize: Theme.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: Theme.spacing.xs,
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
    marginTop: Theme.spacing.md,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
});
