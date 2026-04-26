import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '../src/store/settingsStore';
import { useAuthStore } from '../src/store/authStore';
import { Colors, Spacing, Radius, FontSize, FontWeight, Gradients } from '../src/theme';
import { ScreenWrapper, Card, SectionHeader, GradientButton } from '../src/components/ui';

export default function SettingsScreen() {
  const {
    unit, setUnit,
    restTimerDefault, setRestTimerDefault,
    autoStartTimer, setAutoStartTimer,
    soundEnabled, setSoundEnabled,
    hapticEnabled, setHapticEnabled,
  } = useSettingsStore();

  const { logout } = useAuthStore();

  function SettingRow({ icon, label, value, onPress, rightElement }: {
    icon: string; label: string; value?: string; onPress?: () => void; rightElement?: React.ReactNode;
  }) {
    return (
      <TouchableOpacity style={styles.settingRow} onPress={onPress} disabled={!onPress && !rightElement} activeOpacity={0.7}>
        <Text style={styles.settingIcon}>{icon}</Text>
        <Text style={styles.settingLabel}>{label}</Text>
        <View style={styles.settingRight}>
          {rightElement ?? (
            <>
              {value && <Text style={styles.settingValue}>{value}</Text>}
              {onPress && <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />}
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  function ToggleRow({ icon, label, value, onValueChange }: {
    icon: string; label: string; value: boolean; onValueChange: (v: boolean) => void;
  }) {
    return (
      <View style={styles.settingRow}>
        <Text style={styles.settingIcon}>{icon}</Text>
        <Text style={styles.settingLabel}>{label}</Text>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: Colors.bgMuted, true: Colors.primaryMuted }}
          thumbColor={value ? Colors.primary : Colors.textMuted}
        />
      </View>
    );
  }

  return (
    <ScreenWrapper>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
        <Ionicons name="chevron-back" size={20} color={Colors.primary} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Customize your experience</Text>

      {/* Units */}
      <SectionHeader title="Units" />
      <Card style={styles.sectionCard}>
        <SettingRow
          icon="⚖️"
          label="Weight Unit"
          rightElement={
            <View style={styles.segmentRow}>
              <TouchableOpacity
                style={[styles.segmentBtn, unit === 'kg' && styles.segmentBtnActive]}
                onPress={() => setUnit('kg')}
              >
                <Text style={[styles.segmentText, unit === 'kg' && styles.segmentTextActive]}>kg</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segmentBtn, unit === 'lbs' && styles.segmentBtnActive]}
                onPress={() => setUnit('lbs')}
              >
                <Text style={[styles.segmentText, unit === 'lbs' && styles.segmentTextActive]}>lbs</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </Card>

      {/* Rest Timer */}
      <SectionHeader title="Rest Timer" />
      <Card style={styles.sectionCard}>
        <SettingRow
          icon="⏱"
          label="Default Duration"
          rightElement={
            <View style={styles.segmentRow}>
              {[60, 90, 120, 180].map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.segmentBtn, restTimerDefault === t && styles.segmentBtnActive]}
                  onPress={() => setRestTimerDefault(t)}
                >
                  <Text style={[styles.segmentText, restTimerDefault === t && styles.segmentTextActive]}>
                    {t < 60 ? `${t}s` : `${t / 60}m`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          }
        />
        <View style={styles.divider} />
        <ToggleRow
          icon="▶️"
          label="Auto-start on set complete"
          value={autoStartTimer}
          onValueChange={setAutoStartTimer}
        />
      </Card>

      {/* Feedback */}
      <SectionHeader title="Feedback" />
      <Card style={styles.sectionCard}>
        <ToggleRow icon="🔔" label="Sound Effects" value={soundEnabled} onValueChange={setSoundEnabled} />
        <View style={styles.divider} />
        <ToggleRow icon="📳" label="Haptic Feedback" value={hapticEnabled} onValueChange={setHapticEnabled} />
      </Card>

      {/* Account */}
      <SectionHeader title="Account" />
      <Card style={styles.sectionCard}>
        <SettingRow icon="📤" label="Export Data (JSON)" onPress={() => Alert.alert('Coming Soon', 'Data export will be available in a future update.')} />
        <View style={styles.divider} />
        <SettingRow icon="🗑️" label="Delete Account" onPress={() => Alert.alert('Delete Account', 'This action is irreversible. Are you sure?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => {} },
        ])} />
      </Card>

      {/* Logout */}
      <View style={{ marginTop: Spacing.xl }}>
        <GradientButton
          title="Log Out"
          variant="danger"
          onPress={async () => {
            Alert.alert('Log Out', 'Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Log Out', style: 'destructive', onPress: async () => {
                await logout();
                router.replace('/(auth)/login');
              }},
            ]);
          }}
        />
      </View>

      {/* App version */}
      <Text style={styles.version}>NextRep v1.0.0</Text>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.md },
  backText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: Spacing.xs, marginBottom: Spacing.lg },
  sectionCard: { padding: 0, overflow: 'hidden', marginBottom: Spacing.md },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.md,
  },
  settingIcon: { fontSize: 16 },
  settingLabel: { flex: 1, fontSize: FontSize.sm, color: Colors.text, fontWeight: FontWeight.medium },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  settingValue: { fontSize: FontSize.sm, color: Colors.textMuted },
  divider: { height: 1, backgroundColor: Colors.borderSubtle, marginHorizontal: Spacing.md },
  segmentRow: { flexDirection: 'row', gap: 4 },
  segmentBtn: {
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
  },
  segmentBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  segmentText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.medium },
  segmentTextActive: { color: Colors.primary, fontWeight: FontWeight.bold },
  version: {
    textAlign: 'center', fontSize: FontSize.xs, color: Colors.textDisabled,
    marginTop: Spacing.xl, marginBottom: Spacing.xxl,
  },
});
