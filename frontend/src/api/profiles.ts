import type { AxiosRequestConfig } from 'axios';
import api from './client';

export interface UserResponse {
  id: string;
  email: string;
  display_name: string;
  has_individual_profile: boolean;
  has_organization_profile: boolean;
  created_at: string;
}

export interface ProfileLink {
  id: string;
  link_type: string;
  label: string;
  url: string;
  display_order: number;
}

export interface ProfileLinkInput {
  link_type: string;
  label: string;
  url: string;
  display_order?: number;
}

export interface IndividualProfile {
  user_id: string;
  bio: string;
  headline: string;
  profession: string;
  skills: string[];
  experience_level: string;
  contact_email?: string | null;
  links: ProfileLink[];
}

export interface OrganizationProfile {
  user_id: string;
  organization_name: string;
  description: string;
  industry: string;
  size: string;
  skills_sought: string[];
  contact_email?: string | null;
  links: ProfileLink[];
}

export interface ProfilePreview {
  user_id: string;
  display_name: string;
  bio_excerpt: string;
  skills: string[];
  level_or_size: string;
  active_listing_count: number;
  has_individual_profile: boolean;
  has_organization_profile: boolean;
}

export const profilesApi = {
  getMe: () => api.get<UserResponse>('/users/me'),
  updateMe: (displayName: string) => api.put<UserResponse>('/users/me', { display_name: displayName }),
  deleteAccount: () => api.delete('/users/me'),

  getMyIndividualProfile: (config?: AxiosRequestConfig) => api.get<IndividualProfile>('/profiles/individual', config),
  upsertIndividualProfile: (data: Partial<Omit<IndividualProfile, 'user_id' | 'links'>>) =>
    api.put<IndividualProfile>('/profiles/individual', data),
  deleteIndividualProfile: () => api.delete('/profiles/individual'),

  getMyOrganizationProfile: (config?: AxiosRequestConfig) => api.get<OrganizationProfile>('/profiles/organization', config),
  upsertOrganizationProfile: (data: Partial<Omit<OrganizationProfile, 'user_id' | 'links'>>) =>
    api.put<OrganizationProfile>('/profiles/organization', data),
  deleteOrganizationProfile: () => api.delete('/profiles/organization'),

  getProfileLinks: (profileType: 'individual' | 'organization') =>
    api.get<ProfileLink[]>(`/profiles/${profileType}/links`),
  replaceProfileLinks: (profileType: 'individual' | 'organization', links: ProfileLinkInput[]) =>
    api.put<ProfileLink[]>(`/profiles/${profileType}/links`, { links }),

  getPublicIndividualProfile: (id: string) => api.get<IndividualProfile>(`/profiles/individual/${id}`),
  getPublicOrganizationProfile: (id: string) => api.get<OrganizationProfile>(`/profiles/organization/${id}`),
  getProfilePreview: (id: string) => api.get<ProfilePreview>(`/profiles/preview/${id}`),
};
