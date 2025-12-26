import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { X, Clock, ChefHat, Heart } from 'lucide-react-native';
import { Colors, Theme } from '@/constants';
import type { RecipeDetails, IngredientGroup } from '@/services/ai';

interface RecipeModalProps {
  visible: boolean;
  onClose: () => void;
  mealName: string;
  recipeDetails: RecipeDetails | null;
  loading: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

type Tab = 'ingredients' | 'instructions';

export function RecipeModal({
  visible,
  onClose,
  mealName,
  recipeDetails,
  loading,
  isFavorite = false,
  onToggleFavorite,
}: RecipeModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('ingredients');

  const getTotalTime = () => {
    if (!recipeDetails) return '';
    const prep = parseInt(recipeDetails.prep_time) || 0;
    const cook = parseInt(recipeDetails.cook_time) || 0;
    return `${prep + cook} min`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <View style={styles.headerContent}>
            <ChefHat size={24} color={Colors.primary} />
            <View style={styles.titleContainer}>
              <Text style={styles.modalTitle}>{mealName}</Text>
              {recipeDetails && (
                <View style={styles.timeContainer}>
                  <Clock size={16} color={Colors.text.secondary} />
                  <Text style={styles.timeText}>
                    Préparation: {recipeDetails.prep_time} • Cuisson: {recipeDetails.cook_time}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.headerActions}>
            {onToggleFavorite && (
              <TouchableOpacity
                onPress={onToggleFavorite}
                style={styles.favoriteButton}
              >
                <Heart
                  size={24}
                  color={isFavorite ? '#FF6B9D' : Colors.text.light}
                  fill={isFavorite ? '#FF6B9D' : 'none'}
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={Colors.text.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Le chef rédige la recette...</Text>
          </View>
        ) : recipeDetails ? (
          <>
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === 'ingredients' && styles.activeTab,
                ]}
                onPress={() => setActiveTab('ingredients')}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'ingredients' && styles.activeTabText,
                  ]}
                >
                  Ingrédients
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === 'instructions' && styles.activeTab,
                ]}
                onPress={() => setActiveTab('instructions')}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'instructions' && styles.activeTabText,
                  ]}
                >
                  Préparation
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {activeTab === 'ingredients' && (
                <View style={styles.section}>
                  {recipeDetails.ingredients.map((item: string | IngredientGroup, index: number) => {
                    if (typeof item === 'string') {
                      return (
                        <View key={index} style={styles.ingredientItem}>
                          <View style={styles.bullet} />
                          <Text style={styles.ingredientText}>{item}</Text>
                        </View>
                      );
                    }

                    if (typeof item === 'object' && 'group' in item && 'list' in item) {
                      return (
                        <View key={index} style={styles.groupContainer}>
                          <Text style={styles.groupTitle}>{item.group}</Text>
                          {item.list.map((subItem: string, subIndex: number) => (
                            <View key={subIndex} style={styles.ingredientItem}>
                              <View style={styles.bullet} />
                              <Text style={styles.ingredientText}>{subItem}</Text>
                            </View>
                          ))}
                        </View>
                      );
                    }

                    return null;
                  })}

                  {recipeDetails.macros_detailed && (
                    <View style={styles.macrosContainer}>
                      <Text style={styles.macrosTitle}>Valeurs nutritionnelles</Text>
                      <View style={styles.macrosGrid}>
                        <View style={styles.macroItem}>
                          <Text style={styles.macroValue}>
                            {recipeDetails.macros_detailed.protein}
                          </Text>
                          <Text style={styles.macroLabel}>Protéines</Text>
                        </View>
                        <View style={styles.macroItem}>
                          <Text style={styles.macroValue}>
                            {recipeDetails.macros_detailed.carbs}
                          </Text>
                          <Text style={styles.macroLabel}>Glucides</Text>
                        </View>
                        <View style={styles.macroItem}>
                          <Text style={styles.macroValue}>
                            {recipeDetails.macros_detailed.fat}
                          </Text>
                          <Text style={styles.macroLabel}>Lipides</Text>
                        </View>
                        <View style={styles.macroItem}>
                          <Text style={styles.macroValue}>
                            {recipeDetails.macros_detailed.fiber}
                          </Text>
                          <Text style={styles.macroLabel}>Fibres</Text>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {activeTab === 'instructions' && (
                <View style={styles.section}>
                  {recipeDetails.instructions.map((instruction, index) => (
                    <View key={index} style={styles.instructionItem}>
                      <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>{index + 1}</Text>
                      </View>
                      <Text style={styles.instructionText}>{instruction.replace(/^\d+\.\s*/, '')}</Text>
                    </View>
                  ))}
                </View>
              )}
              <View style={styles.bottomSpacer} />
            </ScrollView>
          </>
        ) : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Impossible de charger les détails de la recette
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: Theme.spacing.md,
  },
  titleContainer: {
    flex: 1,
    marginLeft: Theme.spacing.md,
  },
  modalTitle: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Theme.spacing.xs,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Theme.spacing.xs,
  },
  timeText: {
    fontSize: Theme.fontSize.sm,
    color: Colors.text.secondary,
    marginLeft: Theme.spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
  },
  favoriteButton: {
    padding: Theme.spacing.xs,
  },
  closeButton: {
    padding: Theme.spacing.xs,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  tab: {
    flex: 1,
    paddingVertical: Theme.spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.primary,
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
  modalContent: {
    flex: 1,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.xl,
  },
  errorText: {
    fontSize: Theme.fontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: Theme.spacing.lg,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.sm,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 8,
    marginRight: Theme.spacing.md,
  },
  ingredientText: {
    flex: 1,
    fontSize: Theme.fontSize.md,
    color: Colors.text.primary,
    lineHeight: 22,
  },
  groupContainer: {
    marginTop: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
  },
  groupTitle: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.primary,
    marginBottom: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.sm,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.lg,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.md,
  },
  stepNumberText: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.white,
  },
  instructionText: {
    flex: 1,
    fontSize: Theme.fontSize.md,
    color: Colors.text.primary,
    lineHeight: 22,
    paddingTop: 6,
  },
  macrosContainer: {
    marginTop: Theme.spacing.xl,
    padding: Theme.spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  macrosTitle: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Theme.spacing.md,
  },
  macrosGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.primary,
    marginBottom: Theme.spacing.xs,
  },
  macroLabel: {
    fontSize: Theme.fontSize.sm,
    color: Colors.text.secondary,
  },
  bottomSpacer: {
    height: 40,
  },
});
