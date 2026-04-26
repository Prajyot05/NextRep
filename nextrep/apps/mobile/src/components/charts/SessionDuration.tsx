import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radius, FontSize, FontWeight, Gradients } from '../../theme';

interface DataPoint {
  date: string;
  duration: number; // minutes
}

interface Props {
  data: DataPoint[];
}

export function SessionDuration({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No duration data yet</Text>
        <Text style={styles.emptySubtext}>Complete workouts to track session length</Text>
      </View>
    );
  }

  const durations = data.map(d => d.duration);
  const maxDuration = Math.max(...durations);
  const avgDuration = durations.reduce((s, d) => s + d, 0) / durations.length;
  const chartHeight = 120;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Session Duration</Text>
        <Text style={styles.avgBadge}>avg {Math.round(avgDuration)}m</Text>
      </View>

      <View style={[styles.chartBody, { height: chartHeight }]}>
        {/* Average line */}
        <View style={[styles.avgLine, { bottom: (avgDuration / maxDuration) * chartHeight }]}>
          <View style={styles.avgLineDashed} />
        </View>

        {/* Bars */}
        <View style={styles.barsRow}>
          {data.map((d, i) => {
            const pct = (d.duration / maxDuration) * 100;
            const isAboveAvg = d.duration >= avgDuration;
            const isLatest = i === data.length - 1;
            return (
              <View key={i} style={styles.barCol}>
                <View style={[styles.barOuter, { height: `${Math.max(pct, 4)}%` }]}>
                  <LinearGradient
                    colors={isLatest 
                      ? (Gradients.accent as [string, string])
                      : isAboveAvg 
                        ? (Gradients.primary as [string, string])
                        : ['rgba(0,212,255,0.3)', 'rgba(0,212,255,0.1)']
                    }
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

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{Math.round(Math.min(...durations))}m</Text>
          <Text style={styles.statLabel}>Shortest</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{Math.round(avgDuration)}m</Text>
          <Text style={styles.statLabel}>Average</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{Math.round(Math.max(...durations))}m</Text>
          <Text style={styles.statLabel}>Longest</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  avgBadge: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.medium },
  emptyContainer: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.xs },
  emptyText: { fontSize: FontSize.md, color: Colors.textMuted, fontWeight: FontWeight.semibold },
  emptySubtext: { fontSize: FontSize.xs, color: Colors.textDisabled },
  chartBody: { position: 'relative' },
  avgLine: { position: 'absolute', left: 0, right: 0, zIndex: 1 },
  avgLineDashed: { height: 1, backgroundColor: Colors.warning, opacity: 0.5 },
  barsRow: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  barOuter: { width: '75%', borderRadius: 3, overflow: 'hidden' },
  barInner: { flex: 1, borderRadius: 3 },
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
