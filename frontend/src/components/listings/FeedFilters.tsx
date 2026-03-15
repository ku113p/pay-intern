import { useState, useEffect, useRef } from 'react';
import type { ListingFeedParams } from '../../api/listings';
import { useDebounce } from '../../hooks/useDebounce';

interface Props {
  filters: ListingFeedParams;
  onChange: (filters: ListingFeedParams) => void;
  feedType: 'developer' | 'company';
}

export function FeedFilters({ filters, onChange, feedType }: Props) {
  const labels = feedType === 'developer'
    ? { tech: 'Skills', level: 'Developer Level', minPrice: 'Min rate', maxPrice: 'Max rate', sortPriceAsc: 'Rate: Low to High', sortPriceDesc: 'Rate: High to Low' }
    : { tech: 'Required Tech', level: 'Required Level', minPrice: 'Min budget', maxPrice: 'Max budget', sortPriceAsc: 'Budget: Low to High', sortPriceDesc: 'Budget: High to Low' };
  const [tech, setTech] = useState(filters.tech || '');
  const [minWeeks, setMinWeeks] = useState(filters.min_weeks?.toString() || '');
  const [maxWeeks, setMaxWeeks] = useState(filters.max_weeks?.toString() || '');
  const [minPrice, setMinPrice] = useState(filters.min_price?.toString() || '');
  const [maxPrice, setMaxPrice] = useState(filters.max_price?.toString() || '');

  const debouncedTech = useDebounce(tech, 400);
  const debouncedMinWeeks = useDebounce(minWeeks, 400);
  const debouncedMaxWeeks = useDebounce(maxWeeks, 400);
  const debouncedMinPrice = useDebounce(minPrice, 400);
  const debouncedMaxPrice = useDebounce(maxPrice, 400);

  const isInitialMount = useRef(true);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    onChange({
      ...filtersRef.current,
      tech: debouncedTech || undefined,
      min_weeks: debouncedMinWeeks ? +debouncedMinWeeks : undefined,
      max_weeks: debouncedMaxWeeks ? +debouncedMaxWeeks : undefined,
      min_price: debouncedMinPrice ? +debouncedMinPrice : undefined,
      max_price: debouncedMaxPrice ? +debouncedMaxPrice : undefined,
      page: 1,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTech, debouncedMinWeeks, debouncedMaxWeeks, debouncedMinPrice, debouncedMaxPrice]);

  // Sync local state when filters change externally (e.g. "Clear filters")
  useEffect(() => {
    setTech(filters.tech || '');
    setMinWeeks(filters.min_weeks?.toString() || '');
    setMaxWeeks(filters.max_weeks?.toString() || '');
    setMinPrice(filters.min_price?.toString() || '');
    setMaxPrice(filters.max_price?.toString() || '');
  }, [filters.tech, filters.min_weeks, filters.max_weeks, filters.min_price, filters.max_price]);

  const hasFilters = !!(
    tech || filters.format || filters.experience_level ||
    minWeeks || maxWeeks ||
    minPrice || maxPrice ||
    (filters.sort && filters.sort !== 'newest')
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <h3 className="font-medium text-gray-900">Filters</h3>

      <div>
        <label className="block text-sm text-gray-600 mb-1">{labels.tech}</label>
        <input
          type="text"
          placeholder="e.g. rust,react"
          value={tech}
          onChange={(e) => setTech(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Format</label>
        <select
          value={filters.format || ''}
          onChange={(e) => onChange({ ...filters, format: e.target.value || undefined, page: 1 })}
          className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
        >
          <option value="">All</option>
          <option value="remote">Remote</option>
          <option value="onsite">Onsite</option>
          <option value="hybrid">Hybrid</option>
        </select>
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">{labels.level}</label>
        <select
          value={filters.experience_level || ''}
          onChange={(e) => onChange({ ...filters, experience_level: e.target.value || undefined, page: 1 })}
          className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
        >
          <option value="">All</option>
          <option value="junior">Junior</option>
          <option value="mid">Mid</option>
          <option value="senior">Senior</option>
        </select>
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Sort</label>
        <select
          value={filters.sort || 'newest'}
          onChange={(e) => onChange({ ...filters, sort: e.target.value })}
          className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
        >
          <option value="newest">Newest</option>
          <option value="price_asc">{labels.sortPriceAsc}</option>
          <option value="price_desc">{labels.sortPriceDesc}</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Min weeks</label>
          <input
            type="number"
            min={1}
            value={minWeeks}
            onChange={(e) => setMinWeeks(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Max weeks</label>
          <input
            type="number"
            min={1}
            value={maxWeeks}
            onChange={(e) => setMaxWeeks(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm text-gray-600 mb-1">{labels.minPrice}</label>
          <input
            type="number"
            min={0}
            step={100}
            placeholder="$0"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">{labels.maxPrice}</label>
          <input
            type="number"
            min={0}
            step={100}
            placeholder="Any"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={() => onChange({ sort: 'newest' })}
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
