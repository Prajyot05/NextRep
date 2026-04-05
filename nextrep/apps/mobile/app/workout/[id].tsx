import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/api/client';
import { Colors, Spacing, Radius, FontSize, FontWeight, Gradients, Shadows } from '../../src/theme';
import { ScreenWrapper, Card, StatCard, SectionHeader, Badge } from '../../src/components/ui';

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
    <ScreenWrapper>
      {/* Back button */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
        <Ionicons name="chevron-back" size={20} color={Colors.primary} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{workout.name}</Text>
      <Text style={styles.date}>
        {new Date(workout.startedAt).toLocaleDateString('en-US', {
          weekday: 'long', month: 'long', day: 'numeric',
        })}
      </Text>

      {/* Meta stats */}
      <View style={styles.statsRow}>
        <StatCard icon="⏱" value={`${Math.round((workout.durationSeconds ?? 0) / 60)}m`} label="Duration" gradient={Gradients.primarySoft} />
        <StatCard icon="📦" value={workout.totalSets} label="Sets" gradient={Gradients.accentSoft} />
      </View>
      <View style={styles.statsRow}>
        <StatCard icon="⚖️" value={`${Math.round(workout.totalVolumeKg ?? 0)} kg`} label="Volume" gradient={Gradients.primarySoft} />
        {workout.rating && (
          <StatCard icon="⭐" value={`${workout.rating}/5`} label="Rating" gradient={Gradients.accentSoft} />
        )}
      </View>

      {workout.notes && (
        <Card style={styles.notesCard}>
          <Text style={styles.notesLabel}>Notes</Text>
          <Text style={styles.notesText}>{workout.notes}</Text>
        </Card>
      )}

      {/* Exercises */}
      <SectionHeader title="Exercises" />
      {Object.entries(byExercise).map(([exId, { name, sets }]) => (
        <Card key={exId} style={styles.exerciseBlock} gradientAccent={Gradients.primary}>
          <Text style={styles.exerciseName}>{name}</Text>
          {sets.map((set: any, i: number) => (
            <View key={set.id ?? i} style={styles.setRow}>
              <Text style={styles.setNum}>{i + 1}</Text>
              <Text style={styles.setDetails}>
                {set.weightKg ? `${set.weightKg} kg` : '—'}
                {set.reps ? ` × ${set.reps}` : ''}
              </Text>
              {set.type !== 'WORKING' && (
                <Badge label={set.type} color={Colors.warning} bgColor={Colors.warningMuted} />
              )}
              {set.isPr && (
                <Badge label="🏆 PR" color={Colors.streakGold} bgColor="rgba(255,215,0,0.15)" />
              )}
            </View>
          ))}
        </Card>
      ))}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  errorText:     { color: Colors.error, fontSize: FontSize.md },
  backBtn:       {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.xs,
    marginBottom:  Spacing.md,
  },
  backText:      { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  title:         {
    fontSize:      FontSize.xxl,
    fontWeight:    FontWeight.extrabold,
    color:         Colors.text,
    letterSpacing: -0.5,
  },
  date:          {
    fontSize:     FontSize.sm,
    color:        Colors.textMuted,
    marginTop:    Spacing.xs,
    marginBottom: Spacing.lg,
  },
  statsRow:      { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  notesCard:     { marginBottom: Spacing.lg },
  notesLabel:    { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: Spacing.xs, textTransform: 'uppercase', letterSpacing: 1 },
  notesText:     { fontSize: FontSize.sm, color: Colors.text, lineHeight: 22 },
  exerciseBlock: { marginBottom: Spacing.md },
  exerciseName:  {
    fontSize:     FontSize.md,
    fontWeight:   FontWeight.bold,
    color:        Colors.text,
    marginBottom: Spacing.sm,
    paddingTop:   Spacing.xs,
  },
  setRow:        {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.md,
    paddingVertical: 5,
  },
  setNum:        {
    width:      24,
    fontSize:   FontSize.sm,
    color:      Colors.textMuted,
    fontWeight: FontWeight.semibold,
  },
  setDetails:    { flex: 1, fontSize: FontSize.sm, color: Colors.text },
});
