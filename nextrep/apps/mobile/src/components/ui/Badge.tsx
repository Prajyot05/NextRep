import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, FontSize, FontWeight, Spacing } from '../../theme';

interface BadgeProps {
  label: string;
  color?: string;
  bgColor?: string;
  style?: ViewStyle;
  size?: 'sm' | 'md';
}

export function Badge({ label, color, bgColor, style, size = 'sm' }: BadgeProps) {
  const bg   = bgColor ?? Colors.primaryMuted;
  const fg   = color ?? Colors.primary;
  const padH = size === 'sm' ? Spacing.sm : Spacing.md;
  const padV = size === 'sm' ? 3 : Spacing.xs;
  const fs   = size === 'sm' ? FontSize.xxs : FontSize.xs;

  return (
    <View style={[styles.badge, { backgroundColor: bg, paddingHorizontal: padH, paddingVertical: padV }, style]}>
      <Text style={[styles.text, { color: fg, fontSize: fs }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius:    Radius.full,
    alignSelf:       'flex-start',
  },
  text: {
    fontWeight:    FontWeight.semibold,
    letterSpacing: 0.3,
  },
});
