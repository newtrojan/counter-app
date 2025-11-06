import { create } from 'zustand';
import { User, LoginRequest, RegisterRequest } from '@/types/auth';
import { authApi } from '@/api/auth';
import { tokenStorage } from '@/lib/api-client';

/**
 * Auth Store
 * Security features:
 * - Secure token storage
 * - Auto-refresh mechanism
 * - Role-based access control helpers
 * - Session management
 */

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  clearError: () => void;

  // Helpers
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  /**
   * Login user
   */
  login: async (data: LoginRequest) => {
    try {
      set({ isLoading: true, error: null });

      const response = await authApi.login(data);

      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error.response?.data?.error?.message || 'Login failed',
      });
      throw error;
    }
  },

  /**
   * Register new user
   */
  register: async (data: RegisterRequest) => {
    try {
      set({ isLoading: true, error: null });

      const response = await authApi.register(data);

      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error.response?.data?.error?.message || 'Registration failed',
      });
      throw error;
    }
  },

  /**
   * Logout user
   */
  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      // Clear state even if API call fails
      set({
        user: null,
        isAuthenticated: false,
        error: null,
      });
    }
  },

  /**
   * Load current user profile
   * Called on app initialization if token exists
   */
  loadUser: async () => {
    const token = tokenStorage.getAccessToken();

    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }

    try {
      set({ isLoading: true });

      const user = await authApi.getProfile();

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      // Token invalid or expired, clear it
      tokenStorage.clearTokens();

      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  /**
   * Clear error message
   */
  clearError: () => set({ error: null }),

  /**
   * Check if user has specific role
   */
  hasRole: (role: string): boolean => {
    const { user } = get();
    return user?.roles?.includes(role) || false;
  },

  /**
   * Check if user has specific permission
   * Note: Backend should enforce this, this is just for UI
   */
  hasPermission: (permission: string): boolean => {
    const { user } = get();
    // TODO: Implement permission checking based on your RBAC system
    return false;
  },

  /**
   * Check if user is admin
   */
  isAdmin: (): boolean => {
    const { user } = get();
    return user?.roles?.includes('admin') || user?.roles?.includes('super_admin') || false;
  },
}));
