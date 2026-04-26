import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../theme';

interface Props {
  pendingCount: number;
  isSyncing: boolean;
  onSync: () => void;
}

export function SyncBanner({ pendingCount, isSyncing, onSync }: Props) {
  if (pendingCount <= 0) return null;

  return (
    <TouchableOpacity style={styles.banner} onPress={onSync} activeOpacity={0.8} disabled={isSyncing}>
      <View style={styles.iconWrap}>
        <Ionicons
          name={isSyncing ? 'sync' : 'cloud-upload-outline'}
          size={18}
          color={Colors.warning}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.text}>
          {isSyncing
            ? 'Syncing workouts…'
            : `${pendingCount} workout${pendingCount > 1 ? 's' : ''} not synced`
          }
        </Text>
        {!isSyncing && (
          <Text style={styles.subtext}>Tap to push to cloud ↑</Text>
        )}
      </View>
      {!isSyncing && (
        <Ionicons name="arrow-up-circle" size={20} color={Colors.warning} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.warningMuted,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 0, 0.2)',
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 214, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.warning,
  },
  subtext: {
    fontSize: FontSize.xxs,
    color: Colors.textMuted,
    marginTop: 1,
  },
});
