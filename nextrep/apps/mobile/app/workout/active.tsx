import { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, Modal, FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActiveWorkoutStore } from '../../src/store/workoutStore';
import { useSyncStore } from '../../src/store/syncStore';
import { api } from '../../src/api/client';
import { Colors, Spacing, Radius, FontSize, FontWeight, Gradients, Shadows } from '../../src/theme';
import { Card, Badge, GradientButton } from '../../src/components/ui';

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function ActiveWorkoutScreen() {
  const {
    name, exercises, elapsedSeconds,
    addExercise, addSet, updateSet, completeSet, deleteSet,
    finishWorkout, discardWorkout, tick,
  } = useActiveWorkoutStore();

  const { enqueue } = useSyncStore();
  const queryClient  = useQueryClient();

  const [exerciseModalOpen, setExerciseModalOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(tick, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const { data: allExercises } = useQuery({
    queryKey: ['exercises'],
    queryFn:  () => api.exercises.list(),
  });

  const finishMutation = useMutation({
    mutationFn: (session: any) => api.workouts.create(session),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['streak'] });
      router.replace('/(tabs)/history');
    },
    onError: (_err, session) => {
      enqueue({ id: Date.now().toString(), type: 'CREATE_SESSION', payload: session, createdAt: new Date().toISOString() });
      router.replace('/(tabs)/history');
    },
  });

  function handleFinish() {
    const hasCompletedSets = exercises.some((block) => block.sets.some((s) => s.isCompleted));
    if (!hasCompletedSets) {
      Alert.alert('No sets recorded', 'Log at least one completed set before finishing.');
      return;
    }
    const result = finishWorkout();
    if (!result) return;
    finishMutation.mutate(result.session);
  }

  function handleDiscard() {
    Alert.alert('Discard Workout?', 'All progress will be lost.', [
      { text: 'Cancel',  style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => { discardWorkout(); router.replace('/(tabs)'); } },
    ]);
  }

  const totalCompletedSets = exercises.reduce((acc, b) => acc + b.sets.filter((s) => s.isCompleted).length, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Gradient header with timer */}
      <LinearGradient
        colors={Gradients.dark}
        style={styles.header}
      >
        <TouchableOpacity onPress={handleDiscard} hitSlop={12}>
          <Text style={styles.discardBtn}>✕</Text>
        </TouchableOpacity>
        <View style={styles.timerBox}>
          <Text style={styles.timer}>{formatTime(elapsedSeconds)}</Text>
          <Text style={styles.workoutName}>{name}</Text>
        </View>
        <GradientButton
          title="Finish"
          onPress={handleFinish}
          variant="success"
          size="sm"
        />
      </LinearGradient>

      {/* Sets summary */}
      <View style={styles.summaryBar}>
        <Badge label={`${totalCompletedSets} sets completed`} color={Colors.success} bgColor={Colors.successMuted} size="md" />
      </View>

      <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 120 }}>
        {exercises.map((block) => (
          <Card key={block.exerciseId} style={styles.exerciseBlock} gradientAccent={Gradients.primary}>
            <Text style={styles.exerciseName}>{block.exerciseName}</Text>

            {/* Column headers */}
            <View style={styles.setHeader}>
              <Text style={[styles.setHeaderText, { width: 28 }]}>SET</Text>
              <Text style={[styles.setHeaderText, { flex: 1 }]}>KG</Text>
              <Text style={[styles.setHeaderText, { width: 12 }]} />
              <Text style={[styles.setHeaderText, { flex: 1 }]}>REPS</Text>
              <Text style={[styles.setHeaderText, { width: 36 }]} />
            </View>

            {block.sets.map((set) => (
              <View key={set.id} style={[styles.setRow, set.isCompleted && styles.setRowDone]}>
                <Text style={styles.setNum}>{set.setNumber}</Text>
                <TextInput
                  style={[styles.setInput, set.isCompleted && styles.setInputDone]}
                  placeholder="0"
                  placeholderTextColor={Colors.textDisabled}
                  keyboardType="decimal-pad"
                  value={set.weightKg?.toString() ?? ''}
                  onChangeText={(v) => updateSet(block.exerciseId, set.id, { weightKg: v ? parseFloat(v) : undefined })}
                  editable={!set.isCompleted}
                />
                <Text style={styles.setX}>×</Text>
                <TextInput
                  style={[styles.setInput, set.isCompleted && styles.setInputDone]}
                  placeholder="0"
                  placeholderTextColor={Colors.textDisabled}
                  keyboardType="number-pad"
                  value={set.reps?.toString() ?? ''}
                  onChangeText={(v) => updateSet(block.exerciseId, set.id, { reps: v ? parseInt(v) : undefined })}
                  editable={!set.isCompleted}
                />
                {!set.isCompleted ? (
                  <TouchableOpacity
                    style={styles.doneBtn}
                    onPress={() => completeSet(block.exerciseId, set.id)}
                  >
                    <Text style={styles.doneBtnText}>✓</Text>
                  </TouchableOpacity>
                ) : (
                  <LinearGradient
                    colors={Gradients.success}
                    style={styles.doneBadge}
                  >
                    <Text style={styles.doneBadgeText}>✓</Text>
                  </LinearGradient>
                )}
              </View>
            ))}

            <TouchableOpacity style={styles.addSetBtn} onPress={() => addSet(block.exerciseId)}>
              <Text style={styles.addSetBtnText}>+ Add Set</Text>
            </TouchableOpacity>
          </Card>
        ))}
      </ScrollView>

      {/* Floating add exercise button */}
      <View style={styles.fabContainer}>
        <GradientButton
          title="Add Exercise"
          icon="+"
          onPress={() => setExerciseModalOpen(true)}
          variant="accent"
          size="md"
        />
      </View>

      {/* Exercise picker modal */}
      <Modal visible={exerciseModalOpen} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal} edges={['top']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Pick Exercise</Text>
            <TouchableOpacity onPress={() => setExerciseModalOpen(false)}>
              <Text style={styles.modalClose}>Done</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={allExercises ?? []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.exercisePickerRow}
                onPress={() => {
                  addExercise(item.id, item.name);
                  setExerciseModalOpen(false);
                }}
              >
                <Text style={styles.exercisePickerName}>{item.name}</Text>
                <Badge
                  label={item.primaryMuscle}
                  color={Colors.primary}
                  bgColor={Colors.primaryMuted}
                />
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: Colors.bg },
  header:          {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical:   Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  discardBtn:      {
    color:    Colors.error,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  timerBox:        { alignItems: 'center' },
  timer:           {
    fontSize:     FontSize.xxl,
    fontWeight:   FontWeight.black,
    color:        Colors.primary,
    fontVariant:  ['tabular-nums'],
    letterSpacing: 2,
  },
  workoutName:     { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  summaryBar:      {
    alignItems:  'center',
    paddingVertical: Spacing.sm,
  },
  list:            { flex: 1 },
  exerciseBlock:   { margin: Spacing.md, marginBottom: 0 },
  exerciseName:    {
    fontSize:   FontSize.md,
    fontWeight: FontWeight.bold,
    color:      Colors.text,
    marginBottom: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  setHeader:       {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
    marginBottom:  Spacing.xs,
    paddingHorizontal: 2,
  },
  setHeaderText:   {
    fontSize:      FontSize.xxs,
    color:         Colors.textMuted,
    fontWeight:    FontWeight.semibold,
    textAlign:     'center',
    letterSpacing: 1,
  },
  setRow:          {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
    marginVertical: 3,
  },
  setRowDone:      { opacity: 0.5 },
  setNum:          {
    width:     28,
    fontSize:  FontSize.sm,
    color:     Colors.textMuted,
    textAlign: 'center',
    fontWeight: FontWeight.semibold,
  },
  setInput:        {
    flex:            1,
    backgroundColor: Colors.bgMuted,
    borderRadius:    Radius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    color:           Colors.text,
    fontSize:        FontSize.sm,
    textAlign:       'center',
    borderWidth:     1,
    borderColor:     Colors.borderSubtle,
  },
  setInputDone:    { borderColor: Colors.successMuted },
  setX:            { color: Colors.textMuted, fontSize: FontSize.sm },
  doneBtn:         {
    backgroundColor: Colors.bgMuted,
    borderRadius:    Radius.sm,
    width:           36,
    height:          36,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  doneBtnText:     { color: Colors.text, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  doneBadge:       {
    width:        36,
    height:       36,
    alignItems:   'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
  },
  doneBadgeText:   { color: Colors.bg, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  addSetBtn:       { alignItems: 'center', paddingVertical: Spacing.sm },
  addSetBtnText:   { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  fabContainer:    {
    position:     'absolute',
    bottom:       Spacing.xl,
    left:         Spacing.lg,
    right:        Spacing.lg,
    ...Shadows.lg,
  },
  modal:           { flex: 1, backgroundColor: Colors.bg },
  modalHeader:     {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    padding:        Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle:      { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  modalClose:      { color: Colors.primary, fontWeight: FontWeight.semibold, fontSize: FontSize.md },
  exercisePickerRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    padding:        Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  exercisePickerName: { fontSize: FontSize.md, color: Colors.text, fontWeight: FontWeight.medium },
});
