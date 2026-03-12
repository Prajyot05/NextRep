import { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, Modal, FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActiveWorkoutStore } from '../../src/store/workoutStore';
import { useSyncStore } from '../../src/store/syncStore';
import { api } from '../../src/api/client';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../src/theme';

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
    queryFn:  api.exercises.list,
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
      // Offline — queue for later sync
      enqueue({ id: Date.now().toString(), type: 'CREATE_SESSION', payload: session, createdAt: new Date().toISOString() });
      router.replace('/(tabs)/history');
    },
  });

  function handleFinish() {
    const result = finishWorkout();
    if (!result) return;
    if (result.session.sets.length === 0) {
      Alert.alert('No sets recorded', 'Log at least one completed set before finishing.');
      return;
    }
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleDiscard}>
          <Text style={styles.discardBtn}>✕ Discard</Text>
        </TouchableOpacity>
        <View style={styles.timerBox}>
          <Text style={styles.timer}>{formatTime(elapsedSeconds)}</Text>
          <Text style={styles.workoutName}>{name}</Text>
        </View>
        <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
          <Text style={styles.finishBtnText}>Finish</Text>
        </TouchableOpacity>
      </View>

      {/* Sets summary */}
      <Text style={styles.setsSummary}>{totalCompletedSets} sets completed</Text>

      <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 120 }}>
        {exercises.map((block) => (
          <View key={block.exerciseId} style={styles.exerciseBlock}>
            <Text style={styles.exerciseName}>{block.exerciseName}</Text>

            {/* Set rows */}
            {block.sets.map((set) => (
              <View key={set.id} style={[styles.setRow, set.isCompleted && styles.setRowDone]}>
                <Text style={styles.setNum}>{set.setNumber}</Text>
                <TextInput
                  style={styles.setInput}
                  placeholder="kg"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="decimal-pad"
                  value={set.weightKg?.toString() ?? ''}
                  onChangeText={(v) => updateSet(block.exerciseId, set.id, { weightKg: v ? parseFloat(v) : undefined })}
                  editable={!set.isCompleted}
                />
                <Text style={styles.setX}>×</Text>
                <TextInput
                  style={styles.setInput}
                  placeholder="reps"
                  placeholderTextColor={Colors.textMuted}
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
                  <View style={styles.doneBadge}><Text style={styles.doneBadgeText}>✓</Text></View>
                )}
              </View>
            ))}

            <TouchableOpacity style={styles.addSetBtn} onPress={() => addSet(block.exerciseId)}>
              <Text style={styles.addSetBtnText}>+ Add Set</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Add exercise button */}
      <TouchableOpacity style={styles.addExerciseBtn} onPress={() => setExerciseModalOpen(true)}>
        <Text style={styles.addExerciseBtnText}>+ Add Exercise</Text>
      </TouchableOpacity>

      {/* Exercise picker modal */}
      <Modal visible={exerciseModalOpen} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
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
                <Text style={styles.exercisePickerMuscle}>{item.primaryMuscle}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: Colors.bg },
  header:             {
    flexDirection:    'row',
    justifyContent:   'space-between',
    alignItems:       'center',
    padding:          Spacing.md,
    paddingTop:       Spacing.xl,
    borderBottomWidth:1,
    borderBottomColor:Colors.border,
  },
  discardBtn:         { color: Colors.error, fontSize: FontSize.sm },
  timerBox:           { alignItems: 'center' },
  timer:              { fontSize: FontSize.xxl, fontWeight: FontWeight.black, color: Colors.primary, fontVariant: ['tabular-nums'] },
  workoutName:        { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  finishBtn:          { backgroundColor: Colors.success, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  finishBtnText:      { color: Colors.bg, fontWeight: FontWeight.bold, fontSize: FontSize.sm },
  setsSummary:        { textAlign: 'center', color: Colors.textMuted, fontSize: FontSize.xs, paddingVertical: Spacing.sm },
  list:               { flex: 1 },
  exerciseBlock:      { margin: Spacing.md, backgroundColor: Colors.bgCard, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  exerciseName:       { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text, marginBottom: Spacing.sm },
  setRow:             { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginVertical: 4 },
  setRowDone:         { opacity: 0.6 },
  setNum:             { width: 20, fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
  setInput:           {
    flex: 1,
    backgroundColor: Colors.bgMuted,
    borderRadius:    Radius.sm,
    padding:         Spacing.sm,
    color:           Colors.text,
    fontSize:        FontSize.sm,
    textAlign:       'center',
  },
  setX:               { color: Colors.textMuted },
  doneBtn:            { backgroundColor: Colors.primary, borderRadius: Radius.sm, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  doneBtnText:        { color: Colors.text, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  doneBadge:          { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.sm, backgroundColor: Colors.success },
  doneBadgeText:      { color: Colors.bg, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  addSetBtn:          { alignItems: 'center', paddingVertical: Spacing.sm },
  addSetBtnText:      { color: Colors.primary, fontSize: FontSize.sm },
  addExerciseBtn:     {
    position:        'absolute',
    bottom:          Spacing.xl,
    left:            Spacing.lg,
    right:           Spacing.lg,
    backgroundColor: Colors.accent,
    borderRadius:    Radius.lg,
    padding:         Spacing.md,
    alignItems:      'center',
  },
  addExerciseBtnText: { color: Colors.text, fontWeight: FontWeight.bold, fontSize: FontSize.md },
  modal:              { flex: 1, backgroundColor: Colors.bg },
  modalHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle:         { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  modalClose:         { color: Colors.primary, fontWeight: FontWeight.semibold },
  exercisePickerRow:  { padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  exercisePickerName: { fontSize: FontSize.md, color: Colors.text },
  exercisePickerMuscle:{ fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
});
