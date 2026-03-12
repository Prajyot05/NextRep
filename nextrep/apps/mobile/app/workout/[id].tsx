import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../src/api/client';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../src/theme';

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: workout, isLoading } = useQuery({
    queryKey: ['workout', id],
    queryFn:  () => api.workouts.get(id),
    enabled:  !!id,
  });

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  }

  if (!workout) {
    return <View style={styles.center}><Text style={styles.errorText}>Workout not found.</Text></View>;
  }

  // Group sets by exercise
  const byExercise: Record<string, { name: string; sets: any[] }> = {};
  for (const set of workout.sets ?? []) {
    if (!byExercise[set.exerciseId]) {
      byExercise[set.exerciseId] = { name: set.exercise?.name ?? 'Unknown', sets: [] };
    }
    byExercise[set.exerciseId].sets.push(set);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{workout.name}</Text>
      <Text style={styles.date}>
        {new Date(workout.startedAt).toLocaleDateString('en-US', {
          weekday: 'long', month: 'long', day: 'numeric',
        })}
      </Text>

      <View style={styles.meta}>
        <MetaStat icon="⏱" value={`${Math.round(workout.durationMinutes ?? 0)}m`} label="Duration" />
        <MetaStat icon="📦" value={workout.totalSets} label="Sets" />
        <MetaStat icon="⚖️" value={`${Math.round(workout.totalVolumeKg ?? 0)} kg`} label="Volume" />
        {workout.rating && <MetaStat icon="⭐" value={`${workout.rating}/5`} label="Rating" />}
      </View>

      {workout.notes && (
        <View style={styles.notes}>
          <Text style={styles.notesLabel}>Notes</Text>
          <Text style={styles.notesText}>{workout.notes}</Text>
        </View>
      )}

      {Object.entries(byExercise).map(([exId, { name, sets }]) => (
        <View key={exId} style={styles.exerciseBlock}>
          <Text style={styles.exerciseName}>{name}</Text>
          {sets.map((set: any, i: number) => (
            <View key={set.id ?? i} style={styles.setRow}>
              <Text style={styles.setNum}>{i + 1}</Text>
              <Text style={styles.setDetails}>
                {set.weightKg ? `${set.weightKg} kg` : '—'}
                {set.reps ? ` × ${set.reps}` : ''}
                {set.type !== 'WORKING' ? ` (${set.type})` : ''}
              </Text>
              {set.isPr && <Text style={styles.prBadge}>🏆 PR</Text>}
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

function MetaStat({ icon, value, label }: { icon: string; value: string | number; label: string }) {
  return (
    <View style={styles.metaStat}>
      <Text style={styles.metaIcon}>{icon}</Text>
      <Text style={styles.metaValue}>{value}</Text>
      <Text style={styles.metaLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: Colors.bg },
  content:       { padding: Spacing.lg, paddingBottom: 100 },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText:     { color: Colors.error, fontSize: FontSize.md },
  title:         { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text },
  date:          { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: Spacing.xs, marginBottom: Spacing.lg },
  meta:          { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
  metaStat:      { flex: 1, backgroundColor: Colors.bgCard, borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  metaIcon:      { fontSize: FontSize.lg },
  metaValue:     { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.primary, marginTop: 2 },
  metaLabel:     { fontSize: FontSize.xs, color: Colors.textMuted },
  notes:         { backgroundColor: Colors.bgCard, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.xl, borderWidth: 1, borderColor: Colors.border },
  notesLabel:    { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: Spacing.xs },
  notesText:     { fontSize: FontSize.sm, color: Colors.text },
  exerciseBlock: { backgroundColor: Colors.bgCard, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  exerciseName:  { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text, marginBottom: Spacing.sm },
  setRow:        { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 4 },
  setNum:        { width: 20, fontSize: FontSize.sm, color: Colors.textMuted },
  setDetails:    { flex: 1, fontSize: FontSize.sm, color: Colors.text },
  prBadge:       { fontSize: FontSize.xs, color: Colors.streakGold },
});
