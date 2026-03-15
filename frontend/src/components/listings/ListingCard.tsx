import { Link } from 'react-router-dom';
import { format } from 'timeago.js';
import type { Listing } from '../../api/listings';

export function ListingCard({ listing, currentUserId }: { listing: Listing; currentUserId?: string }) {
  return (
    <Link
      to={`/listings/${listing.id}`}
      className="block bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{listing.title}</h3>
          {(listing.company_name || listing.author_display_name) && (
            <p className="text-xs text-gray-400 mt-0.5">
              {listing.listing_type === 'company'
                ? listing.company_name || listing.author_display_name
                : listing.author_display_name}
              {listing.developer_level && listing.listing_type === 'developer' && (
                <span> · {listing.developer_level}</span>
              )}
              {listing.author_email_domain && (
                <span className="text-gray-400"> · @{listing.author_email_domain}</span>
              )}
            </p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            {listing.duration_weeks} weeks &middot; {listing.format}
            {listing.price_usd != null && listing.price_usd > 0 ? (
              <span className={listing.payment_direction === 'company_pays_developer'
                ? 'text-green-600 font-medium'
                : 'text-amber-600 font-medium'}>
                {' · '}
                {listing.payment_direction === 'company_pays_developer'
                  ? `Company → Dev $${listing.price_usd.toLocaleString()}`
                  : `Dev → Company $${listing.price_usd.toLocaleString()}`}
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
        <div className="flex gap-1">
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
          <span
            className={`text-xs font-medium px-2 py-1 rounded ${
              listing.listing_type === 'company'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-green-100 text-green-700'
            }`}
          >
            {listing.listing_type}
          </span>
        </div>
      </div>

      <p className="text-gray-600 text-sm mt-3 line-clamp-2">{listing.description}</p>

      <div className="flex flex-wrap gap-1.5 mt-3">
        {listing.tech_stack.map((tech) => (
          <span
            key={tech}
            className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
          >
            {tech}
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
