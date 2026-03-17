import api from './client';

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  needs_profile_setup?: boolean;
}

export const authApi = {
  googleAuth: (code: string) =>
    api.post<TokenResponse>('/auth/google', { code }),

  requestMagicLink: (email: string) =>
    api.post<{ message: string }>('/auth/magic-link/request', { email }),

  requestLoginLink: (email: string) =>
    api.post<{ message: string }>('/auth/magic-link/login', { email }),

  verifyMagicLink: (email: string, token: string) =>
    api.post<TokenResponse>('/auth/magic-link/verify', { email, token }),

  refresh: (refreshToken: string) =>
    api.post<TokenResponse>('/auth/refresh', { refresh_token: refreshToken }, { _skipAuthRetry: true } as never),

  switchRole: (role: 'individual' | 'organization') =>
    api.post<TokenResponse>('/auth/switch-role', { role }),

  logout: () => api.post('/auth/logout'),
};
