import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../src/api/client';
import { Colors, Spacing, Radius, FontSize, FontWeight, Gradients, Shadows } from '../../src/theme';
import { ScreenWrapper, Card, SectionHeader, Badge, GradientButton } from '../../src/components/ui';

export default function BodyScreen() {
  const { data: measurements, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['body'],
    queryFn: () => api.body.list(60),
  });

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  }

  const entries = measurements ?? [];

  // Weight trend data
  const weightEntries = entries.filter((e: any) => e.weightKg != null).reverse();
  const latestWeight = weightEntries.length > 0 ? weightEntries[weightEntries.length - 1].weightKg : null;
  const firstWeight = weightEntries.length > 0 ? weightEntries[0].weightKg : null;
  const weightChange = latestWeight && firstWeight ? latestWeight - firstWeight : null;

  // Moving average
  function movingAverage(data: number[], window = 7): number[] {
    return data.map((_, i) => {
      const start = Math.max(0, i - window + 1);
      const slice = data.slice(start, i + 1);
      return slice.reduce((s, v) => s + v, 0) / slice.length;
    });
  }

  const rawWeights = weightEntries.map((e: any) => e.weightKg);
  const maWeights = movingAverage(rawWeights);
  const maxWeight = rawWeights.length > 0 ? Math.max(...rawWeights) : 1;
  const minWeight = rawWeights.length > 0 ? Math.min(...rawWeights) : 0;
  const range = maxWeight - minWeight || 1;
  const chartHeight = 120;

  return (
    <ScreenWrapper onRefresh={onRefresh} refreshing={isRefetching}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
        <Ionicons name="chevron-back" size={20} color={Colors.primary} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Body Tracking</Text>
      <Text style={styles.subtitle}>{entries.length} measurements recorded</Text>

      {/* Current stats */}
      {latestWeight && (
        <Card gradientAccent={Gradients.primary} style={styles.currentCard}>
          <View style={styles.currentRow}>
            <View style={styles.currentItem}>
              <Text style={styles.currentLabel}>Current</Text>
              <Text style={styles.currentValue}>{latestWeight} kg</Text>
            </View>
            {weightChange !== null && (
              <>
                <View style={styles.currentDivider} />
                <View style={styles.currentItem}>
                  <Text style={styles.currentLabel}>Change</Text>
                  <Text style={[styles.currentValue, { color: weightChange >= 0 ? Colors.success : Colors.error }]}>
                    {weightChange >= 0 ? '+' : ''}{Math.round(weightChange * 10) / 10} kg
                  </Text>
                </View>
              </>
            )}
          </View>
        </Card>
      )}

      {/* Weight Chart */}
      {rawWeights.length > 1 && (
        <>
          <SectionHeader title="Weight Trend" />
          <Card style={styles.chartCard}>
            <View style={[styles.chartBody, { height: chartHeight }]}>
              {/* Grid lines */}
              <View style={[styles.gridLine, { top: 0 }]} />
              <View style={[styles.gridLine, { top: chartHeight / 2 }]} />
              <View style={[styles.gridLine, { top: chartHeight - 1 }]} />

              <View style={styles.chartLabels}>
                <Text style={styles.chartLabel}>{Math.round(maxWeight * 10) / 10}</Text>
                <Text style={styles.chartLabel}>{Math.round(((maxWeight + minWeight) / 2) * 10) / 10}</Text>
                <Text style={styles.chartLabel}>{Math.round(minWeight * 10) / 10}</Text>
              </View>

              <View style={styles.barsRow}>
                {rawWeights.map((w: number, i: number) => {
                  const pct = ((w - minWeight) / range) * 100;
                  const maPct = ((maWeights[i] - minWeight) / range) * 100;
                  const isLatest = i === rawWeights.length - 1;
                  return (
                    <View key={i} style={styles.barCol}>
                      {/* Moving average dot */}
                      <View style={[styles.maDot, { bottom: `${Math.max(maPct, 2)}%` }]} />
                      {/* Raw weight bar */}
                      <View style={[styles.barOuter, { height: `${Math.max(pct, 3)}%` }]}>
                        <LinearGradient
                          colors={isLatest ? (Gradients.accent as [string, string]) : (Gradients.primary as [string, string])}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          style={styles.barInner}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
                <Text style={styles.legendText}>Weight</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.accent, borderRadius: 4 }]} />
                <Text style={styles.legendText}>7-day avg</Text>
              </View>
            </View>
          </Card>
        </>
      )}

      {/* Measurement History */}
      <SectionHeader title="History" />
      {entries.length === 0 ? (
        <Card>
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📏</Text>
            <Text style={styles.emptyText}>No measurements yet</Text>
            <Text style={styles.emptySubtext}>Log your first body measurement</Text>
          </View>
        </Card>
      ) : (
        entries.slice(0, 20).map((entry: any) => (
          <Card key={entry.id} style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyDate}>
                {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
            <View style={styles.historyMetrics}>
              {entry.weightKg != null && (
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Weight</Text>
                  <Text style={styles.metricValue}>{entry.weightKg} kg</Text>
                </View>
              )}
              {entry.bodyFatPct != null && (
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Body Fat</Text>
                  <Text style={styles.metricValue}>{entry.bodyFatPct}%</Text>
                </View>
              )}
              {entry.chestCm != null && (
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Chest</Text>
                  <Text style={styles.metricValue}>{entry.chestCm} cm</Text>
                </View>
              )}
              {entry.waistCm != null && (
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Waist</Text>
                  <Text style={styles.metricValue}>{entry.waistCm} cm</Text>
                </View>
              )}
              {entry.leftArmCm != null && (
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>L Arm</Text>
                  <Text style={styles.metricValue}>{entry.leftArmCm} cm</Text>
                </View>
              )}
              {entry.rightArmCm != null && (
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>R Arm</Text>
                  <Text style={styles.metricValue}>{entry.rightArmCm} cm</Text>
                </View>
              )}
            </View>
            {entry.notes && <Text style={styles.historyNotes}>{entry.notes}</Text>}
          </Card>
        ))
      )}

      <GradientButton
        title="Log Measurement"
        icon="📏"
        onPress={() => router.push('/body/log')}
        variant="primary"
        size="lg"
        style={{ marginTop: Spacing.lg }}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.md },
  backText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: Spacing.xs, marginBottom: Spacing.lg },
  currentCard: { marginBottom: Spacing.lg },
  currentRow: { flexDirection: 'row', alignItems: 'center', paddingTop: Spacing.xs },
  currentItem: { flex: 1, alignItems: 'center', gap: 2 },
  currentLabel: { fontSize: FontSize.xxs, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  currentValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.black, color: Colors.text },
  currentDivider: { width: 1, height: 40, backgroundColor: Colors.border },
  chartCard: { padding: Spacing.md, marginBottom: Spacing.lg },
  chartBody: { position: 'relative', flexDirection: 'row' },
  gridLine: { position: 'absolute', left: 36, right: 0, height: 1, backgroundColor: Colors.borderSubtle },
  chartLabels: { width: 36, justifyContent: 'space-between' },
  chartLabel: { fontSize: 8, color: Colors.textMuted, textAlign: 'right' },
  barsRow: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 2, paddingLeft: 4 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%', position: 'relative' },
  barOuter: { width: '70%', borderRadius: 2, overflow: 'hidden' },
  barInner: { flex: 1, borderRadius: 2 },
  maDot: { position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.accent, zIndex: 1 },
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.lg, marginTop: Spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 1 },
  legendText: { fontSize: FontSize.xxs, color: Colors.textMuted },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.xs },
  emptyEmoji: { fontSize: 36 },
  emptyText: { fontSize: FontSize.md, color: Colors.textMuted, fontWeight: FontWeight.semibold },
  emptySubtext: { fontSize: FontSize.xs, color: Colors.textDisabled },
  historyCard: { marginBottom: Spacing.sm },
  historyHeader: { marginBottom: Spacing.sm, paddingTop: Spacing.xs },
  historyDate: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.text },
  historyMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  metric: { alignItems: 'center', minWidth: 60 },
  metricLabel: { fontSize: FontSize.xxs, color: Colors.textMuted, textTransform: 'uppercase' },
  metricValue: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.text, marginTop: 2 },
  historyNotes: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.sm, fontStyle: 'italic' },
});
