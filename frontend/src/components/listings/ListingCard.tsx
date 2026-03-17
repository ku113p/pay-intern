import { Link, useNavigate } from 'react-router-dom';
import { format } from 'timeago.js';
import type { Listing } from '../../api/listings';
import { SaveButton } from './SaveButton';
import { InterestButton } from './InterestButton';
import { ProfileAvatar } from '../common/ProfileAvatar';

export function ListingCard({ listing, currentUserId }: { listing: Listing; currentUserId?: string }) {
  const navigate = useNavigate();

  const paymentLabel = (dir: string, price: number) => {
    switch (dir) {
      case 'poster_pays': return `Poster pays $${price.toLocaleString()}`;
      case 'applicant_pays': return `Applicant pays $${price.toLocaleString()}`;
      case 'negotiable': return `Negotiable $${price.toLocaleString()}`;
      default: return `$${price.toLocaleString()}`;
    }
  };

  const paymentColor = (dir: string) =>
    dir === 'poster_pays' ? 'text-green-600 font-medium'
    : dir === 'applicant_pays' ? 'text-amber-600 font-medium'
    : 'text-blue-600 font-medium';

  return (
    <Link
      to={`/listings/${listing.id}`}
      className="block bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{listing.title}</h3>
          {(listing.organization_name || listing.author_display_name) && (
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
              <ProfileAvatar
                name={listing.author_display_name || listing.organization_name || ''}
                userId={listing.author_id}
                size="sm"
              />
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/profiles/${listing.author_role}/${listing.author_id}`); }}
                className="text-indigo-600 hover:underline cursor-pointer"
              >
                {listing.author_role === 'organization'
                  ? listing.organization_name || listing.author_display_name
                  : listing.author_display_name}
              </button>
              {listing.individual_level && listing.author_role === 'individual' && (
                <span> · {listing.individual_level}</span>
              )}
              {listing.author_email_domain && (
                <span className="text-gray-400"> · @{listing.author_email_domain}</span>
              )}
            </p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            {listing.duration_weeks} weeks &middot; {listing.format}
            {listing.price_usd != null && listing.price_usd > 0 ? (
              <span className={paymentColor(listing.payment_direction)}>
                {' · '}
                {paymentLabel(listing.payment_direction, listing.price_usd)}
                {listing.duration_weeks > 0 && (
                  <span className="font-normal opacity-70">
                    {` ($${Math.round(listing.price_usd / listing.duration_weeks).toLocaleString()}/wk)`}
                  </span>
                )}
              </span>
            ) : (
              <span className="text-green-600 font-medium"> · Free / Unpaid</span>
            )}
            <span className="text-gray-400"> · {format(listing.created_at + 'Z')}</span>
          </p>
        </div>
        <div className="flex items-center gap-1">
          {currentUserId && (
            <>
              <InterestButton
                listingId={listing.id}
                listingAuthorId={listing.author_id}
                userId={currentUserId}
              />
              <SaveButton listingId={listing.id} />
            </>
          )}
          {currentUserId && listing.author_id === currentUserId && (
            <span className="text-xs font-medium px-2 py-1 rounded bg-indigo-100 text-indigo-700">
              Yours
            </span>
          )}
          {listing.experience_level !== 'any' && (
            <span className="text-xs font-medium px-2 py-1 rounded bg-purple-100 text-purple-700">
              {listing.experience_level}
            </span>
          )}
          {listing.category && (
            <span className="text-xs font-medium px-2 py-1 rounded bg-gray-100 text-gray-600">
              {listing.category}
            </span>
          )}
          <span
            className={`text-xs font-medium px-2 py-1 rounded ${
              listing.author_role === 'organization'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-green-100 text-green-700'
            }`}
          >
            {listing.author_role}
          </span>
        </div>
      </div>

      <p className="text-gray-600 text-sm mt-3 line-clamp-2">{listing.description}</p>

      <div className="flex flex-wrap gap-1.5 mt-3">
        {listing.skills.map((skill) => (
          <span
            key={skill}
            className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
          >
            {skill}
          </span>
        ))}
      </div>

      {listing.outcome_criteria && listing.outcome_criteria.length > 0 && (
        <p className="text-xs text-indigo-600 mt-3">
          {listing.outcome_criteria.length} outcome criteria
        </p>
      )}
    </Link>
  );
}
