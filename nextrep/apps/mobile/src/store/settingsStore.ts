import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  unit: 'kg' | 'lbs';
  theme: 'dark' | 'light';
  restTimerDefault: number; // seconds
  autoStartTimer: boolean;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  isLoaded: boolean;

  setUnit: (unit: 'kg' | 'lbs') => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setRestTimerDefault: (seconds: number) => void;
  setAutoStartTimer: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setHapticEnabled: (enabled: boolean) => void;
  loadSettings: () => Promise<void>;
}

const SETTINGS_KEY = 'nextrep_settings';

export const useSettingsStore = create<SettingsState>((set, get) => ({
  unit: 'kg',
  theme: 'dark',
  restTimerDefault: 90,
  autoStartTimer: true,
  soundEnabled: true,
  hapticEnabled: true,
  isLoaded: false,

  setUnit: (unit) => {
    set({ unit });
    persistSettings(get());
  },
  setTheme: (theme) => {
    set({ theme });
    persistSettings(get());
  },
  setRestTimerDefault: (restTimerDefault) => {
    set({ restTimerDefault });
    persistSettings(get());
  },
  setAutoStartTimer: (autoStartTimer) => {
    set({ autoStartTimer });
    persistSettings(get());
  },
  setSoundEnabled: (soundEnabled) => {
    set({ soundEnabled });
    persistSettings(get());
  },
  setHapticEnabled: (hapticEnabled) => {
    set({ hapticEnabled });
    persistSettings(get());
  },
  loadSettings: async () => {
    try {
      const raw = await AsyncStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set({
          unit: parsed.unit ?? 'kg',
          theme: parsed.theme ?? 'dark',
          restTimerDefault: parsed.restTimerDefault ?? 90,
          autoStartTimer: parsed.autoStartTimer ?? true,
          soundEnabled: parsed.soundEnabled ?? true,
          hapticEnabled: parsed.hapticEnabled ?? true,
          isLoaded: true,
        });
      } else {
        set({ isLoaded: true });
      }
    } catch {
      set({ isLoaded: true });
    }
  },
}));

function persistSettings(state: SettingsState) {
  const data = {
    unit: state.unit,
    theme: state.theme,
    restTimerDefault: state.restTimerDefault,
    autoStartTimer: state.autoStartTimer,
    soundEnabled: state.soundEnabled,
    hapticEnabled: state.hapticEnabled,
  };
  AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(data)).catch(() => {});
}

// Utility function to convert weight based on current unit
export function convertWeight(kg: number, unit: 'kg' | 'lbs'): number {
  if (unit === 'lbs') return Math.round(kg * 2.20462 * 10) / 10;
  return kg;
}

export function weightLabel(unit: 'kg' | 'lbs'): string {
  return unit;
}
