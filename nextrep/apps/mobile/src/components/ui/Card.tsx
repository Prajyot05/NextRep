import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius, Spacing, Shadows, Gradients } from '../../theme';
import type { GradientTuple } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Color of the top accent line. null = no accent. */
  accentColor?: string | null;
  /** Use gradient top accent. Overrides accentColor. */
  gradientAccent?: GradientTuple;
  onPress?: () => void;
}

export function Card({ children, style, onPress }: CardProps) {
  const Wrapper = onPress ? TouchableOpacity : View;
  const wrapperProps = onPress ? { onPress, activeOpacity: 0.7 } : {};

  return (
    <Wrapper style={[styles.card, style]} {...wrapperProps}>
      {children}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius:    Radius.xl,
    padding:         Spacing.lg,
    borderWidth:     1,
    borderColor:     Colors.borderSubtle,
    overflow:        'hidden',
  },
});
