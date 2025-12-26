import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { RefreshCw, ChevronRight, CheckCircle, Circle, Heart } from 'lucide-react-native';
import { Colors, Theme } from '@/constants';

interface MealCardProps {
  mealType: string;
  mealName: string;
  calories: number;
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

  return (
    <View style={[styles.mealItem, isConsumed && styles.mealItemConsumed]}>
      <View style={styles.mealHeader}>
        <View style={styles.mealInfo}>
          <Text style={[styles.mealType, isConsumed && styles.consumedText]}>
            {mealType}
          </Text>
          <Text style={[styles.mealCalories, isConsumed && styles.consumedText]}>
            {calories} kcal
          </Text>
        </View>
        <View style={styles.actionsContainer}>
          {onToggleFavorite && (
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={handleFavoritePress}
            >
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
            <TouchableOpacity
              style={styles.replaceButton}
              onPress={onRegenerate}
            >
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
        <Text style={[styles.mealName, isConsumed && styles.mealNameConsumed]}>
          {mealName}
        </Text>
        {onPress && (
          <ChevronRight size={20} color={isConsumed ? Colors.text.light : Colors.primary} />
        )}
      </TouchableOpacity>

      {ingredients && ingredients.length > 0 && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setIsExpanded(!isExpanded)}
        >
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
    opacity: 0.6,
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
  consumedText: {
    color: Colors.text.light,
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
  mealNameConsumed: {
    textDecorationLine: 'line-through',
    color: Colors.text.light,
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
