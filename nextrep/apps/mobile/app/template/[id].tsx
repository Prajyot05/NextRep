import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../src/api/client';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../src/theme';

export default function TemplateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: template, isLoading } = useQuery({
    queryKey: ['template', id],
    queryFn:  () => api.templates.get(id),
    enabled:  !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.templates.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      router.back();
    },
  });

  function handleDelete() {
    Alert.alert('Archive Template', 'This template will be archived and hidden from your list.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Archive', style: 'destructive', onPress: () => deleteMutation.mutate() },
    ]);
  }

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  }

  if (!template) {
    return <View style={styles.center}><Text style={styles.errorText}>Template not found.</Text></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{template.name}</Text>
      {template.description && (
        <Text style={styles.description}>{template.description}</Text>
      )}

      <Text style={styles.sectionTitle}>Exercises ({template.exercises?.length ?? 0})</Text>

      {(template.exercises ?? []).map((te: any, i: number) => (
        <View key={te.id ?? i} style={styles.exerciseCard}>
          <View style={styles.exerciseHeader}>
            <Text style={styles.exerciseOrder}>{i + 1}</Text>
            <View style={styles.exerciseInfo}>
              <Text style={styles.exerciseName}>{te.exercise?.name ?? 'Unknown'}</Text>
              <Text style={styles.exerciseMeta}>
                {te.targetSets ?? te.defaultSets ?? 3} sets
                {te.targetRepsMin ? ` · ${te.targetRepsMin}${te.targetRepsMax && te.targetRepsMax !== te.targetRepsMin ? `-${te.targetRepsMax}` : ''} reps` : ''}
                {te.restSeconds ? ` · ${te.restSeconds}s rest` : ''}
              </Text>
            </View>
          </View>
          {te.notes && <Text style={styles.exerciseNotes}>{te.notes}</Text>}
        </View>
      ))}

      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
        <Text style={styles.deleteBtnText}>Archive Template</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: Colors.bg },
  content:         { padding: Spacing.lg, paddingBottom: 100 },
  center:          { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  errorText:       { color: Colors.error, fontSize: FontSize.md },
  backBtn:         { marginBottom: Spacing.md },
  backText:        { color: Colors.primary, fontSize: FontSize.sm },
  title:           { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text },
  description:     { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: Spacing.xs, marginBottom: Spacing.lg },
  sectionTitle:    { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.text, marginTop: Spacing.lg, marginBottom: Spacing.md },
  exerciseCard:    {
    backgroundColor: Colors.bgCard, borderRadius: Radius.md, padding: Spacing.md,
    marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
  },
  exerciseHeader:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  exerciseOrder:   { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.primary, width: 28, textAlign: 'center' },
  exerciseInfo:    { flex: 1 },
  exerciseName:    { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  exerciseMeta:    { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  exerciseNotes:   { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.sm, fontStyle: 'italic' },
  deleteBtn:       {
    borderWidth: 1, borderColor: Colors.error, borderRadius: Radius.md,
    padding: Spacing.md, alignItems: 'center', marginTop: Spacing.xl,
  },
  deleteBtnText:   { color: Colors.error, fontWeight: FontWeight.semibold, fontSize: FontSize.md },
});
