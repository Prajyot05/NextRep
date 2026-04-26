import { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, Modal, FlatList, Image, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActiveWorkoutStore } from '../../src/store/workoutStore';
import { useSyncStore } from '../../src/store/syncStore';
import { api, getUserFriendlyErrorMessage } from '../../src/api/client';
import {
  fetchCatalog, filterCatalog, selectCatalogExercise,
  getCatalogImageUrl, getExerciseImageUrl, getAvailableMuscleGroups,
  type CatalogExercise,
} from '../../src/api/exerciseApi';
import { Colors, Spacing, Radius, FontSize, FontWeight, Gradients, Shadows } from '../../src/theme';
import { Badge, GradientButton } from '../../src/components/ui';
import { RestTimerOverlay } from '../../src/components/workout/RestTimerOverlay';
import { useSettingsStore } from '../../src/store/settingsStore';
import * as Haptics from 'expo-haptics';

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── Level badge colors ─────────────────────────────────────────────────────
function getLevelStyle(level: string) {
  switch (level) {
    case 'beginner':     return { color: Colors.success, bg: Colors.successMuted };
    case 'intermediate': return { color: Colors.warning, bg: Colors.warningMuted };
    case 'expert':       return { color: Colors.error,   bg: Colors.errorMuted };
    default:             return { color: Colors.textMuted, bg: Colors.bgMuted };
  }
}

// ─── Muscle filter chips ────────────────────────────────────────────────────
const MUSCLE_EMOJI: Record<string, string> = {
  'abdominals': '🎯', 'biceps': '💪', 'calves': '🦵', 'chest': '🏋️',
  'forearms': '🤜', 'glutes': '🍑', 'hamstrings': '🦿', 'lats': '🔙',
  'lower back': '⬇️', 'middle back': '🔙', 'neck': '🦒', 'quadriceps': '🦵',
  'shoulders': '🔝', 'traps': '⬆️', 'triceps': '🔱', 'adductors': '🦵',
  'abductors': '🦵',
};

