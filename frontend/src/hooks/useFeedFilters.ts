import { useSearchParams } from 'react-router-dom';
import { useMemo, useCallback } from 'react';
import type { ListingFeedParams } from '../api/listings';
import { useAuthStore } from '../stores/auth';

export function useFeedFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeRole = useAuthStore((s) => s.activeRole);

  const oppositeRole = activeRole === 'individual' ? 'organization'
    : activeRole === 'organization' ? 'individual'
    : undefined;

  const filters: ListingFeedParams = useMemo(() => ({
    page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
    per_page: searchParams.get('per_page') ? Number(searchParams.get('per_page')) : undefined,
    skills: searchParams.get('skills') || undefined,
    format: searchParams.get('format') || undefined,
    author_role: searchParams.get('author_role') || oppositeRole || undefined,
    min_weeks: searchParams.get('min_weeks') ? Number(searchParams.get('min_weeks')) : undefined,
    max_weeks: searchParams.get('max_weeks') ? Number(searchParams.get('max_weeks')) : undefined,
    min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
    max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
    sort: searchParams.get('sort') || 'newest',
    experience_level: searchParams.get('experience_level') || undefined,
    search: searchParams.get('search') || undefined,
  }), [searchParams, oppositeRole]);

  const setFilters = useCallback((next: ListingFeedParams) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(next)) {
      if (value === undefined || value === null || value === '') continue;
      if (key === 'sort' && value === 'newest') continue;
      if (key === 'page' && value === 1) continue;
      // Don't persist author_role to URL if it matches the auto-default
      if (key === 'author_role' && value === oppositeRole) continue;
      params.set(key, String(value));
    }
    setSearchParams(params, { replace: true });
  }, [setSearchParams, oppositeRole]);

  return { filters, setFilters, defaultAuthorRole: oppositeRole };
}
