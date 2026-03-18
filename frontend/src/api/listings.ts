import api from './client';

export interface Listing {
  id: string;
  author_id: string;
  author_role: string;
  title: string;
  description: string;
  skills: string[];
  category: string | null;
  duration_weeks: number;
  price_usd: number | null;
  payment_direction: string;
  format: string;
  outcome_criteria: string[] | null;
  visibility: string;
  status: string;
  experience_level: string;
  created_at: string;
  updated_at: string;
  author_display_name: string | null;
  organization_name: string | null;
  individual_level: string | null;
  author_email_domain: string | null;
  is_saved?: boolean;
  is_interested?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export interface ListingFeedParams {
  page?: number;
  per_page?: number;
  skills?: string;
  category?: string;
  author_role?: string;
  payment_direction?: string;
  format?: string;
  min_weeks?: number;
  max_weeks?: number;
  min_price?: number;
  max_price?: number;
  sort?: string;
  experience_level?: string;
  search?: string;
}

export interface CreateListingRequest {
  title: string;
  description: string;
  skills: string[];
  category?: string;
  duration_weeks: number;
  price_usd?: number;
  payment_direction?: string;
  format: string;
  outcome_criteria?: string[];
  visibility?: string;
  experience_level?: string;
}

export const listingsApi = {
  getFeed: (params?: ListingFeedParams) =>
    api.get<PaginatedResponse<Listing>>('/listings/feed', { params }),

  getListing: (id: string) =>
    api.get<Listing>(`/listings/${id}`),

  createListing: (data: CreateListingRequest) =>
    api.post<Listing>('/listings', data),

  updateListing: (id: string, data: Partial<CreateListingRequest> & { status?: string }) =>
    api.put<Listing>(`/listings/${id}`, data),

  deleteListing: (id: string) =>
    api.delete(`/listings/${id}`),

  getMyListings: (params?: { page?: number; per_page?: number }) =>
    api.get<PaginatedResponse<Listing>>('/listings/mine', { params }),

  getSimilar: (id: string) =>
    api.get<Listing[]>(`/listings/${id}/similar`),
};
