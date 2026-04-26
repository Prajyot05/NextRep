import React from 'react';
import { Text, TouchableOpacity, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients, Radius, Spacing, FontSize, FontWeight, Shadows } from '../../theme';
import type { GradientTuple } from '../../theme';

type Variant = 'primary' | 'accent' | 'success' | 'danger' | 'ghost';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  size?: 'sm' | 'md' | 'lg';
}

const GRADIENT_MAP: Record<string, GradientTuple> = {
  primary: Gradients.primary,
  accent:  Gradients.accent,
  success: Gradients.success,
  danger:  ['#FF5252', '#D32F2F'],
};

export function GradientButton({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  style,
  size = 'md',
}: GradientButtonProps) {
  const isGhost = variant === 'ghost';
  const paddingV = size === 'sm' ? Spacing.sm : size === 'lg' ? Spacing.lg : Spacing.md;
  const fontSize = size === 'sm' ? FontSize.sm : size === 'lg' ? FontSize.lg : FontSize.md;

  if (isGhost) {
    return (
      <TouchableOpacity
        style={[styles.ghost, { paddingVertical: paddingV }, style]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.6}
      >
        <Text style={[styles.ghostText, { fontSize }]}>
          {icon ? `${icon} ` : ''}{title}
        </Text>
      </TouchableOpacity>
    );
  }

  const gradientColors = GRADIENT_MAP[variant] ?? Gradients.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[Shadows.md, style]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradient,
          { paddingVertical: paddingV },
          (disabled || loading) && styles.disabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={Colors.text} />
        ) : (
          <Text style={[styles.text, { fontSize }]}>
            {icon ? `${icon} ` : ''}{title}
          </Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gradient: {
    borderRadius:    Radius.full,
    paddingHorizontal: Spacing.xl,
    alignItems:      'center',
    justifyContent:  'center',
  },
  text: {
    color:      Colors.text,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
  disabled: {
    opacity: 0.5,
  },
  ghost: {
    alignItems:    'center',
    borderWidth:   1,
    borderColor:   Colors.border,
    borderRadius:  Radius.full,
    paddingHorizontal: Spacing.xl,
  },
  ghostText: {
    color:      Colors.textSecondary,
    fontWeight: FontWeight.semibold,
  },
});
