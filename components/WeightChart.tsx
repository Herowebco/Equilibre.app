import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Colors, Theme } from '@/constants';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { TrendingDown, Scale } from 'lucide-react-native';

interface WeightEntry {
  weight: number;
  date: string;
}

export function WeightChart() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [weightData, setWeightData] = useState<WeightEntry[]>([]);
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - Theme.spacing.lg * 2 - 32;

  useEffect(() => {
    if (user) {
      loadWeightHistory();
    }
  }, [user]);

  const loadWeightHistory = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('weight_history')
        .select('weight, date')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (error) throw error;

      if (data) {
        setWeightData(data);
      }
    } catch (error) {
      console.error('Error loading weight history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('fr-FR', { month: 'short' });
    return `${day} ${month}`;
  };

  const prepareChartData = () => {
    const labels = weightData.map((entry) => formatDate(entry.date));
    const data = weightData.map((entry) => entry.weight);

    return {
      labels: labels.length > 7 ? labels.filter((_, i) => i % Math.ceil(labels.length / 7) === 0) : labels,
      datasets: [
        {
          data: data,
        },
      ],
    };
  };

  const getWeightChange = () => {
    if (weightData.length < 2) return null;
    const firstWeight = weightData[0].weight;
    const lastWeight = weightData[weightData.length - 1].weight;
    const change = lastWeight - firstWeight;
    return {
      value: Math.abs(change),
      isDecrease: change < 0,
    };
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Chargement de votre historique...</Text>
      </View>
    );
  }

  if (weightData.length < 2) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Scale size={48} color={Colors.primary} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>Votre courbe arrive bientôt</Text>
          <Text style={styles.emptyText}>
            Votre graphique d'évolution apparaîtra après votre prochaine pesée. Suivez vos progrès jour après jour !
          </Text>
        </View>
      </View>
    );
  }

  const chartData = prepareChartData();
  const weightChange = getWeightChange();
  const minWeight = Math.min(...weightData.map(d => d.weight));
  const maxWeight = Math.max(...weightData.map(d => d.weight));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Évolution de votre poids</Text>
        {weightChange && (
          <View style={styles.changeContainer}>
            <TrendingDown
              size={16}
              color={weightChange.isDecrease ? Colors.success : Colors.danger}
              style={{
                transform: [{ rotate: weightChange.isDecrease ? '0deg' : '180deg' }],
              }}
            />
            <Text
              style={[
                styles.changeText,
                { color: weightChange.isDecrease ? Colors.success : Colors.danger },
              ]}
            >
              {weightChange.isDecrease ? '-' : '+'}{weightChange.value.toFixed(1)} kg
            </Text>
          </View>
        )}
      </View>

      <View style={styles.chartContainer}>
        <LineChart
          data={chartData}
          width={chartWidth}
          height={220}
          chartConfig={{
            backgroundColor: Colors.white,
            backgroundGradientFrom: Colors.white,
            backgroundGradientTo: Colors.white,
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
            labelColor: (opacity = 1) => Colors.text.secondary,
            style: {
              borderRadius: Theme.borderRadius.md,
            },
            propsForDots: {
              r: '5',
              strokeWidth: '2',
              stroke: Colors.primary,
              fill: Colors.white,
            },
            propsForBackgroundLines: {
              strokeDasharray: '',
              stroke: Colors.border,
              strokeWidth: 1,
            },
          }}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: Theme.borderRadius.md,
          }}
          fromZero={false}
          segments={4}
          yAxisSuffix=" kg"
        />
      </View>

      <View style={styles.footer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Début</Text>
          <Text style={styles.statValue}>{weightData[0].weight} kg</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Actuel</Text>
          <Text style={styles.statValue}>{weightData[weightData.length - 1].weight} kg</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Mesures</Text>
          <Text style={styles.statValue}>{weightData.length}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  title: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text.primary,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
    backgroundColor: `${Colors.success}15`,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.sm,
  },
  changeText: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.bold,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: Theme.spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Theme.spacing.md,
    paddingTop: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: Theme.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Theme.spacing.xs,
  },
  statValue: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text.primary,
  },
  loadingText: {
    marginTop: Theme.spacing.md,
    fontSize: Theme.fontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text.primary,
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: Theme.fontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Theme.spacing.md,
  },
});
