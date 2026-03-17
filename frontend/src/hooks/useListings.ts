import { useQuery } from '@tanstack/react-query';
import { listingsApi, type ListingFeedParams } from '../api/listings';
import { useAuthStore } from '../stores/auth';

export function useFeed(params?: ListingFeedParams) {
  return useQuery({
    queryKey: ['listings', 'feed', params],
    queryFn: () => listingsApi.getFeed(params).then((r) => r.data),
  });
}

export function useListing(id: string) {
  return useQuery({
    queryKey: ['listing', id],
    queryFn: () => listingsApi.getListing(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useMyListings(params?: { page?: number; per_page?: number }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['listings', 'mine', params],
    queryFn: () => listingsApi.getMyListings(params).then((r) => r.data),
    enabled: isAuthenticated,
  });
}
