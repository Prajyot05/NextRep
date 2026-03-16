import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../src/api/client';
import { useActiveWorkoutStore } from '../../src/store/workoutStore';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../src/theme';

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
    // Pre-populate exercises from the template
    if (template.exercises?.length) {
      for (const te of template.exercises) {
        const ex = te.exercise;
        if (!ex) continue;
        addExercise(ex.id, ex.name);
        // Add the target number of sets
        const numSets = te.targetSets ?? te.defaultSets ?? 3;
        for (let i = 0; i < numSets; i++) {
          addSet(ex.id);
        }
      }
    }
    router.push('/workout/active');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Start Workout</Text>

      {/* Active workout resume */}
      {isActive && (
        <TouchableOpacity style={styles.resumeCard} onPress={() => router.push('/workout/active')}>
          <Text style={styles.resumeText}>🔴 Resume Active Workout</Text>
        </TouchableOpacity>
      )}

      {/* Quick start */}
      <TouchableOpacity style={styles.quickStart} onPress={handleStartEmpty}>
        <Text style={styles.quickStartText}>⚡ Quick Start (Empty)</Text>
        <Text style={styles.quickStartSub}>No template — just start lifting</Text>
      </TouchableOpacity>

      {/* Templates */}
      {templates && templates.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>My Templates</Text>
          {templates.map((t: any) => (
            <TouchableOpacity
              key={t.id}
              style={styles.templateCard}
              onPress={() => handleStartFromTemplate(t)}
            >
              <Text style={styles.templateName}>{t.name}</Text>
              {t.description && (
                <Text style={styles.templateDesc}>{t.description}</Text>
              )}
              <Text style={styles.templateMeta}>{t.exercises?.length ?? 0} exercises</Text>
            </TouchableOpacity>
          ))}
        </>
      )}

      <TouchableOpacity style={styles.manageTemplates} onPress={() => router.push('/template/new')}>
        <Text style={styles.manageTemplatesText}>+ Create Template</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: Colors.bg },
  content:            { padding: Spacing.lg, paddingBottom: 100 },
  title:              { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.xl },
  resumeCard:         {
    backgroundColor: Colors.error,
    borderRadius:    Radius.md,
    padding:         Spacing.md,
    marginBottom:    Spacing.lg,
    alignItems:      'center',
  },
  resumeText:         { color: Colors.text, fontWeight: FontWeight.bold, fontSize: FontSize.md },
  quickStart:         {
    backgroundColor: Colors.primary,
    borderRadius:    Radius.lg,
    padding:         Spacing.xl,
    marginBottom:    Spacing.xl,
  },
  quickStartText:     { color: Colors.text, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  quickStartSub:      { color: Colors.primaryLight, fontSize: FontSize.sm, marginTop: Spacing.xs },
  sectionTitle:       { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.textMuted, marginBottom: Spacing.md },
  templateCard:       {
    backgroundColor: Colors.bgCard,
    borderRadius:    Radius.md,
    padding:         Spacing.md,
    marginBottom:    Spacing.md,
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  templateName:       { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  templateDesc:       { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: Spacing.xs },
  templateMeta:       { fontSize: FontSize.xs, color: Colors.primary, marginTop: Spacing.sm },
  manageTemplates:    { alignItems: 'center', marginTop: Spacing.lg },
  manageTemplatesText:{ color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
});
