import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper, Button, SelectableCard, ProgressBar } from '@/components';
import { Colors, Theme } from '@/constants';
import { useOnboarding } from '@/contexts/OnboardingContext';

const VALIDATION_RULES = {
  age: { min: 15, max: 100, message: "L'âge doit être compris entre 15 et 100 ans" },
  height: { min: 120, max: 250, message: "La taille doit être comprise entre 120 et 250 cm" },
  weight: { min: 35, max: 300, message: "Le poids doit être compris entre 35 et 300 kg" },
};

export default function Step1Screen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();

  const [gender, setGender] = useState<'male' | 'female'>(data.gender || 'male');
  const [age, setAge] = useState(data.age?.toString() || '');
  const [height, setHeight] = useState(data.height?.toString() || '');
  const [weight, setWeight] = useState(data.weight?.toString() || '');

  const [errors, setErrors] = useState({
    age: '',
    height: '',
    weight: '',
  });

  const validateNumber = (value: string, field: 'age' | 'height' | 'weight'): boolean => {
    const numValue = Number(value);
    const rules = VALIDATION_RULES[field];

    if (!value || value.trim() === '') {
      setErrors((prev) => ({ ...prev, [field]: '' }));
      return false;
    }

    if (isNaN(numValue) || numValue < 0) {
      setErrors((prev) => ({ ...prev, [field]: 'Veuillez entrer un nombre valide' }));
      return false;
    }

    if (numValue < rules.min || numValue > rules.max) {
      setErrors((prev) => ({ ...prev, [field]: rules.message }));
      return false;
    }

    setErrors((prev) => ({ ...prev, [field]: '' }));
    return true;
  };

  const handleAgeChange = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    setAge(cleaned);
    if (cleaned) validateNumber(cleaned, 'age');
    else setErrors((prev) => ({ ...prev, age: '' }));
  };

  const handleHeightChange = (value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, '');
    setHeight(cleaned);
    if (cleaned) validateNumber(cleaned, 'height');
    else setErrors((prev) => ({ ...prev, height: '' }));
  };

  const handleWeightChange = (value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, '');
    setWeight(cleaned);
    if (cleaned) validateNumber(cleaned, 'weight');
    else setErrors((prev) => ({ ...prev, weight: '' }));
  };

  const handleNext = () => {
    const ageValid = validateNumber(age, 'age');
    const heightValid = validateNumber(height, 'height');
    const weightValid = validateNumber(weight, 'weight');

    if (!ageValid || !heightValid || !weightValid) {
      return;
    }

    updateData({
      gender,
      age: Number(age),
      height: Number(height),
      weight: Number(weight),
    });

    router.push('/onboarding/step2');
  };

  const isValid = age && height && weight && !errors.age && !errors.height && !errors.weight;

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoid}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
    <ScreenWrapper scrollable>
      <View style={styles.container}>
        <ProgressBar currentStep={1} totalSteps={4} />

        <View style={styles.header}>
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
              style={[styles.input, errors.age && styles.inputError]}
              value={age}
              onChangeText={handleAgeChange}
              placeholder="25"
              placeholderTextColor={Colors.text.light}
              keyboardType="number-pad"
            />
            {errors.age ? <Text style={styles.errorText}>{errors.age}</Text> : null}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Taille (cm)</Text>
            <TextInput
              style={[styles.input, errors.height && styles.inputError]}
              value={height}
              onChangeText={handleHeightChange}
              placeholder="170"
              placeholderTextColor={Colors.text.light}
              keyboardType="decimal-pad"
            />
            {errors.height ? <Text style={styles.errorText}>{errors.height}</Text> : null}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Poids actuel (kg)</Text>
            <TextInput
              style={[styles.input, errors.weight && styles.inputError]}
              value={weight}
              onChangeText={handleWeightChange}
              placeholder="70"
              placeholderTextColor={Colors.text.light}
              keyboardType="decimal-pad"
            />
            {errors.weight ? <Text style={styles.errorText}>{errors.weight}</Text> : null}
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
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
  inputError: {
    borderColor: Colors.error,
    borderWidth: 1.5,
  },
  errorText: {
    color: Colors.error,
    fontSize: Theme.fontSize.sm,
    marginTop: Theme.spacing.xs,
  },
  button: {
    marginTop: Theme.spacing.md,
  },
});
