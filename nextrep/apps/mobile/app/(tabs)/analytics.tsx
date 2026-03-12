import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../src/api/client';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '../../src/theme';

export default function AnalyticsScreen() {
  const { data: overview, isLoading } = useQuery({ queryKey: ['analytics', 'overview'], queryFn: api.analytics.overview });
  const { data: muscleBalance }       = useQuery({ queryKey: ['analytics', 'muscleBalance'], queryFn: () => api.analytics.muscleBalance(30) });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Analytics</Text>

      {overview && (
        <View style={styles.overviewGrid}>
          <OverviewCard label="Total Workouts" value={overview.totalWorkouts} />
          <OverviewCard label="Total Volume" value={`${Math.round((overview.totalVolumeKg ?? 0) / 1000)}t`} />
          <OverviewCard label="Total PRs" value={overview.totalPrs} />
          <OverviewCard label="Total Sets" value={overview.totalSets} />
        </View>
      )}

      {muscleBalance && muscleBalance.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Muscle Volume (Last 30 days)</Text>
          {muscleBalance.slice(0, 8).map((row: any) => (
            <View key={row.muscleGroup} style={styles.muscleRow}>
              <Text style={styles.muscleName}>{row.muscleGroup}</Text>
              <Text style={styles.muscleVolume}>{Math.round(row.volume)} kg</Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

function OverviewCard({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardValue}>{value}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: Colors.bg },
  content:       { padding: Spacing.lg, paddingBottom: 100 },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title:         { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.xl },
  overviewGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.xl },
  card:          {
    flex:            1,
    minWidth:        '45%',
    backgroundColor: Colors.bgCard,
    borderRadius:    Radius.md,
    padding:         Spacing.md,
    alignItems:      'center',
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  cardValue:     { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.primary },
  cardLabel:     { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.xs },
  sectionTitle:  { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.text, marginBottom: Spacing.md },
  muscleRow:     { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  muscleName:    { fontSize: FontSize.sm, color: Colors.text },
  muscleVolume:  { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },
});
