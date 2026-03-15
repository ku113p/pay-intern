import type { ListingFeedParams } from '../../api/listings';

interface Props {
  filters: ListingFeedParams;
  onChange: (filters: ListingFeedParams) => void;
}

export function FeedFilters({ filters, onChange }: Props) {
  const hasFilters = !!(
    filters.tech || filters.format || filters.experience_level ||
    filters.min_weeks || filters.max_weeks ||
    filters.min_price != null || filters.max_price != null ||
    (filters.sort && filters.sort !== 'newest')
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <h3 className="font-medium text-gray-900">Filters</h3>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Tech Stack</label>
        <input
          type="text"
          placeholder="e.g. rust,react"
          value={filters.tech || ''}
          onChange={(e) => onChange({ ...filters, tech: e.target.value || undefined, page: 1 })}
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
        <label className="block text-sm text-gray-600 mb-1">Experience Level</label>
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
          <option value="price_asc">Budget: Low to High</option>
          <option value="price_desc">Budget: High to Low</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Min weeks</label>
          <input
            type="number"
            min={1}
            value={filters.min_weeks || ''}
            onChange={(e) =>
              onChange({ ...filters, min_weeks: e.target.value ? +e.target.value : undefined, page: 1 })
            }
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Max weeks</label>
          <input
            type="number"
            min={1}
            value={filters.max_weeks || ''}
            onChange={(e) =>
              onChange({ ...filters, max_weeks: e.target.value ? +e.target.value : undefined, page: 1 })
            }
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Min budget</label>
          <input
            type="number"
            min={0}
            step={100}
            placeholder="$0"
            value={filters.min_price ?? ''}
            onChange={(e) =>
              onChange({ ...filters, min_price: e.target.value ? +e.target.value : undefined, page: 1 })
            }
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Max budget</label>
          <input
            type="number"
            min={0}
            step={100}
            placeholder="Any"
            value={filters.max_price ?? ''}
            onChange={(e) =>
              onChange({ ...filters, max_price: e.target.value ? +e.target.value : undefined, page: 1 })
            }
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
