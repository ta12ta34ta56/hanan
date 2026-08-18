import { create } from 'zustand';

/** Guest-only. Accounts were deleted with Supabase. */
interface AuthState {
  ready: boolean;
  session: null;
  user: null;
  isOwner: boolean;
  init: () => Promise<void>;
}

export const useAuthStore = create<AuthState>(() => ({
  ready: true,
  session: null,
  user: null,
  isOwner: false,
  init: async () => undefined,
}));

export function useAccessToken(): string | null {
  return null;
}
