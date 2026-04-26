import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '../../theme';

interface Stat {
  value: string | number;
  label?: string;
  icon?: string;
  iconColor?: string;
}

interface WorkoutGridCardProps {
  title: string;
  subtitle: string;
  stats: Stat[];
  onPress: () => void;
  dotColor?: string;
}

export function WorkoutGridCard({ title, subtitle, stats, onPress, dotColor = Colors.accent }: WorkoutGridCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: dotColor }]}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      
      <View style={styles.statsContainer}>
        {stats.map((stat, idx) => (
          <View key={idx} style={styles.statCol}>
            <View style={styles.statValueRow}>
              {stat.icon && <Text style={[styles.icon, { color: stat.iconColor || Colors.text }]}>{stat.icon}</Text>}
              <Text style={styles.statValue}>{stat.value}</Text>
            </View>
            {stat.label && <Text style={styles.statLabel}>{stat.label}</Text>}
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    flex: 1,
    minWidth: '45%',
    marginBottom: Spacing.md,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statCol: {
    alignItems: 'flex-start',
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  statLabel: {
    fontSize: FontSize.xxs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  icon: {
    fontSize: 12,
  },
});
