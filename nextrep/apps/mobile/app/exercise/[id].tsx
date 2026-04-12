import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/api/client';
import { getExerciseImageUrl, getCatalogImageUrl } from '../../src/api/exerciseApi';
import { Colors, Spacing, Radius, FontSize, FontWeight, Gradients, Shadows } from '../../src/theme';
import { ScreenWrapper, Card, SectionHeader, Badge, StatCard } from '../../src/components/ui';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: exercise, isLoading: isLoadingExercise } = useQuery({
    queryKey: ['exercise', id],
    queryFn:  () => api.exercises.get(id),
    enabled:  !!id,
  });

  const { data: records, isLoading: isLoadingRecords } = useQuery({
    queryKey: ['records', id],
    queryFn:  () => api.records.forExercise(id),
    enabled:  !!id,
  });

  const isLoading = isLoadingExercise || isLoadingRecords;

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  }

  // Build image URLs
  const imageUrl0 = exercise?.catalogId ? getCatalogImageUrl(exercise.catalogId, 0) : exercise?.imageUrl ?? null;
  const imageUrl1 = exercise?.catalogId ? getCatalogImageUrl(exercise.catalogId, 1) : null;

  return (
    <ScreenWrapper>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
        <Ionicons name="chevron-back" size={20} color={Colors.primary} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      {/* Exercise images */}
      {(imageUrl0 || imageUrl1) && (
        <ScrollView
          horizontal
          pagingEnabled={false}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.imageCarousel}
          style={styles.imageCarouselScroll}
        >
          {imageUrl0 && (
            <Image
              source={{ uri: imageUrl0 }}
              style={styles.exerciseImage}
              resizeMode="cover"
            />
          )}
          {imageUrl1 && (
            <Image
              source={{ uri: imageUrl1 }}
              style={styles.exerciseImage}
              resizeMode="cover"
            />
          )}
        </ScrollView>
      )}

      <Text style={styles.title}>{exercise?.name ?? 'Exercise'}</Text>

      {/* Meta badges */}
      <View style={styles.metaRow}>
        {exercise?.primaryMuscle && (
          <Badge label={exercise.primaryMuscle} color={Colors.primary} bgColor={Colors.primaryMuted} size="md" />
        )}
        {exercise?.category && (
          <Badge label={exercise.category} color={Colors.accent} bgColor={Colors.accentMuted} size="md" />
        )}
        {exercise?.level && (
          <Badge
            label={exercise.level.charAt(0).toUpperCase() + exercise.level.slice(1)}
            color={exercise.level === 'beginner' ? Colors.success : exercise.level === 'intermediate' ? Colors.warning : Colors.error}
            bgColor={exercise.level === 'beginner' ? Colors.successMuted : exercise.level === 'intermediate' ? Colors.warningMuted : Colors.errorMuted}
            size="md"
          />
        )}
      </View>

      {/* Extra details row */}
      {(exercise?.equipment || exercise?.force || exercise?.mechanic) && (
        <View style={styles.detailsGrid}>
          {exercise?.equipment && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Equipment</Text>
              <Text style={styles.detailValue}>{exercise.equipment}</Text>
            </View>
          )}
          {exercise?.force && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Force</Text>
              <Text style={styles.detailValue}>{exercise.force.charAt(0).toUpperCase() + exercise.force.slice(1)}</Text>
            </View>
          )}
          {exercise?.mechanic && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Mechanic</Text>
              <Text style={styles.detailValue}>{exercise.mechanic.charAt(0).toUpperCase() + exercise.mechanic.slice(1)}</Text>
            </View>
          )}
        </View>
      )}

      {/* Secondary muscles */}
      {exercise?.secondaryMuscles?.length > 0 && (
        <>
          <SectionHeader title="Secondary Muscles" />
          <View style={styles.secondaryRow}>
            {exercise.secondaryMuscles.map((m: string) => (
              <Badge key={m} label={m} color={Colors.textSecondary} bgColor={Colors.bgMuted} size="md" />
            ))}
          </View>
        </>
      )}

      {/* Instructions */}
      {exercise?.instructions && (
        <>
          <SectionHeader title="How to Perform" />
          <Card>
            <Text style={styles.instructions}>{exercise.instructions}</Text>
          </Card>
        </>
      )}

      {/* Personal Records */}
      {records && records.length > 0 ? (
        <>
          <SectionHeader title="Personal Records" />
          {records.map((pr: any) => (
            <Card key={pr.id ?? pr.recordType} style={styles.prCard} gradientAccent={Gradients.accent}>
              <View style={styles.prRow}>
                <Text style={styles.prType}>{formatPrType(pr.recordType)}</Text>
                <Text style={styles.prValue}>{pr.value}{prUnit(pr.recordType)}</Text>
                <Text style={styles.prDate}>
                  {new Date(pr.achievedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
            </Card>
          ))}
        </>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>💪</Text>
          <Text style={styles.emptyText}>No personal records yet</Text>
          <Text style={styles.emptySubtext}>Keep lifting to set your first PR!</Text>
        </View>
      )}
    </ScreenWrapper>
  );
}

