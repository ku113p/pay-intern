import { useEffect } from 'react';
import { useAuthStore } from '../stores/auth';
import { profilesApi } from '../api/profiles';
import { authApi } from '../api/auth';

let refreshPromise: Promise<void> | null = null;

export function useAuth() {
  const { isAuthenticated, user, accessToken, refreshToken, setTokens, setUser, logout } =
    useAuthStore();

  useEffect(() => {
    if (refreshToken && !accessToken && !refreshPromise) {
      refreshPromise = authApi
        .refresh(refreshToken)
        .then((res) => {
          setTokens(res.data.access_token, res.data.refresh_token);
        })
        .catch(() => {
          logout();
        })
        .finally(() => {
          refreshPromise = null;
        });
    }
  }, [refreshToken, accessToken, setTokens, logout]);

  useEffect(() => {
    if (accessToken && !user) {
      profilesApi
        .getMe()
        .then((res) => setUser(res.data))
        .catch(() => {});
    }
  }, [accessToken, user, setUser]);

  return { isAuthenticated, user, logout };
}
