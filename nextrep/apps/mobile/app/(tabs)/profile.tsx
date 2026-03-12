import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuthStore } from '../../src/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../src/api/client';
import { router } from 'expo-router';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../src/theme';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { data: streak }      = useQuery({ queryKey: ['streak'],      queryFn: api.streaks.get });
  const { data: milestones }  = useQuery({ queryKey: ['milestones'],  queryFn: api.milestones.list });

  async function handleLogout() {
    Alert.alert('Log Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: async () => {
        await logout();
        router.replace('/(auth)/login');
      }},
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.displayName?.[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <Text style={styles.name}>{user?.displayName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* Streak */}
      {streak && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Streak</Text>
          <View style={styles.streakRow}>
            <Text style={styles.streakNum}>{streak.currentStreak}🔥</Text>
            <Text style={styles.streakSub}>Longest: {streak.longestStreak} days</Text>
          </View>
        </View>
      )}

      {/* Milestones */}
      {milestones && milestones.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Milestones ({milestones.length})</Text>
          {milestones.slice(0, 5).map((m: any) => (
            <View key={m.id} style={styles.milestoneCard}>
              <Text style={styles.milestoneTitle}>{m.title}</Text>
              <Text style={styles.milestoneDate}>
                {new Date(m.achievedAt).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/body/log')}>
          <Text style={styles.actionText}>📏 Log Body Measurements</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: Colors.bg },
  content:        { padding: Spacing.lg, paddingBottom: 100 },
  header:         { alignItems: 'center', marginBottom: Spacing.xl },
  avatar:         {
    width:           80, height: 80,
    borderRadius:    40,
    backgroundColor: Colors.primary,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    Spacing.md,
  },
  avatarText:     { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text },
  name:           { fontSize: FontSize.xl,  fontWeight: FontWeight.bold, color: Colors.text },
  email:          { fontSize: FontSize.sm,  color: Colors.textMuted, marginTop: Spacing.xs },
  section:        { marginBottom: Spacing.xl },
  sectionTitle:   { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.text, marginBottom: Spacing.md },
  streakRow:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.xl },
  streakNum:      { fontSize: FontSize.xxxl, fontWeight: FontWeight.black, color: Colors.streak },
  streakSub:      { fontSize: FontSize.sm, color: Colors.textMuted },
  milestoneCard:  {
    flexDirection:   'row',
    justifyContent:  'space-between',
    backgroundColor: Colors.bgCard,
    borderRadius:    Radius.md,
    padding:         Spacing.md,
    marginBottom:    Spacing.sm,
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  milestoneTitle: { fontSize: FontSize.sm, color: Colors.text, fontWeight: FontWeight.medium },
  milestoneDate:  { fontSize: FontSize.xs, color: Colors.textMuted },
  actionRow:      {
    backgroundColor: Colors.bgCard,
    borderRadius:    Radius.md,
    padding:         Spacing.md,
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  actionText:     { color: Colors.text, fontSize: FontSize.md },
  logoutButton:   {
    borderWidth:  1,
    borderColor:  Colors.error,
    borderRadius: Radius.md,
    padding:      Spacing.md,
    alignItems:   'center',
  },
  logoutText:     { color: Colors.error, fontWeight: FontWeight.semibold, fontSize: FontSize.md },
});
