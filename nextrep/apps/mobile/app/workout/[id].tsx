import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/api/client';
import { getExerciseImageUrl } from '../../src/api/exerciseApi';
import { Colors, Spacing, Radius, FontSize, FontWeight, Gradients, Shadows } from '../../src/theme';
import { ScreenWrapper, Card, StatCard, SectionHeader, Badge } from '../../src/components/ui';

function formatSetType(type: string): { label: string; color: string; bg: string } {
  switch (type) {
    case 'WARMUP': return { label: 'W', color: Colors.warning, bg: Colors.warningMuted };
    case 'DROPSET': return { label: 'D', color: '#A78BFA', bg: 'rgba(167,139,250,0.15)' };
    case 'FAILURE': return { label: 'F', color: Colors.error, bg: Colors.errorMuted };
    case 'AMRAP': return { label: 'A', color: Colors.success, bg: Colors.successMuted };
    default: return { label: '', color: '', bg: '' };
  }
}

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
  const byExercise: Record<string, { name: string; exercise: any; sets: any[] }> = {};
  for (const set of workout.sets ?? []) {
    if (!byExercise[set.exerciseId]) {
      byExercise[set.exerciseId] = {
        name: set.exercise?.name ?? 'Unknown Exercise',
        exercise: set.exercise ?? null,
        sets: [],
      };
    }
    byExercise[set.exerciseId].sets.push(set);
  }

  // Calculate per-exercise volume
  function exerciseVolume(sets: any[]) {
    return sets
      .filter(s => s.type !== 'WARMUP')
      .reduce((sum: number, s: any) => sum + (s.weightKg ?? 0) * (s.reps ?? 0), 0);
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

      {/* Exercises with detailed set table */}
      <SectionHeader title="Exercises" />
      {Object.entries(byExercise).map(([exId, { name, exercise, sets }]) => {
        const imageUrl = exercise ? getExerciseImageUrl(exercise) : null;
        const vol = exerciseVolume(sets);

        return (
          <Card key={exId} style={styles.exerciseBlock} gradientAccent={Gradients.primary}>
            <View style={styles.exerciseHeader}>
              {imageUrl && (
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.exerciseThumb}
                  resizeMode="cover"
                />
              )}
              <View style={styles.exerciseHeaderInfo}>
                <Text style={styles.exerciseName}>{name}</Text>
                <View style={styles.exerciseMetaRow}>
                  {exercise?.primaryMuscle && (
                    <Badge label={exercise.primaryMuscle} color={Colors.primary} bgColor={Colors.primaryMuted} />
                  )}
                  {vol > 0 && (
                    <Text style={styles.exerciseVolume}>{Math.round(vol)} kg</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Set table header */}
            <View style={styles.setTableHeader}>
              <Text style={[styles.setHeaderCell, { width: 36 }]}>SET</Text>
              <Text style={[styles.setHeaderCell, { flex: 1 }]}>WEIGHT</Text>
              <Text style={[styles.setHeaderCell, { flex: 1 }]}>REPS</Text>
              <Text style={[styles.setHeaderCell, { width: 50 }]}>VOL</Text>
              <Text style={[styles.setHeaderCell, { width: 36, textAlign: 'center' }]}> </Text>
            </View>

            {/* Set rows */}
            {sets.map((set: any, i: number) => {
              const setType = formatSetType(set.type);
              const setVol = (set.weightKg ?? 0) * (set.reps ?? 0);
              return (
                <View key={set.id ?? i} style={styles.setRow}>
                  <View style={{ width: 36, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    {setType.label ? (
                      <View style={[styles.typeBadge, { backgroundColor: setType.bg }]}>
                        <Text style={[styles.typeBadgeText, { color: setType.color }]}>{setType.label}</Text>
                      </View>
                    ) : (
                      <Text style={styles.setNum}>{i + 1}</Text>
                    )}
                  </View>
                  <Text style={[styles.setWeight, { flex: 1 }]}>
                    {set.weightKg != null ? `${set.weightKg} kg` : '—'}
                  </Text>
                  <Text style={[styles.setReps, { flex: 1 }]}>
                    {set.reps != null ? `× ${set.reps}` : '—'}
                  </Text>
                  <Text style={[styles.setVol, { width: 50 }]}>
                    {setVol > 0 ? `${Math.round(setVol)}` : '—'}
                  </Text>
                  <View style={{ width: 36, alignItems: 'center' }}>
                    {set.isPr && (
                      <Badge label="🏆" color={Colors.streakGold} bgColor="rgba(255,215,0,0.15)" />
                    )}
                  </View>
                </View>
              );
            })}

            {/* RPE / 1RM info for last working set */}
            {(() => {
              const workingSets = sets.filter((s: any) => s.type === 'WORKING' && s.weightKg && s.reps);
              const lastSet = workingSets[workingSets.length - 1];
              if (!lastSet) return null;
              return (
                <View style={styles.extraInfoRow}>
                  {lastSet.rpe && (
                    <View style={styles.extraItem}>
                      <Text style={styles.extraLabel}>RPE</Text>
                      <Text style={styles.extraValue}>{lastSet.rpe}</Text>
                    </View>
                  )}
                  {lastSet.estimated1rm && (
                    <View style={styles.extraItem}>
                      <Text style={styles.extraLabel}>Est. 1RM</Text>
                      <Text style={styles.extraValue}>{Math.round(lastSet.estimated1rm)} kg</Text>
                    </View>
                  )}
                </View>
              );
            })()}
          </Card>
        );
      })}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  errorText: { color: Colors.error, fontSize: FontSize.md },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.md },
  backText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.text, letterSpacing: -0.5 },
  date: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: Spacing.xs, marginBottom: Spacing.lg },
  statsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  notesCard: { marginBottom: Spacing.lg },
  notesLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: Spacing.xs, textTransform: 'uppercase', letterSpacing: 1 },
  notesText: { fontSize: FontSize.sm, color: Colors.text, lineHeight: 22 },
  exerciseBlock: { marginBottom: Spacing.md },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm, paddingTop: Spacing.xs },
  exerciseThumb: { width: 48, height: 48, borderRadius: Radius.sm, backgroundColor: Colors.bgMuted },
  exerciseHeaderInfo: { flex: 1, gap: Spacing.xs },
  exerciseName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  exerciseMetaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  exerciseVolume: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.semibold },
  setTableHeader: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: Spacing.xs,
    backgroundColor: Colors.bgMuted, borderRadius: Radius.sm, marginBottom: 2,
  },
  setHeaderCell: { fontSize: FontSize.xxs, color: Colors.textMuted, fontWeight: FontWeight.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
  setRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xs,
    borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle,
  },
  setNum: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: FontWeight.semibold },
  typeBadge: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  typeBadgeText: { fontSize: 10, fontWeight: FontWeight.bold },
  setWeight: { fontSize: FontSize.sm, color: Colors.text, fontWeight: FontWeight.bold },
  setReps: { fontSize: FontSize.sm, color: Colors.textSecondary },
  setVol: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right' },
  extraInfoRow: {
    flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.sm,
    paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.borderSubtle,
  },
  extraItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  extraLabel: { fontSize: FontSize.xxs, color: Colors.textMuted, fontWeight: FontWeight.bold, textTransform: 'uppercase' },
  extraValue: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.bold },
});
