import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../src/api/client';
import { useAuthStore } from '../../src/store/authStore';
import { Colors, Spacing, Radius, FontSize, FontWeight, Gradients, Shadows } from '../../src/theme';
import { ScreenWrapper, DateSelector, WorkoutGridCard } from '../../src/components/ui';

function generateDates() {
  const dates = [];
  const today = new Date();
  
  for (let i = -3; i <= 3; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push({
      date: d.getDate(),
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      timestamp: d.getTime(),
      isToday: i === 0,
      hasActivity: Math.random() > 0.5, // Mock activity
    });
  }
  return dates;
}

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const [selectedDate, setSelectedDate] = useState<number>(new Date().getDate());
  
  const dates = useMemo(() => generateDates(), []);
  
  const { data: workoutsData, isLoading } = useQuery({
    queryKey: ['workouts', 'list'],
    queryFn: () => api.workouts.list(1, 10),
  });

  const workouts = workoutsData?.items || [];
  
  const selectedDateItem = dates.find(d => d.date === selectedDate);
  const isTrainingDay = selectedDateItem?.hasActivity;

  return (
    <ScreenWrapper paddingBottom={120}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hey, {user?.displayName || 'Athlete'}</Text>
        </View>
        <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push('/(tabs)/profile')}>
          <Ionicons name="settings" size={24} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      <DateSelector 
        dates={dates.map(d => ({
          date: d.date,
          day: d.day,
          hasActivity: d.hasActivity,
          isActive: selectedDate === d.date
        }))} 
        onSelectDate={setSelectedDate} 
      />

      <TouchableOpacity activeOpacity={0.9} style={styles.dayCardContainer} onPress={() => router.push('/(tabs)/start')}>
        <LinearGradient
          colors={isTrainingDay ? Gradients.trainingDay : Gradients.restDay}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.dayCard}
        >
          <View style={styles.dayCardContent}>
            <View>
              <Text style={styles.dayCardTitle}>{isTrainingDay ? 'Training day' : 'Rest day'}</Text>
              <View style={styles.tags}>
                {isTrainingDay ? (
                  <>
                    <View style={styles.tag}><Text style={styles.tagText}>push-up</Text></View>
                    <View style={styles.tag}><Text style={styles.tagText}>Muscle up</Text></View>
                  </>
                ) : (
                  <Text style={styles.restText}>No workout planned today</Text>
                )}
              </View>
            </View>
            
            <View style={styles.actionBtn}>
              <Ionicons name={isTrainingDay ? "play" : "add"} size={16} color={Colors.text} />
              <Text style={styles.actionBtnText}>{isTrainingDay ? 'Start' : 'add'}</Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Workouts</Text>
      
      <View style={styles.grid}>
        {isLoading ? (
           <Text style={{color: Colors.textMuted}}>Loading workouts...</Text>
        ) : workouts.length > 0 ? (
          workouts.map((w: any) => (
             <WorkoutGridCard 
                key={w.id}
                title={w.name}
                subtitle={`Last session\n${new Date(w.startedAt).toLocaleDateString()}`}
                dotColor={w.name.includes('Push') ? Colors.accent : Colors.primary}
                stats={[
                  { value: w.totalSets || 0, label: 'Sets' },
                  { value: Math.round((w.durationSeconds || 0) / 60), label: 'Min' },
                  { value: w.totalVolumeKg || 0, label: 'Vol', icon: '🔥', iconColor: Colors.accent }
                ]}
                onPress={() => router.push(`/(tabs)/start`)}
             />
          ))
        ) : (
          <>
            <WorkoutGridCard 
              title="Push up"
              subtitle="Last session\n28-25-21"
              dotColor={Colors.accent}
              stats={[
                { value: '12', label: 'max' },
                { value: '30', label: 'max T' },
                { value: '78', icon: '🔥', iconColor: Colors.accent }
              ]}
              onPress={() => router.push('/(tabs)/start')}
            />
            <WorkoutGridCard 
              title="Squats"
              subtitle="Last session\n31-27-19"
              dotColor={Colors.primaryLight}
              stats={[
                { value: '4', label: 'max' },
                { value: '32', label: 'max T' },
                { value: '81', icon: '🔥', iconColor: Colors.accent }
              ]}
              onPress={() => router.push('/(tabs)/start')}
            />
          </>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  greeting: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  settingsBtn: {
    padding: Spacing.xs,
  },
  dayCardContainer: {
    marginVertical: Spacing.md,
  },
  dayCard: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },
  dayCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayCardTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  tags: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  tag: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  tagText: {
    color: Colors.text,
    fontSize: FontSize.xs,
  },
  restText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSize.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    gap: 4,
  },
  actionBtnText: {
    color: Colors.text,
    fontWeight: FontWeight.bold,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
