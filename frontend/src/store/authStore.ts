import { create } from 'zustand';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  subscriptionPlan: 'free' | 'pro';
  subscriptionStatus: 'free' | 'active' | 'canceled' | 'past_due';
}

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: UserProfile | null, token: string | null) => void;
  clearAuth: () => void;
  setLoading: (isLoading: boolean) => void;
  updateUserSubscription: (plan: 'free' | 'pro', status: string) => void;
}

// Check local storage for initial auth load
const savedUser = localStorage.getItem('tf_user');
const savedToken = localStorage.getItem('tf_token');

export const authStore = create<AuthState>((set) => ({
  user: savedUser ? JSON.parse(savedUser) : null,
  accessToken: savedToken || null,
  isAuthenticated: !!savedToken,
  isLoading: false,

  setAuth: (user, token) => {
    if (user && token) {
      localStorage.setItem('tf_user', JSON.stringify(user));
      localStorage.setItem('tf_token', token);
      set({ user, accessToken: token, isAuthenticated: true });
    } else {
      localStorage.removeItem('tf_user');
      localStorage.removeItem('tf_token');
      set({ user: null, accessToken: null, isAuthenticated: false });
    }
  },

  clearAuth: () => {
    localStorage.removeItem('tf_user');
    localStorage.removeItem('tf_token');
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  setLoading: (isLoading) => set({ isLoading }),

  updateUserSubscription: (plan, status) => set((state) => {
    if (!state.user) return state;
    const updatedUser = { ...state.user, subscriptionPlan: plan, subscriptionStatus: status as any };
    localStorage.setItem('tf_user', JSON.stringify(updatedUser));
    return { user: updatedUser };
  }),
}));
