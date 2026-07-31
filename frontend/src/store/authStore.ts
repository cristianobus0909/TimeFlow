import { create } from 'zustand';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  subscriptionPlan: 'free' | 'freelancer' | 'pro' | 'business';
  subscriptionStatus: 'free' | 'trialing' | 'active' | 'canceled' | 'past_due';
  trialPeriodEnd?: string;
  subscriptionPeriodEnd?: string;
}

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: UserProfile | null, token: string | null, refreshToken?: string | null) => void;
  clearAuth: () => void;
  setLoading: (isLoading: boolean) => void;
  updateUserSubscription: (plan: 'free' | 'freelancer' | 'pro' | 'business', status: string) => void;
}

// Check local storage for initial auth load
const savedUser = localStorage.getItem('tf_user');
const savedToken = localStorage.getItem('tf_token');
const savedRefreshToken = localStorage.getItem('tf_refresh_token');

export const authStore = create<AuthState>((set) => ({
  user: savedUser ? JSON.parse(savedUser) : null,
  accessToken: savedToken || null,
  refreshToken: savedRefreshToken || null,
  isAuthenticated: !!savedToken,
  isLoading: false,

  setAuth: (user, token, refreshToken) => {
    if (user && token) {
      localStorage.setItem('tf_user', JSON.stringify(user));
      localStorage.setItem('tf_token', token);
      if (refreshToken) {
        localStorage.setItem('tf_refresh_token', refreshToken);
      }
      const activeRefreshToken = refreshToken || localStorage.getItem('tf_refresh_token') || null;
      set({ user, accessToken: token, refreshToken: activeRefreshToken, isAuthenticated: true });
    } else {
      localStorage.removeItem('tf_user');
      localStorage.removeItem('tf_token');
      localStorage.removeItem('tf_refresh_token');
      set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
    }
  },

  clearAuth: () => {
    localStorage.removeItem('tf_user');
    localStorage.removeItem('tf_token');
    localStorage.removeItem('tf_refresh_token');
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  },

  setLoading: (isLoading) => set({ isLoading }),

  updateUserSubscription: (plan, status) => set((state) => {
    if (!state.user) return state;
    const updatedUser = { ...state.user, subscriptionPlan: plan, subscriptionStatus: status as any };
    localStorage.setItem('tf_user', JSON.stringify(updatedUser));
    return { user: updatedUser };
  }),
}));
