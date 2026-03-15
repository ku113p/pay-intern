import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMyListings } from '../hooks/useListings';
import { listingsApi } from '../api/listings';
import { StatusBadge } from '../components/common/StatusBadge';
import { Pagination } from '../components/common/Pagination';

export function MyListingsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useMyListings({ page });
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const closeMutation = useMutation({
    mutationFn: (id: string) => listingsApi.deleteListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings', 'mine'] });
    },
  });

  const handleClose = (id: string) => {
    if (!confirm('Close this listing? This cannot be undone.')) return;
    closeMutation.mutate(id);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
        <Link
          to="/listings/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700"
        >
          New Listing
        </Link>
      </div>

      {isLoading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-600">Failed to load listings</p>}
      {closeMutation.isError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <p className="text-red-800 text-sm">Failed to close listing. Please try again.</p>
        </div>
      )}

      {data?.data.length === 0 && (
        <p className="text-gray-500">
          You haven't posted any listings yet.{' '}
          <Link to="/listings/new" className="text-indigo-600 hover:text-indigo-500">
            Create one
          </Link>
        </p>
      )}

      <div className="space-y-3">
        {data?.data.map((listing) => (
          <div key={listing.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2">
              <div>
                <Link to={`/listings/${listing.id}`} className="font-medium text-gray-900 hover:text-indigo-600">
                  {listing.title}
                </Link>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={listing.status} />
                  <span className="text-xs text-gray-400">
                    {new Date(listing.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              {listing.status === 'active' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/listings/${listing.id}/edit`)}
                    className="text-sm text-indigo-600 hover:text-indigo-800 border border-indigo-200 px-3 py-1 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleClose(listing.id)}
                    disabled={closeMutation.isPending}
                    className="text-sm text-red-600 hover:text-red-800 border border-red-200 px-3 py-1 rounded disabled:opacity-50"
                  >
                    {closeMutation.isPending ? 'Closing...' : 'Close'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {data && (
        <Pagination
          page={data.pagination.page}
          totalPages={data.pagination.total_pages}
          onPrev={() => setPage(page - 1)}
          onNext={() => setPage(page + 1)}
        />
      )}
    </div>
  );
}
