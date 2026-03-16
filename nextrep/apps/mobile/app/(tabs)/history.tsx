import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { api } from '../../src/api/client';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../src/theme';

export default function HistoryScreen() {
  const { data: workouts, isLoading } = useQuery({
    queryKey: ['workouts'],
    queryFn:  () => api.workouts.list(1, 50),
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  const sessions = workouts?.data ?? workouts ?? [];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Workout History</Text>
      {sessions.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No workouts yet.</Text>
          <Text style={styles.emptySubtext}>Complete your first workout to see it here!</Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: Spacing.md, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/workout/${item.id}`)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardDate}>
                  {new Date(item.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
              <View style={styles.cardMeta}>
                <Text style={styles.metaItem}>⏱ {Math.round((item.durationSeconds ?? 0) / 60)}m</Text>
                <Text style={styles.metaItem}>📦 {item.totalSets} sets</Text>
                <Text style={styles.metaItem}>⚖️ {Math.round(item.totalVolumeKg ?? 0)} kg</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.bg },
  title:        { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text, paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.md },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  emptyText:    { fontSize: FontSize.lg, color: Colors.text, fontWeight: FontWeight.semibold },
  emptySubtext: { fontSize: FontSize.sm, color: Colors.textMuted },
  card:         {
    backgroundColor: Colors.bgCard,
    borderRadius:    Radius.md,
    padding:         Spacing.md,
    marginBottom:    Spacing.md,
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  cardHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  cardName:     { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  cardDate:     { fontSize: FontSize.sm, color: Colors.textMuted },
  cardMeta:     { flexDirection: 'row', gap: Spacing.md },
  metaItem:     { fontSize: FontSize.sm, color: Colors.textMuted },
});
