import { ListingForm } from '../components/listings/ListingForm';

export function CreateListingPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create a Listing</h1>
      <ListingForm />
    </div>
  );
}
