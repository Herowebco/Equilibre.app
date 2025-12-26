import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper, Button, SelectableCard, ProgressBar } from '@/components';
import { Colors, Theme } from '@/constants';
import { useOnboarding } from '@/contexts/OnboardingContext';

type ActivityLevel = 'sedentary' | 'active' | 'very_active';

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string; description: string }[] = [
  {
    value: 'sedentary',
    label: 'Sédentaire',
    description: 'Peu ou pas d\'exercice',
  },
  {
    value: 'active',
    label: 'Actif',
    description: 'Exercice 3-5 fois par semaine',
  },
  {
    value: 'very_active',
    label: 'Très sportif',
    description: 'Exercice intense 6-7 fois par semaine',
  },
];

export default function Step2Screen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();

  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    data.activity_level || 'active'
  );

  const handleNext = () => {
    updateData({ activity_level: activityLevel });
    router.push('/onboarding/step3');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <ScreenWrapper scrollable>
      <View style={styles.container}>
        <ProgressBar currentStep={2} totalSteps={4} />

        <View style={styles.header}>
          <Text style={styles.title}>Niveau d'activité</Text>
          <Text style={styles.subtitle}>
            Quel est votre niveau d'activité physique ?
          </Text>
        </View>

        <View style={styles.content}>
          {ACTIVITY_LEVELS.map((level) => (
            <View key={level.value} style={styles.cardWrapper}>
              <SelectableCard
                title={level.label}
                selected={activityLevel === level.value}
                onPress={() => setActivityLevel(level.value)}
              />
              <Text style={styles.description}>{level.description}</Text>
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
