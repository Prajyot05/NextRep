import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../src/api/client';
import { Colors, Spacing, Radius, FontSize, FontWeight, Gradients, Shadows } from '../../src/theme';
import { ScreenWrapper, StatCard, SectionHeader, Card } from '../../src/components/ui';

function getMonthDetails() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sunday
  const monthName = now.toLocaleString('default', { month: 'long' });
  return { year, month, daysInMonth, firstDayOfWeek, monthName };
}

function formatDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function AnalyticsScreen() {
  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn:  api.analytics.overview,
  });
  const { data: muscleBalance } = useQuery({
    queryKey: ['analytics', 'muscleBalance'],
    queryFn:  () => api.analytics.muscleBalance(30),
  });
  const { data: calendarData, isLoading: loadingCalendar } = useQuery({
    queryKey: ['analytics', 'calendar'],
    queryFn:  api.workouts.calendar,
  });

  if (loadingOverview || loadingCalendar) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  const maxVolume = muscleBalance?.length
    ? Math.max(...muscleBalance.map((r: any) => r.volume))
    : 1;

  const { year, month, daysInMonth, firstDayOfWeek, monthName } = getMonthDetails();
  
  const gridNodes = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    gridNodes.push(<View key={`empty-${i}`} style={styles.dayCellWrapper} />);
  }

  const calendarMap = new Map();
  if (calendarData) {
    for (const session of calendarData) {
      // session.date string format 'YYYY-MM-DD'
      calendarMap.set(session.date, session);
    }
  }

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    const dateStr = formatDate(d);
    const sessionInfo = calendarMap.get(dateStr);
    const isToday = formatDate(new Date()) === dateStr;

    gridNodes.push(
      <View key={`day-${i}`} style={styles.dayCellWrapper}>
        <TouchableOpacity
          disabled={!sessionInfo}
          onPress={() => sessionInfo && router.push(`/workout/${sessionInfo.sessionId || sessionInfo.session_id}`)}
          style={[
            styles.dayCell,
            sessionInfo && styles.dayCellActive,
            isToday && styles.dayCellToday,
          ]}
        >
          <Text style={[
            styles.dayText, 
            sessionInfo && styles.dayTextActive,
            isToday && styles.dayTextToday
          ]}>
            {i}
          </Text>
          {sessionInfo?.muscles?.length > 0 && (
            <View style={styles.muscleIndicatorRow}>
              {sessionInfo.muscles.slice(0, 3).map((m: string, idx: number) => (
                <View 
                  key={`${dateStr}-${m}-${idx}`} 
                  style={[styles.muscleDot, { backgroundColor: Colors.muscle[m.toUpperCase() as keyof typeof Colors.muscle] || Colors.primary }]} 
                />
              ))}
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScreenWrapper scroll={false} paddingBottom={0}>
      <Text style={styles.title}>Analytics</Text>
      <Text style={styles.subtitle}>Your training at a glance</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
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

        <SectionHeader title="Training Calendar" action={monthName} />
        <Card style={styles.calendarCard}>
          <View style={styles.weekDaysRow}>
            {weekDays.map((d, i) => (
              <Text key={`wd-${i}`} style={styles.weekDayText}>{d}</Text>
            ))}
          </View>
          <View style={styles.calendarGrid}>
            {gridNodes}
          </View>
        </Card>

        {muscleBalance && muscleBalance.length > 0 && (
          <>
            <SectionHeader title="Muscle Volume" action="Last 30 days" />
            <Card style={styles.chartCard} gradientAccent={Gradients.primary}>
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
      </ScrollView>
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
  
  // Calendar specific
  calendarCard: { padding: Spacing.md, marginBottom: Spacing.xl },
  weekDaysRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.sm },
  weekDayText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.bold, width: 36, textAlign: 'center' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCellWrapper: { width: '14.28%', aspectRatio: 1, padding: 2 },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
    backgroundColor: Colors.bgMuted,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dayCellActive: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
  },
  dayCellToday: {
    borderColor: Colors.accent,
  },
  dayText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  dayTextActive: { color: Colors.primary, fontWeight: FontWeight.bold },
  dayTextToday: { color: Colors.accent, fontWeight: FontWeight.bold },
  muscleIndicatorRow: { flexDirection: 'row', gap: 2, marginTop: 2, justifyContent: 'center' },
  muscleDot: { width: 4, height: 4, borderRadius: 2 },

  // Minibars
  chartCard: { padding: Spacing.md, marginBottom: Spacing.xxl },
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
