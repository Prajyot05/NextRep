import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/api/client';
import { Colors, Spacing, Radius, FontSize, FontWeight, Gradients, Shadows } from '../../src/theme';
import { Card, Badge } from '../../src/components/ui';
import { SyncBanner } from '../../src/components/sync/SyncBanner';
import { useSyncStore } from '../../src/store/syncStore';
import { useQueryClient } from '@tanstack/react-query';

export default function HistoryScreen() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const { queue, isSyncing, setSyncing, dequeue, incrementAttempts } = useSyncStore();

  const handleSync = async () => {
    if (queue.length === 0 || isSyncing) return;
    setSyncing(true);
    
    try {
      const sessions = queue.map(q => q.payload);
      await api.workouts.sync(sessions);
      
      // Success: clear queue
      for (const item of queue) {
        dequeue(item.id);
      }
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    } catch (err) {
      console.error('Sync failed', err);
      // Increment attempts
      for (const item of queue) {
        incrementAttempts(item.id);
      }
    } finally {
      setSyncing(false);
    }
  };

  const { data: workouts, isLoading, isFetching, refetch, isRefetching } = useQuery({
    queryKey: ['workouts', page],
    queryFn:  () => api.workouts.list(page, 30),
  });

  const onRefresh = useCallback(() => {
    setPage(1);
    refetch();
  }, [refetch]);

  const sessions = workouts?.data ?? workouts ?? [];
  const total = workouts?.total ?? sessions.length;
  const hasMore = sessions.length < total;

  function formatDuration(seconds: number): string {
    const m = Math.round(seconds / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m`;
  }

  function formatRelativeDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerBar}>
        <Text style={styles.title}>History</Text>
        <View style={styles.headerMeta}>
          <Text style={styles.subtitle}>{total} workouts</Text>
        </View>
      </View>

      <SyncBanner 
        pendingCount={queue.length} 
        isSyncing={isSyncing} 
        onSync={handleSync} 
      />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : sessions.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🏋️</Text>
          <Text style={styles.emptyTitle}>No workouts yet</Text>
          <Text style={styles.emptySubtext}>Complete your first workout to see it here</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(tabs)/start')}>
            <Text style={styles.emptyBtnText}>Start Workout</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          onEndReached={() => {
            if (hasMore && !isFetching) setPage(p => p + 1);
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={isFetching ? <ActivityIndicator color={Colors.primary} style={{ padding: Spacing.lg }} /> : null}
          renderItem={({ item, index }) => {
            // Show date separator
            const prevItem = index > 0 ? sessions[index - 1] : null;
            const currentDate = new Date(item.startedAt).toLocaleDateString();
            const prevDate = prevItem ? new Date(prevItem.startedAt).toLocaleDateString() : '';
            const showDateSep = currentDate !== prevDate;

            return (
              <>
                {showDateSep && (
                  <Text style={styles.dateSeparator}>
                    {formatRelativeDate(item.startedAt)}
                  </Text>
                )}
                <Card
                  style={styles.card}
                  gradientAccent={Gradients.primary}
                  onPress={() => router.push(`/workout/${item.id}`)}
                >
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardName}>{item.name}</Text>
                      <Text style={styles.cardTime}>
                        {new Date(item.startedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                  </View>
                  <View style={styles.cardMeta}>
                    <Badge label={formatDuration(item.durationSeconds ?? 0)} color={Colors.primary} bgColor={Colors.primaryMuted} />
                    <Badge label={`${item.totalSets} sets`} color={Colors.accent} bgColor={Colors.accentMuted} />
                    <Badge label={`${Math.round(item.totalVolumeKg ?? 0)} kg`} color={Colors.success} bgColor={Colors.successMuted} />
                  </View>
                </Card>
              </>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  headerBar: {
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.md,
  },
  headerMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.xs },
  title: {
    fontSize: FontSize.xxxl, fontWeight: FontWeight.extrabold,
    color: Colors.text, letterSpacing: -0.5,
  },
  subtitle: { fontSize: FontSize.sm, color: Colors.textMuted },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.sm },
  emptyTitle: { fontSize: FontSize.xl, color: Colors.text, fontWeight: FontWeight.bold },
  emptySubtext: { fontSize: FontSize.sm, color: Colors.textMuted },
  emptyBtn: {
    marginTop: Spacing.lg, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.primary,
  },
  emptyBtnText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  list: { padding: Spacing.lg, paddingBottom: 120 },
  dateSeparator: {
    fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm, marginTop: Spacing.sm,
  },
  card: { marginBottom: Spacing.md },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.sm, paddingTop: Spacing.xs,
  },
  cardName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  cardTime: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  cardMeta: { flexDirection: 'row', gap: Spacing.sm },
});
