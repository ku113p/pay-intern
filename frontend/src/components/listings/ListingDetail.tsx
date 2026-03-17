import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Listing } from '../../api/listings';
import { listingsApi } from '../../api/listings';
import { applicationsApi } from '../../api/applications';
import { useAuthStore } from '../../stores/auth';
import { SaveButton } from './SaveButton';
import { InterestButton } from './InterestButton';
import { ProfileAvatar } from '../common/ProfileAvatar';
import { trackEvent } from '../../lib/analytics';

export function ListingDetail({ listing }: { listing: Listing }) {
  const user = useAuthStore((s) => s.user);
  const isOwner = user?.id === listing.author_id;
  const canApply = user && !isOwner;

  const [message, setMessage] = useState('');
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const { data: similarListings } = useQuery({
    queryKey: ['similar-listings', listing.id],
    queryFn: () => listingsApi.getSimilar(listing.id).then((r) => r.data),
  });

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplying(true);
    try {
      await applicationsApi.create(listing.id, message);
      setApplied(true);
      toast.success('Application sent!');
      trackEvent('application_sent', { listing_id: listing.id });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to apply');
    } finally {
      setApplying(false);
    }
  };

  const paymentLabel = (dir: string, price: number) => {
    switch (dir) {
      case 'poster_pays': return `Poster pays — $${price.toLocaleString()}`;
      case 'applicant_pays': return `Applicant pays — $${price.toLocaleString()}`;
      case 'negotiable': return `Negotiable — $${price.toLocaleString()}`;
      default: return `$${price.toLocaleString()}`;
    }
  };

  const paymentBg = (dir: string) =>
    !listing.price_usd || listing.price_usd === 0
      ? 'bg-gray-50 border border-gray-200'
      : dir === 'poster_pays' ? 'bg-green-50 border border-green-200'
      : dir === 'applicant_pays' ? 'bg-amber-50 border border-amber-200'
      : 'bg-blue-50 border border-blue-200';

  const paymentTextColor = (dir: string) =>
    dir === 'poster_pays' ? 'text-green-800'
    : dir === 'applicant_pays' ? 'text-amber-800'
    : 'text-blue-800';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{listing.title}</h1>
          <p className="text-gray-500 mt-1">
            {listing.duration_weeks} weeks &middot; {listing.format}
            {listing.category && ` · ${listing.category}`}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {listing.author_email_domain && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              @{listing.author_email_domain}
            </span>
          )}
          <span
            className={`text-sm font-medium px-3 py-1 rounded ${
              listing.author_role === 'organization'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-green-100 text-green-700'
            }`}
          >
            {listing.author_role}
          </span>
        </div>
      </div>

      {user && (
        <div className="flex gap-2">
          <SaveButton listingId={listing.id} variant="full" />
          <InterestButton
            listingId={listing.id}
            listingAuthorId={listing.author_id}
            userId={user.id}
            variant="full"
          />
        </div>
      )}

      <div className={`rounded-lg p-4 ${paymentBg(listing.payment_direction)}`}>
        {listing.price_usd != null && listing.price_usd > 0 ? (
          <p className={`font-semibold ${paymentTextColor(listing.payment_direction)}`}>
            {paymentLabel(listing.payment_direction, listing.price_usd)}
            {listing.duration_weeks > 0 && (
              <span className="font-normal text-sm ml-2">
                (${Math.round(listing.price_usd / listing.duration_weeks).toLocaleString()}/wk)
              </span>
            )}
          </p>
        ) : (
          <p className="font-semibold text-gray-600">Free / Unpaid engagement</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {listing.skills.map((skill) => (
          <span key={skill} className="text-sm bg-gray-100 text-gray-700 px-2.5 py-1 rounded">
            {skill}
          </span>
        ))}
      </div>

      <div className="prose max-w-none">
        <p className="text-gray-700 whitespace-pre-wrap">{listing.description}</p>
      </div>

      {listing.outcome_criteria && listing.outcome_criteria.length > 0 && (
        <div className="bg-indigo-50 rounded-lg p-5">
          <h3 className="font-semibold text-indigo-900 mb-3">Outcome Criteria</h3>
          <ul className="space-y-2">
            {listing.outcome_criteria.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-indigo-800">
                <span className="text-indigo-400 mt-0.5">&#10003;</span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {canApply && !applied && (
        <form onSubmit={handleApply} className="bg-white border border-gray-200 rounded-lg p-5 space-y-3">
          <h3 className="font-semibold text-gray-900">Apply to this listing</h3>
          <textarea
            required
            minLength={10}
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write a message to introduce yourself..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={applying}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            {applying ? 'Sending...' : 'Send Application'}
          </button>
        </form>
      )}

      {applied && (
        <p className="text-sm text-green-700">Application sent! Check your applications page for status updates.</p>
      )}

      {/* Author section */}
      <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-3">
        <ProfileAvatar
          name={listing.author_display_name || listing.organization_name || 'User'}
          userId={listing.author_id}
          size="md"
        />
        <div>
          <Link
            to={`/profiles/${listing.author_role}/${listing.author_id}`}
            className="text-sm font-medium text-indigo-600 hover:underline"
          >
            {listing.author_role === 'organization'
              ? listing.organization_name || listing.author_display_name
              : listing.author_display_name}
          </Link>
          <p className="text-xs text-gray-500">
            {listing.author_role === 'organization' && listing.organization_name && listing.author_display_name
              ? listing.author_display_name
              : listing.author_role}
            {listing.individual_level && ` · ${listing.individual_level}`}
          </p>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Posted {new Date(listing.created_at).toLocaleDateString()}
      </p>

      {/* Similar listings */}
      {similarListings && similarListings.length > 0 && (
        <div className="mt-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Similar Listings</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {similarListings.map((sim) => (
              <Link
                key={sim.id}
                to={`/listings/${sim.id}`}
                className="block border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
              >
                <h4 className="text-sm font-medium text-gray-900 truncate">{sim.title}</h4>
                <p className="text-xs text-gray-500 mt-1">
                  {sim.duration_weeks}w · {sim.format}
                  {sim.price_usd != null && sim.price_usd > 0
                    ? ` · $${sim.price_usd.toLocaleString()}`
                    : ' · Free'}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {sim.skills.slice(0, 4).map((t) => (
                    <span key={t} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{t}</span>
                  ))}
                  {sim.skills.length > 4 && (
                    <span className="text-xs text-gray-400">+{sim.skills.length - 4}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
