import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { RefreshCw } from 'lucide-react-native';
import { Colors, Theme } from '@/constants';

interface MealCardProps {
  mealType: string;
  mealName: string;
  calories: number;
  ingredients: string[];
  onRegenerate?: () => void;
}

export function MealCard({
  mealType,
  mealName,
  calories,
  ingredients,
  onRegenerate,
}: MealCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsExpansion, setNeedsExpansion] = useState(false);

  const ingredientsText = ingredients.join(', ');

  return (
    <View style={styles.mealItem}>
      <View style={styles.mealHeader}>
        <View style={styles.mealInfo}>
          <Text style={styles.mealType}>{mealType}</Text>
          <Text style={styles.mealCalories}>{calories} kcal</Text>
        </View>
        {onRegenerate && (
          <TouchableOpacity
            style={styles.replaceButton}
            onPress={onRegenerate}
          >
            <RefreshCw size={18} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.mealName}>{mealName}</Text>

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
  replaceButton: {
    padding: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: `${Colors.primary}15`,
  },
  mealName: {
    fontSize: Theme.fontSize.md,
    color: Colors.text.primary,
    fontWeight: Theme.fontWeight.medium,
    marginBottom: Theme.spacing.xs,
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
