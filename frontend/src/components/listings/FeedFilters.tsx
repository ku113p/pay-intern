import { useState, useEffect, useRef } from 'react';
import type { ListingFeedParams } from '../../api/listings';
import { useDebounce } from '../../hooks/useDebounce';

interface Props {
  filters: ListingFeedParams;
  onChange: (filters: ListingFeedParams) => void;
}

export function FeedFilters({ filters, onChange }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [skills, setSkills] = useState(filters.skills || '');
  const [minWeeks, setMinWeeks] = useState(filters.min_weeks?.toString() || '');
  const [maxWeeks, setMaxWeeks] = useState(filters.max_weeks?.toString() || '');
  const [minPrice, setMinPrice] = useState(filters.min_price?.toString() || '');
  const [maxPrice, setMaxPrice] = useState(filters.max_price?.toString() || '');

  const debouncedSearch = useDebounce(search, 400);
  const debouncedSkills = useDebounce(skills, 400);
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
      search: debouncedSearch || undefined,
      skills: debouncedSkills || undefined,
      min_weeks: debouncedMinWeeks ? +debouncedMinWeeks : undefined,
      max_weeks: debouncedMaxWeeks ? +debouncedMaxWeeks : undefined,
      min_price: debouncedMinPrice ? +debouncedMinPrice : undefined,
      max_price: debouncedMaxPrice ? +debouncedMaxPrice : undefined,
      page: 1,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, debouncedSkills, debouncedMinWeeks, debouncedMaxWeeks, debouncedMinPrice, debouncedMaxPrice]);

  useEffect(() => {
    setSearch(filters.search || '');
    setSkills(filters.skills || '');
    setMinWeeks(filters.min_weeks?.toString() || '');
    setMaxWeeks(filters.max_weeks?.toString() || '');
    setMinPrice(filters.min_price?.toString() || '');
    setMaxPrice(filters.max_price?.toString() || '');
  }, [filters.search, filters.skills, filters.min_weeks, filters.max_weeks, filters.min_price, filters.max_price]);

  const hasFilters = !!(
    search || skills || filters.format || filters.experience_level ||
    filters.author_role || filters.payment_direction || filters.category ||
    minWeeks || maxWeeks ||
    minPrice || maxPrice ||
    (filters.sort && filters.sort !== 'newest')
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <h3 className="font-medium text-gray-900">Filters</h3>

      <div>
        <input
          type="text"
          placeholder="Search listings..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Skills</label>
        <input
          type="text"
          placeholder="e.g. rust,react"
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Author Role</label>
        <select
          value={filters.author_role || ''}
          onChange={(e) => onChange({ ...filters, author_role: e.target.value || undefined, page: 1 })}
          className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
        >
          <option value="">All</option>
          <option value="individual">Individual</option>
          <option value="organization">Organization</option>
        </select>
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Category</label>
        <input
          type="text"
          placeholder="e.g. software"
          value={filters.category || ''}
          onChange={(e) => onChange({ ...filters, category: e.target.value || undefined, page: 1 })}
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
        <label className="block text-sm text-gray-600 mb-1">Payment Direction</label>
        <select
          value={filters.payment_direction || ''}
          onChange={(e) => onChange({ ...filters, payment_direction: e.target.value || undefined, page: 1 })}
          className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
        >
          <option value="">All</option>
          <option value="poster_pays">Poster pays</option>
          <option value="applicant_pays">Applicant pays</option>
          <option value="negotiable">Negotiable</option>
          <option value="unpaid">Unpaid</option>
        </select>
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Experience Level</label>
        <select
          value={filters.experience_level || ''}
          onChange={(e) => onChange({ ...filters, experience_level: e.target.value || undefined, page: 1 })}
          className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
        >
          <option value="">All</option>
          <option value="entry">Entry</option>
          <option value="mid">Mid</option>
          <option value="senior">Senior</option>
          <option value="expert">Expert</option>
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
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
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
          <label className="block text-sm text-gray-600 mb-1">Min price</label>
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
          <label className="block text-sm text-gray-600 mb-1">Max price</label>
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
