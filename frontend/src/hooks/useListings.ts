import { useQuery } from '@tanstack/react-query';
import { listingsApi, type ListingFeedParams } from '../api/listings';

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
