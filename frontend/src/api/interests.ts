import api from './client';
import type { ContactInfo } from './applications';
import type { PaginatedResponse, Listing } from './listings';

export interface SaveToggleResponse {
  saved: boolean;
}

export interface InterestToggleResponse {
  interested: boolean;
  matched: boolean;
}

export interface MatchResponse {
  matched_user_id: string;
  matched_user_name: string;
  my_listing_id: string;
  my_listing_title: string;
  their_listing_id: string;
  their_listing_title: string;
}

export const interestsApi = {
  saveListing: (listingId: string) =>
    api.post<SaveToggleResponse>(`/listings/${listingId}/save`),

  unsaveListing: (listingId: string) =>
    api.delete<SaveToggleResponse>(`/listings/${listingId}/save`),

  getSavedListings: (params?: { page?: number; per_page?: number }) =>
    api.get<PaginatedResponse<Listing>>('/listings/saved', { params }),

  addInterest: (listingId: string) =>
    api.post<InterestToggleResponse>(`/listings/${listingId}/interest`),

  removeInterest: (listingId: string) =>
    api.delete<InterestToggleResponse>(`/listings/${listingId}/interest`),

  getReceivedInterests: () =>
    api.get<Array<{ id: string; user_name: string; listing_title: string; created_at: string }>>('/interests/received'),

  getMatches: () =>
    api.get<MatchResponse[]>('/interests/matches'),

  getMatchContact: (userId: string) =>
    api.get<ContactInfo>(`/interests/matches/${userId}/contact`),
};
