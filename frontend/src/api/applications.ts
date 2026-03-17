import api from './client';
import type { PaginatedResponse } from './listings';
import type { ProfileLink } from './profiles';

export interface Application {
  id: string;
  listing_id: string;
  applicant_id: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
  listing_title?: string;
  listing_author_role?: string;
  applicant_name?: string;
}

export interface ContactInfo {
  user_id: string;
  display_name: string;
  email: string;
  links: ProfileLink[];
}

export const applicationsApi = {
  create: (listingId: string, message: string) =>
    api.post<Application>('/applications', { listing_id: listingId, message }),

  getMine: (params?: { as?: string; status?: string; page?: number; per_page?: number }) =>
    api.get<PaginatedResponse<Application>>('/applications', { params }),

  updateStatus: (id: string, status: 'accepted' | 'rejected' | 'withdrawn') =>
    api.put<Application>(`/applications/${id}/status`, { status }),

  getContact: (id: string) =>
    api.get<ContactInfo>(`/applications/${id}/contact`),
};
