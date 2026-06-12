import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';

interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  initialize: () => void;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,

  initialize: () => {
    if (!isSupabaseConfigured) {
      // Load mock session from localStorage
      const mockUser = localStorage.getItem('nutrivision_mock_user');
      if (mockUser) {
        set({ user: JSON.parse(mockUser), loading: false });
      } else {
        // Log in a default user by default so the app is immediately usable
        const defaultUser = { id: 'mock-user-123', email: 'user@nutrivision.ai', name: 'Alex Health' };
        localStorage.setItem('nutrivision_mock_user', JSON.stringify(defaultUser));
        set({ user: defaultUser, loading: false });
      }
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        set({
          user: {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name,
            avatar_url: session.user.user_metadata?.avatar_url,
          },
          loading: false,
        });
      } else {
        set({ user: null, loading: false });
      }
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        set({
          user: {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name,
            avatar_url: session.user.user_metadata?.avatar_url,
          },
        });
      } else {
        set({ user: null });
      }
    });
  },

  signUp: async (email, password, name) => {
    set({ loading: true, error: null });
    try {
      if (!isSupabaseConfigured) {
        const mockUser = { id: 'mock-' + Math.random().toString(36).substr(2, 9), email, name };
        localStorage.setItem('nutrivision_mock_user', JSON.stringify(mockUser));
        set({ user: mockUser, loading: false });
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

      if (error) throw error;
      if (data.user) {
        set({
          user: {
            id: data.user.id,
            email: data.user.email || '',
            name,
          },
          loading: false,
        });
      }
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      if (!isSupabaseConfigured) {
        // Simple mock credential match
        if (password.length >= 6) {
          const mockUser = { id: 'mock-user-123', email, name: email.split('@')[0] };
          localStorage.setItem('nutrivision_mock_user', JSON.stringify(mockUser));
          set({ user: mockUser, loading: false });
          return;
        } else {
          throw new Error('Password must be at least 6 characters');
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (data.user) {
        set({
          user: {
            id: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.name || data.user.email?.split('@')[0],
          },
          loading: false,
        });
      }
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  signInWithGoogle: async () => {
    set({ loading: true, error: null });
    try {
      if (!isSupabaseConfigured) {
        const mockUser = { id: 'mock-google-user', email: 'google.user@gmail.com', name: 'Google User' };
        localStorage.setItem('nutrivision_mock_user', JSON.stringify(mockUser));
        set({ user: mockUser, loading: false });
        return;
      }
      await supabase.auth.signInWithOAuth({ provider: 'google' });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  signInWithApple: async () => {
    set({ loading: true, error: null });
    try {
      if (!isSupabaseConfigured) {
        const mockUser = { id: 'mock-apple-user', email: 'apple.user@icloud.com', name: 'Apple User' };
        localStorage.setItem('nutrivision_mock_user', JSON.stringify(mockUser));
        set({ user: mockUser, loading: false });
        return;
      }
      await supabase.auth.signInWithOAuth({ provider: 'apple' });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  signOut: async () => {
    set({ loading: true });
    try {
      if (!isSupabaseConfigured) {
        localStorage.removeItem('nutrivision_mock_user');
        set({ user: null, loading: false });
        return;
      }
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },
}));