export default function ActiveWorkoutScreen() {
  const isActive = useActiveWorkoutStore((s) => s.isActive);
  const workoutName = useActiveWorkoutStore((s) => s.name);
  const exercises = useActiveWorkoutStore((s) => s.exercises);
  const elapsedSeconds = useActiveWorkoutStore((s) => s.elapsedSeconds);
  const addExercise = useActiveWorkoutStore((s) => s.addExercise);
  const addSet = useActiveWorkoutStore((s) => s.addSet);
  const updateSet = useActiveWorkoutStore((s) => s.updateSet);
  const completeSet = useActiveWorkoutStore((s) => s.completeSet);
  const finishWorkout = useActiveWorkoutStore((s) => s.finishWorkout);
  const discardWorkout = useActiveWorkoutStore((s) => s.discardWorkout);
  const tick = useActiveWorkoutStore((s) => s.tick);

  const { enqueue } = useSyncStore();
  const queryClient  = useQueryClient();
  const autoStartTimer = useSettingsStore(s => s.autoStartTimer);
  const hapticEnabled = useSettingsStore(s => s.hapticEnabled);

  const [exerciseModalOpen, setExerciseModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [isSelectingExercise, setIsSelectingExercise] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Only tick when workout is active and not finishing
  useEffect(() => {
    if (!isActive || isFinishing) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      return;
    }
    timerRef.current = setInterval(tick, 1000);
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  }, [isActive, isFinishing]);

  // If we land on this screen but there's no active workout, go back
  useEffect(() => {
    if (!isActive && !isFinishing) {
      router.replace('/(tabs)');
    }
  }, [isActive, isFinishing]);

  // Fetch catalog only when modal opens
  const { data: catalog, isLoading: isLoadingCatalog, error: catalogError, refetch: refetchCatalog } = useQuery({
    queryKey: ['exerciseCatalog'],
    queryFn:  () => fetchCatalog(),
    enabled: exerciseModalOpen,
    staleTime: 24 * 60 * 60 * 1000,
  });

  const availableMuscles = catalog ? getAvailableMuscleGroups(catalog) : [];

  const filteredCatalog = catalog
    ? filterCatalog(catalog, {
        query: searchQuery || undefined,
        muscle: selectedMuscle || undefined,
      })
    : [];

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
    if (isFinishing) return;
    const hasCompletedSets = exercises.some((block) => block.sets.some((s) => s.isCompleted));
    if (!hasCompletedSets) {
      Alert.alert('No sets recorded', 'Log at least one completed set before finishing.');
      return;
    }
    setIsFinishing(true);
    const result = finishWorkout();
    if (!result) { setIsFinishing(false); return; }
    finishMutation.mutate(result.session);
  }

  function handleDiscard() {
    Alert.alert('Discard Workout?', 'All progress will be lost.', [
      { text: 'Cancel',  style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => {
        setIsFinishing(true);
        discardWorkout();
        router.replace('/(tabs)');
      }},
    ]);
  }

  const handleSelectCatalogExercise = useCallback(async (catalogExercise: CatalogExercise) => {
    if (isSelectingExercise) return;
    setIsSelectingExercise(true);

    try {
      const dbExercise = await selectCatalogExercise(catalogExercise);
      addExercise(dbExercise.id, dbExercise.name);
      setExerciseModalOpen(false);
      setSearchQuery('');
      setSelectedMuscle(null);
    } catch (err) {
      Alert.alert('Error', getUserFriendlyErrorMessage(err, 'Could not add exercise. Please try again.'));
    } finally {
      setIsSelectingExercise(false);
    }
  }, [isSelectingExercise, addExercise]);

  const totalCompletedSets = exercises.reduce((acc, b) => acc + b.sets.filter((s) => s.isCompleted).length, 0);
  const totalVolume = exercises.reduce((acc, b) => {
    return acc + b.sets
      .filter((s) => s.isCompleted && s.weightKg && s.reps)
      .reduce((sum, s) => sum + (s.weightKg! * s.reps!), 0);
  }, 0);

  // ── Finishing overlay ───────────────────────────────────────────────────
  if (isFinishing) {
    return (
      <View style={styles.finishingContainer}>
        <ActivityIndicator color={Colors.primary} size="large" />
        <Text style={styles.finishingText}>Saving workout...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <LinearGradient colors={Gradients.dark} style={styles.header}>
        <TouchableOpacity onPress={handleDiscard} hitSlop={12} style={styles.headerBtn}>
          <Text style={styles.discardIcon}>✕</Text>
        </TouchableOpacity>

        <View style={styles.timerBox}>
          <Text style={styles.timer}>{formatTime(elapsedSeconds)}</Text>
          <Text style={styles.workoutName} numberOfLines={1}>{workoutName}</Text>
        </View>

        <TouchableOpacity onPress={handleFinish} style={styles.finishBtn} activeOpacity={0.8}>
          <LinearGradient colors={Gradients.success} style={styles.finishBtnGrad}>
            <Text style={styles.finishBtnText}>Finish</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>

      {/* ── Summary bar ────────────────────────────────────────────────── */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryChip}>
          <Text style={styles.summaryValue}>{totalCompletedSets}</Text>
          <Text style={styles.summaryLabel}>sets</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryChip}>
          <Text style={styles.summaryValue}>{exercises.length}</Text>
          <Text style={styles.summaryLabel}>exercises</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryChip}>
          <Text style={styles.summaryValue}>{Math.round(totalVolume)}</Text>
          <Text style={styles.summaryLabel}>kg vol</Text>
        </View>
      </View>

      {/* ── Exercise blocks ────────────────────────────────────────────── */}
      <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 120 }}>
        {exercises.map((block) => (
          <View key={block.exerciseId} style={styles.exerciseCard}>
            {/* Exercise header with name */}
            <View style={styles.exHeaderRow}>
              <View style={styles.exNameRow}>
                <View style={styles.exAccent} />
                <Text style={styles.exName} numberOfLines={1}>{block.exerciseName}</Text>
              </View>
            </View>

            {/* Column headers */}
            <View style={styles.setHeader}>
              <Text style={[styles.setHeaderCell, { width: 32 }]}>SET</Text>
              <Text style={[styles.setHeaderCell, { flex: 1 }]}>KG</Text>
              <Text style={[styles.setHeaderCell, { width: 16 }]} />
              <Text style={[styles.setHeaderCell, { flex: 1 }]}>REPS</Text>
              <Text style={[styles.setHeaderCell, { width: 40 }]} />
            </View>

            {/* Sets */}
            {block.sets.map((set) => (
              <View key={set.id} style={[styles.setRow, set.isCompleted && styles.setRowDone]}>
                <View style={styles.setNumBadge}>
                  <Text style={styles.setNum}>{set.setNumber}</Text>
                </View>
                <TextInput
                  style={[styles.setInput, set.isCompleted && styles.setInputDone]}
                  placeholder="—"
                  placeholderTextColor={Colors.textDisabled}
                  keyboardType="decimal-pad"
                  value={set.weightKg?.toString() ?? ''}
                  onChangeText={(v) => updateSet(block.exerciseId, set.id, { weightKg: v ? parseFloat(v) : undefined })}
                  editable={!set.isCompleted}
                />
                <Text style={styles.setX}>×</Text>
                <TextInput
                  style={[styles.setInput, set.isCompleted && styles.setInputDone]}
                  placeholder="—"
                  placeholderTextColor={Colors.textDisabled}
                  keyboardType="number-pad"
                  value={set.reps?.toString() ?? ''}
                  onChangeText={(v) => updateSet(block.exerciseId, set.id, { reps: v ? parseInt(v) : undefined })}
                  editable={!set.isCompleted}
                />
                {!set.isCompleted ? (
                  <TouchableOpacity
                    style={styles.checkBtn}
                    onPress={() => {
                      completeSet(block.exerciseId, set.id);
                      if (hapticEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      if (autoStartTimer) setShowRestTimer(true);
                    }}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.checkBtnText}>✓</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.checkDone}>
                    <Text style={styles.checkDoneText}>✓</Text>
                  </View>
                )}
              </View>
            ))}

            {/* Add set */}
            <TouchableOpacity style={styles.addSetBtn} onPress={() => addSet(block.exerciseId)} activeOpacity={0.6}>
              <Text style={styles.addSetText}>+ Add Set</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* ── FAB ────────────────────────────────────────────────────────── */}
      <View style={styles.fabWrap}>
        <TouchableOpacity
          onPress={() => setExerciseModalOpen(true)}
          activeOpacity={0.85}
          style={styles.fab}
        >
          <LinearGradient colors={Gradients.accent} style={styles.fabGrad}>
            <Text style={styles.fabIcon}>+</Text>
            <Text style={styles.fabLabel}>Add Exercise</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  Exercise Catalog Picker Modal                                 */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Modal visible={exerciseModalOpen} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal} edges={['top']}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Add Exercise</Text>
              <Text style={styles.modalSubtitle}>Browse 870+ exercises</Text>
            </View>
            <TouchableOpacity
              onPress={() => { setExerciseModalOpen(false); setSearchQuery(''); setSelectedMuscle(null); }}
              style={styles.modalDoneBtn}
            >
              <Text style={styles.modalDoneText}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <View style={styles.searchWrap}>
            <View style={styles.searchBar}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search exercises..."
                placeholderTextColor={Colors.textDisabled}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
                  <Text style={styles.searchClear}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Muscle filter chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContent}
            style={styles.chipsScroll}
          >
            <TouchableOpacity
              style={[styles.chip, !selectedMuscle && styles.chipActive]}
              onPress={() => setSelectedMuscle(null)}
            >
              <Text style={[styles.chipText, !selectedMuscle && styles.chipTextActive]}>All</Text>
            </TouchableOpacity>
            {availableMuscles.map((muscle) => (
              <TouchableOpacity
                key={muscle}
                style={[styles.chip, selectedMuscle === muscle && styles.chipActive]}
                onPress={() => setSelectedMuscle(selectedMuscle === muscle ? null : muscle)}
              >
                <Text style={[styles.chipText, selectedMuscle === muscle && styles.chipTextActive]}>
                  {MUSCLE_EMOJI[muscle] ?? ''} {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Results count */}
          {catalog && (
            <View style={styles.resultsBar}>
              <Text style={styles.resultsText}>
                {filteredCatalog.length} exercise{filteredCatalog.length !== 1 ? 's' : ''}
                {selectedMuscle ? ` · ${selectedMuscle}` : ''}
              </Text>
            </View>
          )}

          {/* Loading / Error / List */}
          {isLoadingCatalog ? (
            <View style={styles.stateWrap}>
              <ActivityIndicator color={Colors.primary} size="large" />
              <Text style={styles.stateText}>Loading exercises...</Text>
            </View>
          ) : catalogError ? (
            <View style={styles.stateWrap}>
              <Text style={{ fontSize: 48, marginBottom: Spacing.md }}>📡</Text>
              <Text style={styles.stateTitle}>Could not load exercises</Text>
              <Text style={styles.stateText}>{getUserFriendlyErrorMessage(catalogError)}</Text>
              <GradientButton
                title="Try Again"
                onPress={() => refetchCatalog()}
                variant="primary"
                size="sm"
                style={{ marginTop: Spacing.md }}
              />
            </View>
          ) : (
            <FlatList
              style={styles.catalogList}
              contentContainerStyle={filteredCatalog.length ? { paddingBottom: 40 } : styles.stateWrap}
              data={filteredCatalog}
              keyExtractor={(item) => item.id}
              initialNumToRender={15}
              maxToRenderPerBatch={10}
              windowSize={5}
              ListEmptyComponent={
                <View style={styles.stateWrap}>
                  <Text style={{ fontSize: 48, marginBottom: Spacing.md }}>🔎</Text>
                  <Text style={styles.stateTitle}>No exercises found</Text>
                  <Text style={styles.stateText}>Try a different search or filter</Text>
                </View>
              }
              renderItem={({ item }) => {
                const levelStyle = getLevelStyle(item.level);
                return (
                  <TouchableOpacity
                    style={styles.catalogItem}
                    onPress={() => handleSelectCatalogExercise(item)}
                    activeOpacity={0.65}
                    disabled={isSelectingExercise}
                  >
                    <Image
                      source={{ uri: getCatalogImageUrl(item.id, 0) }}
                      style={styles.catalogImg}
                      resizeMode="cover"
                    />
                    <View style={styles.catalogInfo}>
                      <Text style={styles.catalogName} numberOfLines={2}>{item.name}</Text>
                      <View style={styles.catalogBadges}>
                        <Badge
                          label={(item.primaryMuscles[0] ?? 'General').charAt(0).toUpperCase() + (item.primaryMuscles[0] ?? 'general').slice(1)}
                          color={Colors.primary}
                          bgColor={Colors.primaryMuted}
                        />
                        {item.equipment && (
                          <Badge label={item.equipment} color={Colors.accent} bgColor={Colors.accentMuted} />
                        )}
                        <Badge label={item.level} color={levelStyle.color} bgColor={levelStyle.bg} />
                      </View>
                    </View>
                    <Text style={styles.catalogChevron}>›</Text>
                  </TouchableOpacity>
                );
              }}
            />
          )}

          {/* Selecting overlay */}
          {isSelectingExercise && (
            <View style={styles.overlay}>
              <View style={styles.overlayBox}>
                <ActivityIndicator color={Colors.primary} size="large" />
                <Text style={styles.overlayText}>Adding exercise...</Text>
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* Rest Timer Overlay */}
      <RestTimerOverlay visible={showRestTimer} onDismiss={() => setShowRestTimer(false)} />
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },

  // ── Finishing overlay ─────────────────────────────────────────────
  finishingContainer: {
    flex: 1, backgroundColor: Colors.bg,
    alignItems: 'center', justifyContent: 'center', gap: Spacing.lg,
  },
  finishingText: {
    fontSize: FontSize.md, color: Colors.textSecondary, fontWeight: FontWeight.medium,
  },

  // ── Header ────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.bgMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  discardIcon: { color: Colors.error, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  timerBox: { alignItems: 'center', flex: 1, marginHorizontal: Spacing.md },
  timer: {
    fontSize: FontSize.xxl, fontWeight: FontWeight.black, color: Colors.primary,
    fontVariant: ['tabular-nums'], letterSpacing: 2,
  },
  workoutName: { fontSize: FontSize.xxs, color: Colors.textMuted, marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 },
  finishBtn: { borderRadius: Radius.sm, overflow: 'hidden' },
  finishBtnGrad: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm + 2, borderRadius: Radius.sm },
  finishBtnText: { color: '#000', fontSize: FontSize.sm, fontWeight: FontWeight.bold },

  // ── Summary bar ───────────────────────────────────────────────────
  summaryBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.md, gap: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle,
  },
  summaryChip: { alignItems: 'center' },
  summaryValue: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text, fontVariant: ['tabular-nums'] },
  summaryLabel: { fontSize: FontSize.xxs, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginTop: 1 },
  summaryDivider: { width: 1, height: 28, backgroundColor: Colors.border },

  // ── Exercise cards ────────────────────────────────────────────────
  list: { flex: 1 },
  exerciseCard: {
    marginHorizontal: Spacing.md, marginTop: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
  },
  exHeaderRow: {
    paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
  },
  exNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  exAccent: { width: 3, height: 18, borderRadius: 2, backgroundColor: Colors.primary },
  exName: {
    fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text,
    flex: 1,
  },

  // ── Sets ──────────────────────────────────────────────────────────
  setHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, marginBottom: Spacing.xs,
  },
  setHeaderCell: {
    fontSize: FontSize.xxs, color: Colors.textMuted, fontWeight: FontWeight.semibold,
    textAlign: 'center', letterSpacing: 1, textTransform: 'uppercase',
  },
  setRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, marginVertical: 2,
  },
  setRowDone: { opacity: 0.45 },
  setNumBadge: {
    width: 32, height: 28, borderRadius: Radius.xs,
    backgroundColor: Colors.bgMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  setNum: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.bold },
  setInput: {
    flex: 1, backgroundColor: Colors.bgMuted, borderRadius: Radius.xs,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.sm,
    color: Colors.text, fontSize: FontSize.sm, textAlign: 'center',
    borderWidth: 1, borderColor: Colors.borderSubtle,
  },
  setInputDone: { borderColor: 'rgba(0,230,118,0.2)' },
  setX: { color: Colors.textDisabled, fontSize: FontSize.sm },
  checkBtn: {
    width: 40, height: 36, borderRadius: Radius.xs,
    backgroundColor: Colors.bgMuted,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  checkBtnText: { color: Colors.text, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  checkDone: {
    width: 40, height: 36, borderRadius: Radius.xs,
    backgroundColor: Colors.success,
    alignItems: 'center', justifyContent: 'center',
  },
  checkDoneText: { color: '#000', fontSize: FontSize.md, fontWeight: FontWeight.bold },
  addSetBtn: {
    alignItems: 'center', paddingVertical: Spacing.sm + 2,
    borderTopWidth: 1, borderTopColor: Colors.borderSubtle,
    marginTop: Spacing.xs,
  },
  addSetText: { color: Colors.primary, fontSize: FontSize.xs, fontWeight: FontWeight.semibold, letterSpacing: 0.3 },

  // ── FAB ───────────────────────────────────────────────────────────
  fabWrap: {
    position: 'absolute', bottom: Spacing.xxl, left: Spacing.lg, right: Spacing.lg,
    ...Shadows.lg,
  },
  fab: { borderRadius: Radius.md, overflow: 'hidden' },
  fabGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.md, gap: Spacing.sm,
  },
  fabIcon: { color: '#fff', fontSize: FontSize.xl, fontWeight: FontWeight.black },
  fabLabel: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.bold, letterSpacing: 0.5 },

  // ── Modal ─────────────────────────────────────────────────────────
  modal: { flex: 1, backgroundColor: Colors.bg },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  modalSubtitle: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  modalDoneBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.sm, backgroundColor: Colors.primaryMuted,
  },
  modalDoneText: { color: Colors.primary, fontWeight: FontWeight.semibold, fontSize: FontSize.sm },

  // ── Search ────────────────────────────────────────────────────────
  searchWrap: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgMuted, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, height: 44,
    borderWidth: 1, borderColor: Colors.borderSubtle,
  },
  searchIcon: { fontSize: FontSize.sm, marginRight: Spacing.sm },
  searchInput: { flex: 1, color: Colors.text, fontSize: FontSize.sm, paddingVertical: 0 },
  searchClear: { color: Colors.textMuted, fontSize: FontSize.sm, paddingLeft: Spacing.sm },

  // ── Chips ─────────────────────────────────────────────────────────
  chipsScroll: { maxHeight: 40 },
  chipsContent: { paddingHorizontal: Spacing.lg, gap: Spacing.xs, alignItems: 'center' },
  chip: {
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: Radius.full, backgroundColor: Colors.bgMuted,
    borderWidth: 1, borderColor: Colors.borderSubtle,
  },
  chipActive: { backgroundColor: Colors.primaryMuted, borderColor: Colors.primary },
  chipText: { fontSize: FontSize.xxs, color: Colors.textMuted, fontWeight: FontWeight.medium },
  chipTextActive: { color: Colors.primary, fontWeight: FontWeight.semibold },

  // ── Results ───────────────────────────────────────────────────────
  resultsBar: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  resultsText: { fontSize: FontSize.xxs, color: Colors.textMuted, fontWeight: FontWeight.medium, letterSpacing: 0.3 },

  // ── Catalog list ──────────────────────────────────────────────────
  catalogList: { flex: 1 },
  catalogItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle,
    gap: Spacing.md,
  },
  catalogImg: {
    width: 56, height: 56, borderRadius: Radius.sm, backgroundColor: Colors.bgMuted,
  },
  catalogInfo: { flex: 1, gap: 4 },
  catalogName: { fontSize: FontSize.sm, color: Colors.text, fontWeight: FontWeight.semibold },
  catalogBadges: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  catalogChevron: { fontSize: FontSize.xl, color: Colors.textDisabled },

  // ── States ────────────────────────────────────────────────────────
  stateWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  stateTitle: { fontSize: FontSize.md, color: Colors.text, fontWeight: FontWeight.semibold, textAlign: 'center' },
  stateText: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.xs },

  // ── Overlay ───────────────────────────────────────────────────────
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.bgOverlay,
    alignItems: 'center', justifyContent: 'center',
  },
  overlayBox: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    padding: Spacing.xl, alignItems: 'center', gap: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
    ...Shadows.lg,
  },
  overlayText: { fontSize: FontSize.sm, color: Colors.text, fontWeight: FontWeight.medium },
});
