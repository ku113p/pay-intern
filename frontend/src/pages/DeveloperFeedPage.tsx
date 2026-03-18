import { useState } from 'react';
import { useFeed } from '../hooks/useListings';
import { useFeedFilters } from '../hooks/useFeedFilters';
import { useAuthStore } from '../stores/auth';
import { ListingCard } from '../components/listings/ListingCard';
import { FeedFilters } from '../components/listings/FeedFilters';
import { Pagination } from '../components/common/Pagination';

export function BrowsePage() {
  const { filters, setFilters, defaultAuthorRole } = useFeedFilters();
  const { data, isLoading, error } = useFeed(filters);
  const [showFilters, setShowFilters] = useState(false);
  const user = useAuthStore((s) => s.user);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Browse Listings</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">Find opportunities across all professions</p>
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="md:hidden mb-4 text-sm font-medium text-primary-600 border border-primary-200 px-4 py-2 rounded-md"
      >
        {showFilters ? 'Hide Filters' : 'Filters'}
      </button>
      <div className="flex flex-col md:flex-row gap-6">
        <aside className={`${showFilters ? 'block' : 'hidden'} md:block w-full md:w-64 flex-shrink-0`}>
          <FeedFilters filters={filters} onChange={setFilters} defaultAuthorRole={defaultAuthorRole} />
        </aside>
        <div className="flex-1 space-y-4">
          {data && (
            <p className="text-sm text-gray-500 mb-4">
              {data.pagination.total} {data.pagination.total === 1 ? 'listing' : 'listings'} found
            </p>
          )}
          {isLoading && (
            <div className="flex items-center gap-2 text-gray-500">
              <span className="animate-spin h-5 w-5 border-2 border-primary-600 border-t-transparent rounded-full inline-block" />
              Loading...
            </div>
          )}
          {error && <p className="text-red-600">Failed to load listings</p>}
          {data?.data.length === 0 && <p className="text-gray-500">No listings found.</p>}
          {data?.data.map((listing) => (
            <ListingCard key={listing.id} listing={listing} currentUserId={user?.id} />
          ))}
          {data && (
            <Pagination
              page={data.pagination.page}
              totalPages={data.pagination.total_pages}
              onPrev={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
              onNext={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Keep old export for backward compat
export { BrowsePage as DeveloperFeedPage };
