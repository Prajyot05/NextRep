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

export function Card({ children, style, accentColor, gradientAccent, onPress }: CardProps) {
  const Wrapper = onPress ? TouchableOpacity : View;
  const wrapperProps = onPress ? { onPress, activeOpacity: 0.7 } : {};

  return (
    <Wrapper style={[styles.card, Shadows.sm, style]} {...wrapperProps}>
      {(gradientAccent || accentColor) && (
        gradientAccent ? (
          <LinearGradient
            colors={gradientAccent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.accentLine}
          />
        ) : (
          <View style={[styles.accentLine, { backgroundColor: accentColor! }]} />
        )
      )}
      {children}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius:    Radius.md,
    padding:         Spacing.md,
    borderWidth:     1,
    borderColor:     Colors.border,
    overflow:        'hidden',
  },
  accentLine: {
    position:     'absolute',
    top:          0,
    left:         0,
    right:        0,
    height:       3,
    borderTopLeftRadius:  Radius.md,
    borderTopRightRadius: Radius.md,
  },
});
