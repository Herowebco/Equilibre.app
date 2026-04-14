import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LineChart } from 'react-native-chart-kit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Theme } from '@/constants';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { TrendingDown, TrendingUp, Scale, Plus, X } from 'lucide-react-native';

interface WeightEntry {
  weight: number;
  date: string;
}

export function WeightChart() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [weightData, setWeightData] = useState<WeightEntry[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [saving, setSaving] = useState(false);
  const [inputError, setInputError] = useState('');

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

  const handleAddWeight = async () => {
    const parsed = parseFloat(newWeight.replace(',', '.'));
    if (!newWeight || isNaN(parsed) || parsed <= 0 || parsed > 500) {
      setInputError('Veuillez entrer un poids valide');
      return;
    }
    if (!user) return;

    setSaving(true);
    setInputError('');

    try {
      const today = new Date().toISOString().split('T')[0];

      const { error } = await supabase
        .from('weight_history')
        .upsert(
          { user_id: user.id, weight: parsed, date: today },
          { onConflict: 'user_id,date' }
        );

      if (error) throw error;

      await supabase
        .from('profiles')
        .update({ weight: parsed })
        .eq('id', user.id);

      setModalVisible(false);
      setNewWeight('');
      await loadWeightHistory();
    } catch {
      setInputError('Une erreur est survenue');
    } finally {
      setSaving(false);
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
    <>
      <View style={styles.glassCard}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Scale size={18} color={Colors.primary} strokeWidth={1.8} />
            <Text style={styles.title}>Suivi du poids</Text>
          </View>
          <View style={styles.headerRight}>
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
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.75}
            >
              <Plus size={15} color={Colors.white} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>

        {weightData.length < 2 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Aucune donnée disponible</Text>
            <Text style={styles.emptyText}>
              Enregistrez votre poids pour suivre votre progression.
            </Text>
            <TouchableOpacity
              style={styles.emptyAddButton}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.8}
            >
              <Plus size={14} color={Colors.primary} strokeWidth={2.5} />
              <Text style={styles.emptyAddText}>Ajouter mon poids</Text>
            </TouchableOpacity>
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

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setModalVisible(false)} />
          <View style={[styles.modalCard, { paddingBottom: Math.max(insets.bottom, Theme.spacing.lg) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajouter mon poids</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <X size={18} color={Colors.text.secondary} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Poids aujourd'hui (kg)</Text>
            <TextInput
              style={[styles.input, inputError ? styles.inputError : null]}
              placeholder="Ex : 72.5"
              placeholderTextColor={Colors.text.light}
              keyboardType="decimal-pad"
              value={newWeight}
              onChangeText={(t) => { setNewWeight(t); setInputError(''); }}
              autoFocus
            />
            {inputError ? <Text style={styles.errorText}>{inputError}</Text> : null}

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleAddWeight}
              activeOpacity={0.8}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
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
  addButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: Theme.spacing.lg,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}12`,
  },
  emptyAddText: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.medium,
    color: Colors.primary,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Theme.spacing.lg,
    paddingTop: Theme.spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  modalTitle: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text.primary,
  },
  closeBtn: {
    padding: Theme.spacing.xs,
  },
  modalLabel: {
    fontSize: Theme.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Theme.spacing.sm,
    fontWeight: Theme.fontWeight.medium,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm + 4,
    fontSize: Theme.fontSize.lg,
    color: Colors.text.primary,
    marginBottom: Theme.spacing.sm,
    textAlign: 'center',
    fontWeight: Theme.fontWeight.medium,
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    fontSize: Theme.fontSize.xs,
    color: Colors.error,
    marginBottom: Theme.spacing.sm,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: Theme.borderRadius.md,
    paddingVertical: Theme.spacing.md,
    alignItems: 'center',
    marginTop: Theme.spacing.sm,
  },
  saveButtonText: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.white,
  },
});
