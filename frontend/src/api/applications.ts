import api from './client';
import type { PaginatedResponse } from './listings';

export interface Application {
  id: string;
  listing_id: string;
  applicant_id: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const applicationsApi = {
  create: (listingId: string, message: string) =>
    api.post<Application>('/applications', { listing_id: listingId, message }),

  getMine: (params?: { as?: string; status?: string; page?: number; per_page?: number }) =>
    api.get<PaginatedResponse<Application>>('/applications', { params }),

  updateStatus: (id: string, status: 'accepted' | 'rejected') =>
    api.put<Application>(`/applications/${id}/status`, { status }),
};
