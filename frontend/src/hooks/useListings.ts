import { useQuery } from '@tanstack/react-query';
import { listingsApi, type ListingFeedParams } from '../api/listings';
import { useAuthStore } from '../stores/auth';

export function useDeveloperFeed(params?: ListingFeedParams) {
  return useQuery({
    queryKey: ['listings', 'developers', params],
    queryFn: () => listingsApi.getDeveloperFeed(params).then((r) => r.data),
  });
}

export function useCompanyFeed(params?: ListingFeedParams) {
  return useQuery({
    queryKey: ['listings', 'companies', params],
    queryFn: () => listingsApi.getCompanyFeed(params).then((r) => r.data),
  });
}

export function useListing(id: string) {
  return useQuery({
    queryKey: ['listing', id],
    queryFn: () => listingsApi.getListing(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useMyListings() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['listings', 'mine'],
    queryFn: () => listingsApi.getMyListings().then((r) => r.data),
    enabled: isAuthenticated,
  });
}
