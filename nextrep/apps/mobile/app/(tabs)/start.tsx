import { View, Text, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../src/api/client';
import { useActiveWorkoutStore } from '../../src/store/workoutStore';
import { Colors, Spacing, Radius, FontSize, FontWeight, Gradients, Shadows } from '../../src/theme';
import { ScreenWrapper, Card, GradientButton, SectionHeader, Badge } from '../../src/components/ui';

export default function StartScreen() {
  const isActive      = useActiveWorkoutStore((s) => s.isActive);
  const startWorkout  = useActiveWorkoutStore((s) => s.startWorkout);
  const addExercise   = useActiveWorkoutStore((s) => s.addExercise);
  const addSet        = useActiveWorkoutStore((s) => s.addSet);

  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn:  api.templates.list,
  });

  function handleStartEmpty() {
    if (isActive) {
      Alert.alert('Workout in progress', 'You already have an active workout. Finish or discard it first.');
      return;
    }
    startWorkout('Quick Workout');
    router.push('/workout/active');
  }

  function handleStartFromTemplate(template: any) {
    if (isActive) {
      Alert.alert('Workout in progress', 'Finish or discard your current workout first.');
      return;
    }
    startWorkout(template.name, template.id);
    if (template.exercises?.length) {
      for (const te of template.exercises) {
        const ex = te.exercise;
        if (!ex) continue;
        addExercise(ex.id, ex.name);
        const numSets = te.targetSets ?? te.defaultSets ?? 3;
        for (let i = 0; i < numSets; i++) addSet(ex.id);
      }
    }
    router.push('/workout/active');
  }

  return (
    <ScreenWrapper paddingBottom={120}>
      <Text style={styles.title}>Start Workout</Text>
      <Text style={styles.subtitle}>Pick a template or go freestyle</Text>

      {/* Active workout resume */}
      {isActive && (
        <GradientButton
          title="Resume Active Workout"
          icon="🔴"
          variant="danger"
          onPress={() => router.push('/workout/active')}
          style={{ marginBottom: Spacing.lg }}
        />
      )}

      {/* Quick start */}
      <Card style={styles.quickStartCard}>
        <View style={styles.quickStartTextCol}>
          <Text style={styles.quickStartTitle}>Quick Start</Text>
          <Text style={styles.quickStartSub}>No template — just lift</Text>
        </View>
        <GradientButton
          title="START"
          onPress={handleStartEmpty}
          style={styles.quickStartBtn}
        />
      </Card>

      {/* Templates */}
      {templates && templates.length > 0 && (
        <>
          <SectionHeader title="My Templates" />
          {templates.map((t: any) => (
            <Card
              key={t.id}
              style={styles.templateCard}
              onPress={() => handleStartFromTemplate(t)}
            >
              <View style={styles.templateHeader}>
                <Text style={styles.templateName}>{t.name}</Text>
                <Badge
                  label={`${t.exercises?.length ?? 0} exercises`}
                  color={Colors.primary}
                  bgColor={Colors.primaryMuted}
                />
              </View>
              {t.description && (
                <Text style={styles.templateDesc}>{t.description}</Text>
              )}
            </Card>
          ))}
        </>
      )}

      <GradientButton
        title="Create Template"
        icon="+"
        variant="ghost"
        onPress={() => router.push('/template/new')}
        style={{ marginTop: Spacing.lg }}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize:      FontSize.xxxl,
    fontWeight:    FontWeight.extrabold,
    color:         Colors.text,
    letterSpacing: -0.5,
    paddingTop:    Spacing.sm,
  },
  subtitle: {
    fontSize:     FontSize.md,
    color:        Colors.textMuted,
    marginTop:    Spacing.xs,
    marginBottom: Spacing.xl,
  },
  quickStartCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems:  'center',
    marginBottom:  Spacing.lg,
  },
  quickStartTextCol: {
    flex: 1,
  },
  quickStartTitle: {
    fontSize: FontSize.lg,
    color: Colors.text,
    fontWeight: FontWeight.bold,
  },
  quickStartBtn: {
    minWidth:    100,
  },
  quickStartSub: {
    color:      Colors.textMuted,
    fontSize:   FontSize.sm,
    marginTop:  4,
  },
  templateCard: {
    marginBottom: Spacing.md,
  },
  templateHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    paddingTop:     Spacing.xs,
  },
  templateName: {
    fontSize:   FontSize.md,
    fontWeight: FontWeight.bold,
    color:      Colors.text,
  },
  templateDesc: {
    fontSize:  FontSize.sm,
    color:     Colors.textMuted,
    marginTop: Spacing.xs,
  },
});
