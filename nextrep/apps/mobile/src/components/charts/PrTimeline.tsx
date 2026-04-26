import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../theme';

interface PR {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  recordType: string;
  value: number;
  achievedAt: string;
}

interface Props {
  data: PR[];
}

function formatPrType(type: string): { label: string; emoji: string; color: string } {
  switch (type) {
    case 'MAX_WEIGHT': return { label: 'Max Weight', emoji: '🏋️', color: Colors.primary };
    case 'MAX_REPS': return { label: 'Max Reps', emoji: '🔄', color: Colors.success };
    case 'MAX_VOLUME': return { label: 'Max Volume', emoji: '📦', color: Colors.accent };
    case 'ESTIMATED_1RM': return { label: 'Est. 1RM', emoji: '💪', color: '#A78BFA' };
    default: return { label: type, emoji: '🏆', color: Colors.primary };
  }
}

function formatValue(type: string, value: number): string {
  switch (type) {
    case 'MAX_WEIGHT': return `${value} kg`;
    case 'MAX_REPS': return `${value} reps`;
    case 'MAX_VOLUME': return `${Math.round(value)} kg`;
    case 'ESTIMATED_1RM': return `${Math.round(value * 10) / 10} kg`;
    default: return `${value}`;
  }
}

export function PrTimeline({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No PRs yet</Text>
        <Text style={styles.emptySubtext}>Push harder to set personal records! 💪</Text>
      </View>
    );
  }

  // Sort by date descending
  const sorted = [...data].sort((a, b) => 
    new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime()
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>PR Timeline</Text>
        <Text style={styles.countBadge}>{data.length} records</Text>
      </View>

      {sorted.slice(0, 15).map((pr, i) => {
        const { label, emoji, color } = formatPrType(pr.recordType);
        const isFirst = i === 0;
        return (
          <View key={`${pr.exerciseId}-${pr.recordType}-${i}`} style={styles.timelineItem}>
            {/* Timeline line */}
            <View style={styles.timelineLine}>
              <View style={[styles.dot, { backgroundColor: color }, isFirst && styles.dotActive]} />
              {i < sorted.length - 1 && <View style={styles.lineSegment} />}
            </View>

            {/* Content */}
            <View style={[styles.card, isFirst && { borderColor: color, borderWidth: 1 }]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardEmoji}>{emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.exerciseName}>{pr.exerciseName}</Text>
                  <Text style={styles.prType}>{label}</Text>
                </View>
                <Text style={[styles.prValue, { color }]}>{formatValue(pr.recordType, pr.value)}</Text>
              </View>
              <View style={styles.cardFooter}>
                <View style={[styles.muscleBadge, { backgroundColor: `${color}20` }]}>
                  <Text style={[styles.muscleText, { color }]}>{pr.muscleGroup}</Text>
                </View>
                <Text style={styles.dateText}>
                  {new Date(pr.achievedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.xs },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  title: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  countBadge: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.medium },
  emptyContainer: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.xs },
  emptyText: { fontSize: FontSize.md, color: Colors.textMuted, fontWeight: FontWeight.semibold },
  emptySubtext: { fontSize: FontSize.xs, color: Colors.textDisabled },
  timelineItem: { flexDirection: 'row', minHeight: 64 },
  timelineLine: { width: 24, alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 14 },
  dotActive: { width: 14, height: 14, borderRadius: 7, marginTop: 12 },
  lineSegment: { width: 2, flex: 1, backgroundColor: Colors.borderSubtle, marginTop: 2 },
  card: {
    flex: 1, backgroundColor: Colors.bgCard, borderRadius: Radius.md,
    padding: Spacing.sm, marginLeft: Spacing.sm, marginBottom: Spacing.xs,
    borderWidth: 1, borderColor: Colors.borderSubtle,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  cardEmoji: { fontSize: 18 },
  exerciseName: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text },
  prType: { fontSize: FontSize.xxs, color: Colors.textMuted, marginTop: 1 },
  prValue: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.xs },
  muscleBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.full },
  muscleText: { fontSize: FontSize.xxs, fontWeight: FontWeight.semibold },
  dateText: { fontSize: FontSize.xxs, color: Colors.textMuted },
});
