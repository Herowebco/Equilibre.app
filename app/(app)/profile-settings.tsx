import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper, Card, Button, SelectableCard, LoadingPlanGenerator } from '@/components';
import { Colors, Theme } from '@/constants';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface ProfileData {
  age: number | null;
  gender: string | null;
  height: number | null;
  weight: number | null;
  target_weight: number | null;
  activity_level: string | null;
  goal: string | null;
  dietary_preferences: {
    diet_type?: string;
    allergies?: string[];
  } | null;
}

const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Sédentaire', description: 'Peu ou pas d\'exercice' },
  { id: 'light', label: 'Léger', description: '1-3 jours/semaine' },
  { id: 'moderate', label: 'Modéré', description: '3-5 jours/semaine' },
  { id: 'active', label: 'Actif', description: '6-7 jours/semaine' },
  { id: 'very_active', label: 'Très Actif', description: 'Sport intense quotidien' },
];

const GOALS = [
  { id: 'lose', label: 'Perte de poids', icon: '📉' },
  { id: 'maintain', label: 'Maintien', icon: '⚖️' },
  { id: 'gain', label: 'Prise de masse', icon: '📈' },
];

const DIET_TYPES = [
  { id: 'standard', label: 'Standard' },
  { id: 'vegetarian', label: 'Végétarien' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'pescatarian', label: 'Pescétarien' },
  { id: 'keto', label: 'Keto' },
  { id: 'paleo', label: 'Paleo' },
];

