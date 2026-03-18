import axios from 'axios';
import { useAuthStore } from '../stores/auth';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Shared refresh logic — ensures only one refresh request is in flight at a time.
// Both the 401 interceptor and useAuth hook use this to avoid racing.
let activeRefreshPromise: Promise<string> | null = null;

export function refreshAccessToken(): Promise<string> {
  if (activeRefreshPromise) return activeRefreshPromise;

  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) return Promise.reject(new Error('No refresh token'));

  const activeRole = useAuthStore.getState().activeRole;
  activeRefreshPromise = axios
    .post('/api/auth/refresh', { refresh_token: refreshToken, active_role: activeRole })
    .then((res) => {
      const { access_token, refresh_token } = res.data;
      useAuthStore.getState().setTokens(access_token, refresh_token);
      return access_token as string;
    })
    .catch((err) => {
      useAuthStore.getState().logout();
      throw err;
    })
    .finally(() => {
      activeRefreshPromise = null;
    });

  return activeRefreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest._skipAuthRetry) {
      originalRequest._retry = true;

      // If a refresh is already in progress, queue this request
      if (activeRefreshPromise) {
        return activeRefreshPromise.then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      try {
        const token = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
