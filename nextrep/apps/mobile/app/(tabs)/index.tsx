import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { api } from '../../src/api/client';
import { useAuthStore } from '../../src/store/authStore';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../src/theme';

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const { data: overview, isLoading } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn:  api.analytics.overview,
  });
  const { data: streak } = useQuery({
    queryKey: ['streak'],
    queryFn:  api.streaks.get,
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Hey {user?.displayName ?? 'Athlete'} 👋</Text>
        <Text style={styles.subGreeting}>Ready to crush it today?</Text>
      </View>

      {/* Streak card */}
      {streak && (
        <View style={styles.streakCard}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <View>
            <Text style={styles.streakCount}>{streak.currentStreak} Day Streak</Text>
            <Text style={styles.streakBest}>Best: {streak.longestStreak} days</Text>
          </View>
        </View>
      )}

      {/* Quick stats */}
      {isLoading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.xl }} />
      ) : overview ? (
        <View style={styles.statsGrid}>
          <StatCard label="Workouts" value={overview.totalWorkouts} />
          <StatCard label="This Month" value={overview.workoutsThisMonth} />
          <StatCard label="PRs Set" value={overview.totalPrs} />
          <StatCard label="Avg Duration" value={`${overview.avgDurationMin ?? 0}m`} />
        </View>
      ) : null}

      {/* Start workout CTA */}
      <TouchableOpacity style={styles.ctaButton} onPress={() => router.push('/(tabs)/start')}>
        <Text style={styles.ctaText}>+ Start Workout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: Colors.bg },
  contentContainer: { padding: Spacing.lg, paddingBottom: 100 },
  header:          { marginBottom: Spacing.xl },
  greeting:        { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text },
  subGreeting:     { fontSize: FontSize.md, color: Colors.textMuted, marginTop: Spacing.xs },
  streakCard:      {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              Spacing.md,
    backgroundColor:  Colors.bgCard,
    borderRadius:     Radius.lg,
    padding:          Spacing.lg,
    marginBottom:     Spacing.xl,
    borderWidth:      1,
    borderColor:      Colors.streak,
  },
  streakEmoji:     { fontSize: 40 },
  streakCount:     { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  streakBest:      { fontSize: FontSize.sm, color: Colors.textMuted },
  statsGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.xl },
  statCard:        {
    flex:             1,
    minWidth:         '45%',
    backgroundColor:  Colors.bgCard,
    borderRadius:     Radius.md,
    padding:          Spacing.md,
    alignItems:       'center',
    borderWidth:      1,
    borderColor:      Colors.border,
  },
  statValue:       { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.primary },
  statLabel:       { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: Spacing.xs },
  ctaButton:       {
    backgroundColor: Colors.primary,
    borderRadius:    Radius.lg,
    padding:         Spacing.lg,
    alignItems:      'center',
  },
  ctaText:         { color: Colors.text, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
});
