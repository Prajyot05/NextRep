import { View, Text, StyleSheet, Alert } from 'react-native';
import { useAuthStore } from '../../src/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../src/api/client';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radius, FontSize, FontWeight, Gradients, Shadows } from '../../src/theme';
import { ScreenWrapper, Card, GradientButton, SectionHeader, Badge } from '../../src/components/ui';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { data: streak }     = useQuery({ queryKey: ['streak'],     queryFn: api.streaks.get });
  const { data: milestones } = useQuery({ queryKey: ['milestones'], queryFn: api.milestones.list });

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
    <ScreenWrapper paddingBottom={120}>
      {/* Avatar + profile info */}
      <View style={styles.header}>
        <LinearGradient
          colors={Gradients.primary}
          style={styles.avatarRing}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.displayName?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
        </LinearGradient>
        <Text style={styles.name}>{user?.displayName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* Streak */}
      {streak && (
        <>
          <SectionHeader title="Streak" />
          <Card gradientAccent={Gradients.accent}>
            <View style={styles.streakRow}>
              <View style={styles.streakLeft}>
                <Text style={styles.streakNum}>{streak.currentStreak}</Text>
                <Text style={styles.streakUnit}>days 🔥</Text>
              </View>
              <View style={styles.streakDivider} />
              <View style={styles.streakRight}>
                <Text style={styles.streakBestNum}>{streak.longestStreak}</Text>
                <Text style={styles.streakBestLabel}>BEST</Text>
              </View>
            </View>
          </Card>
        </>
      )}

      {/* Milestones */}
      {milestones && milestones.length > 0 && (
        <>
          <SectionHeader title="Milestones" action={`${milestones.length} earned`} />
          {milestones.slice(0, 5).map((m: any) => (
            <Card key={m.id} style={styles.milestoneCard} accentColor={Colors.streakGold}>
              <View style={styles.milestoneRow}>
                <Text style={styles.milestoneEmoji}>🏅</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.milestoneTitle}>{m.title}</Text>
                  <Text style={styles.milestoneDate}>
                    {new Date(m.achievedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </>
      )}

      {/* Actions */}
      <SectionHeader title="Quick Actions" />
      <Card onPress={() => router.push('/body/log')} style={styles.actionCard}>
        <Text style={styles.actionText}>📏  Log Body Measurements</Text>
      </Card>

      {/* Logout */}
      <View style={{ marginTop: Spacing.xxl }}>
        <GradientButton
          title="Log Out"
          variant="danger"
          onPress={handleLogout}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems:   'center',
    marginBottom: Spacing.lg,
    paddingTop:   Spacing.md,
  },
  avatarRing: {
    width:        88,
    height:       88,
    borderRadius: 44,
    alignItems:   'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadows.glow(Colors.primary),
  },
  avatar: {
    width:           80,
    height:          80,
    borderRadius:    40,
    backgroundColor: Colors.bg,
    alignItems:      'center',
    justifyContent:  'center',
  },
  avatarText: {
    fontSize:   FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color:      Colors.primary,
  },
  name: {
    fontSize:      FontSize.xl,
    fontWeight:    FontWeight.bold,
    color:         Colors.text,
    letterSpacing: -0.3,
  },
  email: {
    fontSize:  FontSize.sm,
    color:     Colors.textMuted,
    marginTop: Spacing.xs,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems:    'center',
    paddingTop:    Spacing.xs,
  },
  streakLeft: {
    flex:       1,
    alignItems: 'center',
  },
  streakNum: {
    fontSize:   FontSize.hero,
    fontWeight: FontWeight.black,
    color:      Colors.accent,
    lineHeight: 46,
  },
  streakUnit: {
    fontSize:      FontSize.sm,
    color:         Colors.textSecondary,
    fontWeight:    FontWeight.medium,
  },
  streakDivider: {
    width:           1,
    height:          48,
    backgroundColor: Colors.border,
  },
  streakRight: {
    flex:       1,
    alignItems: 'center',
  },
  streakBestNum: {
    fontSize:   FontSize.xxl,
    fontWeight: FontWeight.bold,
    color:      Colors.text,
  },
  streakBestLabel: {
    fontSize:      FontSize.xxs,
    color:         Colors.textMuted,
    fontWeight:    FontWeight.semibold,
    letterSpacing: 1.5,
  },
  milestoneCard: {
    marginBottom: Spacing.sm,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.md,
    paddingTop:    Spacing.xs,
  },
  milestoneEmoji: {
    fontSize: 24,
  },
  milestoneTitle: {
    fontSize:   FontSize.sm,
    color:      Colors.text,
    fontWeight: FontWeight.semibold,
  },
  milestoneDate: {
    fontSize:  FontSize.xs,
    color:     Colors.textMuted,
    marginTop: 2,
  },
  actionCard: {
    marginBottom: Spacing.sm,
  },
  actionText: {
    color:    Colors.text,
    fontSize: FontSize.md,
  },
});
