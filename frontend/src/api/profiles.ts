import api from './client';

export interface UserResponse {
  id: string;
  email: string;
  role: string;
  display_name: string;
  created_at: string;
}

export interface DeveloperProfile {
  user_id: string;
  bio: string;
  tech_stack: string[];
  github_url: string | null;
  linkedin_url: string | null;
  level: string;
  contact_email?: string | null;
}

export interface CompanyProfile {
  user_id: string;
  company_name: string;
  description: string;
  website: string | null;
  size: string;
  tech_stack: string[];
  contact_email?: string | null;
}

export interface ProfilePreview {
  user_id: string;
  display_name: string;
  role: string;
  bio_excerpt: string;
  tech_stack: string[];
  level_or_size: string;
  active_listing_count: number;
}

export const profilesApi = {
  getMe: () => api.get<UserResponse>('/users/me'),
  updateMe: (displayName: string) => api.put<UserResponse>('/users/me', { display_name: displayName }),

  getMyDeveloperProfile: () => api.get<DeveloperProfile>('/profiles/developer'),
  updateDeveloperProfile: (data: Partial<Omit<DeveloperProfile, 'user_id'>>) =>
    api.put<DeveloperProfile>('/profiles/developer', data),

  getMyCompanyProfile: () => api.get<CompanyProfile>('/profiles/company'),
  updateCompanyProfile: (data: Partial<Omit<CompanyProfile, 'user_id'>>) =>
    api.put<CompanyProfile>('/profiles/company', data),

  getPublicDeveloperProfile: (id: string) => api.get<DeveloperProfile>(`/profiles/developer/${id}`),
  getPublicCompanyProfile: (id: string) => api.get<CompanyProfile>(`/profiles/company/${id}`),
  getProfilePreview: (id: string) => api.get<ProfilePreview>(`/profiles/preview/${id}`),
};
