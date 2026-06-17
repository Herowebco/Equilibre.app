import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import CircularProgress from './CircularProgress';
import { Colors, Theme } from '@/constants';

interface MacroBarProps {
  label: string;
  current: number;
  goal: number;
  color: string;
}

function MacroBar({ label, current, goal, color }: MacroBarProps) {
  const progress = Math.min((current / goal) * 100, 100);
  const isGoalReached = current > 0 && Math.abs(current - goal) / goal <= 0.1;
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: progress,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const widthInterpolate = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const barColor = isGoalReached ? '#4CAF50' : color;

  return (
    <View style={styles.macroItem}>
      <Text style={styles.macroLabel}>{label}</Text>
      <View style={styles.progressBarBackground}>
        <Animated.View
          style={[
            styles.progressBarFill,
            { width: widthInterpolate, backgroundColor: barColor },
          ]}
        />
      </View>
      <Text style={[styles.macroValue, isGoalReached && styles.macroValueSuccess]}>
        {Math.round(current)}g / {Math.round(goal)}g{isGoalReached ? ' ✓' : ''}
      </Text>
    </View>
  );
}

interface DailyTrackerProps {
  consumed: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  goals: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
}

export default function DailyTracker({ consumed, goals }: DailyTrackerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Suivi quotidien</Text>

      <View style={styles.content}>
        <View style={styles.caloriesSection}>
          <CircularProgress
            current={consumed.calories}
            goal={goals.calories}
            size={140}
            strokeWidth={10}
          />
        </View>

        <View style={styles.macrosSection}>
          <MacroBar
            label="Protéines"
            current={consumed.protein}
            goal={goals.protein}
            color="#4ECDC4"
          />
          <MacroBar
            label="Glucides"
            current={consumed.carbs}
            goal={goals.carbs}
            color="#FFD93D"
          />
          <MacroBar
            label="Lipides"
            current={consumed.fats}
            goal={goals.fats}
            color="#FF6B9D"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Theme.spacing.md,
  },
  content: {
    flexDirection: 'row',
    gap: Theme.spacing.lg,
  },
  caloriesSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  macrosSection: {
    flex: 1,
    justifyContent: 'center',
    gap: Theme.spacing.md,
  },
  macroItem: {
    width: '100%',
    gap: 4,
  },
  macroLabel: {
    fontSize: Theme.fontSize.xs,
    fontWeight: Theme.fontWeight.medium,
    color: Colors.text.primary,
  },
  macroValue: {
    fontSize: Theme.fontSize.xs,
    color: Colors.text.secondary,
    textAlign: 'right',
  },
  macroValueSuccess: {
    color: '#4CAF50',
    fontWeight: Theme.fontWeight.medium,
  },
  progressBarBackground: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E5E5',
    borderRadius: 100,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 100,
  },
});
