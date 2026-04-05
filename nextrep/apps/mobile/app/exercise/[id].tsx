import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/api/client';
import { Colors, Spacing, Radius, FontSize, FontWeight, Gradients } from '../../src/theme';
import { ScreenWrapper, Card, SectionHeader, Badge } from '../../src/components/ui';

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
    <ScreenWrapper>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
        <Ionicons name="chevron-back" size={20} color={Colors.primary} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{exercise?.name ?? 'Exercise'}</Text>
      <View style={styles.metaRow}>
        {exercise?.primaryMuscle && (
          <Badge label={exercise.primaryMuscle} color={Colors.primary} bgColor={Colors.primaryMuted} size="md" />
        )}
        {exercise?.category && (
          <Badge label={exercise.category} color={Colors.accent} bgColor={Colors.accentMuted} size="md" />
        )}
      </View>

      {exercise?.instructions && (
        <>
          <SectionHeader title="Instructions" />
          <Card>
            <Text style={styles.instructions}>{exercise.instructions}</Text>
          </Card>
        </>
      )}

      {records && records.length > 0 ? (
        <>
          <SectionHeader title="Personal Records" />
          {records.map((pr: any) => (
            <Card key={pr.id ?? pr.recordType} style={styles.prCard} gradientAccent={Gradients.accent}>
              <View style={styles.prRow}>
                <Text style={styles.prType}>{formatPrType(pr.recordType)}</Text>
                <Text style={styles.prValue}>{pr.value}{prUnit(pr.recordType)}</Text>
                <Text style={styles.prDate}>
                  {new Date(pr.achievedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
            </Card>
          ))}
        </>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>💪</Text>
          <Text style={styles.emptyText}>No personal records yet</Text>
          <Text style={styles.emptySubtext}>Keep lifting to set your first PR!</Text>
        </View>
      )}
    </ScreenWrapper>
  );
}

function formatPrType(type: string) {
  const map: Record<string, string> = {
    MAX_WEIGHT:    '🏋️ Max Weight',
    MAX_REPS:      '🔄 Max Reps',
    MAX_VOLUME:    '📦 Max Volume',
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
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  backBtn:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.md },
  backText:     { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  title:        {
    fontSize:      FontSize.xxl,
    fontWeight:    FontWeight.extrabold,
    color:         Colors.text,
    letterSpacing: -0.5,
  },
  metaRow:      {
    flexDirection: 'row',
    gap:           Spacing.sm,
    marginTop:     Spacing.sm,
    marginBottom:  Spacing.md,
  },
  instructions: {
    fontSize:   FontSize.sm,
    color:      Colors.textSecondary,
    lineHeight: 22,
  },
  prCard:       { marginBottom: Spacing.sm },
  prRow:        {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    paddingTop:     Spacing.xs,
  },
  prType:       { fontSize: FontSize.sm, color: Colors.text, flex: 1 },
  prValue:      { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.primary },
  prDate:       { fontSize: FontSize.xs, color: Colors.textMuted, marginLeft: Spacing.md },
  emptyState:   { alignItems: 'center', marginTop: Spacing.xxl, gap: Spacing.xs },
  emptyEmoji:   { fontSize: 48 },
  emptyText:    { fontSize: FontSize.lg, color: Colors.text, fontWeight: FontWeight.bold },
  emptySubtext: { fontSize: FontSize.sm, color: Colors.textMuted },
});
