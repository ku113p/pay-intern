import { useParams, useNavigate } from 'react-router-dom';
import { useListing } from '../hooks/useListings';
import { ListingForm } from '../components/listings/ListingForm';

export function EditListingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: listing, isLoading } = useListing(id!);

  if (isLoading) return <p className="text-gray-500">Loading...</p>;
  if (!listing) return <p className="text-red-600">Listing not found</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Listing</h1>
      <ListingForm key={listing.id} initialData={listing} onSuccess={() => navigate('/listings/mine')} />
    </div>
  );
}
