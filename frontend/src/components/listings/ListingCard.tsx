import { Link } from 'react-router-dom';
import type { Listing } from '../../api/listings';

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link
      to={`/listings/${listing.id}`}
      className="block bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{listing.title}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {listing.duration_weeks} weeks &middot; {listing.format}
            {listing.price_usd != null && ` · $${listing.price_usd}`}
          </p>
        </div>
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