function formatPrType(type: string) {
  const map: Record<string, string> = {
    MAX_WEIGHT:    '🏋️ Max Weight',
    MAX_REPS:      '🔄 Max Reps',
    MAX_VOLUME:    '📦 Max Volume',
    ESTIMATED_1RM: '💪 Est. 1RM',
  };
  return map[type] ?? type;
}

function prUnit(type: string) {
  if (type === 'MAX_WEIGHT' || type === 'MAX_VOLUME' || type === 'ESTIMATED_1RM') return ' kg';
  if (type === 'MAX_REPS') return ' reps';
  return '';
}

const styles = StyleSheet.create({
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  backBtn:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.md },
  backText:     { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },

  // Image carousel
  imageCarouselScroll: {
    marginBottom: Spacing.lg,
    marginHorizontal: -Spacing.lg,
  },
  imageCarousel: {
    gap:               Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  exerciseImage: {
    width:           240,
    height:          180,
    borderRadius:    Radius.lg,
    backgroundColor: Colors.bgMuted,
  },

  title:        {
    fontSize:      FontSize.xxl,
    fontWeight:    FontWeight.extrabold,
    color:         Colors.text,
    letterSpacing: -0.5,
  },
  metaRow:      {
    flexDirection: 'row',
    gap:           Spacing.sm,
    marginTop:     Spacing.sm,
    marginBottom:  Spacing.md,
    flexWrap:      'wrap',
  },
  detailsGrid:  {
    flexDirection:   'row',
    gap:             Spacing.md,
    marginBottom:    Spacing.md,
    flexWrap:        'wrap',
  },
  detailItem:   {
    backgroundColor: Colors.bgCard,
    borderRadius:    Radius.sm,
    padding:         Spacing.md,
    borderWidth:     1,
    borderColor:     Colors.border,
    flex:            1,
    minWidth:        100,
  },
  detailLabel:  {
    fontSize:      FontSize.xxs,
    color:         Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom:  Spacing.xs,
    fontWeight:    FontWeight.medium,
  },
  detailValue:  {
    fontSize:   FontSize.sm,
    color:      Colors.text,
    fontWeight: FontWeight.semibold,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap:           Spacing.sm,
    flexWrap:      'wrap',
    marginBottom:  Spacing.md,
  },
  instructions: {
    fontSize:   FontSize.sm,
    color:      Colors.textSecondary,
    lineHeight: 22,
  },
  prCard:       { marginBottom: Spacing.sm },
  prRow:        {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    paddingTop:     Spacing.xs,
  },
  prType:       { fontSize: FontSize.sm, color: Colors.text, flex: 1 },
  prValue:      { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.primary },
  prDate:       { fontSize: FontSize.xs, color: Colors.textMuted, marginLeft: Spacing.md },
  emptyState:   { alignItems: 'center', marginTop: Spacing.xxl, gap: Spacing.xs },
  emptyEmoji:   { fontSize: 48 },
  emptyText:    { fontSize: FontSize.lg, color: Colors.text, fontWeight: FontWeight.bold },
  emptySubtext: { fontSize: FontSize.sm, color: Colors.textMuted },
});
