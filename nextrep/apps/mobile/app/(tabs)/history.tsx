import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../src/api/client';
import { Colors, Spacing, Radius, FontSize, FontWeight, Gradients, Shadows } from '../../src/theme';
import { Card, Badge } from '../../src/components/ui';

export default function HistoryScreen() {
  const { data: workouts, isLoading } = useQuery({
    queryKey: ['workouts'],
    queryFn:  () => api.workouts.list(1, 50),
  });

  const sessions = workouts?.data ?? workouts ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerBar}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>{sessions.length} workouts</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : sessions.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🏋️</Text>
          <Text style={styles.emptyTitle}>No workouts yet</Text>
          <Text style={styles.emptySubtext}>Complete your first workout to see it here</Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Card
              style={styles.card}
              gradientAccent={Gradients.primary}
              onPress={() => router.push(`/workout/${item.id}`)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardDate}>
                  {new Date(item.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
              <View style={styles.cardMeta}>
                <Badge label={`${Math.round((item.durationSeconds ?? 0) / 60)}m`} color={Colors.primary} bgColor={Colors.primaryMuted} />
                <Badge label={`${item.totalSets} sets`} color={Colors.accent} bgColor={Colors.accentMuted} />
                <Badge label={`${Math.round(item.totalVolumeKg ?? 0)} kg`} color={Colors.success} bgColor={Colors.successMuted} />
              </View>
            </Card>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.bg },
  headerBar:   {
    paddingHorizontal: Spacing.lg,
    paddingTop:        Spacing.sm,
    paddingBottom:     Spacing.md,
  },
  title:       {
    fontSize:      FontSize.xxxl,
    fontWeight:    FontWeight.extrabold,
    color:         Colors.text,
    letterSpacing: -0.5,
  },
  subtitle:    {
    fontSize:   FontSize.sm,
    color:      Colors.textMuted,
    marginTop:  Spacing.xs,
  },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  emptyEmoji:  { fontSize: 48, marginBottom: Spacing.sm },
  emptyTitle:  { fontSize: FontSize.xl, color: Colors.text, fontWeight: FontWeight.bold },
  emptySubtext:{ fontSize: FontSize.sm, color: Colors.textMuted },
  list:        { padding: Spacing.lg, paddingBottom: 120 },
  card:        { marginBottom: Spacing.md },
  cardHeader:  {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   Spacing.sm,
    paddingTop:     Spacing.xs,
  },
  cardName:    { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  cardDate:    { fontSize: FontSize.xs, color: Colors.textMuted },
  cardMeta:    { flexDirection: 'row', gap: Spacing.sm },
});
