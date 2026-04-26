import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../theme';

interface StreakDay {
  date: string;
  has_workout: boolean;
  was_frozen: boolean;
  streak_day: number;
}

interface Props {
  data: StreakDay[];
  currentStreak?: number;
  longestStreak?: number;
}

function getDayColor(day: StreakDay | undefined): string {
  if (!day) return 'transparent';
  if (day.has_workout) return Colors.success;
  if (day.was_frozen) return '#4A90FF';
  return Colors.bgMuted;
}

function getMonthLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleString('default', { month: 'short' });
}

export function StreakCalendar({ data, currentStreak = 0, longestStreak = 0 }: Props) {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No streak data yet</Text>
        <Text style={styles.emptySubtext}>Start working out consistently!</Text>
      </View>
    );
  }

  // Get streak tier
  function getStreakTier(streak: number): { emoji: string; label: string } {
    if (streak >= 365) return { emoji: '💎', label: 'Diamond' };
    if (streak >= 100) return { emoji: '👑', label: 'Gym Royalty' };
    if (streak >= 60) return { emoji: '🏆', label: 'Beast Mode' };
    if (streak >= 30) return { emoji: '💪', label: 'Iron Will' };
    if (streak >= 14) return { emoji: '⚡', label: 'Unstoppable' };
    if (streak >= 7) return { emoji: '🔥', label: 'On Fire' };
    return { emoji: '✨', label: 'Getting Started' };
  }

  const tier = getStreakTier(currentStreak);

  // Build calendar grid — last 90 days (13 weeks × 7 days)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateMap = new Map<string, StreakDay>();
  for (const d of data) {
    dateMap.set(d.date, d);
  }

  // Build 13 weeks of data
  const weeks: (StreakDay | null)[][] = [];
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 90);
  // Align to Sunday
  startDate.setDate(startDate.getDate() - startDate.getDay());

  let current = new Date(startDate);
  while (current <= today) {
    const week: (StreakDay | null)[] = [];
    for (let d = 0; d < 7; d++) {
      if (current > today) {
        week.push(null);
      } else {
        const dateStr = current.toISOString().split('T')[0];
        week.push(dateMap.get(dateStr) ?? null);
      }
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
  }

  // Month labels
  const monthLabels: { label: string; weekIdx: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, i) => {
    const firstDay = week.find(d => d !== null);
    if (firstDay) {
      const m = new Date(firstDay.date + 'T00:00:00').getMonth();
      if (m !== lastMonth) {
        monthLabels.push({ label: getMonthLabel(firstDay.date), weekIdx: i });
        lastMonth = m;
      }
    }
  });

  return (
    <View style={styles.container}>
      {/* Streak info header */}
      <View style={styles.streakHeader}>
        <View style={styles.streakInfo}>
          <Text style={styles.streakEmoji}>{tier.emoji}</Text>
          <View>
            <Text style={styles.streakCount}>{currentStreak}</Text>
            <Text style={styles.streakLabel}>Day Streak</Text>
          </View>
        </View>
        <View style={styles.streakMeta}>
          <Text style={styles.tierLabel}>{tier.label}</Text>
          <Text style={styles.bestLabel}>Best: {longestStreak}d</Text>
        </View>
      </View>

      {/* Calendar grid */}
      <View style={styles.gridContainer}>
        {/* Day labels */}
        <View style={styles.dayLabels}>
          {['', 'M', '', 'W', '', 'F', ''].map((label, i) => (
            <Text key={i} style={styles.dayLabel}>{label}</Text>
          ))}
        </View>

        {/* Weeks */}
        <View style={styles.weeksRow}>
          {weeks.map((week, wIdx) => (
            <View key={wIdx} style={styles.weekCol}>
              {week.map((day, dIdx) => (
                <View
                  key={dIdx}
                  style={[
                    styles.dayCell,
                    { backgroundColor: day ? getDayColor(day) : 'transparent' },
                    !day && { opacity: 0.1, backgroundColor: Colors.bgMuted },
                  ]}
                />
              ))}
            </View>
          ))}
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
          <Text style={styles.legendText}>Workout</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#4A90FF' }]} />
          <Text style={styles.legendText}>Rest Day (freeze)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.bgMuted }]} />
          <Text style={styles.legendText}>Off</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.md },
  emptyContainer: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.xs },
  emptyText: { fontSize: FontSize.md, color: Colors.textMuted, fontWeight: FontWeight.semibold },
  emptySubtext: { fontSize: FontSize.xs, color: Colors.textDisabled },
  streakHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  streakInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  streakEmoji: { fontSize: 28 },
  streakCount: { fontSize: FontSize.xxl, fontWeight: FontWeight.black, color: Colors.accent, lineHeight: 32 },
  streakLabel: { fontSize: FontSize.xxs, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  streakMeta: { alignItems: 'flex-end', gap: 2 },
  tierLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.accent },
  bestLabel: { fontSize: FontSize.xxs, color: Colors.textMuted },
  gridContainer: { flexDirection: 'row', gap: 4 },
  dayLabels: { gap: 2, justifyContent: 'space-between' },
  dayLabel: { fontSize: 8, color: Colors.textMuted, height: 12, lineHeight: 12 },
  weeksRow: { flex: 1, flexDirection: 'row', gap: 2 },
  weekCol: { flex: 1, gap: 2 },
  dayCell: { aspectRatio: 1, borderRadius: 2 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.lg },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 2 },
  legendText: { fontSize: FontSize.xxs, color: Colors.textMuted },
});
