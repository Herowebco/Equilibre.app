import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper, Button, SelectableCard } from '@/components';
import { Colors, Theme } from '@/constants';
import { useOnboarding } from '@/contexts/OnboardingContext';

export default function Step1Screen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();

  const [gender, setGender] = useState<'male' | 'female'>(data.gender || 'male');
  const [age, setAge] = useState(data.age?.toString() || '');
  const [height, setHeight] = useState(data.height?.toString() || '');
  const [weight, setWeight] = useState(data.weight?.toString() || '');

  const handleNext = () => {
    if (!age || !height || !weight) {
      return;
    }

    updateData({
      gender,
      age: parseInt(age),
      height: parseFloat(height),
      weight: parseFloat(weight),
    });

    router.push('/onboarding/step2');
  };

  const isValid = age && height && weight;

  return (
    <ScreenWrapper scrollable>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.step}>Étape 1/4</Text>
          <Text style={styles.title}>Informations de base</Text>
          <Text style={styles.subtitle}>
            Parlez-nous un peu de vous
          </Text>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.label}>Genre</Text>
            <View style={styles.row}>
              <SelectableCard
                title="Homme"
                selected={gender === 'male'}
                onPress={() => setGender('male')}
                style={styles.genderCard}
              />
              <SelectableCard
                title="Femme"
                selected={gender === 'female'}
                onPress={() => setGender('female')}
                style={styles.genderCard}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Âge</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              placeholder="25"
              placeholderTextColor={Colors.text.light}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Taille (cm)</Text>
            <TextInput
              style={styles.input}
              value={height}
              onChangeText={setHeight}
              placeholder="170"
              placeholderTextColor={Colors.text.light}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Poids actuel (kg)</Text>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              placeholder="70"
              placeholderTextColor={Colors.text.light}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        <Button
          title="Continuer"
          onPress={handleNext}
          disabled={!isValid}
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
  section: {
    marginBottom: Theme.spacing.lg,
  },
  label: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.medium,
    color: Colors.text.primary,
    marginBottom: Theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
  },
  genderCard: {
    flex: 1,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    fontSize: Theme.fontSize.md,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  button: {
    marginTop: Theme.spacing.md,
  },
});
