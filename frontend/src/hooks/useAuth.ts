import { useCallback, useEffect } from 'react';
import { useAuthStore } from '../stores/auth';
import { profilesApi } from '../api/profiles';
import { refreshAccessToken } from '../api/client';
import { authApi } from '../api/auth';

export function useAuth() {
  const { isAuthenticated, user, accessToken, refreshToken, setUser, logout } =
    useAuthStore();

  useEffect(() => {
    if (refreshToken && !accessToken) {
      // Uses the shared refreshAccessToken which deduplicates concurrent calls.
      // The 401 interceptor also uses this, so only one refresh request is ever in flight.
      refreshAccessToken().catch(() => {
        // logout already handled inside refreshAccessToken
      });
    }
  }, [refreshToken, accessToken]);

  useEffect(() => {
    if (accessToken && !user) {
      profilesApi
        .getMe()
        .then((res) => setUser(res.data))
        .catch(() => {});
    }
  }, [accessToken, user, setUser]);

  const handleLogout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* clear local state regardless */ }
    logout();
  }, [logout]);

  return { isAuthenticated, user, logout: handleLogout };
}
