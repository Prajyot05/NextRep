import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients, Radius, Spacing, FontSize, FontWeight, Shadows } from '../../theme';
import type { GradientTuple } from '../../theme';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string;
  gradient?: GradientTuple;
}

export function StatCard({ label, value, icon, gradient }: StatCardProps) {
  return (
    <View style={[styles.card, Shadows.sm]}>
      <LinearGradient
        colors={gradient ?? Gradients.primarySoft}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.inner}
      >
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex:         1,
    minWidth:     '45%' as any,
    borderRadius: Radius.md,
    borderWidth:  1,
    borderColor:  Colors.border,
    overflow:     'hidden',
  },
  inner: {
    padding:    Spacing.md,
    alignItems: 'center',
  },
  icon: {
    fontSize:     20,
    marginBottom: Spacing.xs,
  },
  value: {
    fontSize:   FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color:      Colors.text,
    letterSpacing: -0.5,
  },
  label: {
    fontSize:   FontSize.xs,
    color:      Colors.textMuted,
    marginTop:  Spacing.xs,
    fontWeight: FontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
