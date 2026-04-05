import { View, Text, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../src/api/client';
import { useAuthStore } from '../../src/store/authStore';
import { Colors, Spacing, Radius, FontSize, FontWeight, Gradients, Shadows } from '../../src/theme';
import { ScreenWrapper, StatCard, Card, GradientButton, SectionHeader } from '../../src/components/ui';

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
    <ScreenWrapper paddingBottom={120}>
      {/* Hero greeting */}
      <View style={styles.hero}>
        <Text style={styles.greeting}>Hey {user?.displayName ?? 'Athlete'}</Text>
        <Text style={styles.subGreeting}>Ready to crush it today? 💪</Text>
      </View>

      {/* Streak card */}
      {streak && (
        <LinearGradient
          colors={Gradients.accentSoft}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.streakCard, Shadows.md]}
        >
          <View style={styles.streakLeft}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <View>
              <Text style={styles.streakCount}>{streak.currentStreak}</Text>
              <Text style={styles.streakLabel}>Day Streak</Text>
            </View>
          </View>
          <View style={styles.streakDivider} />
          <View style={styles.streakRight}>
            <Text style={styles.streakBestNum}>{streak.longestStreak}</Text>
            <Text style={styles.streakBestLabel}>Best</Text>
          </View>
        </LinearGradient>
      )}

      {/* Quick stats */}
      {!isLoading && overview && (
        <>
          <SectionHeader title="Overview" />
          <View style={styles.statsGrid}>
            <StatCard label="Workouts" value={overview.totalWorkouts} icon="🏋️" gradient={Gradients.primarySoft} />
            <StatCard label="This Month" value={overview.workoutsThisMonth} icon="📅" gradient={Gradients.accentSoft} />
          </View>
          <View style={styles.statsGrid}>
            <StatCard label="PRs Set" value={overview.totalPrs} icon="🏆" gradient={Gradients.primarySoft} />
            <StatCard label="Avg Duration" value={`${overview.avgDurationMin ?? 0}m`} icon="⏱" gradient={Gradients.accentSoft} />
          </View>
        </>
      )}

      {/* Start workout CTA */}
      <View style={{ marginTop: Spacing.xl }}>
        <GradientButton
          title="Start Workout"
          icon="⚡"
          onPress={() => router.push('/(tabs)/start')}
          variant="accent"
          size="lg"
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginBottom: Spacing.xl,
    paddingTop:   Spacing.sm,
  },
  greeting: {
    fontSize:      FontSize.xxxl,
    fontWeight:    FontWeight.extrabold,
    color:         Colors.text,
    letterSpacing: -0.5,
  },
  subGreeting: {
    fontSize:   FontSize.md,
    color:      Colors.textMuted,
    marginTop:  Spacing.xs,
  },
  streakCard: {
    flexDirection:  'row',
    alignItems:     'center',
    borderRadius:   Radius.lg,
    padding:        Spacing.lg,
    marginBottom:   Spacing.md,
    borderWidth:    1,
    borderColor:    'rgba(255, 107, 53, 0.2)',
  },
  streakLeft: {
    flex:           1,
    flexDirection:  'row',
    alignItems:     'center',
    gap:            Spacing.md,
  },
  streakEmoji: {
    fontSize: 36,
  },
  streakCount: {
    fontSize:   FontSize.xxxl,
    fontWeight: FontWeight.black,
    color:      Colors.accent,
    lineHeight: 38,
  },
  streakLabel: {
    fontSize:      FontSize.xs,
    color:         Colors.textSecondary,
    fontWeight:    FontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  streakDivider: {
    width:           1,
    height:          40,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.lg,
  },
  streakRight: {
    alignItems: 'center',
  },
  streakBestNum: {
    fontSize:   FontSize.xl,
    fontWeight: FontWeight.bold,
    color:      Colors.text,
  },
  streakBestLabel: {
    fontSize:      FontSize.xxs,
    color:         Colors.textMuted,
    fontWeight:    FontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    gap:           Spacing.md,
    marginBottom:  Spacing.md,
  },
});
