import { Tabs, router } from 'expo-router';
import { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { Colors, Shadows, Spacing, Radius, FontSize } from '../../src/theme';

export default function TabsLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) router.replace('/(auth)/login');
  }, [isAuthenticated]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position:        'absolute',
          bottom:          Platform.OS === 'ios' ? 24 : 16,
          left:            Spacing.lg,
          right:           Spacing.lg,
          height:          64,
          borderRadius:    Radius.xl,
          backgroundColor: 'rgba(26, 26, 36, 0.92)',
          borderTopWidth:  0,
          borderWidth:     1,
          borderColor:     Colors.border,
          paddingBottom:   Platform.OS === 'ios' ? 0 : 8,
          paddingTop:      8,
          ...Shadows.lg,
        },
        tabBarActiveTintColor:   Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize:   FontSize.xxs,
          fontWeight: '600',
          marginTop:  2,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'time' : 'time-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="start"
        options={{
          title: 'Start',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.startIcon, focused && styles.startIconActive]}>
              <Ionicons name="add" size={26} color={focused ? Colors.bg : color} />
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'stats-chart' : 'stats-chart-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  startIcon: {
    width:           44,
    height:          44,
    borderRadius:    22,
    backgroundColor: Colors.bgMuted,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    4,
  },
  startIconActive: {
    backgroundColor: Colors.primary,
    ...Shadows.glow(Colors.primary),
  },
});
