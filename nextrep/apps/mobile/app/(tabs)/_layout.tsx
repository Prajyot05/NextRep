import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadows, Spacing, Radius, FontSize } from '../../src/theme';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position:        'absolute',
          left:            Spacing.xl,
          right:           Spacing.xl,
          height:          64 + Math.max(insets.bottom, 8),
          borderRadius:    Radius.full,
          backgroundColor: 'rgba(28, 28, 30, 0.95)',
          borderTopWidth:  0,
          borderWidth:     1,
          borderColor:     Colors.borderSubtle,
          paddingBottom:   Math.max(insets.bottom, 8),
          paddingTop:      8,
          shadowColor:     '#000',
          shadowOffset:    { width: 0, height: 10 },
          shadowOpacity:   0.8,
          shadowRadius:    20,
          elevation:       10,
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
              <Ionicons name="add" size={24} color={focused ? '#000' : Colors.text} />
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
            <Ionicons name={focused ? 'list' : 'list-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  startIcon: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: Colors.bgMuted,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    4,
  },
  startIconActive: {
    backgroundColor: Colors.text,
  },
});
