import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useListing } from '../hooks/useListings';
import { ReviewForm } from '../components/reviews/ReviewForm';

export function ReviewPage() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { listingId, listingTitle, applicantName } = (location.state || {}) as {
    listingId?: string; listingTitle?: string; applicantName?: string;
  };

  const { data: listing, isLoading } = useListing(listingId ?? '');

  if (!listingId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-2">Please navigate here from the Applications page.</p>
        <Link to="/applications" className="text-indigo-600 hover:text-indigo-500 text-sm">
          Go to Applications
        </Link>
      </div>
    );
  }

  if (isLoading) return <p className="text-gray-500">Loading...</p>;

  const criteria = listing?.outcome_criteria ?? [];
  if (!criteria.length) {
    return <p className="text-gray-500">No outcome criteria defined for this listing.</p>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Write Review</h1>
      <p className="text-sm text-gray-500 mb-6">
        For {applicantName ?? 'applicant'}'s application to "{listingTitle ?? 'listing'}"
      </p>
      <ReviewForm
        applicationId={applicationId!}
        criteria={criteria}
        onCreated={() => { toast.success('Review submitted!'); navigate('/applications'); }}
      />
    </div>
  );
}
