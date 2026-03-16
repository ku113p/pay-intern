import { useState } from 'react';
import { useCompanyFeed } from '../hooks/useListings';
import { useFeedFilters } from '../hooks/useFeedFilters';
import { useAuthStore } from '../stores/auth';
import { ListingCard } from '../components/listings/ListingCard';
import { FeedFilters } from '../components/listings/FeedFilters';
import { Pagination } from '../components/common/Pagination';

export function CompanyFeedPage() {
  const { filters, setFilters } = useFeedFilters();
  const { data, isLoading, error } = useCompanyFeed(filters);
  const [showFilters, setShowFilters] = useState(false);
  const user = useAuthStore((s) => s.user);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Company Internship Listings</h1>
      {user?.role === 'developer' && (
        <p className="text-sm text-gray-500 mt-1 mb-6">Find structured engagements with real companies</p>
      )}
      {user?.role !== 'developer' && <div className="mb-6" />}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="md:hidden mb-4 text-sm font-medium text-indigo-600 border border-indigo-200 px-4 py-2 rounded-md"
      >
        {showFilters ? 'Hide Filters' : 'Filters'}
      </button>
      <div className="flex flex-col md:flex-row gap-6">
        <aside className={`${showFilters ? 'block' : 'hidden'} md:block w-full md:w-64 flex-shrink-0`}>
          <FeedFilters filters={filters} onChange={setFilters} feedType="company" />
        </aside>
        <div className="flex-1 space-y-4">
          {data && (
            <p className="text-sm text-gray-500 mb-4">
              {data.pagination.total} {data.pagination.total === 1 ? 'listing' : 'listings'} found
            </p>
          )}
          {isLoading && <p className="text-gray-500">Loading...</p>}
          {error && <p className="text-red-600">Failed to load listings</p>}
          {data?.data.length === 0 && <p className="text-gray-500">No listings found.</p>}
          {data?.data.map((listing) => (
            <ListingCard key={listing.id} listing={listing} currentUserId={user?.id} currentUserRole={user?.role} />
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
