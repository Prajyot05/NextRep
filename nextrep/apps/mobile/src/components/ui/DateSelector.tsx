import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '../../theme';

interface DateItem {
  date: number;
  day: string;
  isToday?: boolean;
  isActive?: boolean;
  hasActivity?: boolean;
}

interface DateSelectorProps {
  dates: DateItem[];
  onSelectDate: (date: number) => void;
}

export function DateSelector({ dates, onSelectDate }: DateSelectorProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {dates.map((item, index) => {
        const activeColor = Colors.accent;
        return (
          <TouchableOpacity
            key={index}
            style={[styles.dateItem]}
            onPress={() => onSelectDate(item.date)}
            activeOpacity={0.7}
          >
            <Text style={[styles.dayText, item.isActive && styles.activeDayText]}>
              {item.day}
            </Text>
            <View style={[styles.dateCircle, item.isActive && { backgroundColor: activeColor }]}>
              <Text style={[styles.dateText, item.isActive && styles.activeDateText]}>
                {item.date}
              </Text>
            </View>
            {item.hasActivity && !item.isActive && (
              <View style={[styles.dot, { backgroundColor: Colors.accent }]} />
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  dateItem: {
    alignItems: 'center',
    gap: 4,
  },
  dayText: {
    fontSize: FontSize.xxs,
    color: Colors.textMuted,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
  },
  activeDayText: {
    color: Colors.text,
  },
  dateCircle: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    fontWeight: FontWeight.bold,
  },
  activeDateText: {
    color: Colors.text,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
});
