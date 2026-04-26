import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Modal, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/api/client';
import { Colors, Spacing, Radius, FontSize, FontWeight, Gradients, Shadows } from '../../src/theme';
import { ScreenWrapper, StatCard, SectionHeader, Card, Badge } from '../../src/components/ui';
import { VolumeTrend } from '../../src/components/charts/VolumeTrend';
import { FrequencyHeatmap } from '../../src/components/charts/FrequencyHeatmap';
import { SessionDuration } from '../../src/components/charts/SessionDuration';
import { PrTimeline } from '../../src/components/charts/PrTimeline';
import { RecordsBoard } from '../../src/components/charts/RecordsBoard';
import { StreakCalendar } from '../../src/components/charts/StreakCalendar';

function getMonthDetails(offset = 0) {
  const now = new Date();
  now.setMonth(now.getMonth() + offset);
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });
  return { year, month, daysInMonth, firstDayOfWeek, monthName };
}

function formatDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function AnalyticsScreen() {
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  const { data: overview, isLoading: loadingOverview, refetch: r1, isRefetching: ir1 } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: api.analytics.overview,
  });
  const { data: muscleBalance, refetch: r2, isRefetching: ir2 } = useQuery({
    queryKey: ['analytics', 'muscleBalance'],
    queryFn: () => api.analytics.muscleBalance(30),
  });
  const { data: calendarData, isLoading: loadingCalendar, refetch: r3, isRefetching: ir3 } = useQuery({
    queryKey: ['analytics', 'calendar'],
    queryFn: api.workouts.calendar,
  });
  const { data: volumeData, refetch: r4, isRefetching: ir4 } = useQuery({
    queryKey: ['analytics', 'volume'],
    queryFn: () => api.analytics.volume(12),
  });
  const { data: frequencyData, refetch: r5, isRefetching: ir5 } = useQuery({
    queryKey: ['analytics', 'frequency'],
    queryFn: api.analytics.frequency,
  });
  const { data: durationData, refetch: r6, isRefetching: ir6 } = useQuery({
    queryKey: ['analytics', 'duration'],
    queryFn: () => api.analytics.duration(12),
  });
  const { data: recordsData, refetch: r7, isRefetching: ir7 } = useQuery({
    queryKey: ['analytics', 'records'],
    queryFn: api.analytics.records,
  });
  const { data: streakData, refetch: r8, isRefetching: ir8 } = useQuery({
    queryKey: ['streak'],
    queryFn: api.streaks.get,
  });
  const { data: streakCalData, refetch: r9, isRefetching: ir9 } = useQuery({
    queryKey: ['streaks', 'calendar'],
    queryFn: () => api.streaks.calendar(3),
  });

  const isRefreshing = ir1 || ir2 || ir3 || ir4 || ir5 || ir6 || ir7 || ir8 || ir9;
  const onRefresh = useCallback(() => { r1(); r2(); r3(); r4(); r5(); r6(); r7(); r8(); r9(); }, [r1, r2, r3, r4, r5, r6, r7, r8, r9]);

  // Session summary for calendar popup
  const { data: sessionSummary, isLoading: loadingSummary } = useQuery({
    queryKey: ['workout', 'summary', selectedSession],
    queryFn: () => api.workouts.summary(selectedSession!),
    enabled: !!selectedSession,
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

  const { year, month, daysInMonth, firstDayOfWeek, monthName } = getMonthDetails(monthOffset);

  // Build calendar map
  const calendarMap = new Map<string, any>();
  if (calendarData) {
    for (const session of calendarData) {
      calendarMap.set(session.date, session);
    }
  }

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Build calendar grid
  const gridNodes = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    gridNodes.push(<View key={`empty-${i}`} style={styles.dayCellWrapper} />);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    const dateStr = formatDate(d);
    const sessionInfo = calendarMap.get(dateStr);
    const isToday = formatDate(new Date()) === dateStr;

    gridNodes.push(
      <View key={`day-${i}`} style={styles.dayCellWrapper}>
        <TouchableOpacity
          disabled={!sessionInfo}
          onPress={() => {
            const sid = sessionInfo?.session_id || sessionInfo?.sessionId;
            if (sid) setSelectedSession(sid);
          }}
          activeOpacity={0.7}
          style={[
            styles.dayCell,
            sessionInfo && styles.dayCellActive,
            isToday && styles.dayCellToday,
          ]}
        >
          <Text style={[
            styles.dayText,
            sessionInfo && styles.dayTextActive,
            isToday && styles.dayTextToday,
          ]}>
            {i}
          </Text>
          {(() => {
            const mRaw = sessionInfo?.muscles;
            const mArray = Array.isArray(mRaw) ? mRaw : (typeof mRaw === 'string' ? mRaw.replace(/[{}]/g, '').split(',').filter(Boolean) : []);
            if (mArray.length === 0) return null;
            return (
              <View style={styles.muscleIndicatorRow}>
                {mArray.slice(0, 3).map((m: string, idx: number) => (
                  <View
                    key={`${dateStr}-${m}-${idx}`}
                    style={[styles.muscleDot, { backgroundColor: Colors.muscle[m.toUpperCase() as keyof typeof Colors.muscle] || Colors.primary }]}
                  />
                ))}
              </View>
            );
          })()}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScreenWrapper scroll={false} paddingBottom={0} onRefresh={onRefresh} refreshing={isRefreshing}>
      <Text style={styles.title}>Analytics</Text>
      <Text style={styles.subtitle}>Your training at a glance</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Overview Stats */}
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

        {/* Training Calendar */}
        <SectionHeader title="Training Calendar" />
        <Card style={styles.calendarCard}>
          {/* Month navigation */}
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={() => setMonthOffset(o => o - 1)} hitSlop={12}>
              <Ionicons name="chevron-back" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{monthName}</Text>
            <TouchableOpacity onPress={() => setMonthOffset(o => Math.min(o + 1, 0))} hitSlop={12} disabled={monthOffset >= 0}>
              <Ionicons name="chevron-forward" size={20} color={monthOffset >= 0 ? Colors.textDisabled : Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekDaysRow}>
            {weekDays.map((d, i) => (
              <Text key={`wd-${i}`} style={styles.weekDayText}>{d}</Text>
            ))}
          </View>
          <View style={styles.calendarGrid}>
            {gridNodes}
          </View>
        </Card>

        {/* Muscle Volume */}
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

        {/* Volume Trend */}
        {volumeData && volumeData.length > 0 && (
          <>
            <SectionHeader title="Volume Trend" action="12 weeks" />
            <Card style={styles.chartCard}>
              <VolumeTrend data={volumeData} />
            </Card>
          </>
        )}

        {/* Frequency Heatmap */}
        {frequencyData && frequencyData.length > 0 && (
          <>
            <SectionHeader title="Training Frequency" />
            <Card style={styles.chartCard}>
              <FrequencyHeatmap data={frequencyData} />
            </Card>
          </>
        )}

        {/* Session Duration */}
        {durationData && durationData.length > 0 && (
          <>
            <SectionHeader title="Session Duration" action="12 weeks" />
            <Card style={styles.chartCard}>
              <SessionDuration data={durationData} />
            </Card>
          </>
        )}

        {/* Streak Calendar */}
        {streakCalData && streakCalData.length > 0 && (
          <>
            <SectionHeader title="Streak" />
            <Card style={styles.chartCard}>
              <StreakCalendar
                data={streakCalData}
                currentStreak={streakData?.currentStreak ?? 0}
                longestStreak={streakData?.longestStreak ?? 0}
              />
            </Card>
          </>
        )}

        {/* Records Board */}
        {recordsData && recordsData.length > 0 && (
          <>
            <SectionHeader title="Personal Records" />
            <Card style={styles.chartCard}>
              <RecordsBoard data={recordsData} />
            </Card>
          </>
        )}
      </ScrollView>

      {/* Workout Detail Bottom Sheet */}
      <Modal
        visible={!!selectedSession}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedSession(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setSelectedSession(null)} />
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />
            {loadingSummary ? (
              <View style={styles.sheetLoading}>
                <ActivityIndicator color={Colors.primary} size="large" />
              </View>
            ) : sessionSummary ? (
              <ScrollView showsVerticalScrollIndicator={false} style={styles.sheetScroll}>
                <Text style={styles.sheetTitle}>{sessionSummary.name}</Text>
                <Text style={styles.sheetDate}>
                  {new Date(sessionSummary.startedAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </Text>

                {/* Summary badges */}
                <View style={styles.sheetBadgeRow}>
                  <Badge label={`${Math.round((sessionSummary.durationSeconds ?? 0) / 60)}m`} color={Colors.primary} bgColor={Colors.primaryMuted} />
                  <Badge label={`${sessionSummary.totalSets} sets`} color={Colors.accent} bgColor={Colors.accentMuted} />
                  <Badge label={`${Math.round(sessionSummary.totalVolumeKg ?? 0)} kg`} color={Colors.success} bgColor={Colors.successMuted} />
                </View>

                {/* Exercises with sets */}
                {sessionSummary.exercises?.map((ex: any, exIdx: number) => (
                  <View key={exIdx} style={styles.sheetExercise}>
                    <View style={styles.sheetExHeader}>
                      <Text style={styles.sheetExName}>{ex.name}</Text>
                      {ex.primaryMuscle && (
                        <Badge label={ex.primaryMuscle} color={Colors.primary} bgColor={Colors.primaryMuted} />
                      )}
                    </View>
                    {/* Set table header */}
                    <View style={styles.setTableHeader}>
                      <Text style={[styles.setHeaderText, { width: 32 }]}>SET</Text>
                      <Text style={[styles.setHeaderText, { flex: 1 }]}>WEIGHT</Text>
                      <Text style={[styles.setHeaderText, { flex: 1 }]}>REPS</Text>
                      <Text style={[styles.setHeaderText, { width: 50 }]}>TYPE</Text>
                    </View>
                    {ex.sets?.map((set: any, sIdx: number) => (
                      <View key={sIdx} style={styles.setTableRow}>
                        <Text style={[styles.setNum, { width: 32 }]}>{set.setNumber}</Text>
                        <Text style={[styles.setWeight, { flex: 1 }]}>
                          {set.weightKg != null ? `${set.weightKg} kg` : '—'}
                        </Text>
                        <Text style={[styles.setReps, { flex: 1 }]}>
                          {set.reps != null ? `${set.reps}` : '—'}
                        </Text>
                        <View style={{ width: 50, alignItems: 'center' }}>
                          {set.type !== 'WORKING' ? (
                            <Badge label={set.type} color={Colors.warning} bgColor={Colors.warningMuted} />
                          ) : set.isPr ? (
                            <Badge label="🏆 PR" color={Colors.streakGold} bgColor="rgba(255,215,0,0.15)" />
                          ) : null}
                        </View>
                      </View>
                    ))}
                  </View>
                ))}

                {/* View full workout button */}
                <TouchableOpacity
                  style={styles.viewFullBtn}
                  onPress={() => {
                    setSelectedSession(null);
                    router.push(`/workout/${sessionSummary.id}`);
                  }}
                >
                  <Text style={styles.viewFullText}>View Full Workout</Text>
                  <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <Text style={styles.sheetError}>Could not load workout details</Text>
            )}
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  title: {
    fontSize: FontSize.xxxl, fontWeight: FontWeight.extrabold,
    color: Colors.text, letterSpacing: -0.5, paddingTop: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.md, color: Colors.textMuted,
    marginTop: Spacing.xs, marginBottom: Spacing.lg,
  },
  statsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },

  // Calendar
  calendarCard: { padding: Spacing.md, marginBottom: Spacing.xl },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  monthLabel: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  weekDaysRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.sm },
  weekDayText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.bold, width: 36, textAlign: 'center' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCellWrapper: { width: '14.28%', aspectRatio: 1, padding: 2 },
  dayCell: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    borderRadius: Radius.sm, backgroundColor: Colors.bgMuted,
    borderWidth: 1, borderColor: 'transparent',
  },
  dayCellActive: { backgroundColor: Colors.primaryMuted, borderColor: Colors.primary },
  dayCellToday: { borderColor: Colors.accent },
  dayText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  dayTextActive: { color: Colors.primary, fontWeight: FontWeight.bold },
  dayTextToday: { color: Colors.accent, fontWeight: FontWeight.bold },
  muscleIndicatorRow: { flexDirection: 'row', gap: 2, marginTop: 2, justifyContent: 'center' },
  muscleDot: { width: 4, height: 4, borderRadius: 2 },

  // Charts
  chartCard: { padding: Spacing.md, marginBottom: Spacing.lg },

  // Muscle bars
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, gap: Spacing.sm },
  barLabel: { width: 80, fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  barTrack: { flex: 1, height: 20, backgroundColor: Colors.bgMuted, borderRadius: Radius.xs, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: Radius.xs },
  barValue: { width: 40, fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right', fontWeight: FontWeight.semibold },

  // Modal / Bottom Sheet
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  modalSheet: {
    backgroundColor: Colors.bgElevated, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '80%', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl,
    borderTopWidth: 1, borderColor: Colors.border,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.bgMuted,
    alignSelf: 'center', marginTop: Spacing.sm, marginBottom: Spacing.md,
  },
  sheetLoading: { paddingVertical: Spacing.xxxl, alignItems: 'center' },
  sheetScroll: { paddingBottom: Spacing.xl },
  sheetTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  sheetDate: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: Spacing.xs, marginBottom: Spacing.md },
  sheetBadgeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  sheetExercise: { marginBottom: Spacing.lg },
  sheetExHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  sheetExName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text, flex: 1 },
  setTableHeader: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: Spacing.xs,
    backgroundColor: Colors.bgMuted, borderRadius: Radius.sm, marginBottom: 2,
  },
  setHeaderText: { fontSize: FontSize.xxs, color: Colors.textMuted, fontWeight: FontWeight.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
  setTableRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xs,
    borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle,
  },
  setNum: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: FontWeight.semibold },
  setWeight: { fontSize: FontSize.sm, color: Colors.text, fontWeight: FontWeight.bold },
  setReps: { fontSize: FontSize.sm, color: Colors.textSecondary },
  viewFullBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.md, marginTop: Spacing.md,
    borderWidth: 1, borderColor: Colors.primary, borderRadius: Radius.md,
  },
  viewFullText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.bold },
  sheetError: { fontSize: FontSize.md, color: Colors.textMuted, textAlign: 'center', paddingVertical: Spacing.xxl },
});
