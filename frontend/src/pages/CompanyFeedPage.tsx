import { useState } from 'react';
import { useCompanyFeed } from '../hooks/useListings';
import { ListingCard } from '../components/listings/ListingCard';
import { FeedFilters } from '../components/listings/FeedFilters';
import type { ListingFeedParams } from '../api/listings';

export function CompanyFeedPage() {
  const [filters, setFilters] = useState<ListingFeedParams>({ sort: 'newest' });
  const { data, isLoading, error } = useCompanyFeed(filters);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Company Internship Listings</h1>
      <div className="flex gap-6">
        <aside className="w-64 flex-shrink-0">
          <FeedFilters filters={filters} onChange={setFilters} />
        </aside>
        <div className="flex-1 space-y-4">
          {isLoading && <p className="text-gray-500">Loading...</p>}
          {error && <p className="text-red-600">Failed to load listings</p>}
          {data?.data.length === 0 && <p className="text-gray-500">No listings found.</p>}
          {data?.data.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
          {data && data.pagination.total_pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                disabled={filters.page === 1 || !filters.page}
                onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-sm text-gray-600">
                Page {data.pagination.page} of {data.pagination.total_pages}
              </span>
              <button
                disabled={data.pagination.page >= data.pagination.total_pages}
                onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
