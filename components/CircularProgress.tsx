import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Theme } from '@/constants';

interface CircularProgressProps {
  current: number;
  goal: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function CircularProgress({
  current,
  goal,
  size = 160,
  strokeWidth = 12,
  color = Colors.primary,
}: CircularProgressProps) {
  const progress = Math.min((current / goal) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: progress,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [progress]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  const isOverGoal = current > goal;
  const displayColor = isOverGoal ? '#FF6B6B' : color;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E5E5"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={displayColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.textContainer}>
        <Text style={[styles.currentValue, isOverGoal && styles.overGoalText]}>
          {Math.round(current)}
        </Text>
        <Text style={styles.separator}>/</Text>
        <Text style={styles.goalValue}>{Math.round(goal)}</Text>
        <Text style={styles.unit}>kcal</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  currentValue: {
    fontSize: 28,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.primary,
  },
  separator: {
    fontSize: 16,
    color: Colors.text.light,
    marginVertical: -4,
  },
  goalValue: {
    fontSize: 18,
    fontWeight: Theme.fontWeight.medium,
    color: Colors.text.secondary,
  },
  unit: {
    fontSize: 12,
    color: Colors.text.light,
    marginTop: 2,
  },
  overGoalText: {
    color: '#FF6B6B',
  },
});
