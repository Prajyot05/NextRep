import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, FontWeight } from '../../theme';

interface SectionHeaderProps {
  title: string;
  action?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, action, onAction }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {action && (
        onAction ? (
          <TouchableOpacity onPress={onAction} hitSlop={8}>
            <Text style={styles.action}>{action}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.actionLabel}>{action}</Text>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   Spacing.md,
    marginTop:      Spacing.lg,
  },
  title: {
    fontSize:      FontSize.lg,
    fontWeight:    FontWeight.bold,
    color:         Colors.text,
    letterSpacing: -0.3,
  },
  action: {
    fontSize:   FontSize.sm,
    color:      Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  actionLabel: {
    fontSize:   FontSize.xs,
    color:      Colors.textMuted,
    fontWeight: FontWeight.medium,
  },
});
