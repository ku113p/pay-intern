import api from './client';

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export const authApi = {
  googleAuth: (code: string, role: string) =>
    api.post<TokenResponse>('/auth/google', { code, role }),

  requestMagicLink: (email: string, role: string) =>
    api.post<{ message: string; dev_link: string }>('/auth/magic-link/request', { email, role }),

  verifyMagicLink: (email: string, token: string) =>
    api.post<TokenResponse>('/auth/magic-link/verify', { email, token }),

  refresh: (refreshToken: string) =>
    api.post<TokenResponse>('/auth/refresh', { refresh_token: refreshToken }),

  logout: () => api.post('/auth/logout'),
};
