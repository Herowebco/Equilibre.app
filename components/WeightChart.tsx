import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Colors, Theme } from '@/constants';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { TrendingDown, TrendingUp, Scale } from 'lucide-react-native';

interface WeightEntry {
  weight: number;
  date: string;
}

export function WeightChart() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [weightData, setWeightData] = useState<WeightEntry[]>([]);

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - Theme.spacing.lg * 2 - Theme.spacing.md * 2;

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
      if (data) setWeightData(data);
    } catch {
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
    const maxLabels = 6;
    let entries = weightData;
    if (entries.length > maxLabels) {
      const step = Math.ceil(entries.length / maxLabels);
      entries = entries.filter((_, i) => i % step === 0 || i === weightData.length - 1);
    }
    return {
      labels: entries.map((e) => formatDate(e.date)),
      datasets: [{ data: entries.map((e) => e.weight) }],
    };
  };

  const getWeightChange = () => {
    if (weightData.length < 2) return null;
    const first = weightData[0].weight;
    const last = weightData[weightData.length - 1].weight;
    const change = last - first;
    return { value: Math.abs(change), isDecrease: change < 0 };
  };

  const weightChange = getWeightChange();

  if (loading) {
    return (
      <View style={styles.glassCard}>
        <ActivityIndicator size="small" color={Colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.glassCard}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Scale size={18} color={Colors.primary} strokeWidth={1.8} />
            <Text style={styles.title}>Suivi du poids</Text>
          </View>
          {weightChange && (
            <View
              style={[
                styles.changeBadge,
                { backgroundColor: weightChange.isDecrease ? `${Colors.success}18` : `${Colors.danger}18` },
              ]}
            >
              {weightChange.isDecrease ? (
                <TrendingDown size={13} color={Colors.success} strokeWidth={2} />
              ) : (
                <TrendingUp size={13} color={Colors.danger} strokeWidth={2} />
              )}
              <Text
                style={[
                  styles.changeText,
                  { color: weightChange.isDecrease ? Colors.success : Colors.danger },
                ]}
              >
                {weightChange.isDecrease ? '-' : '+'}
                {weightChange.value.toFixed(1)} kg
              </Text>
            </View>
          )}
        </View>

        {weightData.length < 2 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Aucune donnée disponible</Text>
            <Text style={styles.emptyText}>
              Enregistrez votre poids pour suivre votre progression.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.chartWrapper}>
              <LineChart
                data={prepareChartData()}
                width={chartWidth}
                height={180}
                chartConfig={{
                  backgroundColor: 'transparent',
                  backgroundGradientFrom: 'transparent',
                  backgroundGradientTo: 'transparent',
                  backgroundGradientFromOpacity: 0,
                  backgroundGradientToOpacity: 0,
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(133, 166, 155, ${opacity})`,
                  labelColor: () => Colors.text.secondary,
                  propsForDots: {
                    r: '4',
                    strokeWidth: '2',
                    stroke: Colors.primary,
                    fill: Colors.white,
                  },
                  propsForBackgroundLines: {
                    strokeDasharray: '4 4',
                    stroke: Colors.border,
                    strokeWidth: 1,
                  },
                  fillShadowGradient: Colors.primary,
                  fillShadowGradientOpacity: 0.12,
                }}
                bezier
                withInnerLines
                withOuterLines={false}
                withVerticalLines={false}
                style={{ borderRadius: Theme.borderRadius.md, marginLeft: -12 }}
                fromZero={false}
                segments={4}
                yAxisSuffix=" kg"
              />
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Début</Text>
                <Text style={styles.statValue}>{weightData[0].weight} kg</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Actuel</Text>
                <Text style={styles.statValue}>
                  {weightData[weightData.length - 1].weight} kg
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Mesures</Text>
                <Text style={styles.statValue}>{weightData.length}</Text>
              </View>
            </View>
          </>
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(229, 229, 229, 0.6)',
    shadowColor: '#85A69B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  title: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text.primary,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.full,
  },
  changeText: {
    fontSize: Theme.fontSize.xs,
    fontWeight: Theme.fontWeight.bold,
  },
  chartWrapper: {
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(229,229,229,0.5)',
    marginTop: Theme.spacing.xs,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(229,229,229,0.6)',
  },
  statLabel: {
    fontSize: Theme.fontSize.xs,
    color: Colors.text.light,
    marginBottom: 2,
  },
  statValue: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text.primary,
  },
  loadingText: {
    marginTop: Theme.spacing.sm,
    fontSize: Theme.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Theme.spacing.xs,
  },
  emptyText: {
    fontSize: Theme.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Theme.spacing.md,
  },
});
