import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../src/api/client';
import { Colors, Spacing, Radius, FontSize, FontWeight, Gradients, Shadows } from '../../src/theme';
import { ScreenWrapper, StatCard, SectionHeader, Card } from '../../src/components/ui';

export default function AnalyticsScreen() {
  const { data: overview, isLoading } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn:  api.analytics.overview,
  });
  const { data: muscleBalance } = useQuery({
    queryKey: ['analytics', 'muscleBalance'],
    queryFn:  () => api.analytics.muscleBalance(30),
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  const maxVolume = muscleBalance?.length
    ? Math.max(...muscleBalance.map((r: any) => r.volume))
    : 1;

  return (
    <ScreenWrapper paddingBottom={120}>
      <Text style={styles.title}>Analytics</Text>
      <Text style={styles.subtitle}>Your training at a glance</Text>

      {overview && (
        <>
          <View style={styles.statsRow}>
            <StatCard label="Workouts" value={overview.totalWorkouts} icon="🏋️" gradient={Gradients.primarySoft} />
            <StatCard label="Volume" value={`${Math.round((overview.totalVolumeKg ?? 0) / 1000)}t`} icon="⚖️" gradient={Gradients.accentSoft} />
          </View>
          <View style={styles.statsRow}>
            <StatCard label="PRs" value={overview.totalPrs} icon="🏆" gradient={Gradients.primarySoft} />
            <StatCard label="Total Sets" value={overview.totalSets} icon="📦" gradient={Gradients.accentSoft} />
          </View>
        </>
      )}

      {muscleBalance && muscleBalance.length > 0 && (
        <>
          <SectionHeader title="Muscle Volume" action="Last 30 days" />
          <Card style={styles.chartCard}>
            {muscleBalance.slice(0, 8).map((row: any, i: number) => {
              const pct = Math.round((row.volume / maxVolume) * 100);
              const muscleColors = Object.values(Colors.muscle);
              const barColor = muscleColors[i % muscleColors.length];
              return (
                <View key={row.muscleGroup} style={styles.barRow}>
                  <Text style={styles.barLabel}>{row.muscleGroup}</Text>
                  <View style={styles.barTrack}>
                    <LinearGradient
                      colors={[barColor, `${barColor}88`]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.barFill, { width: `${Math.max(pct, 4)}%` }]}
                    />
                  </View>
                  <Text style={styles.barValue}>{Math.round(row.volume)}</Text>
                </View>
              );
            })}
          </Card>
        </>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  title:     {
    fontSize:      FontSize.xxxl,
    fontWeight:    FontWeight.extrabold,
    color:         Colors.text,
    letterSpacing: -0.5,
    paddingTop:    Spacing.sm,
  },
  subtitle:  {
    fontSize:     FontSize.md,
    color:        Colors.textMuted,
    marginTop:    Spacing.xs,
    marginBottom: Spacing.lg,
  },
  statsRow:  { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  chartCard: { padding: Spacing.md },
  barRow:    {
    flexDirection:  'row',
    alignItems:     'center',
    marginBottom:   Spacing.sm,
    gap:            Spacing.sm,
  },
  barLabel:  {
    width:      80,
    fontSize:   FontSize.xs,
    color:      Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  barTrack:  {
    flex:            1,
    height:          20,
    backgroundColor: Colors.bgMuted,
    borderRadius:    Radius.xs,
    overflow:        'hidden',
  },
  barFill:   {
    height:       '100%',
    borderRadius: Radius.xs,
  },
  barValue:  {
    width:      40,
    fontSize:   FontSize.xs,
    color:      Colors.textMuted,
    textAlign:  'right',
    fontWeight: FontWeight.semibold,
  },
});
