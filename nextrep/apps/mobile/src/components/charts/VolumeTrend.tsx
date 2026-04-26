import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radius, FontSize, FontWeight, Gradients } from '../../theme';

interface DataPoint {
  week: string;
  volume: number;
}

interface Props {
  data: DataPoint[];
}

export function VolumeTrend({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No volume data yet</Text>
        <Text style={styles.emptySubtext}>Complete workouts to see your volume trend</Text>
      </View>
    );
  }

  const maxVolume = Math.max(...data.map(d => d.volume));
  const chartHeight = 140;

  // Calculate trend
  const firstHalf = data.slice(0, Math.floor(data.length / 2));
  const secondHalf = data.slice(Math.floor(data.length / 2));
  const firstAvg = firstHalf.reduce((s, d) => s + d.volume, 0) / (firstHalf.length || 1);
  const secondAvg = secondHalf.reduce((s, d) => s + d.volume, 0) / (secondHalf.length || 1);
  const trendUp = secondAvg >= firstAvg;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Volume Trend</Text>
        <View style={[styles.trendBadge, { backgroundColor: trendUp ? Colors.successMuted : Colors.errorMuted }]}>
          <Text style={[styles.trendText, { color: trendUp ? Colors.success : Colors.error }]}>
            {trendUp ? '↑' : '↓'} {Math.abs(Math.round(((secondAvg - firstAvg) / (firstAvg || 1)) * 100))}%
          </Text>
        </View>
      </View>

      <View style={[styles.chartBody, { height: chartHeight }]}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
          <View key={pct} style={[styles.gridLine, { top: pct * chartHeight }]} />
        ))}

        {/* Bars */}
        <View style={styles.barsRow}>
          {data.map((d, i) => {
            const pct = (d.volume / maxVolume) * 100;
            const weekDate = new Date(d.week);
            const weekLabel = `${weekDate.getMonth() + 1}/${weekDate.getDate()}`;
            const isLatest = i === data.length - 1;
            return (
              <View key={i} style={styles.barCol}>
                <View style={[styles.barOuter, { height: `${Math.max(pct, 3)}%` }]}>
                  <LinearGradient
                    colors={isLatest ? (Gradients.accent as [string, string]) : (Gradients.primary as [string, string])}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.barInner}
                  />
                </View>
                {i % Math.max(1, Math.floor(data.length / 5)) === 0 && (
                  <Text style={styles.xLabel}>{weekLabel}</Text>
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <Text style={styles.summaryText}>
          Total: <Text style={styles.summaryValue}>{Math.round(data.reduce((s, d) => s + d.volume, 0)).toLocaleString()} kg</Text>
        </Text>
        <Text style={styles.summaryText}>
          Avg/week: <Text style={styles.summaryValue}>{Math.round(data.reduce((s, d) => s + d.volume, 0) / data.length).toLocaleString()} kg</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  trendBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.full },
  trendText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  emptyContainer: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.xs },
  emptyText: { fontSize: FontSize.md, color: Colors.textMuted, fontWeight: FontWeight.semibold },
  emptySubtext: { fontSize: FontSize.xs, color: Colors.textDisabled },
  chartBody: { position: 'relative' },
  gridLine: { 
    position: 'absolute', left: 0, right: 0, height: 1,
    backgroundColor: Colors.borderSubtle,
  },
  barsRow: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 3, paddingTop: 4 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  barOuter: { width: '80%', borderRadius: 3, overflow: 'hidden' },
  barInner: { flex: 1, borderRadius: 3 },
  xLabel: { fontSize: 8, color: Colors.textMuted, marginTop: 4 },
  summaryRow: { 
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: Colors.bgMuted, borderRadius: Radius.md,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md,
  },
  summaryText: { fontSize: FontSize.xs, color: Colors.textMuted },
  summaryValue: { color: Colors.text, fontWeight: FontWeight.bold },
});
