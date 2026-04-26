import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../theme';

interface DataPoint {
  dayOfWeek: number;
  hour: number;
  count: number;
}

interface Props {
  data: DataPoint[];
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOUR_RANGES = [
  { label: '6AM', start: 5, end: 8 },
  { label: '9AM', start: 8, end: 11 },
  { label: '12PM', start: 11, end: 14 },
  { label: '3PM', start: 14, end: 17 },
  { label: '6PM', start: 17, end: 20 },
  { label: '9PM', start: 20, end: 23 },
];

function getIntensityColor(count: number, maxCount: number): string {
  if (count === 0) return Colors.bgMuted;
  const intensity = count / maxCount;
  if (intensity > 0.75) return Colors.primary;
  if (intensity > 0.5) return 'rgba(0, 212, 255, 0.7)';
  if (intensity > 0.25) return 'rgba(0, 212, 255, 0.4)';
  return 'rgba(0, 212, 255, 0.2)';
}

export function FrequencyHeatmap({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No frequency data yet</Text>
        <Text style={styles.emptySubtext}>Work out consistently to see patterns</Text>
      </View>
    );
  }

  // Build a matrix: [dayOfWeek][hourRange] -> count
  const matrix: number[][] = Array.from({ length: 7 }, () => Array(HOUR_RANGES.length).fill(0));
  const maxCount = Math.max(...data.map(d => d.count), 1);

  for (const d of data) {
    const rangeIdx = HOUR_RANGES.findIndex(r => d.hour >= r.start && d.hour < r.end);
    if (rangeIdx >= 0 && d.dayOfWeek >= 0 && d.dayOfWeek < 7) {
      matrix[d.dayOfWeek][rangeIdx] += d.count;
    }
  }

  const actualMax = Math.max(...matrix.flat(), 1);

  // Find peak time
  let peakDay = 0, peakRange = 0, peakVal = 0;
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < HOUR_RANGES.length; h++) {
      if (matrix[d][h] > peakVal) {
        peakVal = matrix[d][h];
        peakDay = d;
        peakRange = h;
      }
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Training Frequency</Text>
      
      {/* Grid header */}
      <View style={styles.gridHeader}>
        <View style={styles.dayLabelSpacer} />
        {HOUR_RANGES.map((r) => (
          <Text key={r.label} style={styles.hourLabel}>{r.label}</Text>
        ))}
      </View>

      {/* Grid rows */}
      {DAY_LABELS.map((day, dayIdx) => (
        <View key={day} style={styles.gridRow}>
          <Text style={styles.dayLabel}>{day}</Text>
          {HOUR_RANGES.map((_, hourIdx) => {
            const count = matrix[dayIdx][hourIdx];
            return (
              <View
                key={hourIdx}
                style={[
                  styles.cell,
                  { backgroundColor: getIntensityColor(count, actualMax) },
                ]}
              >
                {count > 0 && (
                  <Text style={styles.cellCount}>{count}</Text>
                )}
              </View>
            );
          })}
        </View>
      ))}

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendText}>Less</Text>
        {[0, 0.25, 0.5, 0.75, 1].map((i) => (
          <View key={i} style={[styles.legendCell, { backgroundColor: getIntensityColor(i * actualMax, actualMax) }]} />
        ))}
        <Text style={styles.legendText}>More</Text>
      </View>

      {peakVal > 0 && (
        <Text style={styles.peakText}>
          Peak: <Text style={styles.peakValue}>{DAY_LABELS[peakDay]}s @ {HOUR_RANGES[peakRange].label}</Text>
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.sm },
  title: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  emptyContainer: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.xs },
  emptyText: { fontSize: FontSize.md, color: Colors.textMuted, fontWeight: FontWeight.semibold },
  emptySubtext: { fontSize: FontSize.xs, color: Colors.textDisabled },
  gridHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  dayLabelSpacer: { width: 32 },
  hourLabel: { flex: 1, fontSize: 8, color: Colors.textMuted, textAlign: 'center' },
  gridRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 2 },
  dayLabel: { width: 32, fontSize: FontSize.xxs, color: Colors.textMuted, fontWeight: FontWeight.medium },
  cell: {
    flex: 1, aspectRatio: 1.4, borderRadius: 3,
    alignItems: 'center', justifyContent: 'center',
  },
  cellCount: { fontSize: 8, color: Colors.text, fontWeight: FontWeight.bold },
  legend: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: Spacing.xs },
  legendCell: { width: 14, height: 14, borderRadius: 2 },
  legendText: { fontSize: 9, color: Colors.textMuted },
  peakText: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center' },
  peakValue: { color: Colors.primary, fontWeight: FontWeight.bold },
});
