import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScreenWrapper, Button, SelectableCard } from '@/components';
import { Colors, Theme } from '@/constants';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { generateMealPlan } from '@/services/ai';

type DietType = 'standard' | 'vegetarian' | 'vegan' | 'no_pork';

const DIET_TYPES: { value: DietType; label: string }[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'vegetarian', label: 'Végétarien' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'no_pork', label: 'Sans porc' },
];

const ALLERGIES = [
  'Gluten',
  'Lactose',
  'Arachides',
  'Fruits à coque',
  'Œufs',
  'Poisson',
  'Crustacés',
  'Soja',
];

export default function Step4Screen() {
  const router = useRouter();
  const { data, updateData, resetData } = useOnboarding();
  const { user } = useAuth();

  const [dietType, setDietType] = useState<DietType>(data.diet_type || 'standard');
  const [allergies, setAllergies] = useState<string[]>(data.allergies || []);
  const [mealsPerDay, setMealsPerDay] = useState<3 | 4>(data.meals_per_day || 3);
  const [loading, setLoading] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);

  const toggleAllergy = (allergy: string) => {
    if (allergies.includes(allergy)) {
      setAllergies(allergies.filter((a) => a !== allergy));
    } else {
      setAllergies([...allergies, allergy]);
    }
  };

  const handleFinish = async () => {
    if (loading) {
      console.log('🟡 [BOUTON] Déjà en cours...');
      return;
    }

    if (!user) {
      console.log('🔴 [BOUTON] Erreur: utilisateur non connecté');
      Alert.alert('Erreur', 'Vous devez être connecté pour générer un plan');
      return;
    }

    console.log('🟢 [BOUTON] Clic détecté !');
    setLoading(true);
    setGeneratingPlan(true);

    try {
      const dietLabel = DIET_TYPES.find(d => d.value === dietType)?.label || 'Standard';
      const allergiesText = allergies.length > 0 ? allergies.join(', ') : 'Aucune';
      console.log(`📋 [BOUTON] Régime: ${dietLabel}, Allergies: ${allergiesText}, Repas/jour: ${mealsPerDay}`);

      updateData({
        diet_type: dietType,
        allergies,
        meals_per_day: mealsPerDay,
      });

      const finalData = {
        ...data,
        diet_type: dietType,
        allergies,
        meals_per_day: mealsPerDay,
      };

      console.log('💾 [BOUTON] Sauvegarde du profil en DB...');
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          gender: finalData.gender,
          age: finalData.age,
          height: finalData.height,
          weight: finalData.weight,
          activity_level: finalData.activity_level,
          goal: finalData.goal,
          dietary_preferences: {
            diet_type: finalData.diet_type,
            allergies: finalData.allergies,
            meals_per_day: finalData.meals_per_day,
          },
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('🔴 [BOUTON] Erreur DB profil:', profileError);
        throw profileError;
      }

      console.log('✅ [BOUTON] Profil sauvegardé');

      const userProfile = {
        gender: finalData.gender,
        age: finalData.age,
        height: finalData.height,
        weight: finalData.weight,
        activity_level: finalData.activity_level,
        goal: finalData.goal,
        dietary_preferences: {
          diet_type: finalData.diet_type,
          allergies: finalData.allergies,
          meals_per_day: finalData.meals_per_day,
        },
      };

      console.log('💾 [BOUTON] Sauvegarde dans AsyncStorage...');
      await AsyncStorage.setItem('temp_user_profile', JSON.stringify(userProfile));

      console.log('🤖 [BOUTON] Appel de l\'IA pour générer le plan...');
      const mealPlan = await generateMealPlan(userProfile, user.id);

      console.log('✅ [BOUTON] Plan généré avec succès!');
      updateData({ generatedPlan: mealPlan });

      console.log('🔄 [BOUTON] Redirection vers validation...');
      router.push('/onboarding/validate-plan');
    } catch (error: any) {
      console.error('🔴 [BOUTON] Erreur fatale:', error);
      Alert.alert(
        'Erreur',
        error.message || 'Une erreur est survenue lors de la génération du plan'
      );
    } finally {
      setLoading(false);
      setGeneratingPlan(false);
      console.log('🏁 [BOUTON] Processus terminé');
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <ScreenWrapper scrollable>
      <View style={styles.container}>
        {generatingPlan && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>
                L'IA génère votre semaine...
              </Text>
            </View>
          </View>
        )}

        <View style={styles.header}>
          <Text style={styles.step}>Étape 4/4</Text>
          <Text style={styles.title}>Préférences alimentaires</Text>
          <Text style={styles.subtitle}>
            Dernière étape avant de générer votre plan
          </Text>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.label}>Type de régime</Text>
            <View style={styles.grid}>
              {DIET_TYPES.map((diet) => (
                <SelectableCard
                  key={diet.value}
                  title={diet.label}
                  selected={dietType === diet.value}
                  onPress={() => setDietType(diet.value)}
                  style={styles.dietCard}
                />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Allergies (optionnel)</Text>
            <View style={styles.allergyGrid}>
              {ALLERGIES.map((allergy) => (
                <TouchableOpacity
                  key={allergy}
                  style={[
                    styles.allergyChip,
                    allergies.includes(allergy) && styles.allergyChipSelected,
                  ]}
                  onPress={() => toggleAllergy(allergy)}
                >
                  <Text
                    style={[
                      styles.allergyText,
                      allergies.includes(allergy) && styles.allergyTextSelected,
                    ]}
                  >
                    {allergy}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Nombre de repas par jour</Text>
            <View style={styles.row}>
              <SelectableCard
                title="3 repas"
                selected={mealsPerDay === 3}
                onPress={() => setMealsPerDay(3)}
                style={styles.mealCard}
              />
              <SelectableCard
                title="4 repas"
                selected={mealsPerDay === 4}
                onPress={() => setMealsPerDay(4)}
                style={styles.mealCard}
              />
            </View>
          </View>
        </View>

        <View style={styles.buttons}>
          <Button
            title="Retour"
            onPress={handleBack}
            variant="outline"
            style={styles.backButton}
            disabled={loading}
          />
          <Button
            title="Générer mon plan"
            onPress={handleFinish}
            style={styles.nextButton}
            loading={loading}
            disabled={loading}
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
  section: {
    marginBottom: Theme.spacing.xl,
  },
  label: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.medium,
    color: Colors.text.primary,
    marginBottom: Theme.spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
  },
  dietCard: {
    flex: 1,
    minWidth: '45%',
  },
  allergyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
  },
  allergyChip: {
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  allergyChipSelected: {
    backgroundColor: `${Colors.primary}15`,
    borderColor: Colors.primary,
  },
  allergyText: {
    fontSize: Theme.fontSize.sm,
    color: Colors.text.primary,
  },
  allergyTextSelected: {
    color: Colors.primary,
    fontWeight: Theme.fontWeight.medium,
  },
  row: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
  },
  mealCard: {
    flex: 1,
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: Colors.white,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Theme.spacing.md,
    fontSize: Theme.fontSize.md,
    color: Colors.text.primary,
    fontWeight: Theme.fontWeight.medium,
  },
});
