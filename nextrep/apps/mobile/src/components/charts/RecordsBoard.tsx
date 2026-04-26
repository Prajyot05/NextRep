import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../theme';

interface Record {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  recordType: string;
  value: number;
  achievedAt: string;
}

interface Props {
  data: Record[];
}

function formatValue(type: string, value: number): string {
  switch (type) {
    case 'MAX_WEIGHT': return `${value} kg`;
    case 'MAX_REPS': return `${value} reps`;
    case 'MAX_VOLUME': return `${Math.round(value).toLocaleString()} kg`;
    case 'ESTIMATED_1RM': return `${Math.round(value * 10) / 10} kg`;
    default: return `${value}`;
  }
}

function prTypeLabel(type: string): string {
  switch (type) {
    case 'MAX_WEIGHT': return 'Weight';
    case 'MAX_REPS': return 'Reps';
    case 'MAX_VOLUME': return 'Volume';
    case 'ESTIMATED_1RM': return '1RM';
    default: return type;
  }
}

function prTypeColor(type: string): string {
  switch (type) {
    case 'MAX_WEIGHT': return Colors.primary;
    case 'MAX_REPS': return Colors.success;
    case 'MAX_VOLUME': return Colors.accent;
    case 'ESTIMATED_1RM': return '#A78BFA';
    default: return Colors.primary;
  }
}

export function RecordsBoard({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No records yet</Text>
        <Text style={styles.emptySubtext}>Complete workouts to build your records board</Text>
      </View>
    );
  }

  // Group by exercise
  const grouped: Map<string, { name: string; muscle: string; records: Map<string, { value: number; date: string }> }> = new Map();
  for (const r of data) {
    if (!grouped.has(r.exerciseId)) {
      grouped.set(r.exerciseId, { name: r.exerciseName, muscle: r.muscleGroup, records: new Map() });
    }
    grouped.get(r.exerciseId)!.records.set(r.recordType, { value: r.value, date: r.achievedAt });
  }

  const exercises = Array.from(grouped.entries());

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Records Board</Text>
        <Text style={styles.countText}>{exercises.length} exercises</Text>
      </View>

      {/* Column headers */}
      <View style={styles.tableHeader}>
        <Text style={[styles.headerCell, styles.nameCol]}>Exercise</Text>
        <Text style={[styles.headerCell, styles.recordCol]}>Weight</Text>
        <Text style={[styles.headerCell, styles.recordCol]}>Reps</Text>
        <Text style={[styles.headerCell, styles.recordCol]}>1RM</Text>
      </View>

      {exercises.map(([exId, ex]) => {
        const weightPr = ex.records.get('MAX_WEIGHT');
        const repsPr = ex.records.get('MAX_REPS');
        const ormPr = ex.records.get('ESTIMATED_1RM');

        return (
          <View key={exId} style={styles.tableRow}>
            <View style={styles.nameCol}>
              <Text style={styles.exerciseName} numberOfLines={1}>{ex.name}</Text>
              <View style={[styles.muscleBadge, { backgroundColor: Colors.primaryMuted }]}>
                <Text style={styles.muscleText}>{ex.muscle}</Text>
              </View>
            </View>
            <View style={styles.recordCol}>
              {weightPr ? (
                <>
                  <Text style={styles.recordValue}>{weightPr.value}</Text>
                  <Text style={styles.recordUnit}>kg</Text>
                </>
              ) : <Text style={styles.noRecord}>—</Text>}
            </View>
            <View style={styles.recordCol}>
              {repsPr ? (
                <>
                  <Text style={[styles.recordValue, { color: Colors.success }]}>{repsPr.value}</Text>
                  <Text style={styles.recordUnit}>reps</Text>
                </>
              ) : <Text style={styles.noRecord}>—</Text>}
            </View>
            <View style={styles.recordCol}>
              {ormPr ? (
                <>
                  <Text style={[styles.recordValue, { color: '#A78BFA' }]}>{Math.round(ormPr.value)}</Text>
                  <Text style={styles.recordUnit}>kg</Text>
                </>
              ) : <Text style={styles.noRecord}>—</Text>}
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
  countText: { fontSize: FontSize.xs, color: Colors.textMuted },
  emptyContainer: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.xs },
  emptyText: { fontSize: FontSize.md, color: Colors.textMuted, fontWeight: FontWeight.semibold },
  emptySubtext: { fontSize: FontSize.xs, color: Colors.textDisabled },
  tableHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xs,
    backgroundColor: Colors.bgMuted, borderRadius: Radius.sm,
  },
  headerCell: { fontSize: FontSize.xxs, color: Colors.textMuted, fontWeight: FontWeight.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
  nameCol: { flex: 2, paddingRight: Spacing.xs },
  recordCol: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tableRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xs,
    borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle,
  },
  exerciseName: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.text },
  muscleBadge: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 1, borderRadius: Radius.full, marginTop: 2 },
  muscleText: { fontSize: 8, color: Colors.primary, fontWeight: FontWeight.bold },
  recordValue: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary },
  recordUnit: { fontSize: 8, color: Colors.textMuted },
  noRecord: { fontSize: FontSize.sm, color: Colors.textDisabled },
});
