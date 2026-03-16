import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useListing } from '../hooks/useListings';
import { ListingDetail } from '../components/listings/ListingDetail';
import { trackEvent } from '../lib/analytics';

export function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: listing, isLoading, error } = useListing(id!);

  useEffect(() => {
    if (listing) {
      trackEvent('listing_viewed', { listing_id: listing.id, type: listing.listing_type });
    }
  }, [listing?.id, listing?.listing_type]);

  if (isLoading) return <p className="text-gray-500">Loading...</p>;
  if (error || !listing) return <p className="text-red-600">Listing not found</p>;

  return (
    <div className="max-w-3xl mx-auto">
      <ListingDetail listing={listing} />
    </div>
  );
}
