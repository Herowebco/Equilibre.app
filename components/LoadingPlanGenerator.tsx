import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
// Temporairement désactivé pour le débogage
// import Animated, {
//   useAnimatedStyle,
//   useSharedValue,
//   withRepeat,
//   withTiming,
//   withSequence,
// } from 'react-native-reanimated';
import { ChefHat } from 'lucide-react-native';
import { Colors, Theme } from '@/constants';

const LOADING_MESSAGES = [
  "Analyse de vos préférences alimentaires...",
  "Calcul de vos besoins caloriques journaliers...",
  "Recherche de recettes saines et gourmandes...",
  "Équilibrage des macronutriments (Protéines, Glucides, Lipides)...",
  "Ajustement des portions pour votre objectif...",
  "Dressage final de votre menu de la semaine !",
];

interface LoadingPlanGeneratorProps {
  visible?: boolean;
}

export default function LoadingPlanGenerator({ visible = true }: LoadingPlanGeneratorProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  // Temporairement désactivé pour le débogage
  // const bounceValue = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;

    // Temporairement désactivé pour le débogage
    // bounceValue.value = withRepeat(
    //   withSequence(
    //     withTiming(-10, { duration: 400 }),
    //     withTiming(0, { duration: 400 })
    //   ),
    //   -1,
    //   false
    // );

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [visible]);

  // Temporairement désactivé pour le débogage
  // const animatedStyle = useAnimatedStyle(() => ({
  //   transform: [{ translateY: bounceValue.value }],
  // }));

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <ChefHat size={64} color={Colors.primary} strokeWidth={2} />
        </View>
        <Text style={styles.message}>{LOADING_MESSAGES[messageIndex]}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
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
  container: {
    backgroundColor: Colors.white,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.xl,
    alignItems: 'center',
    maxWidth: '80%',
  },
  iconContainer: {
    marginBottom: Theme.spacing.lg,
  },
  message: {
    fontSize: Theme.fontSize.md,
    color: Colors.text.primary,
    fontWeight: Theme.fontWeight.medium,
    textAlign: 'center',
    minHeight: 48,
  },
});
