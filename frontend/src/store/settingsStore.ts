import { create } from 'zustand';
import { api } from '../services/api';
import { themeStore } from './themeStore';

export interface UserSettings {
  language: 'es' | 'en';
  theme: 'dark' | 'light';
  timezone: string;
  timeFormat: '12h' | '24h';
  soundAlerts: boolean;
  defaultBreakDuration: number;
  keyboardShortcuts: Record<string, string>;
}

interface SettingsState {
  settings: UserSettings;
  isLoading: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
}

const defaultSettings: UserSettings = {
  language: 'es',
  theme: 'dark',
  timezone: 'UTC',
  timeFormat: '24h',
  soundAlerts: true,
  defaultBreakDuration: 300,
  keyboardShortcuts: {
    toggleTimer: 'Space',
    cancelTimer: 'Escape',
    saveTimer: 'KeyS',
  },
};

export const settingsStore = create<SettingsState>((set, get) => ({
  settings: defaultSettings,
  isLoading: false,

  loadSettings: async () => {
    set({ isLoading: true });
    try {
      const data = await api.get<UserSettings>('/settings');
      set({ settings: { ...defaultSettings, ...data } });
      
      // Sync theme state with settings theme
      if (data.theme) {
        themeStore.getState().setTheme(data.theme);
      }
    } catch (error) {
      console.error('Failed to load settings from API:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  updateSettings: async (updates) => {
    const previousSettings = get().settings;
    
    // Optimistic UI update
    set((state) => ({
      settings: { ...state.settings, ...updates },
    }));

    // If theme changed, apply immediately
    if (updates.theme) {
      themeStore.getState().setTheme(updates.theme);
    }

    try {
      await api.put('/settings', updates);
    } catch (error) {
      console.error('Failed to save settings to API:', error);
      // Revert on failure
      set({ settings: previousSettings });
      if (previousSettings.theme) {
        themeStore.getState().setTheme(previousSettings.theme);
      }
      throw error;
    }
  },
}));
