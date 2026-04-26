import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../theme';
import { useSettingsStore } from '../../store/settingsStore';

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

export function RestTimerOverlay({ visible, onDismiss }: Props) {
  const defaultTime = useSettingsStore(s => s.restTimerDefault);
  const hapticEnabled = useSettingsStore(s => s.hapticEnabled);

  const [totalSeconds, setTotalSeconds] = useState(defaultTime);
  const [remaining, setRemaining] = useState(defaultTime);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setTotalSeconds(defaultTime);
      setRemaining(defaultTime);
      setIsRunning(true);
    } else {
      setIsRunning(false);
      setRemaining(defaultTime);
    }
  }, [visible, defaultTime]);

  useEffect(() => {
    if (isRunning && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining(r => {
          if (r <= 1) {
            // Timer finished
            if (hapticEnabled) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            setIsRunning(false);
            // Pulse animation
            Animated.sequence([
              Animated.timing(pulseAnim, { toValue: 1.1, duration: 200, useNativeDriver: true }),
              Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
              Animated.timing(pulseAnim, { toValue: 1.1, duration: 200, useNativeDriver: true }),
              Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
            ]).start();
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, remaining]);

  if (!visible) return null;

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progress = totalSeconds > 0 ? (totalSeconds - remaining) / totalSeconds : 0;
  const circumference = 2 * Math.PI * 70; // radius = 70
  const strokeDashoffset = circumference * (1 - progress);
  const isFinished = remaining === 0;

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        {/* Close button */}
        <TouchableOpacity style={styles.closeBtn} onPress={onDismiss} hitSlop={12}>
          <Ionicons name="close" size={24} color={Colors.textMuted} />
        </TouchableOpacity>

        <Text style={styles.label}>{isFinished ? 'REST COMPLETE' : 'REST TIMER'}</Text>

        {/* Circular timer */}
        <Animated.View style={[styles.timerCircle, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.timerInner}>
            <Text style={[styles.timerText, isFinished && styles.timerTextDone]}>
              {minutes}:{seconds.toString().padStart(2, '0')}
            </Text>
            <Text style={styles.timerTotalText}>of {Math.floor(totalSeconds / 60)}:{(totalSeconds % 60).toString().padStart(2, '0')}</Text>
          </View>
          {/* Progress ring - visual only */}
          <View style={[styles.progressRing, { borderColor: isFinished ? Colors.success : Colors.primary }]}>
            <View style={[
              styles.progressFill,
              {
                borderColor: isFinished ? Colors.success : Colors.primary,
                opacity: 0.3,
                transform: [{ rotate: `${progress * 360}deg` }],
              }
            ]} />
          </View>
        </Animated.View>

        {/* Adjust buttons */}
        <View style={styles.adjustRow}>
          <TouchableOpacity
            style={styles.adjustBtn}
            onPress={() => {
              setTotalSeconds(t => Math.max(15, t - 15));
              setRemaining(r => Math.max(0, r - 15));
              if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text style={styles.adjustText}>-15s</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, isFinished && styles.actionBtnDone]}
            onPress={() => {
              if (isFinished) {
                onDismiss();
              } else if (isRunning) {
                setIsRunning(false);
              } else {
                setIsRunning(true);
              }
            }}
          >
            <Ionicons
              name={isFinished ? 'checkmark' : isRunning ? 'pause' : 'play'}
              size={24}
              color={Colors.bg}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.adjustBtn}
            onPress={() => {
              setTotalSeconds(t => t + 15);
              setRemaining(r => r + 15);
              if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text style={styles.adjustText}>+15s</Text>
          </TouchableOpacity>
        </View>

        {/* Quick presets */}
        <View style={styles.presetsRow}>
          {[60, 90, 120, 180].map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.presetBtn, totalSeconds === t && styles.presetBtnActive]}
              onPress={() => {
                setTotalSeconds(t);
                setRemaining(t);
                setIsRunning(true);
              }}
            >
              <Text style={[styles.presetText, totalSeconds === t && styles.presetTextActive]}>
                {t < 60 ? `${t}s` : `${t / 60}m`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  container: { alignItems: 'center', gap: Spacing.lg, width: '80%' },
  closeBtn: { position: 'absolute', top: -40, right: 0 },
  label: {
    fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 2,
  },
  timerCircle: {
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: Colors.bgElevated, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: Colors.primary,
  },
  timerInner: { alignItems: 'center' },
  timerText: {
    fontSize: 48, fontWeight: FontWeight.black, color: Colors.text,
    fontVariant: ['tabular-nums'],
  },
  timerTextDone: { color: Colors.success },
  timerTotalText: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  progressRing: { position: 'absolute', width: '100%', height: '100%', borderRadius: 90, borderWidth: 3 },
  progressFill: { position: 'absolute', width: '100%', height: '100%', borderRadius: 90, borderWidth: 3 },
  adjustRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xl },
  adjustBtn: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
  },
  adjustText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textSecondary },
  actionBtn: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  actionBtnDone: { backgroundColor: Colors.success },
  presetsRow: { flexDirection: 'row', gap: Spacing.sm },
  presetBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
  },
  presetBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  presetText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.medium },
  presetTextActive: { color: Colors.primary, fontWeight: FontWeight.bold },
});
