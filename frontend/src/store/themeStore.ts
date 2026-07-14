import { create } from 'zustand';

interface ThemeState {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
}

const savedTheme = (localStorage.getItem('tf_theme') as 'dark' | 'light') || 'dark';

// Initialize theme on HTML element immediately
const root = window.document.documentElement;
root.classList.remove('light', 'dark');
root.classList.add(savedTheme);

export const themeStore = create<ThemeState>((set) => ({
  theme: savedTheme,
  toggleTheme: () => set((state) => {
    const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('tf_theme', nextTheme);
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(nextTheme);
    return { theme: nextTheme };
  }),
  setTheme: (theme) => set(() => {
    localStorage.setItem('tf_theme', theme);
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    return { theme };
  })
}));
