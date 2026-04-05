import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../../theme';

interface ScreenWrapperProps {
  children: React.ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  style?: ViewStyle;
  paddingBottom?: number;
}

export function ScreenWrapper({
  children,
  scroll = true,
  edges = ['top'],
  style,
  paddingBottom = 100,
}: ScreenWrapperProps) {
  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, { paddingBottom }, style]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, style]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg },
  flex:    { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
});
