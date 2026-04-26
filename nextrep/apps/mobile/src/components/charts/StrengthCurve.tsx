import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radius, FontSize, FontWeight, Gradients } from '../../theme';

interface DataPoint {
  date: string;
  weight: number | null;
  estimated1rm: number | null;
}

interface Props {
  data: DataPoint[];
  title?: string;
  exerciseName?: string;
}

export function StrengthCurve({ data, title = 'Strength Curve', exerciseName }: Props) {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No data yet</Text>
        <Text style={styles.emptySubtext}>Complete workouts to see your strength curve</Text>
      </View>
    );
  }

  const weights = data.map(d => d.estimated1rm ?? d.weight ?? 0).filter(w => w > 0);
  if (weights.length === 0) return null;
  
  const maxWeight = Math.max(...weights);
  const minWeight = Math.min(...weights);
  const range = maxWeight - minWeight || 1;
  const chartHeight = 160;

  // Create normalized points
  const points = data
    .map(d => d.estimated1rm ?? d.weight ?? 0)
    .filter(w => w > 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {exerciseName && <Text style={styles.exerciseName}>{exerciseName}</Text>}
      </View>
      
      {/* Y-axis labels */}
      <View style={styles.chartArea}>
        <View style={styles.yAxis}>
          <Text style={styles.axisLabel}>{Math.round(maxWeight)}</Text>
          <Text style={styles.axisLabel}>{Math.round((maxWeight + minWeight) / 2)}</Text>
          <Text style={styles.axisLabel}>{Math.round(minWeight)}</Text>
        </View>

        {/* Chart body */}
        <View style={[styles.chartBody, { height: chartHeight }]}>
          {/* Grid lines */}
          <View style={[styles.gridLine, { top: 0 }]} />
          <View style={[styles.gridLine, { top: chartHeight / 2 }]} />
          <View style={[styles.gridLine, { top: chartHeight - 1 }]} />

          {/* Bars representing each data point */}
          <View style={styles.barsRow}>
            {points.map((w, i) => {
              const pct = ((w - minWeight) / range) * 100;
              const isLast = i === points.length - 1;
              const isPeak = w === maxWeight;
              return (
                <View key={i} style={styles.barWrapper}>
                  <View style={[styles.barOuter, { height: `${Math.max(pct, 5)}%` }]}>
                    <LinearGradient
                      colors={isPeak ? ['#FFD700', '#FF6B35'] : isLast ? (Gradients.primary as [string, string]) : ['rgba(0,212,255,0.6)', 'rgba(0,212,255,0.2)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.barInner}
                    />
                  </View>
                  {isPeak && (
                    <Text style={styles.peakLabel}>🏆</Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Summary stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{Math.round(maxWeight)} kg</Text>
          <Text style={styles.statLabel}>Peak</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{Math.round(weights[weights.length - 1])} kg</Text>
          <Text style={styles.statLabel}>Latest</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: weights[weights.length - 1] >= weights[0] ? Colors.success : Colors.error }]}>
            {weights[weights.length - 1] >= weights[0] ? '+' : ''}{Math.round(weights[weights.length - 1] - weights[0])} kg
          </Text>
          <Text style={styles.statLabel}>Change</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.md },
  header: { gap: Spacing.xs },
  title: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  exerciseName: { fontSize: FontSize.xs, color: Colors.textMuted },
  emptyContainer: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.xs },
  emptyText: { fontSize: FontSize.md, color: Colors.textMuted, fontWeight: FontWeight.semibold },
  emptySubtext: { fontSize: FontSize.xs, color: Colors.textDisabled },
  chartArea: { flexDirection: 'row', gap: Spacing.sm },
  yAxis: { justifyContent: 'space-between', width: 36 },
  axisLabel: { fontSize: FontSize.xxs, color: Colors.textMuted, textAlign: 'right' },
  chartBody: { flex: 1, position: 'relative' },
  gridLine: { 
    position: 'absolute', left: 0, right: 0, height: 1,
    backgroundColor: Colors.borderSubtle,
  },
  barsRow: { 
    flex: 1, flexDirection: 'row', alignItems: 'flex-end', 
    gap: 2, paddingHorizontal: 1,
  },
  barWrapper: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  barOuter: { width: '100%', borderRadius: 2, overflow: 'hidden' },
  barInner: { flex: 1, borderRadius: 2 },
  peakLabel: { fontSize: 10, marginTop: 2 },
  statsRow: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: Colors.bgMuted, borderRadius: Radius.md,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.text },
  statLabel: { fontSize: FontSize.xxs, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1, height: 28, backgroundColor: Colors.border },
});
