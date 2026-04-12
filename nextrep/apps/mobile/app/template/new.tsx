import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, Modal, FlatList, Image, ActivityIndicator, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api, getUserFriendlyErrorMessage } from '../../src/api/client';
import {
  fetchCatalog, filterCatalog, selectCatalogExercise,
  getCatalogImageUrl, getAvailableMuscleGroups,
  type CatalogExercise,
} from '../../src/api/exerciseApi';
import { Colors, Spacing, Radius, FontSize, FontWeight, Gradients, Shadows } from '../../src/theme';
import { Badge } from '../../src/components/ui';
import { LinearGradient } from 'expo-linear-gradient';

interface TemplateExercise {
  exerciseId: string;
  exerciseName: string;
  defaultSets: number;
  defaultReps: number;
  restSeconds: number;
}

export default function NewTemplateScreen() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [exercises, setExercises] = useState<TemplateExercise[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [isSelectingExercise, setIsSelectingExercise] = useState(false);

  const { data: catalog, isLoading: isLoadingCatalog } = useQuery({
    queryKey: ['exerciseCatalog'],
    queryFn: () => fetchCatalog(),
    enabled: pickerOpen,
    staleTime: 24 * 60 * 60 * 1000,
  });

  const availableMuscles = catalog ? getAvailableMuscleGroups(catalog) : [];
  const filteredCatalog = catalog
    ? filterCatalog(catalog, { query: searchQuery || undefined, muscle: selectedMuscle || undefined })
    : [];

  const createMutation = useMutation({
    mutationFn: (body: any) => api.templates.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      router.back();
    },
    onError: (err) => {
      Alert.alert('Error', getUserFriendlyErrorMessage(err, 'Could not create template'));
    },
  });

  function handleSave() {
    if (!name.trim()) {
      Alert.alert('Name required', 'Give your template a name like "Push Day" or "Upper A".');
      return;
    }
    if (exercises.length === 0) {
      Alert.alert('No exercises', 'Add at least one exercise to the template.');
      return;
    }
    createMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      exercises: exercises.map((ex) => ({
        exerciseId: ex.exerciseId,
        defaultSets: ex.defaultSets,
        defaultReps: ex.defaultReps,
        restSeconds: ex.restSeconds,
      })),
    });
  }

  const handleSelectCatalogExercise = useCallback(async (catalogExercise: CatalogExercise) => {
    if (isSelectingExercise) return;
    setIsSelectingExercise(true);
    try {
      const dbExercise = await selectCatalogExercise(catalogExercise);
      setExercises((prev) => [...prev, {
        exerciseId: dbExercise.id,
        exerciseName: dbExercise.name,
        defaultSets: 3,
        defaultReps: 10,
        restSeconds: 90,
      }]);
      setPickerOpen(false);
      setSearchQuery('');
      setSelectedMuscle(null);
    } catch (err) {
      Alert.alert('Error', getUserFriendlyErrorMessage(err, 'Could not add exercise'));
    } finally {
      setIsSelectingExercise(false);
    }
  }, [isSelectingExercise]);

  function updateExercise(index: number, updates: Partial<TemplateExercise>) {
    setExercises((prev) => prev.map((ex, i) => i === index ? { ...ex, ...updates } : ex));
  }

  function removeExercise(index: number) {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  }

  function moveExercise(from: number, to: number) {
    if (to < 0 || to >= exercises.length) return;
    setExercises((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(from, 1);
      copy.splice(to, 0, item);
      return copy;
    });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Template</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveBtn, (!name.trim() || exercises.length === 0) && styles.saveBtnDisabled]}
          disabled={createMutation.isPending || !name.trim() || exercises.length === 0}
        >
          {createMutation.isPending ? (
            <ActivityIndicator color="#000" size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Name & Description */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>TEMPLATE NAME</Text>
          <TextInput
            style={styles.nameInput}
            placeholder="e.g. Push Day 1, Upper A, Leg Day..."
            placeholderTextColor={Colors.textDisabled}
            value={name}
            onChangeText={setName}
            autoFocus
            maxLength={50}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>DESCRIPTION (OPTIONAL)</Text>
          <TextInput
            style={styles.descInput}
            placeholder="Brief notes about this template..."
            placeholderTextColor={Colors.textDisabled}
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={200}
          />
        </View>

        {/* Exercises */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Exercises</Text>
          <Text style={styles.sectionCount}>{exercises.length}</Text>
        </View>

        {exercises.map((ex, i) => (
          <View key={`${ex.exerciseId}-${i}`} style={styles.exerciseCard}>
            <View style={styles.exHeader}>
              <View style={styles.exOrderBadge}>
                <Text style={styles.exOrderText}>{i + 1}</Text>
              </View>
              <Text style={styles.exName} numberOfLines={1}>{ex.exerciseName}</Text>
              <View style={styles.exActions}>
                {i > 0 && (
                  <TouchableOpacity onPress={() => moveExercise(i, i - 1)} hitSlop={8}>
                    <Ionicons name="chevron-up" size={18} color={Colors.textMuted} />
                  </TouchableOpacity>
                )}
                {i < exercises.length - 1 && (
                  <TouchableOpacity onPress={() => moveExercise(i, i + 1)} hitSlop={8}>
                    <Ionicons name="chevron-down" size={18} color={Colors.textMuted} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => removeExercise(i)} hitSlop={8}>
                  <Ionicons name="close-circle" size={20} color={Colors.error} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Configurable values */}
            <View style={styles.exConfig}>
              <View style={styles.configItem}>
                <Text style={styles.configLabel}>Sets</Text>
                <View style={styles.stepper}>
                  <TouchableOpacity
                    onPress={() => updateExercise(i, { defaultSets: Math.max(1, ex.defaultSets - 1) })}
                    style={styles.stepperBtn}
                  >
                    <Text style={styles.stepperBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepperValue}>{ex.defaultSets}</Text>
                  <TouchableOpacity
                    onPress={() => updateExercise(i, { defaultSets: Math.min(10, ex.defaultSets + 1) })}
                    style={styles.stepperBtn}
                  >
                    <Text style={styles.stepperBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.configItem}>
                <Text style={styles.configLabel}>Reps</Text>
                <View style={styles.stepper}>
                  <TouchableOpacity
                    onPress={() => updateExercise(i, { defaultReps: Math.max(1, ex.defaultReps - 1) })}
                    style={styles.stepperBtn}
                  >
                    <Text style={styles.stepperBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepperValue}>{ex.defaultReps}</Text>
                  <TouchableOpacity
                    onPress={() => updateExercise(i, { defaultReps: Math.min(50, ex.defaultReps + 1) })}
                    style={styles.stepperBtn}
                  >
                    <Text style={styles.stepperBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.configItem}>
                <Text style={styles.configLabel}>Rest</Text>
                <View style={styles.stepper}>
                  <TouchableOpacity
                    onPress={() => updateExercise(i, { restSeconds: Math.max(15, ex.restSeconds - 15) })}
                    style={styles.stepperBtn}
                  >
                    <Text style={styles.stepperBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepperValue}>{ex.restSeconds}s</Text>
                  <TouchableOpacity
                    onPress={() => updateExercise(i, { restSeconds: Math.min(300, ex.restSeconds + 15) })}
                    style={styles.stepperBtn}
                  >
                    <Text style={styles.stepperBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ))}

        {/* Add exercise button */}
        <TouchableOpacity
          style={styles.addExBtn}
          onPress={() => setPickerOpen(true)}
          activeOpacity={0.7}
        >
          <LinearGradient colors={Gradients.primarySoft as any} style={styles.addExGrad}>
            <Ionicons name="add-circle-outline" size={22} color={Colors.primary} />
            <Text style={styles.addExText}>Add Exercise</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* ─── Exercise Picker Modal ──────────────────────────────────── */}
      <Modal visible={pickerOpen} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal} edges={['top']}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Add Exercise</Text>
              <Text style={styles.modalSubtitle}>Pick exercises for your template</Text>
            </View>
            <TouchableOpacity
              onPress={() => { setPickerOpen(false); setSearchQuery(''); setSelectedMuscle(null); }}
              style={styles.modalDoneBtn}
            >
              <Text style={styles.modalDoneText}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Search */}
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
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
                  <Text style={styles.searchClear}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Muscle chips */}
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
                  {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {isLoadingCatalog ? (
            <View style={styles.stateWrap}>
              <ActivityIndicator color={Colors.primary} size="large" />
              <Text style={styles.stateText}>Loading exercises...</Text>
            </View>
          ) : (
            <FlatList
              style={{ flex: 1 }}
              contentContainerStyle={filteredCatalog.length ? { paddingBottom: 40 } : styles.stateWrap}
              data={filteredCatalog}
              keyExtractor={(item) => item.id}
              initialNumToRender={15}
              maxToRenderPerBatch={10}
              ListEmptyComponent={
                <View style={styles.stateWrap}>
                  <Text style={{ fontSize: 48, marginBottom: Spacing.md }}>🔎</Text>
                  <Text style={styles.stateTitle}>No exercises found</Text>
                </View>
              }
              renderItem={({ item }) => (
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
                    </View>
                  </View>
                  <Text style={{ fontSize: FontSize.xl, color: Colors.textDisabled }}>›</Text>
                </TouchableOpacity>
              )}
            />
          )}

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bgMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.sm,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm + 2,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { color: '#000', fontSize: FontSize.sm, fontWeight: FontWeight.bold },

  // Body
  body: { flex: 1, paddingHorizontal: Spacing.lg },

  // Fields
  fieldGroup: { marginTop: Spacing.lg },
  fieldLabel: {
    fontSize: FontSize.xxs, color: Colors.textMuted, fontWeight: FontWeight.semibold,
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: Spacing.xs,
  },
  nameInput: {
    backgroundColor: Colors.bgMuted, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    color: Colors.text, fontSize: FontSize.lg, fontWeight: FontWeight.semibold,
    borderWidth: 1, borderColor: Colors.borderSubtle,
  },
  descInput: {
    backgroundColor: Colors.bgMuted, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    color: Colors.text, fontSize: FontSize.sm,
    borderWidth: 1, borderColor: Colors.borderSubtle,
    minHeight: 60, textAlignVertical: 'top',
  },

  // Section
  sectionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: Spacing.xl, marginBottom: Spacing.md,
  },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  sectionCount: {
    fontSize: FontSize.sm, color: Colors.textMuted,
    backgroundColor: Colors.bgMuted, borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 2,
    fontWeight: FontWeight.semibold, overflow: 'hidden',
  },

  // Exercise card
  exerciseCard: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  exHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
  },
  exOrderBadge: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primaryMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  exOrderText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.primary },
  exName: { flex: 1, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text },
  exActions: { flexDirection: 'row', gap: Spacing.xs, alignItems: 'center' },

  // Config
  exConfig: {
    flexDirection: 'row', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingBottom: Spacing.md,
  },
  configItem: { flex: 1, alignItems: 'center' },
  configLabel: {
    fontSize: FontSize.xxs, color: Colors.textMuted, fontWeight: FontWeight.medium,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4,
  },
  stepper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgMuted, borderRadius: Radius.sm, overflow: 'hidden',
  },
  stepperBtn: {
    paddingHorizontal: Spacing.sm + 2, paddingVertical: Spacing.xs + 2,
  },
  stepperBtnText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  stepperValue: {
    color: Colors.text, fontSize: FontSize.sm, fontWeight: FontWeight.semibold,
    minWidth: 32, textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },

  // Add exercise
  addExBtn: { marginTop: Spacing.sm, borderRadius: Radius.md, overflow: 'hidden' },
  addExGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.md, gap: Spacing.sm,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.primaryMuted,
  },
  addExText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },

  // Modal
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

  // Search
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

  // Chips
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

  // Catalog items
  catalogItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle,
    gap: Spacing.md,
  },
  catalogImg: { width: 48, height: 48, borderRadius: Radius.sm, backgroundColor: Colors.bgMuted },
  catalogInfo: { flex: 1, gap: 4 },
  catalogName: { fontSize: FontSize.sm, color: Colors.text, fontWeight: FontWeight.semibold },
  catalogBadges: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },

  // States
  stateWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  stateTitle: { fontSize: FontSize.md, color: Colors.text, fontWeight: FontWeight.semibold },
  stateText: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: Spacing.xs },

  // Overlay
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.bgOverlay, alignItems: 'center', justifyContent: 'center' },
  overlayBox: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    padding: Spacing.xl, alignItems: 'center', gap: Spacing.md,
    borderWidth: 1, borderColor: Colors.border, ...Shadows.lg,
  },
  overlayText: { fontSize: FontSize.sm, color: Colors.text, fontWeight: FontWeight.medium },
});
