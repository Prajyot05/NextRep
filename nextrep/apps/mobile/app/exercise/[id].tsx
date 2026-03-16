import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../src/api/client';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../src/theme';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: records, isLoading } = useQuery({
    queryKey: ['records', id],
    queryFn:  () => api.records.forExercise(id),
    enabled:  !!id,
  });

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  }

  const exercise = records?.[0]?.exercise;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{exercise?.name ?? 'Exercise'}</Text>
      <Text style={styles.muscle}>{exercise?.primaryMuscle} · {exercise?.category}</Text>

      {exercise?.instructions && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <Text style={styles.sectionText}>{exercise.instructions}</Text>
        </View>
      )}

      {records && records.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Records</Text>
          {records.map((pr: any) => (
            <View key={pr.id ?? pr.recordType} style={styles.prRow}>
              <Text style={styles.prType}>{formatPrType(pr.recordType)}</Text>
              <Text style={styles.prValue}>{pr.value}{prUnit(pr.recordType)}</Text>
              <Text style={styles.prDate}>
                {new Date(pr.achievedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.emptyText}>No personal records yet. Keep lifting! 💪</Text>
        </View>
      )}
    </ScrollView>
  );
}

function formatPrType(type: string) {
  const map: Record<string, string> = {
    MAX_WEIGHT: '🏋️ Max Weight',
    MAX_REPS: '🔄 Max Reps',
    MAX_VOLUME: '📦 Max Volume',
    ESTIMATED_1RM: '💪 Est. 1RM',
  };
  return map[type] ?? type;
}

function prUnit(type: string) {
  if (type === 'MAX_WEIGHT' || type === 'MAX_VOLUME' || type === 'ESTIMATED_1RM') return ' kg';
  if (type === 'MAX_REPS') return ' reps';
  return '';
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.bg },
  content:      { padding: Spacing.lg, paddingBottom: 100 },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  backBtn:      { marginBottom: Spacing.md },
  backText:     { color: Colors.primary, fontSize: FontSize.sm },
  title:        { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text },
  muscle:       { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: Spacing.xs, marginBottom: Spacing.xl },
  section:      { marginBottom: Spacing.xl },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.text, marginBottom: Spacing.md },
  sectionText:  { fontSize: FontSize.sm, color: Colors.textMuted, lineHeight: 22 },
  prRow:        {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.bgCard, borderRadius: Radius.md, padding: Spacing.md,
    marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
  },
  prType:       { fontSize: FontSize.sm, color: Colors.text, flex: 1 },
  prValue:      { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.primary },
  prDate:       { fontSize: FontSize.xs, color: Colors.textMuted, marginLeft: Spacing.md },
  emptyText:    { fontSize: FontSize.md, color: Colors.textMuted, textAlign: 'center' },
});
