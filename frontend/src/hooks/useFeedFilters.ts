import { useSearchParams } from 'react-router-dom';
import { useMemo, useCallback } from 'react';
import type { ListingFeedParams } from '../api/listings';

export function useFeedFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: ListingFeedParams = useMemo(() => ({
    page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
    per_page: searchParams.get('per_page') ? Number(searchParams.get('per_page')) : undefined,
    skills: searchParams.get('skills') || undefined,
    format: searchParams.get('format') || undefined,
    min_weeks: searchParams.get('min_weeks') ? Number(searchParams.get('min_weeks')) : undefined,
    max_weeks: searchParams.get('max_weeks') ? Number(searchParams.get('max_weeks')) : undefined,
    min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
    max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
    sort: searchParams.get('sort') || 'newest',
    experience_level: searchParams.get('experience_level') || undefined,
    search: searchParams.get('search') || undefined,
  }), [searchParams]);

  const setFilters = useCallback((next: ListingFeedParams) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(next)) {
      if (value === undefined || value === null || value === '') continue;
      if (key === 'sort' && value === 'newest') continue;
      if (key === 'page' && value === 1) continue;
      params.set(key, String(value));
    }
    setSearchParams(params, { replace: true });
  }, [setSearchParams]);

  return { filters, setFilters };
}
