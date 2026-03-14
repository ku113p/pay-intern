import { useParams } from 'react-router-dom';
import { useListing } from '../hooks/useListings';
import { ListingDetail } from '../components/listings/ListingDetail';

export function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: listing, isLoading, error } = useListing(id!);

  if (isLoading) return <p className="text-gray-500">Loading...</p>;
  if (error || !listing) return <p className="text-red-600">Listing not found</p>;

  return (
    <div className="max-w-3xl mx-auto">
      <ListingDetail listing={listing} />
    </div>
  );
}
