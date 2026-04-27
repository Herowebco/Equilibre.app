import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { RefreshCw, ChevronRight, CircleCheck as CheckCircle, Circle, Heart } from 'lucide-react-native';
import { Colors, Theme } from '@/constants';

interface MealCardProps {
  mealType: string;
  mealName: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  ingredients: string[];
  isConsumed?: boolean;
  isFavorite?: boolean;
  onRegenerate?: () => void;
  onPress?: () => void;
  onToggleConsume?: () => void;
  onToggleFavorite?: () => void;
}

export function MealCard({
  mealType,
  mealName,
  calories,
  protein,
  carbs,
  fat,
  ingredients,
  isConsumed = false,
  isFavorite = false,
  onRegenerate,
  onPress,
  onToggleConsume,
  onToggleFavorite,
}: MealCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsExpansion, setNeedsExpansion] = useState(false);
  const [optimisticFavorite, setOptimisticFavorite] = useState(isFavorite);

  useEffect(() => {
    setOptimisticFavorite(isFavorite);
  }, [isFavorite]);

  const handleFavoritePress = (e: any) => {
    e.stopPropagation();
    setOptimisticFavorite(!optimisticFavorite);
    onToggleFavorite?.();
  };

  const ingredientsText = ingredients.join(', ');
  const hasMacros = protein !== undefined || carbs !== undefined || fat !== undefined;

  return (
    <View style={[styles.mealItem, isConsumed && styles.mealItemConsumed]}>
      <View style={styles.mealHeader}>
        <View style={styles.mealInfo}>
          <Text style={styles.mealType}>{mealType}</Text>
          <Text style={styles.mealCalories}>{calories} kcal</Text>
        </View>
        <View style={styles.actionsContainer}>
          {onToggleFavorite && (
            <TouchableOpacity style={styles.favoriteButton} onPress={handleFavoritePress}>
              <Heart
                size={20}
                color={optimisticFavorite ? '#e74c3c' : Colors.text.light}
                fill={optimisticFavorite ? '#e74c3c' : 'transparent'}
              />
            </TouchableOpacity>
          )}
          {onToggleConsume && (
            <TouchableOpacity
              style={[styles.checkButton, isConsumed && styles.checkButtonActive]}
              onPress={onToggleConsume}
            >
              {isConsumed ? (
                <CheckCircle size={20} color={Colors.primary} />
              ) : (
                <Circle size={20} color={Colors.text.light} />
              )}
            </TouchableOpacity>
          )}
          {onRegenerate && !isConsumed && (
            <TouchableOpacity style={styles.replaceButton} onPress={onRegenerate}>
              <RefreshCw size={18} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={styles.mealNameContainer}
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={0.7}
      >
        <Text style={styles.mealName}>{mealName}</Text>
        {onPress && (
          <ChevronRight size={20} color={Colors.primary} />
        )}
      </TouchableOpacity>

      {hasMacros && (
        <View style={styles.macrosRow}>
          {protein !== undefined && (
            <View style={[styles.macroBadge, styles.macroBadgeProtein]}>
              <Text style={[styles.macroBadgeText, styles.macroBadgeTextProtein]}>
                P {Math.round(protein)}g
              </Text>
            </View>
          )}
          {carbs !== undefined && (
            <View style={[styles.macroBadge, styles.macroBadgeCarbs]}>
              <Text style={[styles.macroBadgeText, styles.macroBadgeTextCarbs]}>
                G {Math.round(carbs)}g
              </Text>
            </View>
          )}
          {fat !== undefined && (
            <View style={[styles.macroBadge, styles.macroBadgeFat]}>
              <Text style={[styles.macroBadgeText, styles.macroBadgeTextFat]}>
                L {Math.round(fat)}g
              </Text>
            </View>
          )}
        </View>
      )}

      {ingredients && ingredients.length > 0 && (
        <TouchableOpacity activeOpacity={0.7} onPress={() => setIsExpanded(!isExpanded)}>
          <Text
            style={styles.ingredients}
            numberOfLines={isExpanded ? undefined : 2}
            onTextLayout={(e) => {
              if (e.nativeEvent.lines.length > 2) {
                setNeedsExpansion(true);
              }
            }}
          >
            {ingredientsText}
          </Text>
          {needsExpansion && (
            <Text style={styles.expandText}>
              {isExpanded ? 'Voir moins' : 'Voir plus'}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mealItem: {
    paddingVertical: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  mealItemConsumed: {
    backgroundColor: '#F8FFF8',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
  },
  mealInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mealType: {
    fontSize: Theme.fontSize.sm,
    color: Colors.primary,
    fontWeight: Theme.fontWeight.medium,
    marginRight: Theme.spacing.md,
    textTransform: 'capitalize',
  },
  mealCalories: {
    fontSize: Theme.fontSize.sm,
    color: Colors.text.secondary,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: Theme.spacing.xs,
  },
  favoriteButton: {
    padding: Theme.spacing.xs,
  },
  checkButton: {
    padding: Theme.spacing.xs,
  },
  checkButtonActive: {
    backgroundColor: `${Colors.primary}10`,
    borderRadius: Theme.borderRadius.md,
  },
  replaceButton: {
    padding: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: `${Colors.primary}15`,
  },
  mealNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.xs,
  },
  mealName: {
    flex: 1,
    fontSize: Theme.fontSize.md,
    color: Colors.text.primary,
    fontWeight: Theme.fontWeight.medium,
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Theme.spacing.xs,
  },
  macroBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  macroBadgeProtein: {
    backgroundColor: '#E8FAF9',
  },
  macroBadgeCarbs: {
    backgroundColor: '#FFF9E6',
  },
  macroBadgeFat: {
    backgroundColor: '#FFF0F6',
  },
  macroBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  macroBadgeTextProtein: {
    color: '#2BBDB4',
  },
  macroBadgeTextCarbs: {
    color: '#C8962A',
  },
  macroBadgeTextFat: {
    color: '#D9507A',
  },
  ingredients: {
    fontSize: Theme.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  expandText: {
    fontSize: Theme.fontSize.sm,
    color: Colors.primary,
    fontWeight: Theme.fontWeight.medium,
    marginTop: Theme.spacing.xs,
  },
});
