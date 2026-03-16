import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { interestsApi } from '../api/interests';
import { useAuthStore } from '../stores/auth';
import { ListingCard } from '../components/listings/ListingCard';
import { Pagination } from '../components/common/Pagination';

export function SavedListingsPage() {
  const user = useAuthStore((s) => s.user);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['saved-listings', page, typeFilter],
    queryFn: () =>
      interestsApi.getSavedListings({
        page,
        per_page: 20,
        ...(typeFilter ? { listing_type: typeFilter } : {}),
      }).then((r) => r.data),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Saved Listings</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">Listings you've bookmarked for later</p>

      <div className="flex gap-2 mb-4">
        {['', 'developer', 'company'].map((t) => (
          <button
            key={t}
            onClick={() => { setTypeFilter(t); setPage(1); }}
            className={`text-sm px-3 py-1.5 rounded border ${
              typeFilter === t
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t === '' ? 'All' : t === 'developer' ? 'Developer' : 'Company'}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-600">Failed to load saved listings</p>}
      {data?.data.length === 0 && (
        <p className="text-gray-500">No saved listings yet. Browse the feed and click the bookmark icon to save listings.</p>
      )}

      <div className="space-y-4">
        {data?.data.map((listing) => (
          <ListingCard key={listing.id} listing={listing} currentUserId={user?.id} currentUserRole={user?.role} />
        ))}
      </div>

      {data && (
        <Pagination
          page={data.pagination.page}
          totalPages={data.pagination.total_pages}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => p + 1)}
        />
      )}
    </div>
  );
}
