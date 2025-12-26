import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper, Card, Button, RecipeModal } from '@/components';
import { Colors, Theme } from '@/constants';
import { User, Heart, Info } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { getUserFavorites, toggleFavorite, type FavoriteRecipe } from '@/services/favorites';
import { supabase } from '@/lib/supabase';

type Tab = 'info' | 'favorites';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [favorites, setFavorites] = useState<FavoriteRecipe[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<FavoriteRecipe | null>(null);
  const [recipeModalVisible, setRecipeModalVisible] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadProfile();
      if (activeTab === 'favorites') {
        loadFavorites();
      }
    }
  }, [user, activeTab]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadFavorites = async () => {
    if (!user) return;

    try {
      setLoadingFavorites(true);
      const favs = await getUserFavorites(user.id);
      setFavorites(favs);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoadingFavorites(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecipePress = (recipe: FavoriteRecipe) => {
    setSelectedRecipe(recipe);
    setRecipeModalVisible(true);
  };

  const handleToggleFavorite = async () => {
    if (!user || !selectedRecipe) return;

    await toggleFavorite(user.id, selectedRecipe.meal_name);
    setRecipeModalVisible(false);
    loadFavorites();
  };

  const getGoalLabel = (goal?: string) => {
    switch (goal) {
      case 'lose_weight': return 'Perte de poids';
      case 'gain_muscle': return 'Prise de muscle';
      case 'maintain': return 'Maintien';
      default: return 'Non défini';
    }
  };

  const getActivityLabel = (level?: string) => {
    switch (level) {
      case 'sedentary': return 'Sédentaire';
      case 'active': return 'Actif';
      case 'very_active': return 'Très actif';
      default: return 'Non défini';
    }
  };

  return (
    <ScreenWrapper scrollable>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <User size={48} color={Colors.primary} />
          </View>
          <Text style={styles.name}>{profile?.full_name || 'Utilisateur'}</Text>
          <Text style={styles.email}>{user?.email || 'email@exemple.com'}</Text>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'info' && styles.activeTab]}
            onPress={() => setActiveTab('info')}
          >
            <Info size={20} color={activeTab === 'info' ? Colors.primary : Colors.text.secondary} />
            <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>
              Mes Infos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'favorites' && styles.activeTab]}
            onPress={() => setActiveTab('favorites')}
          >
            <Heart size={20} color={activeTab === 'favorites' ? Colors.primary : Colors.text.secondary} />
            <Text style={[styles.tabText, activeTab === 'favorites' && styles.activeTabText]}>
              Mes Favoris
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'info' ? (
          <>
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Mes objectifs</Text>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Objectif :</Text>
                <Text style={styles.value}>{getGoalLabel(profile?.goal)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Poids actuel :</Text>
                <Text style={styles.value}>
                  {profile?.weight ? `${profile.weight} kg` : 'Non défini'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Âge :</Text>
                <Text style={styles.value}>
                  {profile?.age ? `${profile.age} ans` : 'Non défini'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Activité :</Text>
                <Text style={styles.value}>{getActivityLabel(profile?.activity_level)}</Text>
              </View>
            </Card>

            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Préférences alimentaires</Text>
              {profile?.dietary_preferences ? (
                <>
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Régime :</Text>
                    <Text style={styles.value}>
                      {profile.dietary_preferences.diet_type || 'Standard'}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Repas/jour :</Text>
                    <Text style={styles.value}>
                      {profile.dietary_preferences.meals_per_day || 3}
                    </Text>
                  </View>
                </>
              ) : (
                <Text style={styles.placeholder}>Non défini</Text>
              )}
            </Card>

            <Button
              title="Se déconnecter"
              onPress={handleLogout}
              variant="outline"
              style={styles.logoutButton}
              loading={loading}
              disabled={loading}
            />
          </>
        ) : (
          <>
            {loadingFavorites ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
              </View>
            ) : favorites.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Heart size={48} color={Colors.text.light} />
                <Text style={styles.emptyTitle}>Aucun favori</Text>
                <Text style={styles.emptyText}>
                  Vous n'avez pas encore de recettes favorites. Explorez le planning pour en ajouter !
                </Text>
              </Card>
            ) : (
              favorites.map((recipe) => (
                <Card key={recipe.id} style={styles.favoriteCard}>
                  <TouchableOpacity
                    onPress={() => handleRecipePress(recipe)}
                    style={styles.favoriteContent}
                  >
                    <View style={styles.favoriteInfo}>
                      <Text style={styles.favoriteName}>{recipe.meal_name}</Text>
                      {recipe.content?.macros_detailed && (
                        <View style={styles.macroRow}>
                          <Text style={styles.macroText}>
                            P: {recipe.content.macros_detailed.protein}
                          </Text>
                          <Text style={styles.macroText}>
                            G: {recipe.content.macros_detailed.carbs}
                          </Text>
                          <Text style={styles.macroText}>
                            L: {recipe.content.macros_detailed.fat}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Heart size={24} color="#FF6B9D" fill="#FF6B9D" />
                  </TouchableOpacity>
                </Card>
              ))
            )}
          </>
        )}
      </View>

      <RecipeModal
        visible={recipeModalVisible}
        onClose={() => setRecipeModalVisible(false)}
        mealName={selectedRecipe?.meal_name || ''}
        recipeDetails={selectedRecipe?.content as any || null}
        loading={false}
        isFavorite={true}
        onToggleFavorite={handleToggleFavorite}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Theme.spacing.xl,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  name: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Theme.spacing.xs,
  },
  email: {
    fontSize: Theme.fontSize.md,
    color: Colors.text.secondary,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.xs,
    marginBottom: Theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    gap: Theme.spacing.xs,
  },
  activeTab: {
    backgroundColor: `${Colors.primary}15`,
  },
  tabText: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.medium,
    color: Colors.text.secondary,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: Theme.fontWeight.bold,
  },
  card: {
    marginBottom: Theme.spacing.md,
  },
  sectionTitle: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.sm,
  },
  label: {
    fontSize: Theme.fontSize.md,
    color: Colors.text.secondary,
  },
  value: {
    fontSize: Theme.fontSize.md,
    color: Colors.text.primary,
    fontWeight: Theme.fontWeight.medium,
  },
  placeholder: {
    fontSize: Theme.fontSize.md,
    color: Colors.text.light,
    fontStyle: 'italic',
  },
  logoutButton: {
    marginTop: Theme.spacing.md,
  },
  loadingContainer: {
    padding: Theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    padding: Theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text.primary,
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
  },
  emptyText: {
    fontSize: Theme.fontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  favoriteCard: {
    marginBottom: Theme.spacing.md,
  },
  favoriteContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  favoriteInfo: {
    flex: 1,
    marginRight: Theme.spacing.md,
  },
  favoriteName: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.medium,
    color: Colors.text.primary,
    marginBottom: Theme.spacing.xs,
  },
  macroRow: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
  },
  macroText: {
    fontSize: Theme.fontSize.sm,
    color: Colors.text.secondary,
  },
});
