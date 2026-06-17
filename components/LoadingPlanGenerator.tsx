import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { ChefHat } from 'lucide-react-native';
import { Colors, Theme } from '@/constants';

const LOADING_MESSAGES = [
  'Analyse de vos préférences alimentaires...',
  'Calcul de vos besoins caloriques journaliers...',
  'Recherche de recettes saines et gourmandes...',
  'Équilibrage des macronutriments...',
  'Ajustement des portions pour votre objectif...',
  'Dressage final de votre menu de la semaine !',
];

// Durée totale estimée : 30 secondes → barre atteint 88% en 30s
const TOTAL_DURATION_MS = 30000;

interface LoadingPlanGeneratorProps {
  visible?: boolean;
}

export default function LoadingPlanGenerator({ visible = true }: LoadingPlanGeneratorProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      setMessageIndex(0);
      progressAnim.setValue(0);
      return;
    }

    // Barre indépendante : monte de 0 à 88% en 30s, jamais en arrière
    Animated.timing(progressAnim, {
      toValue: 88,
      duration: TOTAL_DURATION_MS,
      useNativeDriver: false,
    }).start();

    // Messages qui tournent indépendamment
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 4000);

    return () => {
      clearInterval(interval);
      progressAnim.stopAnimation();
    };
  }, [visible]);

  if (!visible) return null;

  const widthInterpolate = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <ChefHat size={56} color={Colors.primary} strokeWidth={2} />
        </View>

        <Text style={styles.title}>Génération en cours</Text>
        <Text style={styles.message}>{LOADING_MESSAGES[messageIndex]}</Text>

        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: widthInterpolate }]} />
        </View>

        <Text style={styles.hint}>Cela peut prendre 15 à 30 secondes</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    backgroundColor: Colors.white,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.xl,
    alignItems: 'center',
    width: '82%',
  },
  iconContainer: {
    marginBottom: Theme.spacing.md,
  },
  title: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Theme.spacing.sm,
  },
  message: {
    fontSize: Theme.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    minHeight: 40,
    marginBottom: Theme.spacing.lg,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    backgroundColor: '#E8F5EE',
    borderRadius: 100,
    overflow: 'hidden',
    marginBottom: Theme.spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 100,
  },
  hint: {
    fontSize: Theme.fontSize.xs,
    color: Colors.text.light,
    marginTop: Theme.spacing.xs,
  },
});