const COMMON_ALLERGIES = [
  'Gluten',
  'Lactose',
  'Œufs',
  'Fruits à coque',
  'Arachides',
  'Soja',
  'Poisson',
  'Crustacés',
];

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [initialData, setInitialData] = useState<ProfileData | null>(null);
  const [showRegenerationModal, setShowRegenerationModal] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    age: null,
    gender: null,
    height: null,
    weight: null,
    target_weight: null,
    activity_level: null,
    goal: null,
    dietary_preferences: null,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('age, gender, height, weight, target_weight, activity_level, goal, dietary_preferences')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const loadedData = {
        age: data.age,
        gender: data.gender,
        height: data.height,
        weight: data.weight,
        target_weight: data.target_weight,
        activity_level: data.activity_level,
        goal: data.goal,
        dietary_preferences: data.dietary_preferences || { diet_type: 'standard', allergies: [] },
      };

      setProfileData(loadedData);
      setInitialData(loadedData);
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Erreur', 'Impossible de charger votre profil');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    if (!initialData) {
      console.error('No initial data loaded');
      Alert.alert('Erreur', 'Les données initiales ne sont pas chargées');
      return;
    }

    const hasNutritionalChanges =
      initialData.weight !== profileData.weight ||
      initialData.height !== profileData.height ||
      initialData.age !== profileData.age ||
      initialData.activity_level !== profileData.activity_level ||
      initialData.goal !== profileData.goal ||
      JSON.stringify(initialData.dietary_preferences) !== JSON.stringify(profileData.dietary_preferences);

    console.log('=== PROFILE CHANGES DEBUG ===');
    console.log('Initial Data:', initialData);
    console.log('Current Data:', profileData);
    console.log('Has Nutritional Changes:', hasNutritionalChanges);
    console.log('Weight changed:', initialData.weight, '→', profileData.weight);
    console.log('Activity changed:', initialData.activity_level, '→', profileData.activity_level);
    console.log('Goal changed:', initialData.goal, '→', profileData.goal);
    console.log('Diet changed:',
      JSON.stringify(initialData.dietary_preferences),
      '→',
      JSON.stringify(profileData.dietary_preferences)
    );

    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          age: profileData.age,
          gender: profileData.gender,
          height: profileData.height,
          weight: profileData.weight,
          target_weight: profileData.target_weight,
          activity_level: profileData.activity_level,
          goal: profileData.goal,
          dietary_preferences: profileData.dietary_preferences,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      console.log('Profile saved successfully');

      if (hasNutritionalChanges) {
        console.log('Showing regeneration modal');
        setShowRegenerationModal(true);
      } else {
        console.log('No nutritional changes, showing success message');
        Alert.alert('Succès', 'Votre profil a été mis à jour', [
          {
            text: 'OK',
            onPress: () => {
              setInitialData(profileData);
              router.back();
            }
          },
        ]);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder vos modifications');
    } finally {
      setSaving(false);
    }
  };

  const toggleAllergy = (allergy: string) => {
    const currentAllergies = profileData.dietary_preferences?.allergies || [];
    const newAllergies = currentAllergies.includes(allergy)
      ? currentAllergies.filter((a) => a !== allergy)
      : [...currentAllergies, allergy];

    setProfileData({
      ...profileData,
      dietary_preferences: {
        ...profileData.dietary_preferences,
        allergies: newAllergies,
      },
    });
  };

  const handleRegenerateLater = () => {
    console.log('User chose to regenerate later');
    setShowRegenerationModal(false);
    setInitialData(profileData);
    router.back();
  };

  const handleRegenerateNow = async () => {
    console.log('🟢 [PROFILE-REGEN] Début régénération du plan');
    setShowRegenerationModal(false);
    setIsGenerating(true);

    try {
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      console.log('📋 [PROFILE-REGEN] Archive ancien plan');
      const { error: archiveError } = await supabase
        .from('meal_plans')
        .update({ status: 'archived' })
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (archiveError) {
        console.error('⚠️ [PROFILE-REGEN] Erreur archivage:', archiveError);
      }

      const varianceId = Date.now();
      console.log('🔢 [PROFILE-REGEN] Variance ID:', varianceId);
      console.log('🤖 [PROFILE-REGEN] Appel Edge Function avec profil:', {
        gender: profileData.gender,
        age: profileData.age,
        height: profileData.height,
        weight: profileData.weight,
        goal: profileData.goal,
        activity_level: profileData.activity_level,
      });

      const { data: planData, error: generateError } = await supabase.functions.invoke(
        'generate-plan',
        {
          body: {
            userProfile: profileData,
            user_id: user.id,
            variance: varianceId,
          },
        }
      );

      if (generateError) {
        console.error('🔴 [PROFILE-REGEN] Erreur Edge Function:', generateError);
        throw new Error(generateError.message || 'Erreur lors de la génération');
      }

      if (!planData || planData.error) {
        console.error('🔴 [PROFILE-REGEN] Erreur planData:', planData?.error);
        throw new Error(planData?.error || 'Aucune donnée reçue');
      }

      console.log('✅ [PROFILE-REGEN] Plan généré! Jours:', planData.days?.length);
      console.log('💾 [PROFILE-REGEN] Sauvegarde du nouveau plan');

      const { error: insertError } = await supabase.from('meal_plans').insert({
        user_id: user.id,
        plan_data: planData,
        status: 'active',
      });

      if (insertError) {
        console.error('🔴 [PROFILE-REGEN] Erreur sauvegarde:', insertError);
        throw insertError;
      }

      console.log('✅ [PROFILE-REGEN] Plan sauvegardé avec succès!');
      setInitialData(profileData);

      setTimeout(() => {
        setIsGenerating(false);
        router.replace('/(app)');
      }, 500);
    } catch (error: any) {
      console.error('🔴 [PROFILE-REGEN] Erreur fatale:', error);
      setIsGenerating(false);
      Alert.alert(
        'Erreur',
        error.message || 'Impossible de générer le nouveau plan. Veuillez réessayer.'
      );
    }
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.primary} />
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Modifier mon profil</Text>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Informations Physiques</Text>

          <View style={styles.row}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Âge</Text>
              <TextInput
                style={styles.input}
                value={profileData.age?.toString() || ''}
                onChangeText={(text) =>
                  setProfileData({ ...profileData, age: text ? parseInt(text) : null })
                }
                placeholder="25"
                keyboardType="numeric"
                placeholderTextColor={Colors.text.light}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Taille (cm)</Text>
              <TextInput
                style={styles.input}
                value={profileData.height?.toString() || ''}
                onChangeText={(text) =>
                  setProfileData({ ...profileData, height: text ? parseFloat(text) : null })
                }
                placeholder="170"
                keyboardType="numeric"
                placeholderTextColor={Colors.text.light}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Poids actuel (kg)</Text>
              <TextInput
                style={styles.input}
                value={profileData.weight?.toString() || ''}
                onChangeText={(text) =>
                  setProfileData({ ...profileData, weight: text ? parseFloat(text) : null })
                }
                placeholder="70"
                keyboardType="numeric"
                placeholderTextColor={Colors.text.light}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Poids cible (kg)</Text>
              <TextInput
                style={styles.input}
                value={profileData.target_weight?.toString() || ''}
                onChangeText={(text) =>
                  setProfileData({ ...profileData, target_weight: text ? parseFloat(text) : null })
                }
                placeholder="65"
                keyboardType="numeric"
                placeholderTextColor={Colors.text.light}
              />
            </View>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Objectif</Text>
          <View style={styles.optionsGrid}>
            {GOALS.map((goal) => (
              <SelectableCard
                key={goal.id}
                title={goal.label}
                selected={profileData.goal === goal.id}
                onPress={() => setProfileData({ ...profileData, goal: goal.id })}
                style={styles.optionCard}
              />
            ))}
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Niveau d'activité</Text>
          {ACTIVITY_LEVELS.map((level) => (
            <TouchableOpacity
              key={level.id}
              style={[
                styles.levelOption,
                profileData.activity_level === level.id && styles.levelOptionSelected,
              ]}
              onPress={() => setProfileData({ ...profileData, activity_level: level.id })}
            >
              <View style={styles.levelContent}>
                <Text
                  style={[
                    styles.levelLabel,
                    profileData.activity_level === level.id && styles.levelLabelSelected,
                  ]}
                >
                  {level.label}
                </Text>
                <Text
                  style={[
                    styles.levelDescription,
                    profileData.activity_level === level.id && styles.levelDescriptionSelected,
                  ]}
                >
                  {level.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Type de régime</Text>
          <View style={styles.optionsGrid}>
            {DIET_TYPES.map((diet) => (
              <SelectableCard
                key={diet.id}
                title={diet.label}
                selected={profileData.dietary_preferences?.diet_type === diet.id}
                onPress={() =>
                  setProfileData({
                    ...profileData,
                    dietary_preferences: {
                      ...profileData.dietary_preferences,
                      diet_type: diet.id,
                    },
                  })
                }
                style={styles.optionCard}
              />
            ))}
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Allergies et intolérances</Text>
          <View style={styles.allergiesGrid}>
            {COMMON_ALLERGIES.map((allergy) => (
              <TouchableOpacity
                key={allergy}
                style={[
                  styles.allergyChip,
                  profileData.dietary_preferences?.allergies?.includes(allergy) &&
                    styles.allergyChipSelected,
                ]}
                onPress={() => toggleAllergy(allergy)}
              >
                <Text
                  style={[
                    styles.allergyText,
                    profileData.dietary_preferences?.allergies?.includes(allergy) &&
                      styles.allergyTextSelected,
                  ]}
                >
                  {allergy}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Button
          title={saving ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          style={styles.saveButton}
        />
      </ScrollView>

      <Modal
        visible={showRegenerationModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRegenerationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <AlertCircle size={48} color={Colors.primary} />
            </View>

            <Text style={styles.modalTitle}>Vos besoins ont changé</Text>

            <Text style={styles.modalDescription}>
              Vos besoins nutritionnels ont été modifiés. Souhaitez-vous générer un nouveau plan adapté à votre nouveau profil ?
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={handleRegenerateLater}
              >
                <Text style={styles.modalButtonTextSecondary}>Plus tard</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleRegenerateNow}
              >
                <Text style={styles.modalButtonTextPrimary}>Générer maintenant</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <LoadingPlanGenerator visible={isGenerating} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: Theme.spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Theme.spacing.md,
    fontSize: Theme.fontSize.md,
    color: Colors.text.secondary,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Theme.spacing.lg,
  },
  backButtonText: {
    fontSize: Theme.fontSize.md,
    color: Colors.primary,
    fontWeight: Theme.fontWeight.medium,
  },
  title: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Theme.spacing.xl,
  },
  card: {
    marginBottom: Theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },
  inputContainer: {
    flex: 1,
  },
  label: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.medium,
    color: Colors.text.primary,
    marginBottom: Theme.spacing.sm,
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
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
  },
  optionCard: {
    flex: 1,
    minWidth: '45%',
  },
  levelOption: {
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    marginBottom: Theme.spacing.sm,
  },
  levelOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}10`,
  },
  levelContent: {
    flex: 1,
  },
  levelLabel: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Theme.spacing.xs,
  },
  levelLabelSelected: {
    color: Colors.primary,
  },
  levelDescription: {
    fontSize: Theme.fontSize.sm,
    color: Colors.text.secondary,
  },
  levelDescriptionSelected: {
    color: Colors.primary,
  },
  allergiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
  },
  allergyChip: {
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  allergyChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  allergyText: {
    fontSize: Theme.fontSize.sm,
    color: Colors.text.primary,
  },
  allergyTextSelected: {
    color: Colors.white,
    fontWeight: Theme.fontWeight.medium,
  },
  saveButton: {
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalIconContainer: {
    marginBottom: Theme.spacing.lg,
  },
  modalTitle: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Theme.spacing.md,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: Theme.fontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Theme.spacing.xl,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalButtonPrimary: {
    backgroundColor: Colors.primary,
  },
  modalButtonTextSecondary: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.medium,
    color: Colors.text.primary,
  },
  modalButtonTextPrimary: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.medium,
    color: Colors.white,
  },
});
