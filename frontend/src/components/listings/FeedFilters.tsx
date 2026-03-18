import { useState, useEffect, useRef } from 'react';
import type { ListingFeedParams } from '../../api/listings';

interface Props {
  filters: ListingFeedParams;
  onChange: (filters: ListingFeedParams) => void;
  defaultAuthorRole?: string;
}

export function FeedFilters({ filters, onChange, defaultAuthorRole }: Props) {
  // Text/number input local states
  const [search, setSearch] = useState(filters.search || '');
  const [skills, setSkills] = useState(filters.skills || '');
  const [minWeeks, setMinWeeks] = useState(filters.min_weeks?.toString() || '');
  const [maxWeeks, setMaxWeeks] = useState(filters.max_weeks?.toString() || '');
  const [minPrice, setMinPrice] = useState(filters.min_price?.toString() || '');
  const [maxPrice, setMaxPrice] = useState(filters.max_price?.toString() || '');

  // Select input local states (draft)
  const [authorRole, setAuthorRole] = useState(filters.author_role || '');
  const [category, setCategory] = useState(filters.category || '');
  const [format, setFormat] = useState(filters.format || '');
  const [paymentDirection, setPaymentDirection] = useState(filters.payment_direction || '');
  const [experienceLevel, setExperienceLevel] = useState(filters.experience_level || '');
  const [sort, setSort] = useState(filters.sort || 'newest');

  const [justApplied, setJustApplied] = useState(false);
  const appliedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => { clearTimeout(appliedTimerRef.current); };
  }, []);

  // Sync local state from props when filters change externally (URL nav, back/forward)
  const prevFiltersRef = useRef(filters);
  useEffect(() => {
    const prev = prevFiltersRef.current;
    if (prev === filters) return;
    prevFiltersRef.current = filters;
    setSearch(filters.search || '');
    setSkills(filters.skills || '');
    setMinWeeks(filters.min_weeks?.toString() || '');
    setMaxWeeks(filters.max_weeks?.toString() || '');
    setMinPrice(filters.min_price?.toString() || '');
    setMaxPrice(filters.max_price?.toString() || '');
    setAuthorRole(filters.author_role || '');
    setCategory(filters.category || '');
    setFormat(filters.format || '');
    setPaymentDirection(filters.payment_direction || '');
    setExperienceLevel(filters.experience_level || '');
    setSort(filters.sort || 'newest');
  }, [filters]);

  const isDirty =
    search !== (filters.search || '') ||
    skills !== (filters.skills || '') ||
    minWeeks !== (filters.min_weeks?.toString() || '') ||
    maxWeeks !== (filters.max_weeks?.toString() || '') ||
    minPrice !== (filters.min_price?.toString() || '') ||
    maxPrice !== (filters.max_price?.toString() || '') ||
    authorRole !== (filters.author_role || '') ||
    category !== (filters.category || '') ||
    format !== (filters.format || '') ||
    paymentDirection !== (filters.payment_direction || '') ||
    experienceLevel !== (filters.experience_level || '') ||
    sort !== (filters.sort || 'newest');

  const applyFilters = () => {
    onChange({
      search: search || undefined,
      skills: skills || undefined,
      min_weeks: minWeeks ? +minWeeks : undefined,
      max_weeks: maxWeeks ? +maxWeeks : undefined,
      min_price: minPrice ? +minPrice : undefined,
      max_price: maxPrice ? +maxPrice : undefined,
      author_role: authorRole || undefined,
      category: category || undefined,
      format: format || undefined,
      payment_direction: paymentDirection || undefined,
      experience_level: experienceLevel || undefined,
      sort: sort || 'newest',
      page: 1,
    });
    setJustApplied(true);
    clearTimeout(appliedTimerRef.current);
    appliedTimerRef.current = setTimeout(() => setJustApplied(false), 1500);
  };

  const appliedAuthorRoleIsManual = filters.author_role && filters.author_role !== defaultAuthorRole;
  const hasFilters = !!(
    filters.search || filters.skills || filters.format || filters.experience_level ||
    appliedAuthorRoleIsManual || filters.payment_direction || filters.category ||
    filters.min_weeks || filters.max_weeks ||
    filters.min_price || filters.max_price ||
    (filters.sort && filters.sort !== 'newest')
  );

  const clearFilters = () => {
    onChange({ sort: 'newest' });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <h3 className="font-medium text-gray-900 flex items-center gap-2">
        Filters
        {isDirty && (
          <span className="w-2 h-2 rounded-full bg-primary-500 inline-block" />
        )}
      </h3>

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
          value={authorRole}
          onChange={(e) => setAuthorRole(e.target.value)}
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
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Format</label>
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
        >
          <option value="">All</option>
          <option value="remote">Remote</option>
          <option value="onsite">Onsite</option>
          <option value="hybrid">Hybrid</option>
        </select>
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Payment</label>
        <select
          value={paymentDirection}
          onChange={(e) => setPaymentDirection(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
        >
          <option value="">All</option>
          <option value="organization_pays">Organization pays</option>
          <option value="individual_pays">Individual pays</option>
        </select>
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Experience Level</label>
        <select
          value={experienceLevel}
          onChange={(e) => setExperienceLevel(e.target.value)}
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
          value={sort}
          onChange={(e) => setSort(e.target.value)}
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

      <button
        type="button"
        onClick={applyFilters}
        disabled={!isDirty}
        className={`w-full py-2 px-4 rounded text-sm font-medium transition-colors ${
          justApplied
            ? 'bg-green-600 text-white'
            : isDirty
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        {justApplied ? 'Applied!' : 'Apply Filters'}
      </button>

      {hasFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="text-sm text-primary-600 hover:text-primary-800"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
