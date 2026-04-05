import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/api/client';
import { Colors, Spacing, Radius, FontSize, FontWeight, Gradients } from '../../src/theme';
import { ScreenWrapper, Card, SectionHeader, Badge, GradientButton } from '../../src/components/ui';

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
    <ScreenWrapper>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
        <Ionicons name="chevron-back" size={20} color={Colors.primary} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{template.name}</Text>
      {template.description && (
        <Text style={styles.description}>{template.description}</Text>
      )}

      <SectionHeader
        title="Exercises"
        action={`${template.exercises?.length ?? 0} total`}
      />

      {(template.exercises ?? []).map((te: any, i: number) => (
        <Card key={te.id ?? i} style={styles.exerciseCard} gradientAccent={Gradients.primary}>
          <View style={styles.exerciseRow}>
            <View style={styles.orderBadge}>
              <Text style={styles.orderNum}>{i + 1}</Text>
            </View>
            <View style={styles.exerciseInfo}>
              <Text style={styles.exerciseName}>{te.exercise?.name ?? 'Unknown'}</Text>
              <View style={styles.badgeRow}>
                <Badge
                  label={`${te.targetSets ?? te.defaultSets ?? 3} sets`}
                  color={Colors.primary}
                  bgColor={Colors.primaryMuted}
                />
                {te.targetRepsMin && (
                  <Badge
                    label={`${te.targetRepsMin}${te.targetRepsMax && te.targetRepsMax !== te.targetRepsMin ? `-${te.targetRepsMax}` : ''} reps`}
                    color={Colors.accent}
                    bgColor={Colors.accentMuted}
                  />
                )}
                {te.restSeconds && (
                  <Badge
                    label={`${te.restSeconds}s rest`}
                    color={Colors.textSecondary}
                    bgColor={Colors.bgMuted}
                  />
                )}
              </View>
            </View>
          </View>
          {te.notes && <Text style={styles.exerciseNotes}>{te.notes}</Text>}
        </Card>
      ))}

      <View style={{ marginTop: Spacing.xl }}>
        <GradientButton
          title="Archive Template"
          variant="danger"
          onPress={handleDelete}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  errorText:     { color: Colors.error, fontSize: FontSize.md },
  backBtn:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.md },
  backText:      { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  title:         {
    fontSize:      FontSize.xxl,
    fontWeight:    FontWeight.extrabold,
    color:         Colors.text,
    letterSpacing: -0.5,
  },
  description:   { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: Spacing.xs },
  exerciseCard:  { marginBottom: Spacing.sm },
  exerciseRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingTop: Spacing.xs },
  orderBadge:    {
    width:           32,
    height:          32,
    borderRadius:    16,
    backgroundColor: Colors.primaryMuted,
    alignItems:      'center',
    justifyContent:  'center',
  },
  orderNum:      {
    fontSize:   FontSize.sm,
    fontWeight: FontWeight.bold,
    color:      Colors.primary,
  },
  exerciseInfo:  { flex: 1 },
  exerciseName:  { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  badgeRow:      { flexDirection: 'row', gap: Spacing.xs, marginTop: Spacing.xs, flexWrap: 'wrap' },
  exerciseNotes: {
    fontSize:   FontSize.xs,
    color:      Colors.textMuted,
    marginTop:  Spacing.sm,
    fontStyle:  'italic',
  },
});
